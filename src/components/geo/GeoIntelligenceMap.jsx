import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMap, { NavigationControl } from "react-map-gl/maplibre";
import { DeckGL } from "@deck.gl/react";
import SelectionTray from "./SelectionTray.jsx";
import OrgDrawer from "./OrgDrawer.jsx";
import Supercluster from "supercluster";
import { ScatterplotLayer, ArcLayer, TextLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";

import "maplibre-gl/dist/maplibre-gl.css";

/**
 * GeoIntelligenceMap (NO Mapbox / NO billing)
 * - MapLibre GL base map + Deck.GL overlays (premium layers).
 * - Box selection (Shift + drag) emits Set<locationId> (Option B).
 * - CITY can be null; selection/navigation uses stable locationId only.
 *
 * Props:
 *  - points: Array from /api/locations/points (must include latitude/longitude + locationId)
 *  - scope: "all" | "hq" (optional; filters points client-side if hq)
 *  - mapStyleUrl: string (optional; defaults to MapLibre demo tiles)
 *  - onSelectionChange: (set: Set<string>) => void
 *  - onClickPoint: (point) => void (optional)
 */
export default function GeoIntelligenceMap({
  points = [],
  scope = "all",
  mapStyleUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  onSelectionChange,
  onViewOrgs,
  onClickPoint,
}) {
  const mapRef = useRef(null);

  const flyTo = useCallback((longitude, latitude, zoom) => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    try {
      map.easeTo({ center: [longitude, latitude], zoom, duration: 650 });
    } catch (_) {}
  }, []);

  const [viewState, setViewState] = useState({
    longitude: -20,
    latitude: 30,
    zoom: 1.4,
    bearing: 0,
    pitch: 25,
  });

  const [showDensity, setShowDensity] = useState(true);
  const [showNetworks, setShowNetworks] = useState(true);

  const [hovered, setHovered] = useState(null); // deck hover info
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [tick, setTick] = useState(0); // subtle animation pulse
  const [shiftHeld, setShiftHeld] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFeature, setDrawerFeature] = useState(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onDown = (e) => {
      if (e.key === "Shift") setShiftHeld(true);
    };
    const onUp = (e) => {
      if (e.key === "Shift") setShiftHeld(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Box selection UI state
  const [boxSelecting, setBoxSelecting] = useState(false);
  const [boxStart, setBoxStart] = useState(null); // {x,y}
  const [boxEnd, setBoxEnd] = useState(null); // {x,y}

  // ---------- Helpers ----------
  const getLonLat = useCallback((p) => {
    const lat = p?.latitude ?? p?.lat ?? p?.LATITUDE ?? p?.Latitude ?? p?.LAT ?? null;
    const lon = p?.longitude ?? p?.lng ?? p?.lon ?? p?.LONGITUDE ?? p?.Longitude ?? p?.LON ?? null;
    const latitude = lat != null ? Number(lat) : null;
    const longitude = lon != null ? Number(lon) : null;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }, []);

  const isHQ = useCallback((p) => {
    const v = p?.headquarters ?? p?.HEADQUARTERS ?? p?.hq ?? p?.HQ ?? false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.toLowerCase());
    return false;
  }, []);

  const filteredPoints = useMemo(() => {
    const out = [];
    for (const p of points || []) {
      const ll = getLonLat(p);
      if (!ll) continue;
      if (scope === "hq" && !isHQ(p)) continue;
      out.push({ ...p, __ll: ll, __locationId: String(p?.locationId ?? p?.LOCATION_ID ?? p?.location_id ?? "") });
    }
    return out.filter((p) => p.__locationId);
  }, [points, scope, getLonLat, isHQ]);

  // ---- Clustering (premium zoom behavior) ----
  const clusterIndex = useMemo(() => {
    const idx = new Supercluster({ radius: 60, maxZoom: 16 });
    const features = (filteredPoints || []).map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.__ll.longitude, p.__ll.latitude] },
      properties: {
        locationId: p.__locationId,
        isHQ: isHQ(p),
        orgName: p?.orgName ?? p?.ORG_NAME,
      },
    }));
    idx.load(features);
    return idx;
  }, [filteredPoints, isHQ]);

  const clusters = useMemo(() => {
    // If map not ready, approximate bounds around the globe
    try {
      const vp = new WebMercatorViewport(viewState);
      const b = vp.getBounds();
      const zoom = Math.max(0, Math.min(20, Math.round(viewState.zoom || 0)));
      return clusterIndex.getClusters([b[0], b[1], b[2], b[3]], zoom);
    } catch (_) {
      return clusterIndex.getClusters([-180, -85, 180, 85], Math.round(viewState.zoom || 0));
    }
  }, [clusterIndex, viewState]);

  const clusterPoints = useMemo(() => clusters.filter((f) => f.properties && f.properties.cluster), [clusters]);
  const singlePoints = useMemo(() => clusters.filter((f) => !(f.properties && f.properties.cluster)), [clusters]);

  const arcPairs = useMemo(() => {
    if (!showNetworks) return [];
    const byOrg = new Map();
    for (const p of filteredPoints) {
      const orgId = p?.orgId ?? p?.ORG_ID ?? p?.org_id ?? p?.participantId ?? null;
      if (!orgId) continue;
      const entry = byOrg.get(orgId) || { hq: null, others: [] };
      if (isHQ(p) && !entry.hq) entry.hq = p;
      else entry.others.push(p);
      byOrg.set(orgId, entry);
    }

    const arcs = [];
    for (const [orgId, entry] of byOrg.entries()) {
      if (!entry.hq || !entry.others.length) continue;
      for (const o of entry.others) arcs.push({ orgId, from: entry.hq, to: o });
    }
    return arcs;
  }, [filteredPoints, isHQ, showNetworks]);

  const layers = useMemo(() => {
    const out = [];

    if (showDensity) {
      out.push(
        new HexagonLayer({
          transitions: {
            elevationScale: 250,
          },
          id: "density-hex",
          data: singlePoints,
          getPosition: (f) => f.geometry.coordinates,
          radius: 45000,
          elevationScale: 25,
          extruded: true,
          opacity: Math.max(0, Math.min(0.85, 1 - (viewState.zoom - 2.5) * 0.18)),
          pickable: true,
        })
      );
    }

    if (showNetworks) {
      out.push(
        new ArcLayer({
          id: "hq-arcs",
          data: arcPairs,
          getSourcePosition: (d) => [d.from.__ll.longitude, d.from.__ll.latitude],
          getTargetPosition: (d) => [d.to.__ll.longitude, d.to.__ll.latitude],
          getWidth: 1.25,
          pickable: false,
        })
      );
    }

    // Cluster bubbles
    out.push(
      new ScatterplotLayer({
        id: "clusters-layer",
        data: clusterPoints,
        getPosition: (f) => f.geometry.coordinates,
        getRadius: (f) => {
          const c = Number(f?.properties?.point_count || 0);
          // radius in meters-ish — scaled for global view
          return Math.min(22000, 6500 + Math.sqrt(c) * 2200);
        },
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        pickable: true,
        getLineColor: [30, 42, 120, 210],
        getFillColor: [255, 255, 255, 220],
        onClick: (info) => {
          const f = info?.object;
          if (!f) return;
          const id = f.properties?.cluster_id;
          if (id == null) return;
          const zoom = clusterIndex.getClusterExpansionZoom(id);
          const coords = f.geometry.coordinates;
          setViewState((vs) => ({
            ...vs,
            longitude: coords[0],
            latitude: coords[1],
            zoom: Math.max(vs.zoom, Math.min(zoom + 0.6, 10))
          }));
        },
      })
    );

    out.push(
      new TextLayer({
        id: "clusters-text",
        data: clusterPoints,
        getPosition: (f) => f.geometry.coordinates,
        getText: (f) => String(f?.properties?.point_count_abbreviated ?? f?.properties?.point_count ?? ""),
        getSize: 14,
        sizeUnits: "pixels",
        getColor: [30, 42, 120, 235],
        background: false,
        billboard: true,
        pickable: false,
      })
    );

    // Individual points (non-cluster)
    out.push(
      new ScatterplotLayer({
        transitions: {
          getRadius: 250,
        },
        id: "locations-points",
        data: singlePoints,
        getPosition: (f) => f.geometry.coordinates,
        getRadius: (f) => {
          const base = f?.properties?.isHQ ? 7000 : 4600;
          const pulse = f?.properties?.isHQ ? (1 + 0.05 * Math.sin(tick / 12)) : 1;
          return base * pulse;
        },
        radiusUnits: "meters",
        stroked: true,
        filled: true,
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        getLineColor: (f) => (selectedIds.has(String(f?.properties?.locationId)) ? [30, 42, 120, 255] : [30, 42, 120, 160]),
        getFillColor: (f) => (f?.properties?.isHQ ? [30, 42, 120, 235] : [207, 239, 247, 220]),
        onHover: (info) => setHovered(info),
        onClick: (info) => {
          const obj = info?.object;
          if (obj) {
            // Cinematic fly-to
            try {
              const coords = obj?.geometry?.coordinates;
              if (coords && coords.length === 2) {
                setViewState((vs) => ({
                  ...vs,
                  longitude: coords[0],
                  latitude: coords[1],
                  zoom: Math.max(vs.zoom, 4.2)
                }));
              }
            } catch (_) {}
            onClickPoint?.(obj);
            setDrawerFeature(obj);
            setDrawerOpen(true);
          }
        },
      })
    );

    return out;
  }, [filteredPoints, isHQ, selectedIds, arcPairs, showDensity, showNetworks, onClickPoint, viewState, tick, clusterPoints, singlePoints, clusterIndex]);

  const tooltip = useMemo(() => {
    const obj = hovered?.object;
    if (!obj) return null;
    const orgName = obj?.properties?.orgName ?? obj?.orgName ?? obj?.ORG_NAME ?? "Unknown org";
    const hq = !!obj?.properties?.isHQ;
    const loc = String(obj?.properties?.locationId || "");
    return { x: hovered.x, y: hovered.y, lines: [orgName, loc ? `ID: ${loc}` : " ", hq ? "HQ" : "Location"] };
  }, [hovered, isHQ]);

  // ---------- Box selection ----------
  const clearSelection = useCallback(() => {
    const next = new Set();
    setSelectedIds(next);
    onSelectionChange?.(next);
  }, [onSelectionChange]);

  const finishBoxSelection = useCallback(
    (start, end) => {
      const map = mapRef.current?.getMap?.();
      if (!map || !start || !end) return;

      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxX = Math.max(start.x, end.x);
      const maxY = Math.max(start.y, end.y);

      // Convert screen pixels to lng/lat bounds via unproject
      const sw = map.unproject([minX, maxY]); // bottom-left
      const ne = map.unproject([maxX, minY]); // top-right

      const west = Math.min(sw.lng, ne.lng);
      const east = Math.max(sw.lng, ne.lng);
      const south = Math.min(sw.lat, ne.lat);
      const north = Math.max(sw.lat, ne.lat);

      const next = new Set();
      for (const p of filteredPoints) {
        const { longitude, latitude } = p.__ll;
        const inside = longitude >= west && longitude <= east && latitude >= south && latitude <= north;
        if (inside) next.add(p.__locationId);
      }

      setSelectedIds(next);
      onSelectionChange?.(next);
    },
    [filteredPoints, onSelectionChange]
  );

  const onPointerDown = useCallback(
    (e) => {
      // Shift+drag to box-select
      if (!e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = e.currentTarget.getBoundingClientRect();
      const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setBoxSelecting(true);
      setBoxStart(start);
      setBoxEnd(start);
    },
    []
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!boxSelecting) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setBoxEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [boxSelecting]
  );

  const onPointerUp = useCallback(() => {
    if (!boxSelecting) return;
    setBoxSelecting(false);
    finishBoxSelection(boxStart, boxEnd);
    setBoxStart(null);
    setBoxEnd(null);
  }, [boxSelecting, boxStart, boxEnd, finishBoxSelection]);

  return (
    <div style={{ position: "relative", height: 720, borderRadius: 18, overflow: "hidden" }}>
      {/* Top-left controls */}
      <div style={panelStyle}>
        <button type="button" onClick={() => setShowDensity((v) => !v)} style={btnStyle(showDensity)} title="Toggle density layer">
          Density
        </button>
        <button type="button" onClick={() => setShowNetworks((v) => !v)} style={btnStyle(showNetworks)} title="Toggle HQ network arcs">
          Networks
        </button>
        <button type="button" onClick={clearSelection} style={btnStyle(false)} title="Clear selection">
          Clear
        </button>
        <span style={{ fontWeight: 900, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
          Box select: <b>Shift</b> + drag
        </span>
      </div>

      <ReactMap
        ref={mapRef}
        initialViewState={viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyleUrl}
        attributionControl={false}
        scrollZoom={true}
        dragPan={true}
        dragRotate={true}
        touchZoomRotate={true}
      >
        <NavigationControl position="bottom-right" />

        {/* Deck overlay */}
        <DeckGL viewState={viewState} layers={layers} controller={false} style={{ position: "absolute", inset: 0 }} />

        {/* Mouse overlay for box selection (only active with Shift) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            // Only intercept pointer events for box-selection when Shift is held (or actively selecting).
            pointerEvents: boxSelecting || shiftHeld ? "auto" : "none",
            cursor: boxSelecting ? "crosshair" : shiftHeld ? "crosshair" : "grab",
          }}
        />

        {/* Selection rectangle */}
        {boxSelecting && boxStart && boxEnd ? (
          <div
            style={{
              position: "absolute",
              zIndex: 6,
              left: Math.min(boxStart.x, boxEnd.x),
              top: Math.min(boxStart.y, boxEnd.y),
              width: Math.abs(boxEnd.x - boxStart.x),
              height: Math.abs(boxEnd.y - boxStart.y),
              border: "2px solid rgba(30,42,120,0.92)",
              background: "rgba(207,239,247,0.30)",
              borderRadius: 10,
              pointerEvents: "none",
            }}
          />
        ) : null}

        {/* Tooltip */}
        {tooltip ? (
          <div
            style={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(10px, 10px)",
              zIndex: 20,
              pointerEvents: "none",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(30,42,120,0.18)",
              background: "rgba(255,255,255,0.94)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
              minWidth: 220,
            }}
          >
            <div style={{ fontWeight: 950, color: "#111827", fontSize: 13 }}>{tooltip.lines[0]}</div>
            <div style={{ marginTop: 6, fontWeight: 850, color: "rgba(0,0,0,0.70)", fontSize: 12 }}>
              {tooltip.lines[1]}
            </div>
            <div style={{ marginTop: 6, fontWeight: 900, color: "rgba(30,42,120,0.92)", fontSize: 12 }}>
              {tooltip.lines[2]}
            </div>
          </div>
        ) : null}
      </ReactMap>

      <SelectionTray
        selectedIds={selectedIds}
        points={filteredPoints}
        onClear={clearSelection}
        onViewOrgs={(ids) => onViewOrgs?.(ids)}
      />

      <OrgDrawer
        open={drawerOpen}
        feature={drawerFeature}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerFeature(null);
        }}
        onViewOrgs={() => {
          const id = String(drawerFeature?.properties?.locationId || drawerFeature?.locationId || "");
          if (!id) return;
          onViewOrgs?.(new Set([id]));
        }}
      />
    </div>
  );
}

const panelStyle = {
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  padding: 10,
  borderRadius: 16,
  border: "1px solid rgba(30,42,120,0.14)",
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.12)",
};

function btnStyle(active) {
  return {
    border: "1px solid rgba(30,42,120,0.18)",
    borderRadius: 999,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 950,
    background: active ? "rgba(30,42,120,0.92)" : "rgba(255,255,255,0.92)",
    color: active ? "#fff" : "rgba(30,42,120,0.92)",
  };
}
