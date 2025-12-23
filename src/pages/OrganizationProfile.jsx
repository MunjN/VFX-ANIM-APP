
// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";

// const BRAND = {
//   ink: "#1E2A78",
//   fill: "#CFEFF7",
//   bg: "#F7FBFE",
//   text: "#111827",
//   border: "#1E2A78",
// };

// const base = import.meta.env.VITE_API_BASE;
// const TOKEN_FIELDS = new Set([
//   "SERVICES",
//   "INFRASTRUCTURE_TOOLS",
//   "CONTENT_TYPES",
//   "GEONAME_COUNTRY_NAME",
//   "SALES_REGION",
//   "ORG_FUNCTIONAL_TYPE",
// ]);

// /**
//  * ✅ Change displayed field names in the Organization Details panel here.
//  * Any field not in this map will fall back to the raw key name.
//  */
// const FIELD_LABELS = {
//   ORG_ID: "ME-NEXUS ID",
//   ORG_NAME: "Organization Name",
//   GEONAME_COUNTRY_NAME: "Organization Country",
//   SALES_REGION: "Organization Sales Region",
//   ORG_FUNCTIONAL_TYPE: "Organization Functional Type",
//   ORG_SIZING_CALCULATED: "Organization Sizing",
//   ADJUSTED_EMPLOYEE_COUNT: "Organization Employee Count",
//   ORG_ACTIVE_AS_OF_YEAR: "Active As Of Year",
//   ORG_IS_ACTIVE: "Is Active",
//   ORG_DOMAIN: "Organization Domain",
//   ORG_LEGAL_FORM: "Legal Form",
//   ORG_IS_ULTIMATE_PARENT: "Ultimate Parent",
//   PERSONA_SCORING: "Persona Scoring",
//   SERVICES: "Services",
//   INFRASTRUCTURE_TOOLS: "Infrastructure",
//   CONTENT_TYPES: "Content Types",
// };

// function splitTokens(cell) {
//   if (!cell) return [];
//   return String(cell)
//     .split(",")
//     .map((t) => t.trim())
//     .filter(Boolean);
// }

// function formatCellValue(raw) {
//   if (raw === null || raw === undefined) return "";
//   const s = String(raw);
//   if (s === "true") return "True";
//   if (s === "false") return "False";
//   return s;
// }

// function safeFileName(name) {
//   return String(name || "ORG")
//     .trim()
//     .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
//     .replace(/\s+/g, " ")
//     .slice(0, 160);
// }

// function Pill({ children }) {
//   return (
//     <span
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: 6,
//         padding: "6px 10px",
//         borderRadius: 999,
//         border: `1px solid rgba(30,42,120,0.22)`,
//         background: "rgba(207,239,247,0.55)",
//         color: BRAND.ink,
//         fontWeight: 900,
//         fontSize: 12,
//         whiteSpace: "nowrap",
//       }}
//     >
//       {children}
//     </span>
//   );
// }

// function ClickPill({ children, onClick, title }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       title={title}
//       style={{
//         border: `1px solid rgba(30,42,120,0.22)`,
//         background: "rgba(207,239,247,0.55)",
//         color: BRAND.ink,
//         fontWeight: 900,
//         fontSize: 12,
//         whiteSpace: "nowrap",
//         padding: "6px 10px",
//         borderRadius: 999,
//         cursor: "pointer",
//         display: "inline-flex",
//         alignItems: "center",
//         gap: 6,
//       }}
//     >
//       {children}
//       <span style={{ fontWeight: 1000, opacity: 0.7 }}>↗</span>
//     </button>
//   );
// }

// function Card({ title, subtitle, right, children }) {
//   return (
//     <div
//       style={{
//         borderRadius: 18,
//         border: `1px solid rgba(30,42,120,0.16)`,
//         background: "#FFFFFF",
//         boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           padding: "12px 14px",
//           borderBottom: "1px solid rgba(30,42,120,0.12)",
//           display: "flex",
//           alignItems: "flex-start",
//           justifyContent: "space-between",
//           gap: 12,
//           background:
//             "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
//         }}
//       >
//         <div style={{ display: "grid", gap: 4 }}>
//           <div
//             style={{
//               fontSize: 12,
//               fontWeight: 1000,
//               color: BRAND.ink,
//               letterSpacing: 0.3,
//             }}
//           >
//             {title}
//           </div>
//           {subtitle ? (
//             <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.8 }}>
//               {subtitle}
//             </div>
//           ) : null}
//         </div>
//         {right ? (
//           <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//             {right}
//           </div>
//         ) : null}
//       </div>

//       <div style={{ padding: 14 }}>{children}</div>
//     </div>
//   );
// }

