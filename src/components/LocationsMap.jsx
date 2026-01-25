// // // src/components/LocationsMap.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";

// import { getLocationPoints, buildPins } from "../services/locationsApi";
// import {
//   useVisualizeFilters,
//   setVisualizeFilters,
//   openViewItemModal,
//   closeViewItemModal,
//   getVisualizeFilters,
// } from "../state/visualizeFiltersStore";

// // Hardcoded (quick start) — from your samples
// mapboxgl.accessToken =
//   "pk.eyJ1IjoiY3ZpZW5uZWEiLCJhIjoiY21peWtjbGFmMGZlYzNlcHk0Znd5aHh1MyJ9.ThGqGYAKuC-CUr-KSt2EZw";

// const MAP_STYLE = "mapbox://styles/cviennea/cmiyjx5mh004201s18hp8btul";

// const BRAND = {
//   primaryLightBlue: "#CEECF2",
//   primaryDarkBlue: "#232073", // Orgs view city dots
//   secondaryGreen: "#3AA608", // Orgs view org dots
//   secondaryOrange: "#D97218",
//   secondaryYellow: "#F2C53D",
//   grey: "#747474",
//   lightGrey: "#D9D9D9",
//   card: "#FFFFFF",
//   border: "#E5E7EB",
//   danger: "#b91c1c",
// };

// const VIEW_META = {
//   orgs: {
//     label: "Orgs View",
//     pointColor: BRAND.secondaryGreen,
//     clusterColor: BRAND.secondaryGreen,
//     clusterOpacity: 0.18,
//   },
//   tax: {
//     label: "Tax Regions",
//     pointColor: BRAND.secondaryOrange,
//     clusterColor: BRAND.secondaryOrange,
//     clusterOpacity: 0.18,
//   },
//   geodata: {
//     label: "Geodata",
//     pointColor: BRAND.secondaryYellow,
//     clusterColor: BRAND.secondaryYellow,
//     clusterOpacity: 0.18,
//   },
//   cloud: {
//     label: "Cloud Regions",
//     pointColor: BRAND.primaryDarkBlue,
//     clusterColor: BRAND.primaryDarkBlue,
//     clusterOpacity: 0.18,
//   },
// };

// function isUnknownish(value) {
//   const v = String(value ?? "").trim().toLowerCase();
//   return !v || v === "unknown" || v === "n/a" || v === "-" || v === "na";
// }

// /**
//  * From "North America (NA)" -> "NA"
//  * From "Europe - Middle East - Africa (EMEA)" -> "EMEA"
//  */
// function codeFromSalesRegionLabel(label) {
//   const s = String(label ?? "").trim();
//   if (!s) return "Unknown";
//   const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
//   if (m?.[1]) return m[1].toUpperCase();

//   const u = s.toUpperCase();
//   if (u.includes("NORTH AMERICA")) return "NA";
//   if (u.includes("EUROPE") || u.includes("MIDDLE EAST") || u.includes("AFRICA")) return "EMEA";
//   if (u.includes("ASIA") || u.includes("PACIFIC")) return "APAC";
//   if (u.includes("LATIN")) return "LATAM";

//   return "Unknown";
// }

// /**
//  * Normalize any sales region-ish string to a canonical label that matches the filters store.
//  * This fixes APAC/LATAM mismatches caused by slightly different formatting across datasets.
//  */
// function normalizeSalesRegionLabel(label) {
//   const s = String(label ?? "").trim();
//   if (!s) return "";

//   // If already in canonical (CODE) form, keep it.
//   const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
//   if (m?.[1]) {
//     const code = m[1].toUpperCase();
//     if (code === "NA") return "North America (NA)";
//     if (code === "EMEA") return "Europe - Middle East - Africa (EMEA)";
//     if (code === "APAC") return "Asia-Pacific (APAC)";
//     if (code === "LATAM") return "Latin America (LATAM)";
//   }

//   // Otherwise infer by content.
//   const code = codeFromSalesRegionLabel(s);
//   if (code === "NA") return "North America (NA)";
//   if (code === "EMEA") return "Europe - Middle East - Africa (EMEA)";
//   if (code === "APAC") return "Asia-Pacific (APAC)";
//   if (code === "LATAM") return "Latin America (LATAM)";
//   return s; // fallback (won't match filters, but better than blank)
// }

// function escapeHtml(str) {
//   const s = String(str ?? "");
//   return s
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&#039;");
// }

// // Convert pins -> GeoJSON with the right properties for clusters + popups
// function toGeoJSON(pins) {
//   return {
//     type: "FeatureCollection",
//     features: (pins || []).map((p) => ({
//       type: "Feature",
//       geometry: { type: "Point", coordinates: p.coords },
//       properties: {
//         id: p.id,
//         label: p.label,
//         salesRegionLabel: p.salesRegion, // label (e.g. "North America (NA)")
//         salesRegionCode: codeFromSalesRegionLabel(p.salesRegion),
//         countryName: p.countryName,
//         city: p.city,
//         orgCount: Number(p.orgCount || 0),
//         hqCount: Number(p.hqCount || 0),
//         orgIds: JSON.stringify(p.orgIds || []),
//         locationIds: JSON.stringify(p.locationIds || []),
//       },
//     })),
//   };
// }

// // Generic dataset -> GeoJSON (one marker per row)
// function toGenericGeoJSON(rows, viewMode) {
//   return {
//     type: "FeatureCollection",
//     features: (rows || [])
//       .filter((r) => Number.isFinite(r.longitude) && Number.isFinite(r.latitude))
//       .map((r, idx) => {
//         const id =
//           r.id ||
//           r.geonameId ||
//           r.geonameCountryId ||
//           r.cloudRegionName ||
//           r.locationQuery ||
//           `${viewMode}-${idx}`;

//         // label per view
//         let label = "";
//         if (viewMode === "tax") label = r.locationQuery || r.subRegion || r.country || "Tax Region";
//         else if (viewMode === "cloud") label = r.cloudRegionName || r.regionName || "Cloud Region";
//         else if (viewMode === "geodata") label = r.geonameCountryName || "Country";
//         else label = r.label || "Point";

//         const rawSalesRegion = r.salesRegion || r.SALES_REGION || r.salesRegionLabel || "";
//         const salesRegion = normalizeSalesRegionLabel(rawSalesRegion);

//         const cloudProvider =
//           r.cloudProvider || r.CLOUD_PROVIDER || r.provider || r.PROVIDER || "";

//         return {
//           type: "Feature",
//           geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
//           properties: {
//             __viewMode: viewMode,
//             id: String(id),
//             label: String(label),

//             // allow global filters / useful context
//             salesRegion,
//             countryName:
//               r.country ||
//               r.countryName ||
//               r.geonameCountryName ||
//               r.COUNTRY ||
//               r.COUNTRY_NAME ||
//               "",

//             cloudProvider: String(cloudProvider || ""),

//             // embed full row for rich modal
//             row: JSON.stringify(r),
//           },
//         };
//       }),
//   };
// }

// function LegendItem({ label, color }) {
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//       <div
//         style={{
//           width: 10,
//           height: 10,
//           borderRadius: 999,
//           background: color,
//           border: `2px solid ${BRAND.primaryLightBlue}`,
//         }}
//       />
//       <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.primaryDarkBlue }}>{label}</div>
//     </div>
//   );
// }

// function CloudLegend({ providers = [], getColor }) {
//   const list = (providers || []).slice(0, 10); // keep it tidy
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
//       {list.map((p) => (
//         <LegendItem key={p} label={p} color={getColor(p)} />
//       ))}
//       {providers.length > list.length ? (
//         <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
//           +{(providers.length - list.length).toLocaleString()} more
//         </div>
//       ) : null}
//     </div>
//   );
// }

// // Stable-ish palette (we’ll reuse brand hues + softer neutrals)
// const CLOUD_PROVIDER_PALETTE = [
//   BRAND.secondaryOrange,
//   BRAND.secondaryGreen,
//   BRAND.primaryDarkBlue,
//   BRAND.secondaryYellow,
//   "#6D28D9", // purple
//   "#DC2626", // red
//   "#0EA5E9", // cyan
//   "#F97316", // orange alt
//   "#10B981", // teal
//   "#64748B", // slate
// ];

// const base = import.meta.env.VITE_API_BASE;
// function colorForProvider(provider, providersSorted) {
//   const p = String(provider || "").trim();
//   if (!p) return BRAND.lightGrey;

//   const list = providersSorted || [];
//   const idx = list.indexOf(p);
//   if (idx < 0) return CLOUD_PROVIDER_PALETTE[0];
//   return CLOUD_PROVIDER_PALETTE[idx % CLOUD_PROVIDER_PALETTE.length];
// }

// // Fetch wrapper for view endpoints
// async function fetchViewRows(viewMode, filters, { signal } = {}) {
//   if (viewMode === "orgs") return [];

//   const sr = filters.salesRegions?.size ? Array.from(filters.salesRegions).join(",") : "";
//   const co = filters.countries?.size ? Array.from(filters.countries).join(",") : "";
//   const cp = filters.cloudProviders?.size ? Array.from(filters.cloudProviders).join(",") : "";

//   const qs = new URLSearchParams();

//   if (viewMode === "tax") {
//     if (sr) qs.set("SALES_REGION", sr);
//     if (co) qs.set("COUNTRY", co);
//     const res = await fetch(`${base}/api/views/tax-regions?${qs.toString()}`, { signal });
//     if (!res.ok) throw new Error("Failed to load Tax Regions");
//     return res.json();
//   }

//   if (viewMode === "geodata") {
//     if (sr) qs.set("SALES_REGION", sr);
//     // backend expects GEONAME_COUNTRY_NAME for the filter
//     if (co) qs.set("GEONAME_COUNTRY_NAME", co);
//     const res = await fetch(`${base}/api/views/geodata?${qs.toString()}`, { signal });
//     if (!res.ok) throw new Error("Failed to load Geodata");
//     return res.json();
//   }

//   if (viewMode === "cloud") {
//     // ✅ Cloud now supports SALES_REGION + CLOUD_PROVIDER + COUNTRY_NAME
//     if (sr) qs.set("SALES_REGION", sr);
//     if (co) qs.set("COUNTRY_NAME", co);
//     if (cp) qs.set("CLOUD_PROVIDER", cp);
//     const res = await fetch(`${base}/api/views/cloud-regions?${qs.toString()}`, { signal });
//     if (!res.ok) throw new Error("Failed to load Cloud Regions");
//     return res.json();
//   }

