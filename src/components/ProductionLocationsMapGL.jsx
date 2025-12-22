import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import MapGL, { Source, Layer, Popup, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

/**
 * ProductionLocationsMapGL (MapLibre / WebGL) — Premium clusters + spider expansion
 *
 * Props:
 * - points: [{ orgId, orgName, salesRegion, countryName, city, latitude, longitude, isHQ }]
 * - search: global search string (optional)
 * - pinMode: "org" | "city"
 * - onPinModeChange(mode)
 * - onToggleSelect(key, meta)
 * - isSelected(key)
 * - makeKey(item)
 * - onViewOrgs(payload)
 *      payload supports:
 *        { salesRegion, country, city? } OR { orgIds: string[] }
 * - onGoToRegion(region), onGoToCountry(countryName), onGoToCity(city, countryName, salesRegion)
 * - onSelectRegion/onSelectCountry/onSelectCity/onClearSelection (optional)
 */
const MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const SIDEBAR_W = 360;
const CLUSTER_HOVER_DEBOUNCE_MS = 180;
const CLUSTER_LEAVES_LIMIT = 400;      // hover preview
const SPIDER_LEAVES_LIMIT = 80;        // spider view
const SAME_COORD_JITTER_MAX = 18;      // meters (visual only)
const UNKNOWN_CITY = "unknown";

function norm(v) {
  return String(v ?? "").trim();
}
function normLower(v) {
  return norm(v).toLowerCase();
}
function isUnknownCity(v) {
  const s = normLower(v);
  return !s || s === UNKNOWN_CITY || s === "n/a" || s === "na" || s === "null";
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function deterministicAngle(key) {
  // stable 0..2pi
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h / 0xffffffff) * Math.PI * 2;
}

function metersToLngLatOffset(meters, latDeg) {
  // Approximations: 1 deg lat ~ 111,320m; 1 deg lng ~ 111,320m * cos(lat)
  const lat = (meters / 111320);
  const lng = (meters / (111320 * Math.max(0.2, Math.cos((latDeg * Math.PI) / 180))));
  return { dLng: lng, dLat: lat };
}

function softCard() {
  return {
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0,0,0,0.10)",
    boxShadow: "0 14px 44px rgba(17,24,39,0.16)",
    borderRadius: 16,
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.14)",
    outline: "none",
    fontWeight: 900,
    fontSize: 13,
  };
}

function pill(active) {
  return {
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.14)",
    background: active ? "rgba(29,78,216,0.12)" : "white",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 12,
    userSelect: "none",
  };
}

function btn(kind = "primary") {
  const primary = kind === "primary";
  return {
    padding: "9px 12px",
    borderRadius: 12,
    border: `1px solid ${primary ? "rgba(29,78,216,0.22)" : "rgba(0,0,0,0.14)"}`,
    background: primary ? "#1d4ed8" : "white",
    color: primary ? "white" : "rgba(0,0,0,0.86)",
    fontWeight: 950,
    cursor: "pointer",
  };
}

