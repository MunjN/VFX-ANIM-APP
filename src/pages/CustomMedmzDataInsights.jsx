// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import InsightsShell from "../components/insights/InsightsShell";
// import { Card, Pill, Divider } from "../components/insights/Cards";

// // -------------------- helpers --------------------
// function useQuery() {
//   const { search } = useLocation();
//   return useMemo(() => new URLSearchParams(search), [search]);
// }

// function safeStr(x) {
//   return String(x ?? "").trim();
// }

// const base = import.meta.env.VITE_API_BASE;

// function SegmentedToggle({ value, options, onChange }) {
//   return (
//     <div
//       style={{
//         display: "inline-flex",
//         gap: 6,
//         padding: 6,
//         borderRadius: 999,
//         border: "1px solid rgba(30,42,120,0.14)",
//         background: "rgba(255,255,255,0.70)",
//         boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
//         backdropFilter: "blur(10px)",
//       }}
//     >
//       {options.map((o) => {
//         const active = o.value === value;
//         return (
//           <button
//             key={o.value}
//             onClick={() => onChange(o.value)}
//             style={{
//               appearance: "none",
//               border: "1px solid rgba(30,42,120,0.10)",
//               background: active
//                 ? "linear-gradient(180deg, rgba(30,42,120,0.12), rgba(30,42,120,0.08))"
//                 : "rgba(255,255,255,0.65)",
//               borderRadius: 999,
//               padding: "8px 12px",
//               fontWeight: 950,
//               fontSize: 13,
//               cursor: "pointer",
//               color: "rgba(15,23,42,0.92)",
//               boxShadow: active ? "0 8px 16px rgba(17,24,39,0.10)" : "none",
//               transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
//               transform: active ? "translateY(-1px)" : "translateY(0px)",
//               whiteSpace: "nowrap",
//             }}
//             title={o.label}
//           >
//             {o.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// function SkeletonLine({ w = "60%" }) {
//   return (
//     <div
//       style={{
//         height: 12,
//         width: w,
//         borderRadius: 999,
//         background:
//           "linear-gradient(90deg, rgba(30,42,120,0.06), rgba(30,42,120,0.12), rgba(30,42,120,0.06))",
//         backgroundSize: "200% 100%",
//         animation: "medmz_shimmer 1.1s ease-in-out infinite",
//       }}
//     />
//   );
// }

// export default function MEDMZCustomInsights() {
//   const nav = useNavigate();
//   const qs = useQuery();

//   const [decks, setDecks] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Fetch deck list from server
//   useEffect(() => {
//     let alive = true;
//     setLoading(true);

//     fetch(base+"/api/custom-insights/decks")
//       .then((r) => {
//         if (!r.ok) throw new Error(`HTTP ${r.status}`);
//         return r.json();
//       })
//       .then((json) => {
//         if (!alive) return;
//         setDecks(Array.isArray(json?.decks) ? json.decks : []);
//         setLoading(false);
//       })
//       .catch(() => {
//         if (!alive) return;
//         setDecks([]);
//         setLoading(false);
//       });

//     return () => {
//       alive = false;
//     };
//   }, []);

//   const defaultDeckId = useMemo(() => decks?.[0]?.id || "", [decks]);

//   const deckIdFromUrl = safeStr(qs.get("deck"));
//   const [deckId, setDeckId] = useState(deckIdFromUrl);

//   // When decks arrive: ensure we have a valid selection
//   useEffect(() => {
//     if (!decks?.length) return;

//     const valid =
//       deckId && decks.some((d) => d.id === deckId)
//         ? deckId
//         : deckIdFromUrl && decks.some((d) => d.id === deckIdFromUrl)
//         ? deckIdFromUrl
//         : defaultDeckId;

//     if (valid && valid !== deckId) setDeckId(valid);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [decks, defaultDeckId]);