//   return [];
// }

// export default function LocationsMap({ viewMode = "orgs" }) {
//   const filters = useVisualizeFilters();

//   // 🔒 Runtime-safe refs so map click handlers always see the latest state (no stale closures)
//   const viewModeRef = useRef(viewMode);
//   const selectedFeatureIdRef = useRef(null);

//   useEffect(() => {
//     viewModeRef.current = viewMode;
//   }, [viewMode]);

//   useEffect(() => {
//     selectedFeatureIdRef.current = filters.selectedFeatureId || null;
//   }, [filters.selectedFeatureId]);

//   const isOrgsView = viewMode === "orgs";
//   const isCloudView = viewMode === "cloud";
//   const meta = VIEW_META[viewMode] || VIEW_META.orgs;

//   const containerRef = useRef(null);
//   const mapRef = useRef(null);
//   const popupRef = useRef(null);

//   // Orgs view data
//   const [points, setPoints] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   // Generic view data
//   const [viewRows, setViewRows] = useState([]);
//   const [viewLoading, setViewLoading] = useState(false);
//   const [viewErr, setViewErr] = useState("");

//   // Track zoom
//   const [zoomLevel, setZoomLevel] = useState(1.5);
//   const zoomRef = useRef(1.5);
//   const zoomRafRef = useRef(null);

//   // ORGS VIEW: org layer shows when either a city is selected OR an org drilldown exists
//   const citySelected = (filters.cities?.size || 0) > 0;
//   const orgSelected = (filters.orgIds?.size || 0) > 0;
//   const showOrgLayer = isOrgsView && (citySelected || orgSelected);

//   // Load org location points once (cached by service) — only if orgs view
//   useEffect(() => {
//     if (!isOrgsView) {
//       setLoading(false);
//       setErr("");
//       return;
//     }

//     const ac = new AbortController();
//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");
//         const pts = await getLocationPoints({ signal: ac.signal });
//         setPoints(pts);
//       } catch (e) {
//         if (ac.signal.aborted) return;
//         setErr(e?.message || "Failed to load location points");
//       } finally {
//         if (!ac.signal.aborted) setLoading(false);
//       }
//     })();

//     return () => ac.abort();
//   }, [isOrgsView]);

//   // Load view rows for non-org modes (filtered server-side)
//   useEffect(() => {
//     if (isOrgsView) {
//       setViewRows([]);
//       setViewLoading(false);
//       setViewErr("");
//       return;
//     }

//     const ac = new AbortController();
//     (async () => {
//       try {
//         setViewLoading(true);
//         setViewErr("");
//         const rows = await fetchViewRows(viewMode, filters, { signal: ac.signal });
//         setViewRows(rows || []);
//       } catch (e) {
//         if (ac.signal.aborted) return;
//         setViewErr(e?.message || "Failed to load view data");
//         setViewRows([]);
//       } finally {
//         if (!ac.signal.aborted) setViewLoading(false);
//       }
//     })();

//     return () => ac.abort();
//     // ✅ include cloudProviders so map updates when provider filter changes
//   }, [isOrgsView, viewMode, filters.salesRegions, filters.countries, filters.cloudProviders]);

//   /**
//    * ORGS VIEW:
//    * BASE FILTER: sales region + country apply to both layers
//    * - salesRegions stores LABELS (e.g. "North America (NA)")
//    */
//   const baseFilteredPoints = useMemo(() => {
//     if (!isOrgsView) return [];
//     const sr = filters.salesRegions; // LABELS
//     const co = filters.countries;

//     return (points || []).filter((p) => {
//       if (sr?.size && !sr.has(String(p.salesRegion))) return false;
//       if (co?.size && !co.has(p.countryName)) return false;
//       return true;
//     });
//   }, [isOrgsView, points, filters.salesRegions, filters.countries]);

//   /**
//    * CITY LAYER: keep city context visible; ignore city filter here
//    */
//   const cityPins = useMemo(() => {
//     if (!isOrgsView) return [];
//     return buildPins(baseFilteredPoints, { mode: "city" });
//   }, [isOrgsView, baseFilteredPoints]);

//   const geoCity = useMemo(() => (isOrgsView ? toGeoJSON(cityPins) : null), [isOrgsView, cityPins]);

//   /**
//    * ORG LAYER:
//    * - If orgIds selected, drill to those regardless of city
//    * - Else city drilldown if selected
//    */
//   const orgFilteredPoints = useMemo(() => {
//     if (!isOrgsView) return [];
//     const ci = filters.cities;
//     const orgIds = filters.orgIds;

//     return (baseFilteredPoints || []).filter((p) => {
//       if (orgIds?.size) return orgIds.has(String(p.orgId));
//       if (ci?.size && !ci.has(p.city)) return false;
//       return true;
//     });
//   }, [isOrgsView, baseFilteredPoints, filters.cities, filters.orgIds]);

//   const orgPins = useMemo(() => {
//     if (!isOrgsView || !showOrgLayer) return [];
//     return buildPins(orgFilteredPoints, { mode: "org" });
//   }, [isOrgsView, orgFilteredPoints, showOrgLayer]);

//   const geoOrg = useMemo(() => (isOrgsView ? toGeoJSON(orgPins) : null), [isOrgsView, orgPins]);

//   // Generic GeoJSON
//   const geoGeneric = useMemo(() => {
//     if (isOrgsView) return null;
//     return toGenericGeoJSON(viewRows || [], viewMode);
//   }, [isOrgsView, viewRows, viewMode]);

//   // Cloud provider list (for coloring + legend)
//   const cloudProvidersSorted = useMemo(() => {
//     if (!isCloudView) return [];
//     const s = new Set();
//     for (const ft of geoGeneric?.features || []) {
//       const p = ft?.properties?.cloudProvider;
//       if (p) s.add(String(p));
//     }
//     return Array.from(s).sort((a, b) => a.localeCompare(b));
//   }, [isCloudView, geoGeneric]);

//   // Init map once
//   useEffect(() => {
//     if (mapRef.current || !containerRef.current) return;

//     const map = new mapboxgl.Map({
//       container: containerRef.current,
//       style: MAP_STYLE,
//       center: [0, 20],
//       zoom: 1.5,
//       projection: "mercator",
//     });

//     map.addControl(new mapboxgl.NavigationControl(), "top-right");

//     const updateZoomState = () => {
//       const z = map.getZoom();
//       zoomRef.current = z;

//       if (zoomRafRef.current) return;
//       zoomRafRef.current = requestAnimationFrame(() => {
//         zoomRafRef.current = null;
//         setZoomLevel(zoomRef.current);
//       });
//     };

//     map.on("zoomend", updateZoomState);
//     map.on("moveend", updateZoomState);

//     map.on("load", () => {
//       // -----------------------
//       // ORGS VIEW SOURCES/LAYERS
//       // -----------------------
//       if (!map.getSource("locations-city")) {
//         map.addSource("locations-city", {
//           type: "geojson",
//           data: { type: "FeatureCollection", features: [] },
//           cluster: true,
//           clusterMaxZoom: 9,
//           clusterRadius: 50,
//           clusterProperties: {
//             clusterOrgCount: ["+", ["coalesce", ["get", "orgCount"], 0]],
//             clusterHQCount: ["+", ["coalesce", ["get", "hqCount"], 0]],
//           },
//         });
//       }

