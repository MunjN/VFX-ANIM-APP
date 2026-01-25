// // src/components/OrgSuggestSearch.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { setVisualizeFilters, useVisualizeFilters } from "../state/visualizeFiltersStore";
// import { getLocationPoints } from "../services/locationsApi";

// /**
//  * Suggestive org search bar (debounced + keyboard nav).
//  *
//  * Default endpoint: GET /api/orgs
//  * We try multiple param names because backends vary:
//  *   q, search, query, term
//  *
//  * Response normalization is defensive:
//  *  - { data: [...] }, { results: [...] }, { items: [...] }
//  *  - { data: { items: [...] } }
//  *  - [...] directly
//  */

// const BRAND = {
//   primaryLightBlue: "#CEECF2",
//   primaryDarkBlue: "#232073",
//   grey: "#747474",
//   card: "#FFFFFF",
//   border: "#E5E7EB",
//   danger: "#b91c1c",
// };

// function normalizeOrgResults(payload) {
//   if (!payload) return [];
//   if (Array.isArray(payload)) return payload;

//   if (Array.isArray(payload.data)) return payload.data;
//   if (Array.isArray(payload.results)) return payload.results;
//   if (Array.isArray(payload.items)) return payload.items;

//   if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
//   if (payload.data && Array.isArray(payload.data.results)) return payload.data.results;

//   return [];
// }

// function isUuidLike(v) {
//   const s = String(v ?? "").trim();
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
// }

// function pickFirstTruthy(o, keys) {
//   for (const k of keys) {
//     const val = o?.[k];
//     if (val != null && String(val).trim() !== "") return val;
//   }
//   return "";
// }

// function getOrgId(o) {
//   const uuidCandidates = [
//     "uuid",
//     "orgUuid",
//     "ORG_UUID",
//     "participantId",
//     "organizationId",
//     "ORG_ID",
//   ];

//   for (const k of uuidCandidates) {
//     const v = o?.[k];
//     if (isUuidLike(v)) return String(v).trim();
//   }

//   if (isUuidLike(o?.orgId)) return String(o.orgId).trim();

//   return String(
//     pickFirstTruthy(o, ["orgId", "id", "_id", "ORGID", "ORGID_NUMERIC", "legacyId"]) || ""
//   ).trim();
// }

// function getOrgName(o) {
//   return (
//     o?.orgName ||
//     o?.name ||
//     o?.title ||
//     o?.label ||
//     o?.ORG_NAME ||
//     o?.ORGNAME ||
//     o?.organizationName ||
//     ""
//   );
// }

// function useDebouncedValue(value, delayMs = 250) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(value), delayMs);
//     return () => clearTimeout(t);
//   }, [value, delayMs]);
//   return debounced;
// }

// export default function OrgSuggestSearch({
//   placeholder = "Search orgs…",
//   pageSize = 8,
//   minChars = 2,
//   endpoint = "/api/orgs",
// }) {
//   const filters = useVisualizeFilters();

//   const [q, setQ] = useState("");
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");
//   const [results, setResults] = useState([]);
//   const [activeIdx, setActiveIdx] = useState(-1);

//   const [debugUrl, setDebugUrl] = useState("");

//   const wrapRef = useRef(null);
//   const inputRef = useRef(null);

//   const debouncedQ = useDebouncedValue(q, 250);

//   const selectedOrgIds = useMemo(() => {
//     const set = filters?.orgIds;
//     if (set && typeof set.size === "number") return Array.from(set);
//     return [];
//   }, [filters]);

//   // Close on outside click
//   useEffect(() => {
//     const onDoc = (e) => {
//       if (!wrapRef.current) return;
//       if (!wrapRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", onDoc);
//     return () => document.removeEventListener("mousedown", onDoc);
//   }, []);

//   // Fetch suggestions
//   useEffect(() => {
//     const term = debouncedQ.trim();
//     if (term.length < minChars) {
//       setResults([]);
//       setErr("");
//       setLoading(false);
//       setDebugUrl("");
//       return;
//     }

//     const ac = new AbortController();

//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");
//         setActiveIdx(-1);

//         const paramCandidates = ["q", "search", "query", "term"];

//         let json = null;
//         let usedUrl = "";

//         for (const param of paramCandidates) {
//           const url =
//             `${endpoint}?${param}=${encodeURIComponent(term)}` +
//             `&pageSize=${encodeURIComponent(String(pageSize))}`;

