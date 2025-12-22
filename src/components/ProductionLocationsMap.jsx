// import React, { useMemo } from "react";
// import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
// import L from "leaflet";

// // Fix Leaflet default marker icons for bundlers (Vite/webpack)
// import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: markerIcon2x,
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
// });

// /**
//  * ProductionLocationsMap
//  *
//  * Props:
//  * - points: Array of org-location rows, each with:
//  *    {
//  *      orgId, orgName,
//  *      salesRegion, countryName, city,
//  *      latitude, longitude,
//  *      isHQ (boolean)
//  *    }
//  * - pinMode: "org" | "city"
//  * - onPinModeChange: (mode) => void
//  * - onToggleSelect: (key, meta) => void
//  * - isSelected: (key) => boolean
//  * - makeKey: (pointOrCityAgg) => string  // stable key generator used by list view too
//  * - onViewOrgs: (filtersObj) => void     // e.g. navigate to org search with params
//  * - onGoToRegion / onGoToCountry / onGoToCity: optional navigation callbacks
//  *
//  * Notes:
//  * - This component is intentionally "dumb": filtering & state live in the parent.
//  */
// export default function ProductionLocationsMap({
//   points = [],
//   pinMode = "city",
//   onPinModeChange,
//   onToggleSelect,
//   isSelected,
//   makeKey,
//   onViewOrgs,
//   onGoToRegion,
//   onGoToCountry,
//   onGoToCity,
//   height = "calc(100vh - 220px)",
// }) {
//   const cityAgg = useMemo(() => {
//     // Aggregate by (salesRegion, countryName, city) with lat/lng rounding to reduce near-duplicates.
//     const m = new Map();
//     for (const p of points) {
//       const lat = Number(p.latitude);
//       const lng = Number(p.longitude);
//       if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

//       const region = p.salesRegion ?? "";
//       const country = p.countryName ?? "";
//       const city = p.city ?? "";

//       // Round coords to 4 decimals (~11m) to avoid micro-variance duplicates
//       const latR = Math.round(lat * 10000) / 10000;
//       const lngR = Math.round(lng * 10000) / 10000;

//       const aggKey = `${region}||${country}||${city}||${latR}||${lngR}`;
//       const cur = m.get(aggKey) || {
//         salesRegion: region,
//         countryName: country,
//         city,
//         latitude: latR,
//         longitude: lngR,
//         orgIds: new Set(),
//         hqCount: 0,
//       };

//       if (p.orgId != null) cur.orgIds.add(String(p.orgId));
//       if (p.isHQ) cur.hqCount += 1;

//       m.set(aggKey, cur);
//     }

//     return Array.from(m.values()).map((x) => ({
//       salesRegion: x.salesRegion,
//       countryName: x.countryName,
//       city: x.city,
//       latitude: x.latitude,
//       longitude: x.longitude,
//       orgIds: Array.from(x.orgIds),
//       orgCount: x.orgIds.size,
//       hqCount: x.hqCount,
//     }));
//   }, [points]);

//   const mapPoints = pinMode === "org" ? points : cityAgg;

//   const bounds = useMemo(() => {
//     const coords = [];
//     for (const p of mapPoints) {
//       const lat = Number(p.latitude);
//       const lng = Number(p.longitude);
//       if (Number.isFinite(lat) && Number.isFinite(lng)) coords.push([lat, lng]);
//     }
//     return coords.length ? L.latLngBounds(coords) : null;
//   }, [mapPoints]);

//   const defaultCenter = useMemo(() => {
//     let n = 0,
//       sumLat = 0,
//       sumLng = 0;
//     for (const p of mapPoints) {
//       const lat = Number(p.latitude);
//       const lng = Number(p.longitude);
//       if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
//       n += 1;
//       sumLat += lat;
//       sumLng += lng;
//     }
//     if (!n) return [20, 0]; // world-ish
//     return [sumLat / n, sumLng / n];
//   }, [mapPoints]);

//   return (
//     <div style={{ width: "100%" }}>
//       <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
//         <span style={{ fontWeight: 600 }}>Map Pins:</span>
//         <button type="button" onClick={() => onPinModeChange?.("city")} style={pillStyle(pinMode === "city")}>
//           Cities
//         </button>
//         <button type="button" onClick={() => onPinModeChange?.("org")} style={pillStyle(pinMode === "org")}>
//           Orgs
//         </button>
//         <span style={{ marginLeft: "auto", opacity: 0.75, fontSize: 13 }}>
//           Showing {mapPoints.length.toLocaleString()} {pinMode === "org" ? "org pins" : "city pins"}
//         </span>
//       </div>