//       if (!map.getLayer("city-clusters")) {
//         map.addLayer({
//           id: "city-clusters",
//           type: "circle",
//           source: "locations-city",
//           filter: ["has", "point_count"],
//           paint: {
//             "circle-color": BRAND.primaryDarkBlue,
//             "circle-opacity": 0.22,
//             "circle-stroke-width": 2,
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 50, 28, 100, 34],
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       if (!map.getLayer("city-cluster-count")) {
//         map.addLayer({
//           id: "city-cluster-count",
//           type: "symbol",
//           source: "locations-city",
//           filter: ["has", "point_count"],
//           layout: {
//             "text-field": [
//               "to-string",
//               ["coalesce", ["get", "clusterOrgCount"], ["get", "point_count"]],
//             ],
//             "text-size": 12,
//             visibility: "none",
//           },
//           paint: {
//             "text-color": BRAND.primaryDarkBlue,
//             "text-halo-color": "#ffffff",
//             "text-halo-width": 2,
//           },
//         });
//       }

//       if (!map.getLayer("city-point")) {
//         map.addLayer({
//           id: "city-point",
//           type: "circle",
//           source: "locations-city",
//           filter: ["!", ["has", "point_count"]],
//           paint: {
//             "circle-color": BRAND.primaryDarkBlue,
//             "circle-radius": [
//               "interpolate",
//               ["linear"],
//               ["coalesce", ["get", "orgCount"], 0],
//               1,
//               5,
//               50,
//               10,
//               250,
//               16,
//             ],
//             "circle-stroke-width": ["case", [">", ["coalesce", ["get", "hqCount"], 0], 0], 3, 2],
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-opacity": 0.92,
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       if (!map.getSource("locations-org")) {
//         map.addSource("locations-org", {
//           type: "geojson",
//           data: { type: "FeatureCollection", features: [] },
//           cluster: true,
//           clusterMaxZoom: 10,
//           clusterRadius: 45,
//           clusterProperties: {
//             clusterOrgCount: ["+", ["coalesce", ["get", "orgCount"], 0]],
//             clusterHQCount: ["+", ["coalesce", ["get", "hqCount"], 0]],
//           },
//         });
//       }

//       if (!map.getLayer("org-clusters")) {
//         map.addLayer({
//           id: "org-clusters",
//           type: "circle",
//           source: "locations-org",
//           filter: ["has", "point_count"],
//           paint: {
//             "circle-color": BRAND.secondaryGreen,
//             "circle-opacity": 0.18,
//             "circle-stroke-width": 2,
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-radius": ["step", ["get", "point_count"], 14, 25, 18, 50, 22, 100, 26],
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       if (!map.getLayer("org-cluster-count")) {
//         map.addLayer({
//           id: "org-cluster-count",
//           type: "symbol",
//           source: "locations-org",
//           filter: ["has", "point_count"],
//           layout: {
//             "text-field": ["to-string", ["coalesce", ["get", "point_count"], 0]],
//             "text-size": 11,
//             visibility: "none",
//           },
//           paint: {
//             "text-color": BRAND.secondaryGreen,
//             "text-halo-color": "#ffffff",
//             "text-halo-width": 2,
//           },
//         });
//       }

//       if (!map.getLayer("org-point")) {
//         map.addLayer({
//           id: "org-point",
//           type: "circle",
//           source: "locations-org",
//           filter: ["!", ["has", "point_count"]],
//           paint: {
//             "circle-color": BRAND.secondaryGreen,
//             "circle-radius": 6,
//             "circle-stroke-width": ["case", [">", ["coalesce", ["get", "hqCount"], 0], 0], 3, 2],
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-opacity": 0.95,
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       // -----------------------
//       // GENERIC VIEW SOURCE/LAYERS
//       // -----------------------
//       if (!map.getSource("view-generic")) {
//         map.addSource("view-generic", {
//           type: "geojson",
//           data: { type: "FeatureCollection", features: [] },
//           cluster: true,
//           clusterMaxZoom: 9,
//           clusterRadius: 50,
//         });
//       }

//       if (!map.getLayer("view-clusters")) {
//         map.addLayer({
//           id: "view-clusters",
//           type: "circle",
//           source: "view-generic",
//           filter: ["has", "point_count"],
//           paint: {
//             "circle-color": BRAND.secondaryOrange,
//             "circle-opacity": 0.18,
//             "circle-stroke-width": 2,
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 50, 28, 100, 34],
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       if (!map.getLayer("view-cluster-count")) {
//         map.addLayer({
//           id: "view-cluster-count",
//           type: "symbol",
//           source: "view-generic",
//           filter: ["has", "point_count"],
//           layout: {
//             "text-field": ["to-string", ["get", "point_count"]],
//             "text-size": 12,
//             visibility: "none",
//           },
//           paint: {
//             "text-color": BRAND.primaryDarkBlue,
//             "text-halo-color": "#ffffff",
//             "text-halo-width": 2,
//           },
//         });
//       }

//       if (!map.getLayer("view-point")) {
//         map.addLayer({
//           id: "view-point",
//           type: "circle",
//           source: "view-generic",
//           filter: ["!", ["has", "point_count"]],
//           paint: {
//             "circle-color": BRAND.secondaryOrange,
//             "circle-radius": 7,
//             "circle-stroke-width": 2,
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-opacity": 0.95,
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       // ✅ Selected glow ring (optional = YES)
//       // We draw this ABOVE view-point so it looks like a halo.
//       if (!map.getLayer("view-selected-halo")) {
//         map.addLayer({
//           id: "view-selected-halo",
//           type: "circle",
//           source: "view-generic",
//           filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], "___none___"]],
//           paint: {
//             "circle-color": "#FFFFFF",
//             "circle-opacity": 0.0,
//             "circle-radius": 16,
//             "circle-stroke-width": 6,
//             "circle-stroke-color": BRAND.primaryLightBlue,
//             "circle-stroke-opacity": 0.95,
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       if (!map.getLayer("view-selected-core")) {
//         map.addLayer({
//           id: "view-selected-core",
//           type: "circle",
//           source: "view-generic",
//           filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], "___none___"]],
//           paint: {
//             "circle-color": BRAND.secondaryOrange,
//             "circle-opacity": 0.18,
//             "circle-radius": 13,
//             "circle-stroke-width": 0,
//           },
//           layout: { visibility: "none" },
//         });
//       }

//       // -----------------------
//       // Click behavior
//       // -----------------------

//       // City cluster click -> zoom in
//       map.on("click", "city-clusters", (e) => {
//         if (viewModeRef.current !== "orgs") return;
//         const features = map.queryRenderedFeatures(e.point, { layers: ["city-clusters"] });
//         const clusterId = features?.[0]?.properties?.cluster_id;
//         const source = map.getSource("locations-city");
//         if (!source || clusterId == null) return;

//         source.getClusterExpansionZoom(clusterId, (error, zoom) => {
//           if (error) return;
//           map.easeTo({ center: features[0].geometry.coordinates, zoom });
//         });
//       });

//       // City point click -> popup + drilldown into org layer (sets city filter)
//       map.on("click", "city-point", (e) => {
//         if (viewModeRef.current !== "orgs") return;
//         const f = e.features?.[0];
//         if (!f) return;

//         const props = f.properties || {};
//         const coords = f.geometry.coordinates;

//         const label = props.label;
//         const city = props.city;
//         const countryName = props.countryName;
//         const salesRegionLabel = props.salesRegionLabel;
//         const orgCount = Number(props.orgCount || 0);
//         const hqCount = Number(props.hqCount || 0);

//         if (popupRef.current) popupRef.current.remove();

//         const html = `
//           <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; min-width: 270px;">
//             <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
//               <div style="width:10px;height:10px;border-radius:999px;background:${BRAND.primaryDarkBlue};border:2px solid ${BRAND.primaryLightBlue};"></div>
//               <div style="font-weight:950; color:${BRAND.primaryDarkBlue}; font-size:14px;">
//                 ${escapeHtml(label || city || "City")}
//               </div>
//             </div>

//             <div style="color:${BRAND.grey}; font-size:12px; line-height:1.65;">
//               <div><strong>City:</strong> ${escapeHtml(city || "—")}</div>
//               <div><strong>Country:</strong> ${escapeHtml(countryName || "—")}</div>
//               <div><strong>Sales Region:</strong> ${escapeHtml(salesRegionLabel || "—")}</div>
//               <div style="margin-top:8px; padding:10px; border-radius:12px; background:${BRAND.primaryLightBlue}; color:${BRAND.primaryDarkBlue}; font-weight:900;">
//                 ${orgCount.toLocaleString()} orgs • ${hqCount.toLocaleString()} HQs
//               </div>
//             </div>

//             <div style="margin-top:10px; padding-top:10px; border-top:2px solid ${BRAND.primaryLightBlue};">
//               <div style="font-size:11px; color:${BRAND.grey}; font-weight:800;">
//                 Clicked a city → drilling down into org points for this city.
//               </div>
//             </div>
//           </div>
//         `;

//         popupRef.current = new mapboxgl.Popup({ offset: 18 })
//           .setLngLat(coords)
//           .setHTML(html)
//           .addTo(map);

//         // Clicking a city also closes any non-org modal selection (defensive)
//         closeViewItemModal();

//         setVisualizeFilters({
//           salesRegions: salesRegionLabel ? [String(salesRegionLabel).trim()] : [],
//           countries: countryName ? [String(countryName).trim()] : [],
//           cities: !isUnknownish(city) ? [String(city).trim()] : [],
//           // do NOT touch orgIds here; city drilldown is independent
//         });
//       });

//       // Org cluster click -> zoom in
//       map.on("click", "org-clusters", (e) => {
//         if (viewModeRef.current !== "orgs") return;
//         const features = map.queryRenderedFeatures(e.point, { layers: ["org-clusters"] });
//         const clusterId = features?.[0]?.properties?.cluster_id;
//         const source = map.getSource("locations-org");
//         if (!source || clusterId == null) return;

//         source.getClusterExpansionZoom(clusterId, (error, zoom) => {
//           if (error) return;
//           map.easeTo({ center: features[0].geometry.coordinates, zoom });
//         });
//       });

//       // Org point click -> popup + add org to filter (append-only)
//       map.on("click", "org-point", (e) => {
//         if (viewModeRef.current !== "orgs") return;
//         const f = e.features?.[0];
//         if (!f) return;

//         const props = f.properties || {};
//         const coords = f.geometry.coordinates;

//         // ✅ IMPORTANT FIX:
//         // Use getVisualizeFilters() so we always append to the LATEST orgIds (no stale closure).
//         try {
//           const arr = JSON.parse(props.orgIds || "[]");
//           const pickedOrgId = Array.isArray(arr) ? String(arr[0] || "").trim() : "";

//           if (pickedOrgId) {
//             const current = getVisualizeFilters();
//             const next = new Set(current.orgIds ? Array.from(current.orgIds) : []);
//             next.add(pickedOrgId);
//             setVisualizeFilters({ orgIds: Array.from(next) });
//           }
//         } catch {
//           // ignore parse errors
//         }

//         const label = props.label;
//         const city = props.city;
//         const countryName = props.countryName;
//         const salesRegionLabel = props.salesRegionLabel;
//         const orgCount = Number(props.orgCount || 0);
//         const hqCount = Number(props.hqCount || 0);

//         if (popupRef.current) popupRef.current.remove();

//         const html = `
//           <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; min-width: 270px;">
//             <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
//               <div style="width:10px;height:10px;border-radius:999px;background:${BRAND.secondaryGreen};border:2px solid ${BRAND.primaryLightBlue};"></div>
//               <div style="font-weight:950; color:${BRAND.primaryDarkBlue}; font-size:14px;">
//                 ${escapeHtml(label || "Organization")}
//               </div>
//             </div>

//             <div style="color:${BRAND.grey}; font-size:12px; line-height:1.65;">
//               <div><strong>City:</strong> ${escapeHtml(city || "—")}</div>
//               <div><strong>Country:</strong> ${escapeHtml(countryName || "—")}</div>
//               <div><strong>Sales Region:</strong> ${escapeHtml(salesRegionLabel || "—")}</div>
//               <div style="margin-top:8px; padding:10px; border-radius:12px; background:rgba(58,166,8,0.10); color:${BRAND.primaryDarkBlue}; font-weight:900;">
//                 Added to org selection • ${orgCount.toLocaleString()} orgs in pin • ${hqCount.toLocaleString()} HQs
//               </div>
//             </div>
//           </div>
//         `;

//         popupRef.current = new mapboxgl.Popup({ offset: 18 })
//           .setLngLat(coords)
//           .setHTML(html)
//           .addTo(map);
//       });

//       // Generic cluster click -> zoom in
//       map.on("click", "view-clusters", (e) => {
//         if (viewModeRef.current === "orgs") return;
//         const features = map.queryRenderedFeatures(e.point, { layers: ["view-clusters"] });
//         const clusterId = features?.[0]?.properties?.cluster_id;
//         const source = map.getSource("view-generic");
//         if (!source || clusterId == null) return;

//         source.getClusterExpansionZoom(clusterId, (error, zoom) => {
//           if (error) return;
//           map.easeTo({ center: features[0].geometry.coordinates, zoom });
//         });
//       });

//       // ✅ Generic point click -> OPEN MODAL + highlight (NO filter changes, NO mapbox popup)
//       map.on("click", "view-point", (e) => {
//         if (viewModeRef.current === "orgs") return;
//         const f = e.features?.[0];
//         if (!f) return;

//         const props = f.properties || {};

//         let row = {};
//         try {
//           row = JSON.parse(props.row || "{}");
//         } catch {
//           row = {};
//         }

//         const featureId = String(props.id ?? "");
//         const vt = viewModeRef.current;

//         // close any org popups if you were bouncing around
//         if (popupRef.current) popupRef.current.remove();

//         openViewItemModal({
//           viewType: vt,
//           item: row,
//           featureId: featureId || null,
//         });
//       });

//       // Hover cursor
//       const pointerOn = () => (map.getCanvas().style.cursor = "pointer");
//       const pointerOff = () => (map.getCanvas().style.cursor = "");

//       for (const layer of [
//         "city-point",
//         "city-clusters",
//         "org-point",
//         "org-clusters",
//         "view-point",
//         "view-clusters",
//       ]) {
//         map.on("mouseenter", layer, pointerOn);
//         map.on("mouseleave", layer, pointerOff);
//       }

//       // Click empty space in generic views -> close modal + clear highlight
//       map.on("click", (e) => {
//         if (viewModeRef.current === "orgs") return;

//         const hit = map.queryRenderedFeatures(e.point, {
//           layers: ["view-point", "view-clusters"],
//         });

//         if (!hit || hit.length === 0) {
//           closeViewItemModal();
//         }
//       });
//     });

//     mapRef.current = map;

//     return () => {
//       if (zoomRafRef.current) cancelAnimationFrame(zoomRafRef.current);
//       if (popupRef.current) popupRef.current.remove();
//       if (mapRef.current) mapRef.current.remove();
//       mapRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Push data into sources whenever geojson changes
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const apply = () => {
//       const srcCity = map.getSource("locations-city");
//       if (srcCity && srcCity.setData && geoCity) srcCity.setData(geoCity);

//       const srcOrg = map.getSource("locations-org");
//       if (srcOrg && srcOrg.setData && geoOrg) srcOrg.setData(geoOrg);

//       const srcGeneric = map.getSource("view-generic");
//       if (srcGeneric && srcGeneric.setData && geoGeneric) srcGeneric.setData(geoGeneric);

//       if (typeof map.triggerRepaint === "function") map.triggerRepaint();
//     };

//     if (!map.isStyleLoaded()) {
//       const onIdle = () => {
//         map.off("idle", onIdle);
//         apply();
//       };
//       map.on("idle", onIdle);
//       return () => map.off("idle", onIdle);
//     }

//     apply();
//   }, [geoCity, geoOrg, geoGeneric]);

//   // ✅ FIX: visibility toggling retried on idle so clusters appear on first load (no view-switch needed)
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const applyVisibility = () => {
//       const showOrgs = isOrgsView;
//       const showGeneric = !isOrgsView;

//       const setVis = (id, vis) => {
//         if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
//       };

//       // Orgs view layers
//       setVis("city-point", showOrgs ? "visible" : "none");
//       setVis("city-clusters", showOrgs ? "visible" : "none");
//       setVis("city-cluster-count", showOrgs ? "visible" : "none");

//       // org layer only when city/org selected
//       const orgVis = showOrgLayer ? "visible" : "none";
//       setVis("org-point", showOrgs ? orgVis : "none");
//       setVis("org-clusters", showOrgs ? orgVis : "none");
//       setVis("org-cluster-count", showOrgs ? orgVis : "none");

//       // Generic view layers
//       setVis("view-point", showGeneric ? "visible" : "none");
//       setVis("view-clusters", showGeneric ? "visible" : "none");
//       setVis("view-cluster-count", showGeneric ? "visible" : "none");

//       // Selected layers (only for generic views; only when a feature is selected)
//       const hasSelection = !!(filters.selectedFeatureId && String(filters.selectedFeatureId).trim());
//       const selVis = showGeneric && hasSelection ? "visible" : "none";
//       setVis("view-selected-halo", selVis);
//       setVis("view-selected-core", selVis);

//       // Update generic colors by view
//       if (showGeneric) {
//         // Default (single color)
//         if (map.getLayer("view-point")) map.setPaintProperty("view-point", "circle-color", meta.pointColor);
//         if (map.getLayer("view-clusters")) {
//           map.setPaintProperty("view-clusters", "circle-color", meta.clusterColor);
//           map.setPaintProperty("view-clusters", "circle-opacity", meta.clusterOpacity);
//         }
//         if (map.getLayer("view-selected-core")) {
//           map.setPaintProperty("view-selected-core", "circle-color", meta.pointColor);
//           map.setPaintProperty("view-selected-core", "circle-opacity", 0.18);
//         }

//         // ✅ Cloud: color points by provider
//         if (viewMode === "cloud") {
//           const providers = cloudProvidersSorted || [];
//           const matchExpr = ["match", ["get", "cloudProvider"]];
//           for (const p of providers) {
//             matchExpr.push(p, colorForProvider(p, providers));
//           }
//           matchExpr.push(BRAND.lightGrey);

//           if (map.getLayer("view-point")) map.setPaintProperty("view-point", "circle-color", matchExpr);
//           if (map.getLayer("view-selected-core")) map.setPaintProperty("view-selected-core", "circle-color", "#FFFFFF");
//         }
//       }
//     };

//     // If layers aren't present yet on first render, wait for idle and apply.
//     const layersReady =
//       map.getLayer("city-point") ||
//       map.getLayer("city-clusters") ||
//       map.getLayer("view-point") ||
//       map.getLayer("view-clusters");

//     if (!layersReady) {
//       const onIdle = () => {
//         map.off("idle", onIdle);
//         applyVisibility();
//       };
//       map.on("idle", onIdle);
//       return () => map.off("idle", onIdle);
//     }

//     applyVisibility();
//   }, [
//     isOrgsView,
//     showOrgLayer,
//     meta.pointColor,
//     meta.clusterColor,
//     meta.clusterOpacity,
//     filters.selectedFeatureId,
//     viewMode,
//     cloudProvidersSorted,
//   ]);

//   // ✅ Keep selected halo filter in sync with store selection
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const featureId = filters.selectedFeatureId ? String(filters.selectedFeatureId) : "";
//     const hasSelection = !!featureId;

//     const applySelected = () => {
//       if (map.getLayer("view-selected-halo")) {
//         map.setFilter(
//           "view-selected-halo",
//           ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], hasSelection ? featureId : "___none___"]]
//         );
//       }
//       if (map.getLayer("view-selected-core")) {
//         map.setFilter(
//           "view-selected-core",
//           ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], hasSelection ? featureId : "___none___"]]
//         );
//       }
//       if (typeof map.triggerRepaint === "function") map.triggerRepaint();
//     };

//     if (!map.isStyleLoaded()) {
//       const onIdle = () => {
//         map.off("idle", onIdle);
//         applySelected();
//       };
//       map.on("idle", onIdle);
//       return () => map.off("idle", onIdle);
//     }

//     applySelected();
//   }, [filters.selectedFeatureId]);

//   // Auto-fit bounds to what’s visible
//   const lastFitKeyRef = useRef("");
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;

//     const key =
//       `vm:${viewMode}` +
//       `|sr:${Array.from(filters.salesRegions || []).join("|")}` +
//       `|co:${Array.from(filters.countries || []).join("|")}` +
//       `|cp:${Array.from(filters.cloudProviders || []).join("|")}` +
//       `|ci:${Array.from(filters.cities || []).join("|")}` +
//       `|org:${Array.from(filters.orgIds || []).join("|")}` +
//       `|sel:${filters.selectedFeatureId || ""}` +
//       `|n1:${geoGeneric?.features?.length || 0}` +
//       `|n2:${geoCity?.features?.length || 0}` +
//       `|n3:${geoOrg?.features?.length || 0}`;

//     if (key === lastFitKeyRef.current) return;
//     lastFitKeyRef.current = key;

//     let activeGeo = null;
//     let maxZoom = 6;

//     if (!isOrgsView) {
//       activeGeo = geoGeneric;
//       maxZoom = 6;
//     } else {
//       activeGeo = showOrgLayer ? geoOrg : geoCity;
//       maxZoom = showOrgLayer ? 12 : 6;
//     }

//     const hasData = activeGeo?.features?.length > 0;
//     if (!hasData) return;

//     const bounds = new mapboxgl.LngLatBounds();
//     for (const ft of activeGeo.features) bounds.extend(ft.geometry.coordinates);

//     map.fitBounds(bounds, { padding: 70, maxZoom, duration: 650 });
//   }, [viewMode, filters, geoGeneric, geoCity, geoOrg, isOrgsView, showOrgLayer]);

//   const statusText = useMemo(() => {
//     if (isOrgsView) {
//       if (loading) return "Loading…";
//       if (err) return err;
//       return showOrgLayer
//         ? `Orgs: ${orgPins.length.toLocaleString()} pins • zoom ${zoomLevel.toFixed(2)}`
//         : `Cities: ${cityPins.length.toLocaleString()} pins • zoom ${zoomLevel.toFixed(2)}`;
//     }

//     if (viewLoading) return `Loading ${meta.label}…`;
//     if (viewErr) return viewErr;

//     const n = geoGeneric?.features?.length || 0;
//     if (!n) return `No points to show (check filters or missing lat/lng) • zoom ${zoomLevel.toFixed(2)}`;

//     const sel = filters.selectedFeatureId ? ` • selected` : "";
//     return `${meta.label}: ${n.toLocaleString()} points${sel} • zoom ${zoomLevel.toFixed(2)}`;
//   }, [
//     isOrgsView,
//     loading,
//     err,
//     showOrgLayer,
//     orgPins.length,
//     cityPins.length,
//     zoomLevel,
//     viewLoading,
//     viewErr,
//     geoGeneric,
//     meta.label,
//     filters.selectedFeatureId,
//   ]);

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//       {/* Map container */}
//       <div
//         style={{
//           background: BRAND.card,
//           borderRadius: 14,
//           border: `1px solid ${BRAND.border}`,
//           overflow: "hidden",
//           height: 800,
//         }}
//       >
//         <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
//       </div>

//       {/* Legend / status bar */}
//       <div
//         style={{
//           background: BRAND.card,
//           borderRadius: 14,
//           border: `1px solid ${BRAND.border}`,
//           padding: 14,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 12,
//             flexWrap: "wrap",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
//             {isOrgsView ? (
//               <>
//                 <LegendItem label="Cities" color={BRAND.primaryDarkBlue} />
//                 <LegendItem label="Orgs (drilldown)" color={BRAND.secondaryGreen} />
//                 <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
//                   Blue = city pins • Green = org pins (after city/org selection)
//                 </div>
//               </>
//             ) : (
//               <>
//                 {viewMode === "cloud" ? (
//                   <CloudLegend
//                     providers={cloudProvidersSorted}
//                     getColor={(p) => colorForProvider(p, cloudProvidersSorted)}
//                   />
//                 ) : (
//                   <LegendItem label={meta.label} color={meta.pointColor} />
//                 )}
//                 <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
//                   Click pins for details • clusters expand on click • click empty space to close
//                 </div>
//               </>
//             )}
//           </div>

//           <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.grey }}>{statusText}</div>
//         </div>
//       </div>
//     </div>
//   );
// }




// src/components/LocationsMap.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import { getLocationPoints, buildPins } from "../services/locationsApi";
import {
  useVisualizeFilters,
  setVisualizeFilters,
  openViewItemModal,
  closeViewItemModal,
  getVisualizeFilters,
} from "../state/visualizeFiltersStore";

// Hardcoded (quick start) — from your samples
mapboxgl.accessToken =
  "pk.eyJ1IjoiY3ZpZW5uZWEiLCJhIjoiY21peWtjbGFmMGZlYzNlcHk0Znd5aHh1MyJ9.ThGqGYAKuC-CUr-KSt2EZw";

const MAP_STYLE = "mapbox://styles/cviennea/cmiyjx5mh004201s18hp8btul";

const BRAND = {
  primaryLightBlue: "#CEECF2",
  primaryDarkBlue: "#232073", // Orgs view city dots
  secondaryGreen: "#3AA608", // Orgs view org dots
  secondaryOrange: "#D97218",
  secondaryYellow: "#F2C53D",
  grey: "#747474",
  lightGrey: "#D9D9D9",
  card: "#FFFFFF",
  border: "#E5E7EB",
  danger: "#b91c1c",
};

const VIEW_META = {
  orgs: {
    label: "Orgs View",
    pointColor: BRAND.secondaryGreen,
    clusterColor: BRAND.secondaryGreen,
    clusterOpacity: 0.18,
  },
  tax: {
    label: "Tax Regions",
    pointColor: BRAND.secondaryOrange,
    clusterColor: BRAND.secondaryOrange,
    clusterOpacity: 0.18,
  },
  geodata: {
    label: "Geodata",
    pointColor: BRAND.secondaryYellow,
    clusterColor: BRAND.secondaryYellow,
    clusterOpacity: 0.18,
  },
  cloud: {
    label: "Cloud Regions",
    pointColor: BRAND.primaryDarkBlue,
    clusterColor: BRAND.primaryDarkBlue,
    clusterOpacity: 0.18,
  },
};

function isUnknownish(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return !v || v === "unknown" || v === "n/a" || v === "-" || v === "na";
}

/**
 * From "North America (NA)" -> "NA"
 * From "Europe - Middle East - Africa (EMEA)" -> "EMEA"
 */
function codeFromSalesRegionLabel(label) {
  const s = String(label ?? "").trim();
  if (!s) return "Unknown";
  const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
  if (m?.[1]) return m[1].toUpperCase();

  const u = s.toUpperCase();
  if (u.includes("NORTH AMERICA")) return "NA";
  if (u.includes("EUROPE") || u.includes("MIDDLE EAST") || u.includes("AFRICA")) return "EMEA";
  if (u.includes("ASIA") || u.includes("PACIFIC")) return "APAC";
  if (u.includes("LATIN")) return "LATAM";

  return "Unknown";
}

/**
 * Normalize any sales region-ish string to a canonical label that matches the filters store.
 * This fixes APAC/LATAM mismatches caused by slightly different formatting across datasets.
 */
function normalizeSalesRegionLabel(label) {
  const s = String(label ?? "").trim();
  if (!s) return "";

  // If already in canonical (CODE) form, keep it.
  const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
  if (m?.[1]) {
    const code = m[1].toUpperCase();
    if (code === "NA") return "North America (NA)";
    if (code === "EMEA") return "Europe - Middle East - Africa (EMEA)";
    if (code === "APAC") return "Asia-Pacific (APAC)";
    if (code === "LATAM") return "Latin America (LATAM)";
  }

  // Otherwise infer by content.
  const code = codeFromSalesRegionLabel(s);
  if (code === "NA") return "North America (NA)";
  if (code === "EMEA") return "Europe - Middle East - Africa (EMEA)";
  if (code === "APAC") return "Asia-Pacific (APAC)";
  if (code === "LATAM") return "Latin America (LATAM)";
  return s; // fallback (won't match filters, but better than blank)
}

function escapeHtml(str) {
  const s = String(str ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Convert pins -> GeoJSON with the right properties for clusters + popups
function toGeoJSON(pins) {
  return {
    type: "FeatureCollection",
    features: (pins || []).map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: p.coords },
      properties: {
        id: p.id,
        label: p.label,
        salesRegionLabel: p.salesRegion, // label (e.g. "North America (NA)")
        salesRegionCode: codeFromSalesRegionLabel(p.salesRegion),
        countryName: p.countryName,
        city: p.city,
        orgCount: Number(p.orgCount || 0),
        hqCount: Number(p.hqCount || 0),
        orgIds: JSON.stringify(p.orgIds || []),
        locationIds: JSON.stringify(p.locationIds || []),
      },
    })),
  };
}

// Generic dataset -> GeoJSON (one marker per row)
function toGenericGeoJSON(rows, viewMode) {
  return {
    type: "FeatureCollection",
    features: (rows || [])
      .filter((r) => Number.isFinite(r.longitude) && Number.isFinite(r.latitude))
      .map((r, idx) => {
        const id =
          r.id ||
          r.geonameId ||
          r.geonameCountryId ||
          r.cloudRegionName ||
          r.locationQuery ||
          `${viewMode}-${idx}`;

        // label per view
        let label = "";
        if (viewMode === "tax") label = r.locationQuery || r.subRegion || r.country || "Tax Region";
        else if (viewMode === "cloud") label = r.cloudRegionName || r.regionName || "Cloud Region";
        else if (viewMode === "geodata") label = r.geonameCountryName || "Country";
        else label = r.label || "Point";

        const rawSalesRegion = r.salesRegion || r.SALES_REGION || r.salesRegionLabel || "";
        const salesRegion = normalizeSalesRegionLabel(rawSalesRegion);

        const cloudProvider =
          r.cloudProvider || r.CLOUD_PROVIDER || r.provider || r.PROVIDER || "";

        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
          properties: {
            __viewMode: viewMode,
            id: String(id),
            label: String(label),

            // allow global filters / useful context
            salesRegion,
            countryName:
              r.country ||
              r.countryName ||
              r.geonameCountryName ||
              r.COUNTRY ||
              r.COUNTRY_NAME ||
              "",

            cloudProvider: String(cloudProvider || ""),

            // embed full row for rich modal
            row: JSON.stringify(r),
          },
        };
      }),
  };
}

function LegendItem({ label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          border: `2px solid ${BRAND.primaryLightBlue}`,
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.primaryDarkBlue }}>{label}</div>
    </div>
  );
}

function CloudLegend({ providers = [], getColor }) {
  const list = (providers || []).slice(0, 10); // keep it tidy
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      {list.map((p) => (
        <LegendItem key={p} label={p} color={getColor(p)} />
      ))}
      {providers.length > list.length ? (
        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
          +{(providers.length - list.length).toLocaleString()} more
        </div>
      ) : null}
    </div>
  );
}