// function KVRow({ k, v, isTokens, onTokenClick }) {
//   const value = formatCellValue(v);
//   const tokens = isTokens ? splitTokens(value) : [];
//   const label = FIELD_LABELS[k] || k;

//   return (
//     <div
//       style={{
//         display: "grid",
//         gridTemplateColumns: "260px 1fr",
//         gap: 12,
//         padding: "10px 0",
//         borderBottom: "1px solid rgba(30,42,120,0.08)",
//       }}
//     >
//       <div
//         style={{
//           fontWeight: 1000,
//           color: "rgba(30,42,120,0.85)",
//           fontSize: 13,
//         }}
//       >
//         {label}
//       </div>

//       <div
//         style={{
//           fontWeight: 800,
//           color: "rgba(17,24,39,0.92)",
//           fontSize: 13,
//         }}
//       >
//         {isTokens ? (
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//             {tokens.length === 0 ? (
//               <span style={{ opacity: 0.55 }}>—</span>
//             ) : (
//               tokens.map((t) =>
//                 onTokenClick ? (
//                   <button
//                     key={t}
//                     type="button"
//                     onClick={() => onTokenClick(t)}
//                     style={{
//                       border: `1px solid rgba(30,42,120,0.18)`,
//                       background: "rgba(207,239,247,0.55)",
//                       color: BRAND.ink,
//                       fontSize: 12,
//                       fontWeight: 1000,
//                       padding: "6px 10px",
//                       borderRadius: 999,
//                       whiteSpace: "nowrap",
//                       cursor: "pointer",
//                     }}
//                     title="Open reference"
//                   >
//                     {t}
//                   </button>
//                 ) : (
//                   <span
//                     key={t}
//                     style={{
//                       fontSize: 12,
//                       fontWeight: 1000,
//                       color: BRAND.ink,
//                       background: "rgba(207,239,247,0.55)",
//                       border: `1px solid rgba(30,42,120,0.18)`,
//                       padding: "6px 10px",
//                       borderRadius: 999,
//                       whiteSpace: "nowrap",
//                     }}
//                   >
//                     {t}
//                   </span>
//                 )
//               )
//             )}
//           </div>
//         ) : value ? (
//           value
//         ) : (
//           <span style={{ opacity: 0.55 }}>—</span>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function OrganizationProfile() {
//   const navigate = useNavigate();
//   const { orgId } = useParams();

//   const [loading, setLoading] = useState(true);
//   const [org, setOrg] = useState(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let cancelled = false;

//     async function run() {
//       setLoading(true);
//       setError("");
//       try {
//         const res = await fetch(`${base}/api/orgs/${encodeURIComponent(orgId)}`);
//         if (!res.ok) {
//           const j = await res.json().catch(() => ({}));
//           throw new Error(
//             j?.error || `Failed to load organization (${res.status})`
//           );
//         }
//         const json = await res.json();
//         if (!cancelled) setOrg(json);
//       } catch (e) {
//         if (!cancelled) setError(String(e?.message || e));
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     run();
//     return () => {
//       cancelled = true;
//     };
//   }, [orgId]);

//   const identifiers = useMemo(() => org?.identifiers || [], [org]);

//   const orgName = org?.ORG_NAME || "Organization";
//   const meNexusId = org?.ORG_ID || orgId;

//   const displayPairs = useMemo(() => {
//     if (!org) return [];
//     // show ALL attributes except internal helper fields + identifiers array
//     const entries = Object.entries(org).filter(
//       ([k]) => k !== "id" && k !== "identifiers"
//     );
//     // Put key fields first
//     const preferred = [
//       "ORG_ID",
//       "ORG_NAME",
//       "ORG_DOMAIN",
//       "GEONAME_COUNTRY_NAME",
//       "SALES_REGION",
//       "ORG_FUNCTIONAL_TYPE",
//       "ORG_SIZING_CALCULATED",
//       "ADJUSTED_EMPLOYEE_COUNT",
//       "ORG_ACTIVE_AS_OF_YEAR",
//       "ORG_IS_ACTIVE",
//     ];
//     const prefSet = new Set(preferred);

//     const first = preferred
//       .filter((k) => entries.some(([kk]) => kk === k))
//       .map((k) => [k, org[k]]);

//     const rest = entries
//       .filter(([k]) => !prefSet.has(k))
//       .sort((a, b) => a[0].localeCompare(b[0]));

//     return [...first, ...rest];
//   }, [org]);

//   function downloadOrgJSON() {
//     if (!org) return;

//     // Ensure ORG_ID present (explicit requirement)
//     const payload = { ...org, ORG_ID: String(org.ORG_ID ?? meNexusId) };