//   // Keep URL in sync (shareable)
//   useEffect(() => {
//     if (!deckId) return;
//     const params = new URLSearchParams(qs.toString());
//     params.set("deck", deckId);
//     nav({ search: params.toString() }, { replace: true });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [deckId]);

//   const deck = useMemo(() => decks.find((d) => d.id === deckId) || decks[0], [decks, deckId]);

//   const toggleOptions = useMemo(
//     () => (decks || []).map((d) => ({ value: d.id, label: d.title })),
//     [decks]
//   );

//   const viewerSrc = useMemo(() => {
//     if (!deck?.pdfUrl) return "";
//     return `${deck.pdfUrl}#view=FitH`;
//   }, [deck]);

//   return (
//     <InsightsShell
//       title="ME-DMZ Custom Insights"
//       active="custom-insights"
//     >
//       {/* tiny shimmer keyframes */}
//       <style>{`
//         @keyframes medmz_shimmer {
//           0% { background-position: 0% 0%; }
//           100% { background-position: 200% 0%; }
//         }
//       `}</style>

//       {/* Header row */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           gap: 12,
//           flexWrap: "wrap",
//           marginTop: -6,
//           marginBottom: 12,
//         }}
//       >
//         <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
//           <Pill tone="brand">Custom Insights</Pill>
//           {!loading && deck?.title ? <Pill tone="neutral">{deck.title}</Pill> : null}
//         </div>

//         {loading ? (
//           <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//             <SkeletonLine w="220px" />
//           </div>
//         ) : (
//           <SegmentedToggle value={deckId} options={toggleOptions} onChange={setDeckId} />
//         )}
//       </div>

//       <Card
//         title={deck?.title || "Report viewer"}
//         subtitle={deck?.title ? "PDF deck" : "Choose a deck to view"}
//         right={
//           deck?.pdfUrl ? (
//             <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
//               <a
//                 href={deck.pdfUrl}
//                 target="_blank"
//                 rel="noreferrer"
//                 style={{
//                   textDecoration: "none",
//                   border: "1px solid rgba(30,42,120,0.16)",
//                   background: "rgba(255,255,255,0.78)",
//                   borderRadius: 999,
//                   padding: "8px 12px",
//                   cursor: "pointer",
//                   fontWeight: 900,
//                   boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
//                   color: "rgba(15,23,42,0.92)",
//                 }}
//                 title="Open PDF in a new tab"
//               >
//                 Open
//               </a>
//               <a
//                 href={deck.pdfUrl}
//                 download
//                 style={{
//                   textDecoration: "none",
//                   border: "1px solid rgba(30,42,120,0.16)",
//                   background: "rgba(255,255,255,0.78)",
//                   borderRadius: 999,
//                   padding: "8px 12px",
//                   cursor: "pointer",
//                   fontWeight: 900,
//                   boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
//                   color: "rgba(15,23,42,0.92)",
//                 }}
//                 title="Download PDF"
//               >
//                 Download
//               </a>
//             </div>
//           ) : (
//             <Pill tone="neutral">Viewer</Pill>
//           )
//         }
//       >
//         {loading ? (
//           <div style={{ display: "grid", gap: 12 }}>
//             <SkeletonLine w="38%" />
//             <SkeletonLine w="62%" />
//             <div
//               style={{
//                 marginTop: 6,
//                 height: "calc(100vh - 220px)",
//                 minHeight: 900,
//                 borderRadius: 20,
//                 border: "1px solid rgba(30,42,120,0.10)",
//                 background:
//                   "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.35))",
//                 boxShadow: "0 18px 44px rgba(17,24,39,0.14)",
//                 overflow: "hidden",
//               }}
//             >
//               <div style={{ padding: 16 }}>
//                 <SkeletonLine w="28%" />
//                 <div style={{ height: 12 }} />
//                 <SkeletonLine w="52%" />
//               </div>
//             </div>
//           </div>
//         ) : decks?.length ? (
//           <div
//             style={{
//               marginTop: 10,
//               borderRadius: 20,
//               overflow: "hidden",
//               border: "1px solid rgba(30,42,120,0.10)",
//               background: "rgba(255,255,255,0.55)",
//               boxShadow: "0 18px 44px rgba(17,24,39,0.14)",
//             }}
//           >
//             <iframe
//               key={viewerSrc} // forces refresh on toggle
//               title={deck?.title || "ME-DMZ PDF"}
//               src={viewerSrc}
//               style={{
//                 width: "100%",
//                 height: "calc(100vh - 220px)",
//                 minHeight: 900,
//                 border: 0,
//                 display: "block",
//                 background: "white",
//               }}
//             />
//           </div>
//         ) : (
//           <div style={{ fontWeight: 850, opacity: 0.8 }}>
//             No decks found. Make sure the PDFs are in <code>/data</code> and the API endpoint is live.
//           </div>
//         )}