// Stable-ish palette (we’ll reuse brand hues + softer neutrals)
const CLOUD_PROVIDER_PALETTE = [
  BRAND.secondaryOrange,
  BRAND.secondaryGreen,
  BRAND.primaryDarkBlue,
  BRAND.secondaryYellow,
  "#6D28D9", // purple
  "#DC2626", // red
  "#0EA5E9", // cyan
  "#F97316", // orange alt
  "#10B981", // teal
  "#64748B", // slate
];

const base = import.meta.env.VITE_API_BASE;
function colorForProvider(provider, providersSorted) {
  const p = String(provider || "").trim();
  if (!p) return BRAND.lightGrey;

  const list = providersSorted || [];
  const idx = list.indexOf(p);
  if (idx < 0) return CLOUD_PROVIDER_PALETTE[0];
  return CLOUD_PROVIDER_PALETTE[idx % CLOUD_PROVIDER_PALETTE.length];
}

// Fetch wrapper for view endpoints
async function fetchViewRows(viewMode, filters, { signal } = {}) {
  if (viewMode === "orgs") return [];

  const sr = filters.salesRegions?.size ? Array.from(filters.salesRegions).join(",") : "";
  const co = filters.countries?.size ? Array.from(filters.countries).join(",") : "";
  const cp = filters.cloudProviders?.size ? Array.from(filters.cloudProviders).join(",") : "";

  const qs = new URLSearchParams();

  if (viewMode === "tax") {
    if (sr) qs.set("SALES_REGION", sr);
    if (co) qs.set("COUNTRY", co);
    const res = await fetch(`${base}/api/views/tax-regions?${qs.toString()}`, { signal });
    if (!res.ok) throw new Error("Failed to load Tax Regions");
    return res.json();
  }

  if (viewMode === "geodata") {
    if (sr) qs.set("SALES_REGION", sr);
    // backend expects GEONAME_COUNTRY_NAME for the filter
    if (co) qs.set("GEONAME_COUNTRY_NAME", co);
    const res = await fetch(`${base}/api/views/geodata?${qs.toString()}`, { signal });
    if (!res.ok) throw new Error("Failed to load Geodata");
    return res.json();
  }

  if (viewMode === "cloud") {
    // ✅ Cloud now supports SALES_REGION + CLOUD_PROVIDER + COUNTRY_NAME
    if (sr) qs.set("SALES_REGION", sr);
    if (co) qs.set("COUNTRY_NAME", co);
    if (cp) qs.set("CLOUD_PROVIDER", cp);
    const res = await fetch(`${base}/api/views/cloud-regions?${qs.toString()}`, { signal });
    if (!res.ok) throw new Error("Failed to load Cloud Regions");
    return res.json();
  }

  return [];
}