//           usedUrl = url;

//           const res = await fetch(url, { signal: ac.signal });
//           if (!res.ok) continue;

//           json = await res.json();
//           const maybe = normalizeOrgResults(json);
//           if (Array.isArray(maybe)) break;
//         }

//         if (!json) throw new Error(`Org search failed (no compatible query param)`);

//         setDebugUrl(usedUrl);

//         const rawItems = normalizeOrgResults(json);

//         const items = rawItems
//           .map((o) => {
//             const orgId = String(getOrgId(o) || "").trim();
//             const orgName = String(getOrgName(o) || "").trim();
//             return { orgId, orgName: orgName || orgId, raw: o };
//           })
//           .filter((x) => x.orgId);

//         setResults(items);
//         setOpen(true);
//       } catch (e) {
//         if (ac.signal.aborted) return;
//         setErr(e?.message || "Org search failed");
//         setResults([]);
//         setOpen(true);
//       } finally {
//         if (!ac.signal.aborted) setLoading(false);
//       }
//     })();

//     return () => ac.abort();
//   }, [debouncedQ, minChars, pageSize, endpoint]);

//   const onPick = async (item) => {
//     if (!item?.orgId) return;

//     // Add orgId
//     const next = new Set(selectedOrgIds);
//     next.add(item.orgId);

//     // Optional: find a best-guess region/country for "helpful" narrowing,
//     // but DO NOT set city (this caused the Harrow bug).
//     let found = null;
//     try {
//       const pts = await getLocationPoints();
//       const matches = (pts || []).filter((p) => String(p.orgId) === String(item.orgId));
//       if (matches.length) found = matches.find((m) => m.isHQ) || matches[0];
//     } catch {
//       // ignore
//     }

//     // NON-STRICT behavior:
//     // - set orgIds always (map drills into green)
//     // - only set salesRegions/countries IF those filters are currently empty
//     // - never touch cities (prevents Harrow/London surprise)
//     const patch = {
//       orgIds: Array.from(next),
//     };

//     if (!(filters.salesRegions?.size) && found?.salesRegion) {
//       patch.salesRegions = [String(found.salesRegion).trim()];
//     }
//     if (!(filters.countries?.size) && found?.countryName) {
//       patch.countries = [String(found.countryName).trim()];
//     }

//     setVisualizeFilters(patch);

//     setQ(item.orgName);
//     setOpen(false);
//     setActiveIdx(-1);

//     requestAnimationFrame(() => inputRef.current?.focus());
//   };

//   const clearOrgSelection = () => {
//     setVisualizeFilters({ orgIds: [] });
//     setQ("");
//     setResults([]);
//     setOpen(false);
//     setActiveIdx(-1);
//     requestAnimationFrame(() => inputRef.current?.focus());
//   };

//   const onKeyDown = (e) => {
//     if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
//       setOpen(true);
//       return;
//     }

//     if (e.key === "Escape") {
//       setOpen(false);
//       setActiveIdx(-1);
//       return;
//     }

//     if (!open) return;

//     if (e.key === "ArrowDown") {
//       e.preventDefault();
//       setActiveIdx((i) => Math.min(i + 1, results.length - 1));
//       return;
//     }

//     if (e.key === "ArrowUp") {
//       e.preventDefault();
//       setActiveIdx((i) => Math.max(i - 1, 0));
//       return;
//     }

//     if (e.key === "Enter") {
//       if (activeIdx >= 0 && results[activeIdx]) {
//         e.preventDefault();
//         onPick(results[activeIdx]);
//       }
//     }
//   };

//   return (
//     <div ref={wrapRef} style={{ position: "relative", minWidth: 320, flex: "1 1 360px" }}>
//       {/* Input row */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 8,
//           border: `1px solid ${BRAND.border}`,
//           borderRadius: 999,
//           background: "white",
//           padding: "0 10px",
//           height: 40,
//         }}
//       >
//         <span
//           style={{
//             fontSize: 14,
//             fontWeight: 900,
//             color: BRAND.primaryDarkBlue,
//             paddingLeft: 4,
//           }}
//           aria-hidden
//         >
//           ⌕
//         </span>