//     const fileName = `${safeFileName(org.ORG_NAME || "ORG")}.json`;
//     const blob = new Blob([JSON.stringify(payload, null, 2)], {
//       type: "application/json",
//     });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = fileName;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();

//     setTimeout(() => URL.revokeObjectURL(url), 500);
//   }

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: BRAND.bg,
//         fontFamily:
//           "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
//         color: BRAND.text,
//       }}
//     >
//       {/* Header */}
//       <div style={{ padding: "22px 26px 12px" }}>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 12,
//           }}
//         >
//           <div
//             style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
//           >
//             <button
//               type="button"
//               onClick={() => navigate("/")}
//               style={{
//                 border: "none",
//                 background: BRAND.fill,
//                 color: BRAND.ink,
//                 fontWeight: 1000,
//                 padding: "10px 14px",
//                 borderRadius: 14,
//                 cursor: "pointer",
//                 letterSpacing: 0.2,
//                 boxShadow: "0 8px 28px rgba(30,42,120,0.12)",
//               }}
//             >
//               ME-NEXUS
//             </button>

//             <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

//             <button
//               type="button"
//               onClick={() => navigate("/participants")}
//               style={{
//                 border: "none",
//                 background: "transparent",
//                 color: BRAND.ink,
//                 fontWeight: 1000,
//                 cursor: "pointer",
//                 padding: "8px 10px",
//                 borderRadius: 10,
//               }}
//             >
//               Participants
//             </button>

//             <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

//             <button
//               type="button"
//               onClick={() => navigate("/participants/organizations")}
//               style={{
//                 border: "none",
//                 background: "transparent",
//                 color: BRAND.ink,
//                 fontWeight: 1000,
//                 cursor: "pointer",
//                 padding: "8px 10px",
//                 borderRadius: 10,
//               }}
//             >
//               Organizations
//             </button>

//             <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

//             <span style={{ fontWeight: 1000, opacity: 0.95 }}>Profile</span>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 10 }}>
//               <Pill>ME-NEXUS ID: {meNexusId}</Pill>
//               {org?.GEONAME_COUNTRY_NAME ? (
//                 <Pill>
//                   {splitTokens(org.GEONAME_COUNTRY_NAME)[0] ||
//                     org.GEONAME_COUNTRY_NAME}
//                 </Pill>
//               ) : null}
//             </div>
//           </div>

//           <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//             <button
//               type="button"
//               onClick={() => navigate("/participants/organizations/schema")}
//               style={{
//                 border: `1px solid rgba(30,42,120,0.18)`,
//                 background: "#FFFFFF",
//                 color: BRAND.ink,
//                 fontWeight: 1000,
//                 padding: "10px 12px",
//                 borderRadius: 12,
//                 cursor: "pointer",
//               }}
//             >
//               Schema Information
//             </button>

//             <a
//               href="https://me-dmz.com"
//               target="_blank"
//               rel="noreferrer"
//               style={{
//                 textDecoration: "none",
//                 color: BRAND.ink,
//                 fontWeight: 1000,
//                 opacity: 0.9,
//                 padding: "10px 12px",
//                 borderRadius: 12,
//                 border: `1px solid rgba(30,42,120,0.18)`,
//                 background: "#FFFFFF",
//               }}
//             >
//               ME-DMZ ↗
//             </a>
//           </div>
//         </div>

//         <div style={{ marginTop: 14 }}>
//           <div
//             style={{
//               fontSize: 30,
//               fontWeight: 1000,
//               letterSpacing: 0.2,
//               color: "#0B0F1A",
//             }}
//           >
//             {loading ? "Loading…" : orgName}
//           </div>

//           {/* Quick taxonomy pills */}
//           <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
//             {org?.SALES_REGION ? (
//               <Pill>{splitTokens(org.SALES_REGION)[0] || org.SALES_REGION}</Pill>
//             ) : null}

//             {org?.ORG_FUNCTIONAL_TYPE ? (
//               <ClickPill
//                 onClick={() => navigate("/participants/organizations/functional-types")}
//                 title="Open Functional Types reference"
//               >
//                 {splitTokens(org.ORG_FUNCTIONAL_TYPE)[0] || org.ORG_FUNCTIONAL_TYPE}
//               </ClickPill>
//             ) : null}

//             {org?.CONTENT_TYPES ? (
//               <ClickPill
//                 onClick={() => navigate("/participants/organizations/content-types")}
//                 title="Open Content Types reference"
//               >
//                 {splitTokens(org.CONTENT_TYPES)[0] || org.CONTENT_TYPES}
//               </ClickPill>
//             ) : null}