export default function LocationsMap({ viewMode = "orgs" }) {
  const filters = useVisualizeFilters();

  // 🔒 Runtime-safe refs so map click handlers always see the latest state (no stale closures)
  const viewModeRef = useRef(viewMode);
  const selectedFeatureIdRef = useRef(null);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    selectedFeatureIdRef.current = filters.selectedFeatureId || null;
  }, [filters.selectedFeatureId]);

  const isOrgsView = viewMode === "orgs";
  const isCloudView = viewMode === "cloud";
  const meta = VIEW_META[viewMode] || VIEW_META.orgs;

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  // Orgs view data
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Generic view data
  const [viewRows, setViewRows] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewErr, setViewErr] = useState("");

  // Track zoom
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const zoomRef = useRef(1.5);
  const zoomRafRef = useRef(null);

  // ORGS VIEW: org layer shows when either a city is selected OR an org drilldown exists
  const citySelected = (filters.cities?.size || 0) > 0;
  const orgSelected = (filters.orgIds?.size || 0) > 0;
  const showOrgLayer = isOrgsView && (citySelected || orgSelected);

  // Load org location points once (cached by service) — only if orgs view
  useEffect(() => {
    if (!isOrgsView) {
      setLoading(false);
      setErr("");
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const pts = await getLocationPoints({ signal: ac.signal });
        setPoints(pts);
      } catch (e) {
        if (ac.signal.aborted) return;
        setErr(e?.message || "Failed to load location points");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [isOrgsView]);

  // Load view rows for non-org modes (filtered server-side)
  useEffect(() => {
    if (isOrgsView) {
      setViewRows([]);
      setViewLoading(false);
      setViewErr("");
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        setViewLoading(true);
        setViewErr("");
        const rows = await fetchViewRows(viewMode, filters, { signal: ac.signal });
        setViewRows(rows || []);
      } catch (e) {
        if (ac.signal.aborted) return;
        setViewErr(e?.message || "Failed to load view data");
        setViewRows([]);
      } finally {
        if (!ac.signal.aborted) setViewLoading(false);
      }
    })();

    return () => ac.abort();
    // ✅ include cloudProviders so map updates when provider filter changes
  }, [isOrgsView, viewMode, filters.salesRegions, filters.countries, filters.cloudProviders]);

  /**
   * ORGS VIEW:
   * BASE FILTER: sales region + country apply to both layers
   * - salesRegions stores LABELS (e.g. "North America (NA)")
   */
  const baseFilteredPoints = useMemo(() => {
    if (!isOrgsView) return [];
    const sr = filters.salesRegions; // LABELS
    const co = filters.countries;

    return (points || []).filter((p) => {
      if (sr?.size && !sr.has(String(p.salesRegion))) return false;
      if (co?.size && !co.has(p.countryName)) return false;
      return true;
    });
  }, [isOrgsView, points, filters.salesRegions, filters.countries]);

  /**
   * CITY LAYER: keep city context visible; ignore city filter here
   */
  const cityPins = useMemo(() => {
    if (!isOrgsView) return [];
    return buildPins(baseFilteredPoints, { mode: "city" });
  }, [isOrgsView, baseFilteredPoints]);

  const geoCity = useMemo(() => (isOrgsView ? toGeoJSON(cityPins) : null), [isOrgsView, cityPins]);

  /**
   * ORG LAYER:
   * - If orgIds selected, drill to those regardless of city
   * - Else city drilldown if selected
   */
  const orgFilteredPoints = useMemo(() => {
    if (!isOrgsView) return [];
    const ci = filters.cities;
    const orgIds = filters.orgIds;

    return (baseFilteredPoints || []).filter((p) => {
      if (orgIds?.size) return orgIds.has(String(p.orgId));
      if (ci?.size && !ci.has(p.city)) return false;
      return true;
    });
  }, [isOrgsView, baseFilteredPoints, filters.cities, filters.orgIds]);

  const orgPins = useMemo(() => {
    if (!isOrgsView || !showOrgLayer) return [];
    return buildPins(orgFilteredPoints, { mode: "org" });
  }, [isOrgsView, orgFilteredPoints, showOrgLayer]);

  const geoOrg = useMemo(() => (isOrgsView ? toGeoJSON(orgPins) : null), [isOrgsView, orgPins]);

  // Generic GeoJSON
  const geoGeneric = useMemo(() => {
    if (isOrgsView) return null;
    return toGenericGeoJSON(viewRows || [], viewMode);
  }, [isOrgsView, viewRows, viewMode]);

  // Cloud provider list (for coloring + legend)
  const cloudProvidersSorted = useMemo(() => {
    if (!isCloudView) return [];
    const s = new Set();
    for (const ft of geoGeneric?.features || []) {
      const p = ft?.properties?.cloudProvider;
      if (p) s.add(String(p));
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [isCloudView, geoGeneric]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [0, 20],
      zoom: 1.5,
      projection: "mercator",
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const updateZoomState = () => {
      const z = map.getZoom();
      zoomRef.current = z;

      if (zoomRafRef.current) return;
      zoomRafRef.current = requestAnimationFrame(() => {
        zoomRafRef.current = null;
        setZoomLevel(zoomRef.current);
      });
    };

    map.on("zoomend", updateZoomState);
    map.on("moveend", updateZoomState);

    map.on("load", () => {
      // -----------------------
      // ORGS VIEW SOURCES/LAYERS
      // -----------------------
      if (!map.getSource("locations-city")) {
        map.addSource("locations-city", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 9,
          clusterRadius: 50,
          clusterProperties: {
            clusterOrgCount: ["+", ["coalesce", ["get", "orgCount"], 0]],
            clusterHQCount: ["+", ["coalesce", ["get", "hqCount"], 0]],
          },
        });
      }

      if (!map.getLayer("city-clusters")) {
        map.addLayer({
          id: "city-clusters",
          type: "circle",
          source: "locations-city",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": BRAND.primaryDarkBlue,
            "circle-opacity": 0.22,
            "circle-stroke-width": 2,
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 50, 28, 100, 34],
          },
          layout: { visibility: "none" },
        });
      }

      if (!map.getLayer("city-cluster-count")) {
        map.addLayer({
          id: "city-cluster-count",
          type: "symbol",
          source: "locations-city",
          filter: ["has", "point_count"],
          layout: {
            "text-field": [
              "to-string",
              ["coalesce", ["get", "clusterOrgCount"], ["get", "point_count"]],
            ],
            "text-size": 12,
            visibility: "none",
          },
          paint: {
            "text-color": BRAND.primaryDarkBlue,
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }

      if (!map.getLayer("city-point")) {
        map.addLayer({
          id: "city-point",
          type: "circle",
          source: "locations-city",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": BRAND.primaryDarkBlue,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "orgCount"], 0],
              1,
              5,
              50,
              10,
              250,
              16,
            ],
            "circle-stroke-width": ["case", [">", ["coalesce", ["get", "hqCount"], 0], 0], 3, 2],
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-opacity": 0.92,
          },
          layout: { visibility: "none" },
        });
      }

      if (!map.getSource("locations-org")) {
        map.addSource("locations-org", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 45,
          clusterProperties: {
            clusterOrgCount: ["+", ["coalesce", ["get", "orgCount"], 0]],
            clusterHQCount: ["+", ["coalesce", ["get", "hqCount"], 0]],
          },
        });
      }

      if (!map.getLayer("org-clusters")) {
        map.addLayer({
          id: "org-clusters",
          type: "circle",
          source: "locations-org",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": BRAND.secondaryGreen,
            "circle-opacity": 0.18,
            "circle-stroke-width": 2,
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-radius": ["step", ["get", "point_count"], 14, 25, 18, 50, 22, 100, 26],
          },
          layout: { visibility: "none" },
        });
      }

      if (!map.getLayer("org-cluster-count")) {
        map.addLayer({
          id: "org-cluster-count",
          type: "symbol",
          source: "locations-org",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["to-string", ["coalesce", ["get", "point_count"], 0]],
            "text-size": 11,
            visibility: "none",
          },
          paint: {
            "text-color": BRAND.secondaryGreen,
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }

      if (!map.getLayer("org-point")) {
        map.addLayer({
          id: "org-point",
          type: "circle",
          source: "locations-org",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": BRAND.secondaryGreen,
            "circle-radius": 6,
            "circle-stroke-width": ["case", [">", ["coalesce", ["get", "hqCount"], 0], 0], 3, 2],
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-opacity": 0.95,
          },
          layout: { visibility: "none" },
        });
      }

      // -----------------------
      // GENERIC VIEW SOURCE/LAYERS
      // -----------------------
      if (!map.getSource("view-generic")) {
        map.addSource("view-generic", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 9,
          clusterRadius: 50,
        });
      }

      if (!map.getLayer("view-clusters")) {
        map.addLayer({
          id: "view-clusters",
          type: "circle",
          source: "view-generic",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": BRAND.secondaryOrange,
            "circle-opacity": 0.18,
            "circle-stroke-width": 2,
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 50, 28, 100, 34],
          },
          layout: { visibility: "none" },
        });
      }

      if (!map.getLayer("view-cluster-count")) {
        map.addLayer({
          id: "view-cluster-count",
          type: "symbol",
          source: "view-generic",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["to-string", ["get", "point_count"]],
            "text-size": 12,
            visibility: "none",
          },
          paint: {
            "text-color": BRAND.primaryDarkBlue,
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      }

      if (!map.getLayer("view-point")) {
        map.addLayer({
          id: "view-point",
          type: "circle",
          source: "view-generic",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": BRAND.secondaryOrange,
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-opacity": 0.95,
          },
          layout: { visibility: "none" },
        });
      }

      // ✅ Selected glow ring (optional = YES)
      // We draw this ABOVE view-point so it looks like a halo.
      if (!map.getLayer("view-selected-halo")) {
        map.addLayer({
          id: "view-selected-halo",
          type: "circle",
          source: "view-generic",
          filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], "___none___"]],
          paint: {
            "circle-color": "#FFFFFF",
            "circle-opacity": 0.0,
            "circle-radius": 16,
            "circle-stroke-width": 6,
            "circle-stroke-color": BRAND.primaryLightBlue,
            "circle-stroke-opacity": 0.95,
          },
          layout: { visibility: "none" },
        });
      }

      if (!map.getLayer("view-selected-core")) {
        map.addLayer({
          id: "view-selected-core",
          type: "circle",
          source: "view-generic",
          filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], "___none___"]],
          paint: {
            "circle-color": BRAND.secondaryOrange,
            "circle-opacity": 0.18,
            "circle-radius": 13,
            "circle-stroke-width": 0,
          },
          layout: { visibility: "none" },
        });
      }

      // -----------------------
      // Click behavior
      // -----------------------

      // City cluster click -> zoom in
      map.on("click", "city-clusters", (e) => {
        if (viewModeRef.current !== "orgs") return;
        const features = map.queryRenderedFeatures(e.point, { layers: ["city-clusters"] });
        const clusterId = features?.[0]?.properties?.cluster_id;
        const source = map.getSource("locations-city");
        if (!source || clusterId == null) return;

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // City point click -> popup + drilldown into org layer (sets city filter)
      map.on("click", "city-point", (e) => {
        if (viewModeRef.current !== "orgs") return;
        const f = e.features?.[0];
        if (!f) return;

        const props = f.properties || {};
        const coords = f.geometry.coordinates;

        const label = props.label;
        const city = props.city;
        const countryName = props.countryName;
        const salesRegionLabel = props.salesRegionLabel;
        const orgCount = Number(props.orgCount || 0);
        const hqCount = Number(props.hqCount || 0);

        if (popupRef.current) popupRef.current.remove();

        const pin = {
          label,
          city,
          countryName,
          orgCount,
          hqCount,
        };

        const html = `
  <div class="me-pop">
    <div class="me-pop__header">
      <div class="me-pop__title">${escapeHtml(pin.label || "Organization")}</div>
      <div class="me-pop__meta">
        <span class="me-chip">${escapeHtml(pin.city || "—")}</span>
        <span class="me-chip">${escapeHtml(pin.countryName || "—")}</span>
      </div>
    </div>

    <div class="me-pop__stats">
      <div class="me-stat">
        <div class="me-stat__k">Orgs</div>
        <div class="me-stat__v">${pin.orgCount ?? 1}</div>
      </div>
      <div class="me-stat">
        <div class="me-stat__k">HQ</div>
        <div class="me-stat__v">${pin.hqCount ?? 0}</div>
      </div>
    </div>

    <div class="me-pop__actions">
      <button class="me-btn" data-action="open">Open org</button>
      <button class="me-btn me-btn--ghost" data-action="filter">Filter</button>
    </div>

    <div class="me-pop__shine"></div>
  </div>
`;

        popupRef.current = new mapboxgl.Popup({
          offset: 18,
          closeButton: true,
          closeOnClick: false,
          className: "me-popup",
        })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);

        // Wire actions AFTER addTo(map) so the popup DOM exists
        const el = popupRef.current.getElement();
        el.querySelector('[data-action="open"]')?.addEventListener("click", () => {
          // TODO: navigate to org profile / whatever you do today
          // No-op for now to avoid breaking the app.
        });
        el.querySelector('[data-action="filter"]')?.addEventListener("click", () => {
          // TODO: toggle filters
          // No-op for now to avoid breaking the app.
        });

        // Clicking a city also closes any non-org modal selection (defensive)
        closeViewItemModal();

        setVisualizeFilters({
          salesRegions: salesRegionLabel ? [String(salesRegionLabel).trim()] : [],
          countries: countryName ? [String(countryName).trim()] : [],
          cities: !isUnknownish(city) ? [String(city).trim()] : [],
          // do NOT touch orgIds here; city drilldown is independent
        });
      });

      // Org cluster click -> zoom in
      map.on("click", "org-clusters", (e) => {
        if (viewModeRef.current !== "orgs") return;
        const features = map.queryRenderedFeatures(e.point, { layers: ["org-clusters"] });
        const clusterId = features?.[0]?.properties?.cluster_id;
        const source = map.getSource("locations-org");
        if (!source || clusterId == null) return;

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // Org point click -> popup + add org to filter (append-only)
      map.on("click", "org-point", (e) => {
        if (viewModeRef.current !== "orgs") return;
        const f = e.features?.[0];
        if (!f) return;

        const props = f.properties || {};
        const coords = f.geometry.coordinates;

        // ✅ IMPORTANT FIX:
        // Use getVisualizeFilters() so we always append to the LATEST orgIds (no stale closure).
        try {
          const arr = JSON.parse(props.orgIds || "[]");
          const pickedOrgId = Array.isArray(arr) ? String(arr[0] || "").trim() : "";

          if (pickedOrgId) {
            const current = getVisualizeFilters();
            const next = new Set(current.orgIds ? Array.from(current.orgIds) : []);
            next.add(pickedOrgId);
            setVisualizeFilters({ orgIds: Array.from(next) });
          }
        } catch {
          // ignore parse errors
        }

        const label = props.label;
        const city = props.city;
        const countryName = props.countryName;
        const salesRegionLabel = props.salesRegionLabel;
        const orgCount = Number(props.orgCount || 0);
        const hqCount = Number(props.hqCount || 0);

        if (popupRef.current) popupRef.current.remove();

        const pin = {
          label,
          city,
          countryName,
          orgCount,
          hqCount,
        };

        const html = `
  <div class="me-pop">
    <div class="me-pop__header">
      <div class="me-pop__title">${escapeHtml(pin.label || "Organization")}</div>
      <div class="me-pop__meta">
        <span class="me-chip">${escapeHtml(pin.city || "—")}</span>
        <span class="me-chip">${escapeHtml(pin.countryName || "—")}</span>
      </div>
    </div>

    <div class="me-pop__stats">
      <div class="me-stat">
        <div class="me-stat__k">Orgs</div>
        <div class="me-stat__v">${pin.orgCount ?? 1}</div>
      </div>
      <div class="me-stat">
        <div class="me-stat__k">HQ</div>
        <div class="me-stat__v">${pin.hqCount ?? 0}</div>
      </div>
    </div>

    <div class="me-pop__actions">
      <button class="me-btn" data-action="open">Open org</button>
      <button class="me-btn me-btn--ghost" data-action="filter">Filter</button>
    </div>

    <div class="me-pop__shine"></div>
  </div>
`;

        popupRef.current = new mapboxgl.Popup({
          offset: 18,
          closeButton: true,
          closeOnClick: false,
          className: "me-popup",
        })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);

        const el = popupRef.current.getElement();
        el.querySelector('[data-action="open"]')?.addEventListener("click", () => {
          // TODO: navigate to org profile / whatever you do today
          // No-op for now to avoid breaking the app.
        });
        el.querySelector('[data-action="filter"]')?.addEventListener("click", () => {
          // TODO: toggle filters
          // No-op for now to avoid breaking the app.
        });
      });

      // Generic cluster click -> zoom in
      map.on("click", "view-clusters", (e) => {
        if (viewModeRef.current === "orgs") return;
        const features = map.queryRenderedFeatures(e.point, { layers: ["view-clusters"] });
        const clusterId = features?.[0]?.properties?.cluster_id;
        const source = map.getSource("view-generic");
        if (!source || clusterId == null) return;

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // ✅ Generic point click -> OPEN MODAL + highlight (NO filter changes, NO mapbox popup)
      map.on("click", "view-point", (e) => {
        if (viewModeRef.current === "orgs") return;
        const f = e.features?.[0];
        if (!f) return;

        const props = f.properties || {};

        let row = {};
        try {
          row = JSON.parse(props.row || "{}");
        } catch {
          row = {};
        }

        const featureId = String(props.id ?? "");
        const vt = viewModeRef.current;

        // close any org popups if you were bouncing around
        if (popupRef.current) popupRef.current.remove();

        openViewItemModal({
          viewType: vt,
          item: row,
          featureId: featureId || null,
        });
      });

      // Hover cursor
      const pointerOn = () => (map.getCanvas().style.cursor = "pointer");
      const pointerOff = () => (map.getCanvas().style.cursor = "");

      for (const layer of [
        "city-point",
        "city-clusters",
        "org-point",
        "org-clusters",
        "view-point",
        "view-clusters",
      ]) {
        map.on("mouseenter", layer, pointerOn);
        map.on("mouseleave", layer, pointerOff);
      }

      // Click empty space in generic views -> close modal + clear highlight
      map.on("click", (e) => {
        if (viewModeRef.current === "orgs") return;

        const hit = map.queryRenderedFeatures(e.point, {
          layers: ["view-point", "view-clusters"],
        });

        if (!hit || hit.length === 0) {
          closeViewItemModal();
        }
      });
    });

    mapRef.current = map;

    return () => {
      if (zoomRafRef.current) cancelAnimationFrame(zoomRafRef.current);
      if (popupRef.current) popupRef.current.remove();
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push data into sources whenever geojson changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const srcCity = map.getSource("locations-city");
      if (srcCity && srcCity.setData && geoCity) srcCity.setData(geoCity);

      const srcOrg = map.getSource("locations-org");
      if (srcOrg && srcOrg.setData && geoOrg) srcOrg.setData(geoOrg);

      const srcGeneric = map.getSource("view-generic");
      if (srcGeneric && srcGeneric.setData && geoGeneric) srcGeneric.setData(geoGeneric);

      if (typeof map.triggerRepaint === "function") map.triggerRepaint();
    };

    if (!map.isStyleLoaded()) {
      const onIdle = () => {
        map.off("idle", onIdle);
        apply();
      };
      map.on("idle", onIdle);
      return () => map.off("idle", onIdle);
    }

    apply();
  }, [geoCity, geoOrg, geoGeneric]);

  // ✅ FIX: visibility toggling retried on idle so clusters appear on first load (no view-switch needed)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyVisibility = () => {
      const showOrgs = isOrgsView;
      const showGeneric = !isOrgsView;

      const setVis = (id, vis) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
      };

      // Orgs view layers
      setVis("city-point", showOrgs ? "visible" : "none");
      setVis("city-clusters", showOrgs ? "visible" : "none");
      setVis("city-cluster-count", showOrgs ? "visible" : "none");

      // org layer only when city/org selected
      const orgVis = showOrgLayer ? "visible" : "none";
      setVis("org-point", showOrgs ? orgVis : "none");
      setVis("org-clusters", showOrgs ? orgVis : "none");
      setVis("org-cluster-count", showOrgs ? orgVis : "none");

      // Generic view layers
      setVis("view-point", showGeneric ? "visible" : "none");
      setVis("view-clusters", showGeneric ? "visible" : "none");
      setVis("view-cluster-count", showGeneric ? "visible" : "none");

      // Selected layers (only for generic views; only when a feature is selected)
      const hasSelection = !!(filters.selectedFeatureId && String(filters.selectedFeatureId).trim());
      const selVis = showGeneric && hasSelection ? "visible" : "none";
      setVis("view-selected-halo", selVis);
      setVis("view-selected-core", selVis);

      // Update generic colors by view
      if (showGeneric) {
        // Default (single color)
        if (map.getLayer("view-point")) map.setPaintProperty("view-point", "circle-color", meta.pointColor);
        if (map.getLayer("view-clusters")) {
          map.setPaintProperty("view-clusters", "circle-color", meta.clusterColor);
          map.setPaintProperty("view-clusters", "circle-opacity", meta.clusterOpacity);
        }
        if (map.getLayer("view-selected-core")) {
          map.setPaintProperty("view-selected-core", "circle-color", meta.pointColor);
          map.setPaintProperty("view-selected-core", "circle-opacity", 0.18);
        }

        // ✅ Cloud: color points by provider
        if (viewMode === "cloud") {
          const providers = cloudProvidersSorted || [];
          const matchExpr = ["match", ["get", "cloudProvider"]];
          for (const p of providers) {
            matchExpr.push(p, colorForProvider(p, providers));
          }
          matchExpr.push(BRAND.lightGrey);

          if (map.getLayer("view-point")) map.setPaintProperty("view-point", "circle-color", matchExpr);
          if (map.getLayer("view-selected-core")) map.setPaintProperty("view-selected-core", "circle-color", "#FFFFFF");
        }
      }
    };

    // If layers aren't present yet on first render, wait for idle and apply.
    const layersReady =
      map.getLayer("city-point") ||
      map.getLayer("city-clusters") ||
      map.getLayer("view-point") ||
      map.getLayer("view-clusters");

    if (!layersReady) {
      const onIdle = () => {
        map.off("idle", onIdle);
        applyVisibility();
      };
      map.on("idle", onIdle);
      return () => map.off("idle", onIdle);
    }

    applyVisibility();
  }, [
    isOrgsView,
    showOrgLayer,
    meta.pointColor,
    meta.clusterColor,
    meta.clusterOpacity,
    filters.selectedFeatureId,
    viewMode,
    cloudProvidersSorted,
  ]);

  // ✅ Keep selected halo filter in sync with store selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const featureId = filters.selectedFeatureId ? String(filters.selectedFeatureId) : "";
    const hasSelection = !!featureId;

    const applySelected = () => {
      if (map.getLayer("view-selected-halo")) {
        map.setFilter(
          "view-selected-halo",
          ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], hasSelection ? featureId : "___none___"]]
        );
      }
      if (map.getLayer("view-selected-core")) {
        map.setFilter(
          "view-selected-core",
          ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], hasSelection ? featureId : "___none___"]]
        );
      }
      if (typeof map.triggerRepaint === "function") map.triggerRepaint();
    };

    if (!map.isStyleLoaded()) {
      const onIdle = () => {
        map.off("idle", onIdle);
        applySelected();
      };
      map.on("idle", onIdle);
      return () => map.off("idle", onIdle);
    }

    applySelected();
  }, [filters.selectedFeatureId]);

  // Auto-fit bounds to what’s visible
  const lastFitKeyRef = useRef("");
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const key =
      `vm:${viewMode}` +
      `|sr:${Array.from(filters.salesRegions || []).join("|")}` +
      `|co:${Array.from(filters.countries || []).join("|")}` +
      `|cp:${Array.from(filters.cloudProviders || []).join("|")}` +
      `|ci:${Array.from(filters.cities || []).join("|")}` +
      `|org:${Array.from(filters.orgIds || []).join("|")}` +
      `|sel:${filters.selectedFeatureId || ""}` +
      `|n1:${geoGeneric?.features?.length || 0}` +
      `|n2:${geoCity?.features?.length || 0}` +
      `|n3:${geoOrg?.features?.length || 0}`;

    if (key === lastFitKeyRef.current) return;
    lastFitKeyRef.current = key;

    let activeGeo = null;
    let maxZoom = 6;

    if (!isOrgsView) {
      activeGeo = geoGeneric;
      maxZoom = 6;
    } else {
      activeGeo = showOrgLayer ? geoOrg : geoCity;
      maxZoom = showOrgLayer ? 12 : 6;
    }

    const hasData = activeGeo?.features?.length > 0;
    if (!hasData) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const ft of activeGeo.features) bounds.extend(ft.geometry.coordinates);

    map.fitBounds(bounds, { padding: 70, maxZoom, duration: 650 });
  }, [viewMode, filters, geoGeneric, geoCity, geoOrg, isOrgsView, showOrgLayer]);

  const statusText = useMemo(() => {
    if (isOrgsView) {
      if (loading) return "Loading…";
      if (err) return err;
      return showOrgLayer
        ? `Orgs: ${orgPins.length.toLocaleString()} pins • zoom ${zoomLevel.toFixed(2)}`
        : `Cities: ${cityPins.length.toLocaleString()} pins • zoom ${zoomLevel.toFixed(2)}`;
    }

    if (viewLoading) return `Loading ${meta.label}…`;
    if (viewErr) return viewErr;

    const n = geoGeneric?.features?.length || 0;
    if (!n) return `No points to show (check filters or missing lat/lng) • zoom ${zoomLevel.toFixed(2)}`;

    const sel = filters.selectedFeatureId ? ` • selected` : "";
    return `${meta.label}: ${n.toLocaleString()} points${sel} • zoom ${zoomLevel.toFixed(2)}`;
  }, [
    isOrgsView,
    loading,
    err,
    showOrgLayer,
    orgPins.length,
    cityPins.length,
    zoomLevel,
    viewLoading,
    viewErr,
    geoGeneric,
    meta.label,
    filters.selectedFeatureId,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
/* ===== ME “Bomb” Mapbox Popup ===== */

.me-popup .mapboxgl-popup-content {
  padding: 0 !important;
  border-radius: 18px !important;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 16, 28, 0.62);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    0 18px 55px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(0, 120, 255, 0.10),
    0 0 35px rgba(0, 120, 255, 0.14);
  overflow: hidden;
  transform-origin: bottom center;
  animation: me-pop-in 160ms ease-out;
}

.me-popup .mapboxgl-popup-close-button {
  width: 34px;
  height: 34px;
  margin: 10px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform 120ms ease, background 120ms ease;
}

.me-popup .mapboxgl-popup-close-button:hover {
  transform: scale(1.06);
  background: rgba(255, 255, 255, 0.12);
}

/* Make the little pointer (“tip”) match the glass look */
.me-popup .mapboxgl-popup-tip {
  border-top-color: rgba(10, 16, 28, 0.62) !important;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
}

/* Inner layout */
.me-pop {
  position: relative;
  width: 320px;
  padding: 14px 14px 12px 14px;
  color: rgba(255, 255, 255, 0.92);
}

.me-pop__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 38px; /* space for the X */
}