//         <input
//           ref={inputRef}
//           value={q}
//           onChange={(e) => {
//             setQ(e.target.value);
//             setOpen(true);
//           }}
//           onFocus={() => setOpen(true)}
//           onKeyDown={onKeyDown}
//           placeholder={placeholder}
//           style={{
//             flex: 1,
//             border: "none",
//             outline: "none",
//             fontSize: 13,
//             fontWeight: 800,
//             color: "#111827",
//             background: "transparent",
//           }}
//         />

//         {loading ? <span style={{ fontSize: 12, fontWeight: 900, color: BRAND.grey }}>…</span> : null}

//         {(q || selectedOrgIds.length) ? (
//           <button
//             type="button"
//             onClick={clearOrgSelection}
//             style={{
//               border: "none",
//               background: "transparent",
//               cursor: "pointer",
//               fontSize: 14,
//               fontWeight: 900,
//               color: BRAND.grey,
//               padding: "0 6px",
//             }}
//             title="Clear org search"
//           >
//             ×
//           </button>
//         ) : null}
//       </div>

//       {/* Dropdown */}
//       {open ? (
//         <div
//           style={{
//             position: "absolute",
//             top: 46,
//             left: 0,
//             right: 0,
//             background: BRAND.card,
//             border: `1px solid ${BRAND.border}`,
//             borderRadius: 14,
//             boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//             zIndex: 50,
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               padding: "10px 12px",
//               borderBottom: `1px solid ${BRAND.border}`,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               gap: 10,
//             }}
//           >
//             <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
//               Org Search
//             </div>
//             <div style={{ fontSize: 11, fontWeight: 800, color: BRAND.grey }}>
//               {err
//                 ? "Error"
//                 : loading
//                 ? "Searching…"
//                 : results.length
//                 ? `${results.length} results`
//                 : "No results"}
//             </div>
//           </div>

//           {/* Optional debug line */}
//           {debugUrl ? (
//             <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: BRAND.grey }}>
//               {debugUrl}
//             </div>
//           ) : null}

//           {/* Body */}
//           <div style={{ maxHeight: 320, overflow: "auto" }}>
//             {err ? (
//               <div style={{ padding: 12, fontSize: 12, fontWeight: 900, color: BRAND.danger }}>
//                 {err}
//               </div>
//             ) : debouncedQ.trim().length < minChars ? (
//               <div style={{ padding: 12, fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
//                 Type at least {minChars} characters…
//               </div>
//             ) : results.length ? (
//               results.map((r, idx) => {
//                 const active = idx === activeIdx;
//                 const alreadySelected = selectedOrgIds.includes(r.orgId);

//                 return (
//                   <div
//                     key={r.orgId}
//                     role="button"
//                     tabIndex={0}
//                     onMouseEnter={() => setActiveIdx(idx)}
//                     onMouseDown={(e) => e.preventDefault()}
//                     onClick={() => onPick(r)}
//                     style={{
//                       padding: "10px 12px",
//                       cursor: "pointer",
//                       background: active ? BRAND.primaryLightBlue : "white",
//                       borderBottom: `1px solid ${BRAND.border}`,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       gap: 10,
//                     }}
//                   >
//                     <div style={{ minWidth: 0 }}>
//                       <div
//                         style={{
//                           fontSize: 13,
//                           fontWeight: 900,
//                           color: "#111827",
//                           whiteSpace: "nowrap",
//                           overflow: "hidden",
//                           textOverflow: "ellipsis",
//                         }}
//                         title={r.orgName}
//                       >
//                         {r.orgName}
//                       </div>
//                       <div style={{ fontSize: 11, fontWeight: 800, color: BRAND.grey }}>
//                         {r.orgId}
//                       </div>
//                     </div>

//                     <div
//                       style={{
//                         fontSize: 11,
//                         fontWeight: 900,
//                         color: alreadySelected ? BRAND.primaryDarkBlue : BRAND.grey,
//                         opacity: alreadySelected ? 1 : 0.9,
//                       }}
//                     >
//                       {alreadySelected ? "Selected" : "Add"}
//                     </div>
//                   </div>
//                 );
//               })
//             ) : (
//               <div style={{ padding: 12, fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
//                 No matching orgs.
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div
//             style={{
//               padding: "10px 12px",
//               borderTop: `1px solid ${BRAND.border}`,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               gap: 10,
//             }}
//           >
//             <div style={{ fontSize: 11, fontWeight: 900, color: BRAND.grey }}>
//               Selected:{" "}
//               <span style={{ color: BRAND.primaryDarkBlue }}>
//                 {selectedOrgIds.length.toLocaleString()}
//               </span>
//             </div>