//       <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
//         <MapContainer style={{ width: "100%", height }} center={defaultCenter} zoom={2} scrollWheelZoom>
//           <FitBounds bounds={bounds} />
//           <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//           {pinMode === "org"
//             ? points.map((p) => {
//                 const lat = Number(p.latitude);
//                 const lng = Number(p.longitude);
//                 if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

//                 const key = makeKey ? makeKey(p) : `${p.salesRegion ?? ""}||${p.countryName ?? ""}||${p.city ?? ""}||${p.orgId ?? ""}`;
//                 const selected = isSelected?.(key) ?? false;

//                 return (
//                   <Marker key={key} position={[lat, lng]} opacity={selected ? 1 : 0.9}>
//                     <Popup>
//                       <div style={{ minWidth: 240 }}>
//                         <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.orgName ?? "Organization"}</div>
//                         <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
//                           {p.city}
//                           {p.city ? ", " : ""}
//                           {p.countryName}
//                           {p.countryName ? " • " : ""}
//                           {p.salesRegion}
//                         </div>

//                         <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                           <button type="button" onClick={() => onToggleSelect?.(key, { type: "org", point: p })} style={btnStyle()}>
//                             {selected ? "Unselect" : "Select"}
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => onViewOrgs?.({ salesRegion: p.salesRegion, country: p.countryName, city: p.city })}
//                             style={btnStyle("secondary")}
//                           >
//                             View orgs
//                           </button>
//                           {onGoToCity && (
//                             <button type="button" onClick={() => onGoToCity(p.city, p.countryName, p.salesRegion)} style={btnStyle("secondary")}>
//                               City details
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </Popup>
//                   </Marker>
//                 );
//               })
//             : cityAgg.map((c) => {
//                 const lat = Number(c.latitude);
//                 const lng = Number(c.longitude);
//                 if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

//                 const key = makeKey ? makeKey(c) : `${c.salesRegion ?? ""}||${c.countryName ?? ""}||${c.city ?? ""}`;
//                 const selected = isSelected?.(key) ?? false;

//                 return (
//                   <Marker key={key} position={[lat, lng]} opacity={selected ? 1 : 0.9}>
//                     <Popup>
//                       <div style={{ minWidth: 260 }}>
//                         <div style={{ fontWeight: 700, marginBottom: 6 }}>
//                           {c.city || "City"}
//                           {c.city ? ", " : ""}
//                           {c.countryName || ""}
//                         </div>
//                         <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>{c.salesRegion || ""}</div>

//                         <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
//                           <Stat label="Orgs" value={c.orgCount} />
//                           <Stat label="HQs" value={c.hqCount} />
//                         </div>

//                         <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                           <button type="button" onClick={() => onToggleSelect?.(key, { type: "city", city: c })} style={btnStyle()}>
//                             {selected ? "Unselect" : "Select"}
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => onViewOrgs?.({ salesRegion: c.salesRegion, country: c.countryName, city: c.city })}
//                             style={btnStyle("secondary")}
//                           >
//                             View orgs
//                           </button>

//                           {onGoToCountry && (
//                             <button type="button" onClick={() => onGoToCountry(c.countryName)} style={btnStyle("secondary")}>
//                               Country details
//                             </button>
//                           )}
//                           {onGoToRegion && (
//                             <button type="button" onClick={() => onGoToRegion(c.salesRegion)} style={btnStyle("secondary")}>
//                               Region details
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </Popup>
//                   </Marker>
//                 );
//               })}
//         </MapContainer>
//       </div>
//     </div>
//   );
// }

// function FitBounds({ bounds }) {
//   const map = useMap();
//   React.useEffect(() => {
//     if (!bounds) return;
//     map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
//   }, [bounds, map]);
//   return null;
// }

// function Stat({ label, value }) {
//   return (
//     <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "8px 10px" }}>
//       <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
//       <div style={{ fontSize: 16, fontWeight: 700 }}>{Number(value ?? 0).toLocaleString()}</div>
//     </div>
//   );
// }

// function pillStyle(active) {
//   return {
//     padding: "6px 10px",
//     borderRadius: 999,
//     border: "1px solid rgba(0,0,0,0.12)",
//     background: active ? "rgba(0,0,0,0.08)" : "white",
//     cursor: "pointer",
//     fontWeight: 600,
//   };
// }