//         <Divider style={{ margin: "16px 0 0" }} />

//         <div style={{ marginTop: 12, opacity: 0.78, fontWeight: 850, fontSize: 13 }}>
//         </div>
//       </Card>
//     </InsightsShell>
//   );
// }


import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InsightsShell from "../components/insights/InsightsShell";
import { Card, Pill, Divider } from "../components/insights/Cards";

// -------------------- helpers --------------------
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function safeStr(x) {
  return String(x ?? "").trim();
}

// Normalize base (works for prod + local)
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function withApiBase(url) {
  if (!url) return "";
  // already absolute
  if (/^https?:\/\//i.test(url)) return url;
  // relative like "/api/..." -> "https://api.../api/..."
  return `${API_BASE}${url}`;
}

function SegmentedToggle({ value, options, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: 6,
        borderRadius: 999,
        border: "1px solid rgba(30,42,120,0.14)",
        background: "rgba(255,255,255,0.70)",
        boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              appearance: "none",
              border: "1px solid rgba(30,42,120,0.10)",
              background: active
                ? "linear-gradient(180deg, rgba(30,42,120,0.12), rgba(30,42,120,0.08))"
                : "rgba(255,255,255,0.65)",
              borderRadius: 999,
              padding: "8px 12px",
              fontWeight: 950,
              fontSize: 13,
              cursor: "pointer",
              color: "rgba(15,23,42,0.92)",
              boxShadow: active ? "0 8px 16px rgba(17,24,39,0.10)" : "none",
              transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
              transform: active ? "translateY(-1px)" : "translateY(0px)",
              whiteSpace: "nowrap",
            }}
            title={o.label}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SkeletonLine({ w = "60%" }) {
  return (
    <div
      style={{
        height: 12,
        width: w,
        borderRadius: 999,
        background:
          "linear-gradient(90deg, rgba(30,42,120,0.06), rgba(30,42,120,0.12), rgba(30,42,120,0.06))",
        backgroundSize: "200% 100%",
        animation: "medmz_shimmer 1.1s ease-in-out infinite",
      }}
    />
  );
}

export default function MEDMZCustomInsights() {
  const nav = useNavigate();
  const qs = useQuery();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch deck list from server
  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch(`${API_BASE}/api/custom-insights/decks`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        setDecks(Array.isArray(json?.decks) ? json.decks : []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setDecks([]);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const defaultDeckId = useMemo(() => decks?.[0]?.id || "", [decks]);

  const deckIdFromUrl = safeStr(qs.get("deck"));
  const [deckId, setDeckId] = useState(deckIdFromUrl);

  // When decks arrive: ensure we have a valid selection
  useEffect(() => {
    if (!decks?.length) return;

    const valid =
      deckId && decks.some((d) => d.id === deckId)
        ? deckId
        : deckIdFromUrl && decks.some((d) => d.id === deckIdFromUrl)
        ? deckIdFromUrl
        : defaultDeckId;

    if (valid && valid !== deckId) setDeckId(valid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks, defaultDeckId]);

  // Keep URL in sync (shareable)
  useEffect(() => {
    if (!deckId) return;
    const params = new URLSearchParams(qs.toString());
    params.set("deck", deckId);
    nav({ search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const deck = useMemo(() => decks.find((d) => d.id === deckId) || decks[0], [decks, deckId]);

  const toggleOptions = useMemo(
    () => (decks || []).map((d) => ({ value: d.id, label: d.title })),
    [decks]
  );

  // IMPORTANT: deck.pdfUrl is usually a relative "/api/..." coming from the backend.
  // Prefix it with API_BASE so it doesn't hit the frontend origin and 404.
  const viewerSrc = useMemo(() => {
    if (!deck?.pdfUrl) return "";
    return `${withApiBase(deck.pdfUrl)}#view=FitH`;
  }, [deck]);

  return (
    <InsightsShell title="ME-DMZ Custom Insights" active="custom-insights">
      {/* tiny shimmer keyframes */}
      <style>{`
        @keyframes medmz_shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: -6,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Pill tone="brand">Custom Insights</Pill>
          {!loading && deck?.title ? <Pill tone="neutral">{deck.title}</Pill> : null}
        </div>

        {loading ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SkeletonLine w="220px" />
          </div>
        ) : (
          <SegmentedToggle value={deckId} options={toggleOptions} onChange={setDeckId} />
        )}
      </div>

      <Card
        title={deck?.title || "Report viewer"}
        subtitle={deck?.title ? "PDF deck" : "Choose a deck to view"}
        right={
          deck?.pdfUrl ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <a
                href={withApiBase(deck.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(30,42,120,0.16)",
                  background: "rgba(255,255,255,0.78)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 900,
                  boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
                  color: "rgba(15,23,42,0.92)",
                }}
                title="Open PDF in a new tab"
              >
                Open
              </a>
              <a
                href={withApiBase(deck.pdfUrl)}
                download
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(30,42,120,0.16)",
                  background: "rgba(255,255,255,0.78)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 900,
                  boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
                  color: "rgba(15,23,42,0.92)",
                }}
                title="Download PDF"
              >
                Download
              </a>
            </div>
          ) : (
            <Pill tone="neutral">Viewer</Pill>
          )
        }
      >
        {loading ? (
          <div style={{ display: "grid", gap: 12 }}>
            <SkeletonLine w="38%" />
            <SkeletonLine w="62%" />
            <div
              style={{
                marginTop: 6,
                height: "calc(100vh - 220px)",
                minHeight: 900,
                borderRadius: 20,
                border: "1px solid rgba(30,42,120,0.10)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.35))",
                boxShadow: "0 18px 44px rgba(17,24,39,0.14)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: 16 }}>
                <SkeletonLine w="28%" />
                <div style={{ height: 12 }} />
                <SkeletonLine w="52%" />
              </div>
            </div>
          </div>
        ) : decks?.length ? (
          <div
            style={{
              marginTop: 10,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(30,42,120,0.10)",
              background: "rgba(255,255,255,0.55)",
              boxShadow: "0 18px 44px rgba(17,24,39,0.14)",
            }}
          >
            <iframe
              key={viewerSrc} // forces refresh on toggle
              title={deck?.title || "ME-DMZ PDF"}
              src={viewerSrc}
              style={{
                width: "100%",
                height: "calc(100vh - 220px)",
                minHeight: 900,
                border: 0,
                display: "block",
                background: "white",
              }}
            />
          </div>
        ) : (
          <div style={{ fontWeight: 850, opacity: 0.8 }}>
            No decks found. Make sure the PDFs are in <code>/data</code> and the API endpoint is live.
          </div>
        )}

        <Divider style={{ margin: "16px 0 0" }} />

        <div style={{ marginTop: 12, opacity: 0.78, fontWeight: 850, fontSize: 13 }} />
      </Card>
    </InsightsShell>
  );
}