//             <button
//               type="button"
//               onClick={() => setOpen(false)}
//               style={{
//                 border: `1px solid ${BRAND.border}`,
//                 background: "white",
//                 borderRadius: 999,
//                 padding: "6px 10px",
//                 fontSize: 11,
//                 fontWeight: 900,
//                 cursor: "pointer",
//                 color: BRAND.primaryDarkBlue,
//               }}
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// }


// src/components/OrgSuggestSearch.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { setVisualizeFilters, useVisualizeFilters } from "../state/visualizeFiltersStore";
import { getLocationPoints } from "../services/locationsApi";

/**
 * Suggestive org search bar (debounced + keyboard nav).
 *
 * Default endpoint: GET /api/orgs
 * We try multiple param names because backends vary:
 *   q, search, query, term
 *
 * Response normalization is defensive:
 *  - { data: [...] }, { results: [...] }, { items: [...] }
 *  - { data: { items: [...] } }
 *  - [...] directly
 */

const BRAND = {
  primaryLightBlue: "#CEECF2",
  primaryDarkBlue: "#232073",
  grey: "#747474",
  card: "#FFFFFF",
  border: "#E5E7EB",
  danger: "#b91c1c",
};

function normalizeOrgResults(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.items)) return payload.items;

  if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
  if (payload.data && Array.isArray(payload.data.results)) return payload.data.results;

  return [];
}

function isUuidLike(v) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function pickFirstTruthy(o, keys) {
  for (const k of keys) {
    const val = o?.[k];
    if (val != null && String(val).trim() !== "") return val;
  }
  return "";
}

function getOrgId(o) {
  const uuidCandidates = ["uuid", "orgUuid", "ORG_UUID", "participantId", "organizationId", "ORG_ID"];

  for (const k of uuidCandidates) {
    const v = o?.[k];
    if (isUuidLike(v)) return String(v).trim();
  }

  if (isUuidLike(o?.orgId)) return String(o.orgId).trim();

  return String(
    pickFirstTruthy(o, ["orgId", "id", "_id", "ORGID", "ORGID_NUMERIC", "legacyId"]) || ""
  ).trim();
}

function getOrgName(o) {
  return (
    o?.orgName ||
    o?.name ||
    o?.title ||
    o?.label ||
    o?.ORG_NAME ||
    o?.ORGNAME ||
    o?.organizationName ||
    ""
  );
}