.me-pop__title {
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.2px;
  line-height: 1.2;
  text-shadow: 0 10px 28px rgba(0,0,0,0.35);
}

.me-pop__meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.me-chip {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.me-pop__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

.me-stat {
  border-radius: 14px;
  padding: 10px 10px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.10),
    rgba(255, 255, 255, 0.06)
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.me-stat__k {
  font-size: 11px;
  opacity: 0.72;
}

.me-stat__v {
  font-size: 18px;
  font-weight: 900;
  margin-top: 2px;
}

.me-pop__actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.me-btn {
  flex: 1;
  padding: 9px 10px;
  border-radius: 12px;
  font-weight: 750;
  font-size: 12px;
  border: 1px solid rgba(60, 160, 255, 0.35);
  background: rgba(60, 160, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
  transition: transform 120ms ease, background 120ms ease;
  cursor: pointer;
}

.me-btn:hover {
  transform: translateY(-1px);
  background: rgba(60, 160, 255, 0.24);
}

.me-btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
}

.me-pop__shine {
  position: absolute;
  inset: -40px -80px auto -80px;
  height: 120px;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(120, 190, 255, 0.24),
    rgba(120, 190, 255, 0.0) 60%
  );
  pointer-events: none;
}

@keyframes me-pop-in {
  from {
    transform: translateY(10px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
`}</style>

      {/* Map container */}
      <div
        style={{
          background: BRAND.card,
          borderRadius: 14,
          border: `1px solid ${BRAND.border}`,
          overflow: "hidden",
          height: 800,
        }}
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Legend / status bar */}
      <div
        style={{
          background: BRAND.card,
          borderRadius: 14,
          border: `1px solid ${BRAND.border}`,
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            {isOrgsView ? (
              <>
                <LegendItem label="Cities" color={BRAND.primaryDarkBlue} />
                <LegendItem label="Orgs (drilldown)" color={BRAND.secondaryGreen} />
                <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
                  Blue = city pins • Green = org pins (after city/org selection)
                </div>
              </>
            ) : (
              <>
                {viewMode === "cloud" ? (
                  <CloudLegend
                    providers={cloudProvidersSorted}
                    getColor={(p) => colorForProvider(p, cloudProvidersSorted)}
                  />
                ) : (
                  <LegendItem label={meta.label} color={meta.pointColor} />
                )}
                <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
                  Click pins for details • clusters expand on click • click empty space to close
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.grey }}>{statusText}</div>
        </div>
      </div>
    </div>
  );
}