//             {org?.SERVICES ? (
//               <ClickPill
//                 onClick={() => navigate("/participants/organizations/services")}
//                 title="Open Services reference"
//               >
//                 {splitTokens(org.SERVICES)[0] || org.SERVICES}
//               </ClickPill>
//             ) : null}

//             {org?.ORG_SIZING_CALCULATED ? <Pill>{org.ORG_SIZING_CALCULATED}</Pill> : null}
//             {org?.ADJUSTED_EMPLOYEE_COUNT ? <Pill>Employees: {org.ADJUSTED_EMPLOYEE_COUNT}</Pill> : null}
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       <div style={{ padding: "0 26px 26px" }}>
//         {error ? (
//           <div
//             style={{
//               borderRadius: 18,
//               border: `1px solid rgba(30,42,120,0.16)`,
//               background: "#FFFFFF",
//               boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
//               padding: 18,
//               fontWeight: 1000,
//               color: BRAND.ink,
//             }}
//           >
//             {error}
//           </div>
//         ) : null}

//         <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
//           {/* Left: Attributes */}
//           <Card
//             title="Participant Organization Details"
//             right={
//               <button
//                 type="button"
//                 onClick={downloadOrgJSON}
//                 disabled={!org}
//                 style={{
//                   border: `1px solid rgba(30,42,120,0.22)`,
//                   background: org ? "#FFFFFF" : "rgba(243,244,246,0.7)",
//                   color: org ? BRAND.ink : "rgba(30,42,120,0.45)",
//                   fontWeight: 1000,
//                   padding: "10px 12px",
//                   borderRadius: 14,
//                   cursor: org ? "pointer" : "not-allowed",
//                 }}
//                 title="Export this organization as JSON"
//               >
//                 Export JSON
//               </button>
//             }
//           >
//             {loading ? (
//               <div style={{ padding: 8, fontWeight: 1000, color: BRAND.ink }}>
//                 Loading organization…
//               </div>
//             ) : (
//               <div>
//                 {displayPairs.map(([k, v]) => (
//                   <KVRow
//                     key={k}
//                     k={k}
//                     v={v}
//                     isTokens={TOKEN_FIELDS.has(k)}
//                     onTokenClick={
//                       k === "ORG_FUNCTIONAL_TYPE"
//                         ? () => navigate("/participants/organizations/functional-types")
//                         : k === "CONTENT_TYPES"
//                         ? () => navigate("/participants/organizations/content-types")
//                         : k === "SERVICES"
//                         ? () => navigate("/participants/organizations/services")
//                         : k === "INFRASTRUCTURE_TOOLS"
//                         ? (t) => navigate(`/participants/organizations/infrastructure/${encodeURIComponent(t)}`)
//                         : undefined
//                     }
//                   />
//                 ))}
//               </div>
//             )}
//           </Card>

//           {/* Right: Identifiers */}
//           <div style={{ display: "grid", gap: 16 }}>
//             <Card title="Organization Identifiers" right={<Pill>{identifiers.length} rows</Pill>}>
//               {loading ? (
//                 <div style={{ padding: 8, fontWeight: 1000, color: BRAND.ink }}>
//                   Loading identifiers…
//                 </div>
//               ) : identifiers.length === 0 ? (
//                 <div
//                   style={{
//                     border: `1px dashed rgba(30,42,120,0.25)`,
//                     borderRadius: 16,
//                     padding: 14,
//                     background: "rgba(207,239,247,0.25)",
//                     color: BRAND.ink,
//                     fontWeight: 1000,
//                   }}
//                 >
//                   No identifiers found for this org.
//                 </div>
//               ) : (
//                 <div style={{ display: "grid", gap: 10 }}>
//                   {identifiers.map((it, idx) => {
//                     const domain = String(it.ORG_DOMAIN || "").trim();
//                     const externalUrl = String(it.ORG_IDENTIFIER_EXTERNAL_URL || "").trim();

//                     const domainUrl =
//                       domain && !/^https?:\/\//i.test(domain) ? `https://${domain}` : domain;

//                     return (
//                       <div
//                         key={`${domain || externalUrl || "id"}:${idx}`}
//                         style={{
//                           borderRadius: 16,
//                           border: `1px solid rgba(30,42,120,0.14)`,
//                           background: "rgba(247,251,254,0.6)",
//                           padding: 12,
//                           display: "grid",
//                           gap: 8,
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "space-between",
//                             gap: 10,
//                           }}
//                         >
//                           <div style={{ fontWeight: 1000, color: BRAND.ink, fontSize: 13 }}>
//                             {domain || "Identifier"}
//                           </div>