function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const base = import.meta.env.VITE_API_BASE;
export default function OrgSuggestSearch({
  viewMode = "orgs",
  placeholder = "Search orgs…",
  pageSize = 8,
  minChars = 2,
  endpoint = base+"/api/orgs",
}) {
  const filters = useVisualizeFilters();

  // ✅ Orgs search is ONLY for orgs view.
  // Returning null avoids accidental filter writes from hidden UI.
  const isOrgsView = String(viewMode || "orgs").toLowerCase() === "orgs";
  if (!isOrgsView) return null;

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [results, setResults] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);

  const [debugUrl, setDebugUrl] = useState("");

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQ = useDebouncedValue(q, 250);

  const selectedOrgIds = useMemo(() => {
    const set = filters?.orgIds;
    if (set && typeof set.size === "number") return Array.from(set);
    return [];
  }, [filters]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const term = debouncedQ.trim();
    if (term.length < minChars) {
      setResults([]);
      setErr("");
      setLoading(false);
      setDebugUrl("");
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setActiveIdx(-1);

        const paramCandidates = ["q", "search", "query", "term"];

        let json = null;
        let usedUrl = "";

        for (const param of paramCandidates) {
          const url =
            `${endpoint}?${param}=${encodeURIComponent(term)}` +
            `&pageSize=${encodeURIComponent(String(pageSize))}`;

          usedUrl = url;

          const res = await fetch(url, { signal: ac.signal });
          if (!res.ok) continue;

          json = await res.json();
          const maybe = normalizeOrgResults(json);
          if (Array.isArray(maybe)) break;
        }

        if (!json) throw new Error(`Org search failed (no compatible query param)`);

        setDebugUrl(usedUrl);

        const rawItems = normalizeOrgResults(json);

        const items = rawItems
          .map((o) => {
            const orgId = String(getOrgId(o) || "").trim();
            const orgName = String(getOrgName(o) || "").trim();
            return { orgId, orgName: orgName || orgId, raw: o };
          })
          .filter((x) => x.orgId);

        setResults(items);
        setOpen(true);
      } catch (e) {
        if (ac.signal.aborted) return;
        setErr(e?.message || "Org search failed");
        setResults([]);
        setOpen(true);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [debouncedQ, minChars, pageSize, endpoint]);

  const onPick = async (item) => {
    if (!item?.orgId) return;

    // Add orgId (append)
    const next = new Set(selectedOrgIds);
    next.add(item.orgId);

    // Optional: best-guess region/country for "helpful" narrowing,
    // but only if those filters are currently empty.
    let found = null;
    try {
      const pts = await getLocationPoints();
      const matches = (pts || []).filter((p) => String(p.orgId) === String(item.orgId));
      if (matches.length) found = matches.find((m) => m.isHQ) || matches[0];
    } catch {
      // ignore
    }

    const patch = { orgIds: Array.from(next) };

    if (!(filters.salesRegions?.size) && found?.salesRegion) {
      patch.salesRegions = [String(found.salesRegion).trim()];
    }
    if (!(filters.countries?.size) && found?.countryName) {
      patch.countries = [String(found.countryName).trim()];
    }

    setVisualizeFilters(patch);

    setQ(item.orgName);
    setOpen(false);
    setActiveIdx(-1);

    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const clearOrgSelection = () => {
    setVisualizeFilters({ orgIds: [] });
    setQ("");
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
      return;
    }

    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      if (activeIdx >= 0 && results[activeIdx]) {
        e.preventDefault();
        onPick(results[activeIdx]);
      }
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", minWidth: 320, flex: "1 1 360px" }}>
      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 999,
          background: "white",
          padding: "0 10px",
          height: 40,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: BRAND.primaryDarkBlue,
            paddingLeft: 4,
          }}
          aria-hidden
        >
          ⌕
        </span>

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 13,
            fontWeight: 800,
            color: "#111827",
            background: "transparent",
          }}
        />

        {loading ? <span style={{ fontSize: 12, fontWeight: 900, color: BRAND.grey }}>…</span> : null}

        {(q || selectedOrgIds.length) ? (
          <button
            type="button"
            onClick={clearOrgSelection}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 900,
              color: BRAND.grey,
              padding: "0 6px",
            }}
            title="Clear org search"
          >
            ×
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {open ? (
        <div
          style={{
            position: "absolute",
            top: 46,
            left: 0,
            right: 0,
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            borderRadius: 14,
            boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: `1px solid ${BRAND.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
              Org Search
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: BRAND.grey }}>
              {err ? "Error" : loading ? "Searching…" : results.length ? `${results.length} results` : "No results"}
            </div>
          </div>

          {/* Optional debug line */}
          {debugUrl ? (
            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: BRAND.grey }}>
              {debugUrl}
            </div>
          ) : null}

          {/* Body */}
          <div style={{ maxHeight: 320, overflow: "auto" }}>
            {err ? (
              <div style={{ padding: 12, fontSize: 12, fontWeight: 900, color: BRAND.danger }}>
                {err}
              </div>
            ) : debouncedQ.trim().length < minChars ? (
              <div style={{ padding: 12, fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
                Type at least {minChars} characters…
              </div>
            ) : results.length ? (
              results.map((r, idx) => {
                const active = idx === activeIdx;
                const alreadySelected = selectedOrgIds.includes(r.orgId);

                return (
                  <div
                    key={r.orgId}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onPick(r)}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      background: active ? BRAND.primaryLightBlue : "white",
                      borderBottom: `1px solid ${BRAND.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 900,
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={r.orgName}
                      >
                        {r.orgName}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: BRAND.grey }}>
                        {r.orgId}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: alreadySelected ? BRAND.primaryDarkBlue : BRAND.grey,
                        opacity: alreadySelected ? 1 : 0.9,
                      }}
                    >
                      {alreadySelected ? "Selected" : "Add"}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 12, fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
                No matching orgs.
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${BRAND.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: BRAND.grey }}>
              Selected:{" "}
              <span style={{ color: BRAND.primaryDarkBlue }}>
                {selectedOrgIds.length.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                border: `1px solid ${BRAND.border}`,
                background: "white",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                color: BRAND.primaryDarkBlue,
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