export default function ProductionLocationsMapGL({
  points = [],
  search = "",
  pinMode = "city",
  onPinModeChange,
  onToggleSelect,
  isSelected,
  makeKey,
  onViewOrgs,
  onGoToRegion,
  onGoToCountry,
  onGoToCity,
  onSelectRegion,
  onSelectCountry,
  onSelectCity,
  onClearSelection,
  height = "calc(100vh - 220px)",
}) {
  const mapRef = useRef(null);

  // premium hover popup for clusters
  const [hoverCluster, setHoverCluster] = useState(null); // { clusterId, point:[lng,lat], count, screen:{x,y} }
  const [hoverLeaves, setHoverLeaves] = useState([]);
  const [hoverLeavesErr, setHoverLeavesErr] = useState("");
  const [hoverSearch, setHoverSearch] = useState("");

  // click spider expansion (cluster -> spider overlay)
  const [spider, setSpider] = useState(null); // { clusterId, center:[lng,lat], count, leaves:[], geojson:{points,lines} }
  const [spiderSearch, setSpiderSearch] = useState("");

  // popup for org/city pins
  const [popup, setPopup] = useState(null); // {lng,lat, kind, props}

  // sidebar (kept)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [qRegion, setQRegion] = useState("");
  const [qCountry, setQCountry] = useState("");
  const [qCity, setQCity] = useState("");
  const [qOrg, setQOrg] = useState("");

  const hoverTimer = useRef(null);
  const clusterLeavesCache = useRef(new Map()); // clusterId -> leaves[]

  // --- Global search applied to points
  const shownPoints = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return points || [];
    return (points || []).filter((p) => {
      const hay = `${p.orgName || ""} ${p.salesRegion || ""} ${p.countryName || ""} ${p.city || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [points, search]);

  // --- Option lists (sidebar)
  const allRegions = useMemo(() => {
    const s = new Set();
    for (const p of shownPoints) s.add(p.salesRegion || "Unknown");
    return Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
  }, [shownPoints]);

  const filteredCountries = useMemo(() => {
    const region = norm(qRegion);
    const s = new Set();
    for (const p of shownPoints) {
      const r = p.salesRegion || "Unknown";
      if (region && r !== region) continue;
      s.add(p.countryName || "Unknown");
    }
    return Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
  }, [shownPoints, qRegion]);

  const filteredCities = useMemo(() => {
    const region = norm(qRegion);
    const country = norm(qCountry);
    const s = new Set();
    for (const p of shownPoints) {
      const r = p.salesRegion || "Unknown";
      const c = p.countryName || "Unknown";
      if (region && r !== region) continue;
      if (country && c !== country) continue;
      s.add(p.city || "Unknown");
    }
    return Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
  }, [shownPoints, qRegion, qCountry]);

  const filteredOrgs = useMemo(() => {
    const region = norm(qRegion);
    const country = norm(qCountry);
    const city = norm(qCity);
    const s = new Set();
    for (const p of shownPoints) {
      const r = p.salesRegion || "Unknown";
      const c = p.countryName || "Unknown";
      const ct = p.city || "Unknown";
      if (region && r !== region) continue;
      if (country && c !== country) continue;
      if (city && ct !== city) continue;
      if (p.orgName) s.add(p.orgName);
    }
    return Array.from(s).sort((a, b) => String(a).localeCompare(String(b)));
  }, [shownPoints, qRegion, qCountry, qCity]);

  const flyTo = useCallback((lng, lat, zoom = 4) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom, duration: 650 });
  }, []);

  // --- Jitter coincident points (visual only)
  const jitteredOrgPoints = useMemo(() => {
    // group by precise coordinate
    const groups = new Map(); // "lat||lng" -> points[]
    for (const p of shownPoints || []) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const key = `${lat}||${lng}`;
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    }

    const out = [];
    for (const [k, arr] of groups.entries()) {
      if (arr.length === 1) {
        out.push(arr[0]);
        continue;
      }
      // deterministic but spread
      const [latStr, lngStr] = k.split("||");
      const lat0 = Number(latStr);
      const lng0 = Number(lngStr);
      const n = arr.length;
      const radiusMeters = clamp(6 + n * 0.35, 6, SAME_COORD_JITTER_MAX);
      const baseAngle = deterministicAngle(k);

      for (let i = 0; i < n; i++) {
        const a = baseAngle + (i * (Math.PI * 2)) / n;
        const dx = Math.cos(a) * radiusMeters;
        const dy = Math.sin(a) * radiusMeters;
        const { dLng, dLat } = metersToLngLatOffset(1, lat0);
        // scale by meters
        const lng = lng0 + dLng * dx;
        const lat = lat0 + dLat * dy;
        out.push({ ...arr[i], _jitterLng: lng, _jitterLat: lat, _sameCoordGroupSize: n });
      }
    }
    return out;
  }, [shownPoints]);

  // --- GeoJSON features
  const orgFeatures = useMemo(() => {
    const feats = [];
    for (const p of jitteredOrgPoints || []) {
      const lat = Number(p._jitterLat ?? p.latitude);
      const lng = Number(p._jitterLng ?? p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const key = makeKey
        ? makeKey(p)
        : `${p.salesRegion || ""}||${p.countryName || ""}||${p.city || ""}||${p.orgId || ""}`;

      feats.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          _kind: "org",
          _key: key,
          orgId: p.orgId ?? "",
          orgName: p.orgName ?? "",
          salesRegion: p.salesRegion ?? "",
          countryName: p.countryName ?? "",
          city: p.city ?? "",
          isHQ: p.isHQ ? 1 : 0,
          selected: isSelected?.(key) ? 1 : 0,
          sameCoordGroupSize: Number(p._sameCoordGroupSize || 1),
        },
      });
    }
    return { type: "FeatureCollection", features: feats };
  }, [jitteredOrgPoints, isSelected, makeKey]);

  const cityFeatures = useMemo(() => {
    const m = new Map(); // aggKey -> {region,country,city,lat,lng,orgIds:Set,hqCount}
    for (const p of shownPoints || []) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const region = p.salesRegion ?? "";
      const country = p.countryName ?? "";
      const city = p.city ?? "";
      const latR = Math.round(lat * 10000) / 10000;
      const lngR = Math.round(lng * 10000) / 10000;

      const aggKey = `${region}||${country}||${city}||${latR}||${lngR}`;
      const cur =
        m.get(aggKey) || {
          salesRegion: region,
          countryName: country,
          city,
          latitude: latR,
          longitude: lngR,
          orgIds: new Set(),
          hqCount: 0,
        };

      if (p.orgId) cur.orgIds.add(String(p.orgId));
      if (p.isHQ) cur.hqCount += 1;

      m.set(aggKey, cur);
    }

    const feats = [];
    for (const [key, c] of m.entries()) {
      feats.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.longitude, c.latitude] },
        properties: {
          _kind: "city",
          _key: key,
          salesRegion: c.salesRegion,
          countryName: c.countryName,
          city: c.city,
          orgCount: c.orgIds.size,
          hqCount: c.hqCount,
          selected: isSelected?.(key) ? 1 : 0,
        },
      });
    }

    return { type: "FeatureCollection", features: feats };
  }, [shownPoints, isSelected]);

  // --- initial view
  const initialViewState = useMemo(() => {
    if (!shownPoints?.length) return { longitude: 0, latitude: 15, zoom: 1.2 };
    let latSum = 0, lngSum = 0, n = 0;
    for (const p of shownPoints) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      latSum += lat; lngSum += lng; n += 1;
    }
    if (!n) return { longitude: 0, latitude: 15, zoom: 1.2 };
    return { longitude: lngSum / n, latitude: latSum / n, zoom: 1.7 };
  }, [shownPoints]);

  // --- Premium marker icons (simple: use circles + halo via layers; no custom images needed)

  // --- Cluster leaves helper (client-side Mapbox clustering API)
  const getClusterLeaves = useCallback(async (clusterId, limit = CLUSTER_LEAVES_LIMIT) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return [];
    const src = map.getSource("org-source");
    if (!src || !src.getClusterLeaves) return [];
    return await new Promise((resolve) => {
      src.getClusterLeaves(clusterId, limit, 0, (err, features) => {
        if (err) resolve([]);
        else resolve(features || []);
      });
    });
  }, []);

  const toLeafRows = useCallback((features) => {
    return (features || [])
      .map((f) => f?.properties || {})
      .map((p) => ({
        orgId: p.orgId || "",
        orgName: p.orgName || "",
        salesRegion: p.salesRegion || "",
        countryName: p.countryName || "",
        city: p.city || "",
        isHQ: Number(p.isHQ || 0) === 1,
      }))
      .filter((r) => r.orgId || r.orgName)
      .sort((a, b) => String(a.orgName).localeCompare(String(b.orgName)));
  }, []);

  // --- Build spider geojson (points + spokes)
  const buildSpider = useCallback((centerLngLat, leaves) => {
    const [cx, cy] = centerLngLat;
    const n = leaves.length;

    const points = [];
    const lines = [];

    // radius in pixels-like degrees — we’ll convert meters to degrees at the center latitude
    // make it look "spyder": inner ring + outer ring if large
    const ring1 = clamp(8 + n * 0.55, 12, 40); // meters
    const ring2 = clamp(18 + n * 0.7, 22, 65); // meters

    const latForConv = cy;
    const conv1 = metersToLngLatOffset(1, latForConv);
    const conv2 = conv1;

    for (let i = 0; i < n; i++) {
      const a = (i * (Math.PI * 2)) / n;
      // alternate rings for depth
      const useOuter = n > 14 ? i % 2 === 1 : false;
      const rMeters = useOuter ? ring2 : ring1;

      const dx = Math.cos(a) * rMeters;
      const dy = Math.sin(a) * rMeters;

      const px = cx + conv1.dLng * dx;
      const py = cy + conv2.dLat * dy;

      const p = leaves[i];
      const key = p._key || `${p.salesRegion || ""}||${p.countryName || ""}||${p.city || ""}||${p.orgId || ""}`;

      points.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [px, py] },
        properties: {
          _kind: "spider",
          _key: key,
          orgId: p.orgId || "",
          orgName: p.orgName || "",
          salesRegion: p.salesRegion || "",
          countryName: p.countryName || "",
          city: p.city || "",
          isHQ: p.isHQ ? 1 : 0,
        },
      });

      lines.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[cx, cy], [px, py]] },
        properties: { _kind: "spider-line" },
      });
    }

    return {
      points: { type: "FeatureCollection", features: points },
      lines: { type: "FeatureCollection", features: lines },
    };
  }, []);

  // --- Map interactions
  const onMapClick = useCallback(
    async (evt) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;

      const features = map.queryRenderedFeatures(evt.point, {
        layers: [
          "org-clusters",
          "org-unclustered",
          "city-unclustered",
          "spider-points",
        ],
      });

      if (!features?.length) {
        // click empty closes overlays
        setPopup(null);
        setSpider(null);
        return;
      }

      const f = features[0];
      const props = f.properties || {};

      // click on spider point
      if (props._kind === "spider") {
        const lng = f.geometry.coordinates[0];
        const lat = f.geometry.coordinates[1];
        setPopup({ lng, lat, kind: "org", props });
        // keep spider open; feels premium
        return;
      }

      // click on cluster -> open spider overlay
      if (props.cluster) {
        const clusterId = Number(props.cluster_id);
        const count = Number(props.point_count || 0);
        const center = f.geometry.coordinates;

        // fetch leaves (cached)
        let leaves = clusterLeavesCache.current.get(clusterId);
        if (!leaves) {
          const feats = await getClusterLeaves(clusterId, SPIDER_LEAVES_LIMIT);
          leaves = toLeafRows(feats);
          clusterLeavesCache.current.set(clusterId, leaves);
        }

        const geo = buildSpider(center, leaves);
        setSpider({ clusterId, center, count, leaves, geojson: geo });
        setSpiderSearch("");
        setPopup(null);
        return;
      }

      // click org (unclustered)
      if (props._kind === "org") {
        const lng = f.geometry.coordinates[0];
        const lat = f.geometry.coordinates[1];
        setPopup({ lng, lat, kind: "org", props });
        setSpider(null);
        return;
      }

      // click city
      if (props._kind === "city") {
        const lng = f.geometry.coordinates[0];
        const lat = f.geometry.coordinates[1];
        setPopup({ lng, lat, kind: "city", props });
        setSpider(null);
      }
    },
    [getClusterLeaves, toLeafRows, buildSpider]
  );

  const onMapMove = useCallback(() => {
    // Close hover popup while actively panning/zooming to reduce visual noise
    setHoverCluster(null);
    setHoverLeaves([]);
    setHoverLeavesErr("");
    setHoverSearch("");
  }, []);

  const onMapMouseMove = useCallback(
    async (evt) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;

      if (pinMode !== "org") {
        setHoverCluster(null);
        setHoverLeaves([]);
        setHoverLeavesErr("");
        return;
      }

      const features = map.queryRenderedFeatures(evt.point, { layers: ["org-clusters"] });
      if (!features?.length) {
        setHoverCluster(null);
        setHoverLeaves([]);
        setHoverLeavesErr("");
        return;
      }

      const f = features[0];
      const props = f.properties || {};
      if (!props.cluster) return;

      const clusterId = Number(props.cluster_id);
      const count = Number(props.point_count || 0);
      const lng = f.geometry.coordinates[0];
      const lat = f.geometry.coordinates[1];

      // Debounce + avoid repeats
      if (hoverCluster?.clusterId === clusterId) return;

      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(async () => {
        // cache lookup first
        const cached = clusterLeavesCache.current.get(clusterId);
        if (cached) {
          setHoverCluster({ clusterId, point: [lng, lat], count });
          setHoverLeaves(cached);
          setHoverLeavesErr("");
          return;
        }

        setHoverCluster({ clusterId, point: [lng, lat], count });
        setHoverLeaves([]);
        setHoverLeavesErr("");

        try {
          const feats = await getClusterLeaves(clusterId, CLUSTER_LEAVES_LIMIT);
          const rows = toLeafRows(feats);
          clusterLeavesCache.current.set(clusterId, rows);
          setHoverLeaves(rows);
        } catch (e) {
          setHoverLeavesErr("Couldn't load orgs in this cluster.");
        }
      }, CLUSTER_HOVER_DEBOUNCE_MS);
    },
    [pinMode, hoverCluster, getClusterLeaves, toLeafRows]
  );

  // --- Sidebar selection callbacks
  const pickRegion = useCallback(
    (region) => {
      setQRegion(region);
      setQCountry("");
      setQCity("");
      setQOrg("");
      onSelectRegion?.(region);
    },
    [onSelectRegion]
  );
  const pickCountry = useCallback(
    (country) => {
      setQCountry(country);
      setQCity("");
      setQOrg("");
      onSelectCountry?.(qRegion, country);
    },
    [onSelectCountry, qRegion]
  );
  const pickCity = useCallback(
    (city) => {
      setQCity(city);
      setQOrg("");
      onSelectCity?.(qRegion, qCountry, city);

      const hit = (shownPoints || []).find(
        (p) =>
          (p.salesRegion || "Unknown") === (qRegion || "Unknown") &&
          (p.countryName || "Unknown") === (qCountry || "Unknown") &&
          (p.city || "Unknown") === city
      );
      if (hit) {
        const lat = Number(hit.latitude);
        const lng = Number(hit.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) flyTo(lng, lat, 6.4);
      }
    },
    [onSelectCity, shownPoints, qRegion, qCountry, flyTo]
  );
  const pickOrg = useCallback(
    (name) => {
      setQOrg(name);
      const org = (shownPoints || []).find((p) => (p.orgName || "") === name);
      if (org) {
        const lat = Number(org.latitude);
        const lng = Number(org.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) flyTo(lng, lat, 8);
      }
    },
    [shownPoints, flyTo]
  );
  const clearAll = useCallback(() => {
    setQRegion("");
    setQCountry("");
    setQCity("");
    setQOrg("");
    onClearSelection?.();
  }, [onClearSelection]);

  // --- filtered lists for hover/spider search
  const hoverList = useMemo(() => {
    const q = normLower(hoverSearch);
    if (!q) return hoverLeaves;
    return hoverLeaves.filter((o) => normLower(o.orgName).includes(q));
  }, [hoverLeaves, hoverSearch]);

  const spiderList = useMemo(() => {
    if (!spider?.leaves?.length) return [];
    const q = normLower(spiderSearch);
    const leaves = spider.leaves;
    if (!q) return leaves;
    return leaves.filter((o) => normLower(o.orgName).includes(q));
  }, [spider, spiderSearch]);

  // --- layers: premium visual styling
  const orgClusterCircle = {
    id: "org-clusters",
    type: "circle",
    source: "org-source",
    filter: ["has", "point_count"],
    paint: {
      // outer halo
      "circle-radius": ["step", ["get", "point_count"], 18, 20, 22, 50, 26, 200, 32],
      "circle-color": "rgba(29,78,216,0.18)",
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(29,78,216,0.55)",
      "circle-blur": 0.15,
    },
  };

  const orgClusterInner = {
    id: "org-clusters-inner",
    type: "circle",
    source: "org-source",
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": ["step", ["get", "point_count"], 12, 20, 14, 50, 16, 200, 20],
      "circle-color": "rgba(255,255,255,0.94)",
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "rgba(0,0,0,0.10)",
    },
  };

  const orgClusterCount = {
    id: "org-cluster-count",
    type: "symbol",
    source: "org-source",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: { "text-color": "rgba(17,24,39,0.92)" },
  };

  const orgPinHalo = {
    id: "org-pin-halo",
    type: "circle",
    source: "org-source",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "isHQ"], 1], 12, 10],
      "circle-color": ["case", ["==", ["get", "isHQ"], 1], "rgba(34,197,94,0.18)", "rgba(29,78,216,0.18)"],
      "circle-blur": 0.65,
    },
  };

  const orgPin = {
    id: "org-unclustered",
    type: "circle",
    source: "org-source",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "isHQ"], 1], 6.5, 6],
      "circle-color": [
        "case",
        ["==", ["get", "selected"], 1],
        "rgba(29,78,216,0.95)",
        ["==", ["get", "isHQ"], 1],
        "rgba(34,197,94,0.90)",
        "rgba(29,78,216,0.90)",
      ],
      "circle-stroke-width": 1.4,
      "circle-stroke-color": "rgba(255,255,255,0.96)",
    },
  };

  const cityHalo = {
    id: "city-halo",
    type: "circle",
    source: "city-source",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "orgCount"], 1, 14, 50, 22, 200, 28],
      "circle-color": "rgba(29,78,216,0.10)",
      "circle-blur": 0.7,
    },
  };

  const cityPin = {
    id: "city-unclustered",
    type: "circle",
    source: "city-source",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "orgCount"], 1, 6.5, 50, 9.5, 200, 12],
      "circle-color": [
        "case",
        ["==", ["get", "selected"], 1],
        "rgba(29,78,216,0.95)",
        "rgba(255,255,255,0.96)",
      ],
      "circle-stroke-width": 1.8,
      "circle-stroke-color": "rgba(29,78,216,0.65)",
    },
  };

  const cityCount = {
    id: "city-count",
    type: "symbol",
    source: "city-source",
    layout: {
      "text-field": "{orgCount}",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-size": 11,
    },
    paint: { "text-color": "rgba(17,24,39,0.92)" },
  };

  const spiderLines = {
    id: "spider-lines",
    type: "line",
    source: "spider-lines-source",
    paint: {
      "line-width": 1.8,
      "line-color": "rgba(29,78,216,0.55)",
      "line-opacity": 0.85,
    },
  };

  const spiderPointsHalo = {
    id: "spider-points-halo",
    type: "circle",
    source: "spider-points-source",
    paint: {
      "circle-radius": 12,
      "circle-color": "rgba(29,78,216,0.14)",
      "circle-blur": 0.65,
    },
  };

  const spiderPoints = {
    id: "spider-points",
    type: "circle",
    source: "spider-points-source",
    paint: {
      "circle-radius": 6.2,
      "circle-color": "rgba(29,78,216,0.92)",
      "circle-stroke-width": 1.4,
      "circle-stroke-color": "rgba(255,255,255,0.96)",
    },
  };

  // --- view orgs helper: handle unknown city cleanly
  const fireViewOrgs = useCallback(
    (payload) => {
      if (!onViewOrgs) return;

      if (payload?.orgIds?.length) {
        onViewOrgs({ orgIds: payload.orgIds });
        return;
      }

      const salesRegion = payload?.salesRegion;
      const country = payload?.country;
      const city = payload?.city;

      if (isUnknownCity(city)) {
        onViewOrgs({ salesRegion, country });
        return;
      }
      onViewOrgs({ salesRegion, country, city });
    },
    [onViewOrgs]
  );

  // --- Render
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* Sidebar kept (works + users like it) */}
      <div
        style={{
          width: sidebarOpen ? SIDEBAR_W : 46,
          transition: "width 180ms ease",
          position: "relative",
        }}
      >
        <div style={{ ...softCard(), padding: 12, height, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            {sidebarOpen ? (
              <div style={{ fontWeight: 950, fontSize: 13 }}>Map Controls</div>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              style={{ ...pill(false), padding: "6px 10px" }}
              title={sidebarOpen ? "Collapse" : "Expand"}
            >
              {sidebarOpen ? "⟨" : "⟩"}
            </button>
          </div>

          {sidebarOpen ? (
            <div style={{ marginTop: 12, height: "calc(100% - 42px)", overflow: "auto", paddingRight: 6 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => onPinModeChange?.("org")} style={pill(pinMode === "org")}>
                  Org pins
                </button>
                <button type="button" onClick={() => onPinModeChange?.("city")} style={pill(pinMode === "city")}>
                  City pins
                </button>
                <button type="button" onClick={clearAll} style={pill(false)}>
                  Clear
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Region</div>
                <select value={qRegion} onChange={(e) => pickRegion(e.target.value)} style={inputStyle()}>
                  <option value="">All</option>
                  {allRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Country</div>
                <select value={qCountry} onChange={(e) => pickCountry(e.target.value)} style={inputStyle()}>
                  <option value="">All</option>
                  {filteredCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.7, marginBottom: 6 }}>City</div>
                <select value={qCity} onChange={(e) => pickCity(e.target.value)} style={inputStyle()}>
                  <option value="">All</option>
                  {filteredCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Org</div>
                <select value={qOrg} onChange={(e) => pickOrg(e.target.value)} style={inputStyle()}>
                  <option value="">Any</option>
                  {filteredOrgs.slice(0, 800).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {filteredOrgs.length > 800 ? (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>
                    Showing first 800 orgs. Use global search to narrow.
                  </div>
                ) : null}
              </div>

              {pinMode === "org" ? (
                <div style={{ marginTop: 14, fontSize: 12, opacity: 0.72, fontWeight: 800 }}>
                  Tip: hover a cluster to preview orgs, click a cluster to open the spider view.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.10)" }}>
        <MapGL
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={MAP_STYLE_URL}
          initialViewState={initialViewState}
          style={{ width: "100%", height }}
          onClick={onMapClick}
          onMoveStart={onMapMove}
          onDragStart={onMapMove}
          onZoomStart={onMapMove}
          onMouseMove={onMapMouseMove}
          interactiveLayerIds={["org-clusters", "org-unclustered", "city-unclustered", "spider-points"]}
        >
          <NavigationControl position="bottom-right" />

          {/* Org source (clustered) */}
          <Source
            key="org"
            id="org-source"
            type="geojson"
            data={orgFeatures}
            cluster
            clusterRadius={52}
            clusterMaxZoom={12}
          >
            {pinMode === "org" ? (
              <>
                <Layer {...orgClusterCircle} />
                <Layer {...orgClusterInner} />
                <Layer {...orgClusterCount} />
                <Layer {...orgPinHalo} />
                <Layer {...orgPin} />
              </>
            ) : null}
          </Source>

          {/* City source */}
          <Source key="city" id="city-source" type="geojson" data={cityFeatures}>
            {pinMode === "city" ? (
              <>
                <Layer {...cityHalo} />
                <Layer {...cityPin} />
                <Layer {...cityCount} />
              </>
            ) : null}
          </Source>

          {/* Spider overlay (only when active) */}
          {spider?.geojson ? (
            <>
              <Source id="spider-lines-source" type="geojson" data={spider.geojson.lines}>
                <Layer {...spiderLines} />
              </Source>
              <Source id="spider-points-source" type="geojson" data={spider.geojson.points}>
                <Layer {...spiderPointsHalo} />
                <Layer {...spiderPoints} />
              </Source>
            </>
          ) : null}

          {/* Hover cluster popup (search within cluster) */}
          {hoverCluster?.point ? (
            <Popup
              longitude={hoverCluster.point[0]}
              latitude={hoverCluster.point[1]}
              closeButton={false}
              closeOnClick={false}
              anchor="top"
              offset={18}
              maxWidth="360px"
            >
              <div style={{ ...softCard(), padding: 12, width: 330 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 950, fontSize: 13 }}>Cluster preview</div>
                  <div style={{ fontWeight: 950, fontSize: 12, opacity: 0.7 }}>{hoverCluster.count} orgs</div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <input
                    value={hoverSearch}
                    onChange={(e) => setHoverSearch(e.target.value)}
                    placeholder="Search orgs in this cluster…"
                    style={inputStyle()}
                  />
                </div>

                {hoverLeavesErr ? (
                  <div style={{ marginTop: 10, fontWeight: 900, color: "#b00020" }}>{hoverLeavesErr}</div>
                ) : null}

                <div style={{ marginTop: 10, maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                  {(hoverList || []).slice(0, 60).map((o) => (
                    <button
                      key={`${o.orgId}-${o.orgName}`}
                      type="button"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "white",
                        cursor: "pointer",
                        fontWeight: 900,
                        marginBottom: 8,
                      }}
                      onClick={() => {
                        // fly to org by searching a matching feature in current orgFeatures
                        const map = mapRef.current?.getMap?.();
                        if (map) {
                          const found = orgFeatures.features.find((f) => f.properties.orgId === o.orgId);
                          if (found) {
                            const [lng, lat] = found.geometry.coordinates;
                            flyTo(lng, lat, 8);
                            setPopup({ lng, lat, kind: "org", props: found.properties });
                          }
                        }
                      }}
                    >
                      <div style={{ fontSize: 13 }}>{o.orgName || "(Unnamed org)"}</div>
                      <div style={{ fontSize: 12, opacity: 0.68, fontWeight: 850 }}>
                        {o.countryName}
                        {isUnknownCity(o.city) ? "" : ` • ${o.city}`}
                        {o.isHQ ? " • HQ" : ""}
                      </div>
                    </button>
                  ))}

                  {hoverList?.length > 60 ? (
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 850 }}>Showing first 60 matches…</div>
                  ) : null}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    style={btn("secondary")}
                    onClick={() => {
                      // Promote to spider (premium)
                      const cached = clusterLeavesCache.current.get(hoverCluster.clusterId) || hoverLeaves;
                      const center = hoverCluster.point;
                      const geo = buildSpider(center, cached.slice(0, SPIDER_LEAVES_LIMIT));
                      setSpider({
                        clusterId: hoverCluster.clusterId,
                        center,
                        count: hoverCluster.count,
                        leaves: cached.slice(0, SPIDER_LEAVES_LIMIT),
                        geojson: geo,
                      });
                      setSpiderSearch("");
                      setPopup(null);
                    }}
                  >
                    Open spider
                  </button>

                  <button
                    type="button"
                    style={btn("primary")}
                    onClick={() => {
                      // If this cluster is mostly "Unknown city", prefer country-level view.
                      const list = (hoverList || hoverLeaves || []);
                      const orgIds = list.map((x) => x.orgId).filter(Boolean);
                      fireViewOrgs({ orgIds });
                    }}
                  >
                    View selected orgs
                  </button>
                </div>
              </div>
            </Popup>
          ) : null}

          {/* Spider mini panel (anchored) */}
          {spider?.center ? (
            <Popup
              longitude={spider.center[0]}
              latitude={spider.center[1]}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={22}
              maxWidth="420px"
            >
              <div style={{ ...softCard(), padding: 12, width: 380 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 950, fontSize: 13 }}>Spider cluster</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" style={pill(false)} onClick={() => setSpider(null)}>
                      Close
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <input
                    value={spiderSearch}
                    onChange={(e) => setSpiderSearch(e.target.value)}
                    placeholder="Search orgs in this cluster…"
                    style={inputStyle()}
                  />
                </div>

                <div style={{ marginTop: 10, maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                  {(spiderList || []).slice(0, 80).map((o) => (
                    <div
                      key={`${o.orgId}-${o.orgName}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "white",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {o.orgName || "(Unnamed org)"}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.68, fontWeight: 850 }}>
                          {o.countryName}
                          {isUnknownCity(o.city) ? "" : ` • ${o.city}`}
                          {o.isHQ ? " • HQ" : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        style={btn("secondary")}
                        onClick={() => {
                          // find feature by orgId and fly
                          const found = orgFeatures.features.find((f) => f.properties.orgId === o.orgId);
                          if (found) {
                            const [lng, lat] = found.geometry.coordinates;
                            flyTo(lng, lat, 8);
                            setPopup({ lng, lat, kind: "org", props: found.properties });
                          }
                        }}
                      >
                        Focus
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    style={btn("secondary")}
                    onClick={() => {
                      // Rebuild spider using filtered list for visual declutter
                      const leaves = (spiderList || []).slice(0, SPIDER_LEAVES_LIMIT);
                      const geo = buildSpider(spider.center, leaves);
                      setSpider({ ...spider, leaves, geojson: geo });
                    }}
                  >
                    Apply filter
                  </button>
                  <button
                    type="button"
                    style={btn("primary")}
                    onClick={() => {
                      const orgIds = (spiderList || []).map((x) => x.orgId).filter(Boolean);
                      fireViewOrgs({ orgIds });
                    }}
                  >
                    View listed orgs
                  </button>
                </div>
              </div>
            </Popup>
          ) : null}

          {/* Pin popup */}
          {popup ? (
            <Popup
              longitude={popup.lng}
              latitude={popup.lat}
              closeButton={false}
              closeOnClick={false}
              anchor="top"
              offset={18}
            >
              <div style={{ ...softCard(), padding: 12, width: 320 }}>
                {popup.kind === "org" ? (
                  <>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{popup.props.orgName || "Organization"}</div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.72, fontWeight: 850 }}>
                      {popup.props.countryName}
                      {isUnknownCity(popup.props.city) ? "" : ` • ${popup.props.city}`}
                      {Number(popup.props.isHQ || 0) === 1 ? " • HQ" : ""}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => onToggleSelect?.(popup.props._key, { type: "org", org: popup.props })}
                        style={btn("secondary")}
                      >
                        {isSelected?.(popup.props._key) ? "Unselect" : "Select"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const salesRegion = popup.props.salesRegion;
                          const country = popup.props.countryName;
                          const city = popup.props.city;
                          fireViewOrgs({ salesRegion, country, city });
                        }}
                        style={btn("primary")}
                      >
                        {isUnknownCity(popup.props.city) ? "View orgs in country" : "View orgs"}
                      </button>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {onGoToCountry ? (
                        <button type="button" onClick={() => onGoToCountry(popup.props.countryName)} style={btn("secondary")}>
                          Country details
                        </button>
                      ) : null}
                      {onGoToRegion ? (
                        <button type="button" onClick={() => onGoToRegion(popup.props.salesRegion)} style={btn("secondary")}>
                          Region details
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{popup.props.city || "City"}</div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.72, fontWeight: 850 }}>
                      {popup.props.countryName} • {popup.props.salesRegion}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, opacity: 0.8 }}>
                      {popup.props.orgCount} orgs{Number(popup.props.hqCount || 0) ? ` • ${popup.props.hqCount} HQ` : ""}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => onToggleSelect?.(popup.props._key, { type: "city", city: popup.props })}
                        style={btn("secondary")}
                      >
                        {isSelected?.(popup.props._key) ? "Unselect" : "Select"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const salesRegion = popup.props.salesRegion;
                          const country = popup.props.countryName;
                          const city = popup.props.city;
                          fireViewOrgs({ salesRegion, country, city });
                        }}
                        style={btn("primary")}
                      >
                        {isUnknownCity(popup.props.city) ? "View orgs in country" : "View orgs"}
                      </button>

                      {onGoToCity && !isUnknownCity(popup.props.city) ? (
                        <button
                          type="button"
                          onClick={() => onGoToCity(popup.props.city, popup.props.countryName, popup.props.salesRegion)}
                          style={btn("secondary")}
                        >
                          City details
                        </button>
                      ) : null}
                    </div>
                  </>
                )}

                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" style={pill(false)} onClick={() => setPopup(null)}>
                    Close
                  </button>
                </div>
              </div>
            </Popup>
          ) : null}
        </MapGL>
      </div>
    </div>
  );
}