//                           {/* ✅ Open now goes to org domain */}
//                           {domainUrl ? (
//                             <a
//                               href={domainUrl}
//                               target="_blank"
//                               rel="noreferrer"
//                               style={{
//                                 textDecoration: "none",
//                                 fontWeight: 1000,
//                                 color: BRAND.ink,
//                                 border: `1px solid rgba(30,42,120,0.18)`,
//                                 background: "#FFFFFF",
//                                 padding: "8px 10px",
//                                 borderRadius: 12,
//                                 whiteSpace: "nowrap",
//                               }}
//                             >
//                               Open ↗
//                             </a>
//                           ) : null}
//                         </div>

//                         <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
//                           Organization Domain
//                         </div>
//                         <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
//                           {domain || <span style={{ opacity: 0.55 }}>—</span>}
//                         </div>

//                         <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
//                           Organization LinkedIn URL
//                         </div>
//                         <div
//                           style={{
//                             fontSize: 13,
//                             fontWeight: 900,
//                             color: "rgba(17,24,39,0.92)",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                           }}
//                           title={externalUrl}
//                         >
//                           {externalUrl || <span style={{ opacity: 0.55 }}>—</span>}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </Card>

//             <Card title="ACTIONS" subtitle="Quick controls">
//               <div style={{ display: "grid", gap: 10 }}>
//                 <button
//                   type="button"
//                   onClick={() => navigate("/participants/organizations")}
//                   style={{
//                     width: "100%",
//                     border: `1px solid rgba(30,42,120,0.22)`,
//                     background: "#FFFFFF",
//                     color: BRAND.ink,
//                     fontWeight: 1000,
//                     padding: "12px 12px",
//                     borderRadius: 16,
//                     cursor: "pointer",
//                   }}
//                 >
//                   ← Back to Organizations
//                 </button>

//                 <button
//                   type="button"
//                   onClick={downloadOrgJSON}
//                   disabled={!org}
//                   style={{
//                     width: "100%",
//                     border: `1px solid rgba(30,42,120,0.22)`,
//                     background: org ? BRAND.fill : "rgba(243,244,246,0.7)",
//                     color: org ? BRAND.ink : "rgba(30,42,120,0.45)",
//                     fontWeight: 1000,
//                     padding: "12px 12px",
//                     borderRadius: 16,
//                     cursor: org ? "pointer" : "not-allowed",
//                   }}
//                 >
//                   Export JSON (ME-NEXUS Schema)
//                 </button>
//               </div>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

// }


import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const base = import.meta.env.VITE_API_BASE;

// Only these are rendered as token pills (comma-separated)
const TOKEN_FIELDS = new Set([
  "SERVICES",
  "INFRASTRUCTURE_TOOLS",
  "CONTENT_TYPES",
  "GEONAME_COUNTRY_NAME",
  "SALES_REGION",
  "ORG_FUNCTIONAL_TYPE",
]);

/**
 * ✅ Change displayed field names here.
 * Any field not in this map falls back to the raw key name.
 */
const FIELD_LABELS = {
  ORG_ID: "ME-NEXUS ID",
  ORG_NAME: "Organization Name",
  GEONAME_COUNTRY_NAME: "Organization Country",
  SALES_REGION: "Organization Sales Region",
  ORG_FUNCTIONAL_TYPE: "Organization Functional Type",
  ORG_SIZING_CALCULATED: "Organization Sizing",
  ADJUSTED_EMPLOYEE_COUNT: "Organization Employee Count",
  ORG_ACTIVE_AS_OF_YEAR: "Active As Of Year",
  ORG_IS_ACTIVE: "Is Active",
  ORG_DOMAIN: "Organization Domain",
  ORG_LEGAL_FORM: "Legal Form",
  ORG_IS_ULTIMATE_PARENT: "Ultimate Parent",
  PERSONA_SCORING: "Persona Scoring",
  SERVICES: "Services",
  INFRASTRUCTURE_TOOLS: "Infrastructure",
  CONTENT_TYPES: "Content Types",

  // ✅ nicer naming for locations shown on profile
  ORG_HQ_CITY: "HQ City",
  ORG_LOCATION_CITIES: "Production Cities",
};

/**
 * ✅ Hide fields from the details panel (keep in API response).
 * You asked to hide these two:
 */
const HIDDEN_FIELDS = new Set([
  "ORG_LOCATION_SALES_REGIONS",
  "ORG_LOCATION_COUNTRIES",
  // also keep these hidden (existing behavior)
  "id",
  "identifiers",
]);