// function btnStyle(variant = "primary") {
//   const base = {
//     padding: "7px 10px",
//     borderRadius: 10,
//     border: "1px solid rgba(0,0,0,0.12)",
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: 13,
//   };
//   if (variant === "secondary") return { ...base, background: "white" };
//   return { ...base, background: "rgba(0,0,0,0.08)" };
// }



import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";

// Fix Leaflet default marker icons for bundlers (Vite)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ORG_PIN_LIMIT = 3000;

export default function ProductionLocationsMap({
  points = [],
  pinMode = "city",
  onPinModeChange,
  onToggleSelect,
  isSelected,
  makeKey,
  onViewOrgs,
  onGoToRegion,
  onGoToCountry,
  onGoToCity,
  height = "calc(100vh - 220px)",
}) {
  const cityAgg = useMemo(() => {
    const m = new Map();
    for (const p of points) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const region = p.salesRegion ?? "";
      const country = p.countryName ?? "";
      const city = p.city ?? "";

      const latR = Math.round(lat * 10000) / 10000;
      const lngR = Math.round(lng * 10000) / 10000;

      const k = `${region}||${country}||${city}||${latR}||${lngR}`;
      const cur = m.get(k) || {
        salesRegion: region,
        countryName: country,
        city,
        latitude: latR,
        longitude: lngR,
        orgIds: new Set(),
        hqCount: 0,
      };

      if (p.orgId != null) cur.orgIds.add(String(p.orgId));
      if (p.isHQ) cur.hqCount += 1;

      m.set(k, cur);
    }

    return Array.from(m.values()).map((x) => ({
      salesRegion: x.salesRegion,
      countryName: x.countryName,
      city: x.city,
      latitude: x.latitude,
      longitude: x.longitude,
      orgIds: Array.from(x.orgIds),
      orgCount: x.orgIds.size,
      hqCount: x.hqCount,
    }));
  }, [points]);

  const mapPoints = pinMode === "org" ? points : cityAgg;

  const bounds = useMemo(() => {
    const coords = [];
    for (const p of mapPoints) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) coords.push([lat, lng]);
    }
    return coords.length ? L.latLngBounds(coords) : null;
  }, [mapPoints]);

  const defaultCenter = useMemo(() => {
    let n = 0,
      sumLat = 0,
      sumLng = 0;
    for (const p of mapPoints) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      n++;
      sumLat += lat;
      sumLng += lng;
    }
    return n ? [sumLat / n, sumLng / n] : [20, 0];
  }, [mapPoints]);

  const tooManyOrgPins = pinMode === "org" && mapPoints.length > ORG_PIN_LIMIT;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontWeight: 600 }}>Map Pins:</span>
        <button onClick={() => onPinModeChange?.("city")} style={pillStyle(pinMode === "city")}>Cities</button>
        <button onClick={() => onPinModeChange?.("org")} style={pillStyle(pinMode === "org")}>Orgs</button>
        <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.75 }}>
          Showing {mapPoints.length.toLocaleString()} {pinMode === "org" ? "org pins" : "city pins"}
        </span>
      </div>

      {tooManyOrgPins ? (
        <div style={{ padding: 16, fontWeight: 600, opacity: 0.75 }}>
          Too many org pins to render smoothly.
          <br />
          Zoom in or filter by region / country / city.
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
          <MapContainer center={defaultCenter} zoom={2} style={{ width: "100%", height }} scrollWheelZoom>
            <FitBounds bounds={bounds} />
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MarkerClusterGroup chunkedLoading>
              {mapPoints.map((p) => {
                const lat = Number(p.latitude);
                const lng = Number(p.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                const key = makeKey ? makeKey(p) : `${p.salesRegion}||${p.countryName}||${p.city}`;
                const selected = isSelected?.(key) ?? false;

                return (
                  <Marker key={key} position={[lat, lng]} opacity={selected ? 1 : 0.85}>
                    <Popup>
                      {pinMode === "org" ? (
                        <div>
                          <strong>{p.orgName || "Organization"}</strong>
                          <div>{p.city}, {p.countryName}</div>
                        </div>
                      ) : (
                        <div>
                          <strong>{p.city || "City"}</strong>
                          <div>{p.countryName}</div>
                          <div>Orgs: {p.orgCount} • HQs: {p.hqCount}</div>
                        </div>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

function FitBounds({ bounds }) {
  const map = useMap();
  React.useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  }, [bounds, map]);
  return null;
}

function pillStyle(active) {
  return {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: active ? "rgba(0,0,0,0.08)" : "white",
    cursor: "pointer",
    fontWeight: 600,
  };
}