function splitTokens(cell) {
  if (!cell) return [];
  return String(cell)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatCellValue(raw) {
  if (raw === null || raw === undefined) return "";
  const s = String(raw);
  if (s === "true") return "True";
  if (s === "false") return "False";
  return s;
}

function safeFileName(name) {
  return String(name || "ORG")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

function uniqPreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = String(x || "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/**
 * ✅ Nice presentation:
 * - HQ City (single value)
 * - Production Cities (pill list)
 * - No ORG_LOCATION_COUNTRIES / ORG_LOCATION_SALES_REGIONS in details panel
 *
 * This row component supports both:
 * - standard tokens (comma lists)
 * - custom "pill list" for production cities
 */
function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ClickPill({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
        padding: "6px 10px",
        borderRadius: 999,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
      <span style={{ fontWeight: 1000, opacity: 0.7 }}>↗</span>
    </button>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid rgba(30,42,120,0.16)`,
        background: "#FFFFFF",
        boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(30,42,120,0.12)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          background:
            "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 1000,
              color: BRAND.ink,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.8 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {right}
          </div>
        ) : null}
      </div>

      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function pillList(items) {
  const toks = uniqPreserveOrder(items);
  if (toks.length === 0) return <span style={{ opacity: 0.55 }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {toks.map((t) => (
        <span
          key={t}
          style={{
            fontSize: 12,
            fontWeight: 1000,
            color: BRAND.ink,
            background: "rgba(207,239,247,0.55)",
            border: `1px solid rgba(30,42,120,0.18)`,
            padding: "6px 10px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function KVRow({ k, v, isTokens, onTokenClick, renderOverride }) {
  const label = FIELD_LABELS[k] || k;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid rgba(30,42,120,0.08)",
      }}
    >
      <div
        style={{
          fontWeight: 1000,
          color: "rgba(30,42,120,0.85)",
          fontSize: 13,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 800,
          color: "rgba(17,24,39,0.92)",
          fontSize: 13,
        }}
      >
        {renderOverride ? (
          renderOverride()
        ) : isTokens ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(() => {
              const value = formatCellValue(v);
              const tokens = splitTokens(value);
              if (tokens.length === 0) return <span style={{ opacity: 0.55 }}>—</span>;

              return tokens.map((t) =>
                onTokenClick ? (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTokenClick(t)}
                    style={{
                      border: `1px solid rgba(30,42,120,0.18)`,
                      background: "rgba(207,239,247,0.55)",
                      color: BRAND.ink,
                      fontSize: 12,
                      fontWeight: 1000,
                      padding: "6px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                    title="Open reference"
                  >
                    {t}
                  </button>
                ) : (
                  <span
                    key={t}
                    style={{
                      fontSize: 12,
                      fontWeight: 1000,
                      color: BRAND.ink,
                      background: "rgba(207,239,247,0.55)",
                      border: `1px solid rgba(30,42,120,0.18)`,
                      padding: "6px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t}
                  </span>
                )
              );
            })()}
          </div>
        ) : (() => {
            const value = formatCellValue(v);
            return value ? value : <span style={{ opacity: 0.55 }}>—</span>;
          })()}
      </div>
    </div>
  );
}

export default function OrganizationProfile() {
  const navigate = useNavigate();
  const { orgId } = useParams();

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${base}/api/orgs/${encodeURIComponent(orgId)}`, { cache: "no-store" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to load organization (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) setOrg(json);
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const identifiers = useMemo(() => org?.identifiers || [], [org]);

  const orgName = org?.ORG_NAME || "Organization";
  const meNexusId = org?.ORG_ID || orgId;

  // ✅ Build "nice locations" data from raw fields
  const hqCity = useMemo(() => {
    const v = formatCellValue(org?.ORG_HQ_CITY);
    return v || "";
  }, [org]);

  const productionCities = useMemo(() => {
    // primary source: ORG_LOCATION_CITIES (comma-separated)
    const raw = formatCellValue(org?.ORG_LOCATION_CITIES);
    const toks = splitTokens(raw);

    // optional: if backend ever sends ORG_LOCATION_CITY (singular), merge it
    const singular = formatCellValue(org?.ORG_LOCATION_CITY);
    const merged = singular ? [...toks, singular] : toks;

    return uniqPreserveOrder(merged);
  }, [org]);

  const displayPairs = useMemo(() => {
    if (!org) return [];

    const entries = Object.entries(org).filter(([k]) => !HIDDEN_FIELDS.has(k));

    // Put key fields first (and add HQ / Production Cities in a sensible spot)
    const preferred = [
      "ORG_ID",
      "ORG_NAME",
      "ORG_DOMAIN",
      "GEONAME_COUNTRY_NAME",
      "SALES_REGION",
      "ORG_HQ_CITY",
      "ORG_LOCATION_CITIES",
      "ORG_FUNCTIONAL_TYPE",
      "ORG_SIZING_CALCULATED",
      "ADJUSTED_EMPLOYEE_COUNT",
      "ORG_ACTIVE_AS_OF_YEAR",
      "ORG_IS_ACTIVE",
      "ORG_LEGAL_FORM",
      "ORG_IS_ULTIMATE_PARENT",
      "PERSONA_SCORING",
      "SERVICES",
      "INFRASTRUCTURE_TOOLS",
      "CONTENT_TYPES",
    ];

    const prefSet = new Set(preferred);

    const first = preferred
      .filter((k) => entries.some(([kk]) => kk === k))
      .map((k) => [k, org[k]]);

    const rest = entries
      .filter(([k]) => !prefSet.has(k))
      .sort((a, b) => a[0].localeCompare(b[0]));

    return [...first, ...rest];
  }, [org]);

  function downloadOrgJSON() {
    if (!org) return;

    const payload = { ...org, ORG_ID: String(org.ORG_ID ?? meNexusId) };

    const fileName = `${safeFileName(org.ORG_NAME || "ORG")}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 26px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                border: "none",
                background: BRAND.fill,
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 14px",
                borderRadius: 14,
                cursor: "pointer",
                letterSpacing: 0.2,
                boxShadow: "0 8px 28px rgba(30,42,120,0.12)",
              }}
            >
              ME-NEXUS
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Participants
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants/organizations")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Organizations
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Profile</span>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 10 }}>
              <Pill>ME-NEXUS ID: {meNexusId}</Pill>
              {org?.GEONAME_COUNTRY_NAME ? (
                <Pill>{splitTokens(org.GEONAME_COUNTRY_NAME)[0] || org.GEONAME_COUNTRY_NAME}</Pill>
              ) : null}
              {hqCity ? <Pill>HQ: {hqCity}</Pill> : null}
              {productionCities.length ? <Pill>Production Cities: {productionCities.length}</Pill> : null}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => navigate("/participants/organizations/schema")}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Schema Information
            </button>

            <a
              href="https://me-dmz.com"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: BRAND.ink,
                fontWeight: 1000,
                opacity: 0.9,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
              }}
            >
              ME-DMZ ↗
            </a>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 1000,
              letterSpacing: 0.2,
              color: "#0B0F1A",
            }}
          >
            {loading ? "Loading…" : orgName}
          </div>

          {/* Quick taxonomy pills */}
          <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {org?.SALES_REGION ? <Pill>{splitTokens(org.SALES_REGION)[0] || org.SALES_REGION}</Pill> : null}

            {org?.ORG_FUNCTIONAL_TYPE ? (
              <ClickPill
                onClick={() => navigate("/participants/organizations/functional-types")}
                title="Open Functional Types reference"
              >
                {splitTokens(org.ORG_FUNCTIONAL_TYPE)[0] || org.ORG_FUNCTIONAL_TYPE}
              </ClickPill>
            ) : null}

            {org?.CONTENT_TYPES ? (
              <ClickPill
                onClick={() => navigate("/participants/organizations/content-types")}
                title="Open Content Types reference"
              >
                {splitTokens(org.CONTENT_TYPES)[0] || org.CONTENT_TYPES}
              </ClickPill>
            ) : null}

            {org?.SERVICES ? (
              <ClickPill
                onClick={() => navigate("/participants/organizations/services")}
                title="Open Services reference"
              >
                {splitTokens(org.SERVICES)[0] || org.SERVICES}
              </ClickPill>
            ) : null}

            {org?.ORG_SIZING_CALCULATED ? <Pill>{org.ORG_SIZING_CALCULATED}</Pill> : null}
            {org?.ADJUSTED_EMPLOYEE_COUNT ? <Pill>Employees: {org.ADJUSTED_EMPLOYEE_COUNT}</Pill> : null}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 26px 26px" }}>
        {error ? (
          <div
            style={{
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.16)`,
              background: "#FFFFFF",
              boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
              padding: 18,
              fontWeight: 1000,
              color: BRAND.ink,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
          {/* Left: Attributes */}
          <Card
            title="Participant Organization Details"
            right={
              <button
                type="button"
                onClick={downloadOrgJSON}
                disabled={!org}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: org ? "#FFFFFF" : "rgba(243,244,246,0.7)",
                  color: org ? BRAND.ink : "rgba(30,42,120,0.45)",
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: org ? "pointer" : "not-allowed",
                }}
                title="Export this organization as JSON"
              >
                Export JSON
              </button>
            }
          >
            {loading ? (
              <div style={{ padding: 8, fontWeight: 1000, color: BRAND.ink }}>
                Loading organization…
              </div>
            ) : (
              <div>
                {displayPairs.map(([k, v]) => {
                  // ✅ custom presentation for HQ / Production Cities
                  if (k === "ORG_HQ_CITY") {
                    return (
                      <KVRow
                        key={k}
                        k={k}
                        v={v}
                        isTokens={false}
                        renderOverride={() => {
                          const val = formatCellValue(v);
                          return val ? (
                            <span style={{ fontWeight: 1000 }}>{val}</span>
                          ) : (
                            <span style={{ opacity: 0.55 }}>—</span>
                          );
                        }}
                      />
                    );
                  }

                  if (k === "ORG_LOCATION_CITIES") {
                    return (
                      <KVRow
                        key={k}
                        k={k}
                        v={v}
                        isTokens={false}
                        renderOverride={() => pillList(splitTokens(formatCellValue(v)))}
                      />
                    );
                  }

                  return (
                    <KVRow
                      key={k}
                      k={k}
                      v={v}
                      isTokens={TOKEN_FIELDS.has(k)}
                      onTokenClick={
                        k === "ORG_FUNCTIONAL_TYPE"
                          ? () => navigate("/participants/organizations/functional-types")
                          : k === "CONTENT_TYPES"
                          ? () => navigate("/participants/organizations/content-types")
                          : k === "SERVICES"
                          ? () => navigate("/participants/organizations/services")
                          : k === "INFRASTRUCTURE_TOOLS"
                          ? (t) => navigate(`/participants/organizations/infrastructure/${encodeURIComponent(t)}`)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right: Identifiers */}
          <div style={{ display: "grid", gap: 16 }}>
            <Card title="Organization Identifiers" right={<Pill>{identifiers.length} rows</Pill>}>
              {loading ? (
                <div style={{ padding: 8, fontWeight: 1000, color: BRAND.ink }}>
                  Loading identifiers…
                </div>
              ) : identifiers.length === 0 ? (
                <div
                  style={{
                    border: `1px dashed rgba(30,42,120,0.25)`,
                    borderRadius: 16,
                    padding: 14,
                    background: "rgba(207,239,247,0.25)",
                    color: BRAND.ink,
                    fontWeight: 1000,
                  }}
                >
                  No identifiers found for this org.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {identifiers.map((it, idx) => {
                    const domain = String(it.ORG_DOMAIN || "").trim();
                    const externalUrl = String(it.ORG_IDENTIFIER_EXTERNAL_URL || "").trim();

                    const domainUrl =
                      domain && !/^https?:\/\//i.test(domain) ? `https://${domain}` : domain;

                    return (
                      <div
                        key={`${domain || externalUrl || "id"}:${idx}`}
                        style={{
                          borderRadius: 16,
                          border: `1px solid rgba(30,42,120,0.14)`,
                          background: "rgba(247,251,254,0.6)",
                          padding: 12,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={{ fontWeight: 1000, color: BRAND.ink, fontSize: 13 }}>
                            {domain || "Identifier"}
                          </div>

                          {domainUrl ? (
                            <a
                              href={domainUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                textDecoration: "none",
                                fontWeight: 1000,
                                color: BRAND.ink,
                                border: `1px solid rgba(30,42,120,0.18)`,
                                background: "#FFFFFF",
                                padding: "8px 10px",
                                borderRadius: 12,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Open ↗
                            </a>
                          ) : null}
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                          Organization Domain
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                          {domain || <span style={{ opacity: 0.55 }}>—</span>}
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                          Organization LinkedIn URL
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: "rgba(17,24,39,0.92)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={externalUrl}
                        >
                          {externalUrl || <span style={{ opacity: 0.55 }}>—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="ACTIONS" subtitle="Quick controls">
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => navigate("/participants/organizations")}
                  style={{
                    width: "100%",
                    border: `1px solid rgba(30,42,120,0.22)`,
                    background: "#FFFFFF",
                    color: BRAND.ink,
                    fontWeight: 1000,
                    padding: "12px 12px",
                    borderRadius: 16,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Organizations
                </button>

                <button
                  type="button"
                  onClick={downloadOrgJSON}
                  disabled={!org}
                  style={{
                    width: "100%",
                    border: `1px solid rgba(30,42,120,0.22)`,
                    background: org ? BRAND.fill : "rgba(243,244,246,0.7)",
                    color: org ? BRAND.ink : "rgba(30,42,120,0.45)",
                    fontWeight: 1000,
                    padding: "12px 12px",
                    borderRadius: 16,
                    cursor: org ? "pointer" : "not-allowed",
                  }}
                >
                  Export JSON (ME-NEXUS Schema)
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
