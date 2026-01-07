// // import React, { useEffect, useMemo, useState } from "react";
// // import { useNavigate } from "react-router-dom";
// // import InsightsShell from "../components/insights/InsightsShell";
// // import { StatCard, Card, CardGrid, TwoCol, Pill, Divider } from "../components/insights/Cards";
// // import BarChart from "../components/insights/BarChart";
// // import DonutChart from "../components/insights/DonutChart";
// // import PaginatedOrgTable from "../components/insights/PaginatedOrgTable";


// // const ICONS = {
// //   orgs: "🏢",
// //   people: "👥",
// //   avg: "📊",
// //   focus: "🎯",
// //   map: "🗺️",
// //   globe: "🌍",
// // };

// // function asXY(list, xKeyName, yKeyName) {
// //   return (list || []).map((d) => ({
// //     [xKeyName]: d?.label ?? "",
// //     [yKeyName]: Number(d?.value) || 0,
// //   }));
// // }

// // function pct(part, total) {
// //   if (!total) return 0;
// //   return (part / total) * 100;
// // }

// // function top1Share(list) {
// //   const first = Number((list || [])[0]?.value || 0);
// //   const total = (list || []).reduce((s, x) => s + (Number(x?.value) || 0), 0);
// //   return { first, total, share: pct(first, total) };
// // }

// // function withOtherExclusive(list, total, topN, otherLabel) {
// //   const safe = (list || []).filter((x) => Number(x?.value) > 0);
// //   const top = safe.slice(0, topN);
// //   const sumTop = top.reduce((s, x) => s + (Number(x?.value) || 0), 0);
// //   const remainder = Math.max(0, (Number(total) || 0) - sumTop);
// //   return remainder > 0 ? [...top, { label: otherLabel, value: remainder }] : top;
// // }

// // function safeHTML(s) {
// //   return String(s ?? "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// // }

// // export default function OrgInsights() {
// //   const nav = useNavigate();
// //   const [data, setData] = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     let alive = true;

// //     fetch("/api/insights/orgs/scripted-top100")
// //       .then((r) => r.json())
// //       .then((d) => {
// //         if (!alive) return;
// //         setData(d);
// //         setLoading(false);
// //       })
// //       .catch(() => {
// //         if (!alive) return;
// //         setLoading(false);
// //       });

// //     return () => {
// //       alive = false;
// //     };
// //   }, []);

// //   const topOrgs = data?.top || [];
// //   const byCountryFootprint = data?.byCountryFootprint || [];
// //   const byCountryHQRaw = data?.byCountryHQ || [];
// //   const byRegionRaw = data?.byRegion || [];
// //   const byCityFootprint = data?.byCityFootprint || [];

// //   const topServicesRaw = data?.topServices || [];
// //   const topInfrasRaw = data?.topInfras || [];

// //   const stats = useMemo(() => {
// //     const totalOrgs = topOrgs.length;
// //     const totalAdjEmp = topOrgs.reduce((s, o) => s + (Number(o?.ADJUSTED_EMPLOYEE_COUNT) || 0), 0);
// //     const avgAdjEmp = totalOrgs ? Math.round(totalAdjEmp / totalOrgs) : 0;

// //     const countriesHQ = new Set(topOrgs.map((o) => o?.GEONAME_COUNTRY_NAME).filter(Boolean));
// //     const regions = new Set(topOrgs.map((o) => o?.SALES_REGION).filter(Boolean));

// //     return {
// //       totalOrgs,
// //       totalAdjEmp,
// //       avgAdjEmp,
// //       countryCount: countriesHQ.size,
// //       regionCount: regions.size,
// //     };
// //   }, [topOrgs]);

// //   /**
// //    * HQ distribution must be exclusive and sum to cohort size.
// //    * If server has missing HQ, represent them as "HQ unknown".
// //    */
// //   const byCountryHQExclusive = useMemo(() => {
// //     const list = (byCountryHQRaw || []).filter((x) => Number(x?.value) > 0);
// //     const known = list.reduce((s, x) => s + (Number(x?.value) || 0), 0);
// //     const unknown = Math.max(0, (stats.totalOrgs || 0) - known);
// //     if (unknown > 0) return [...list, { label: "Other", value: unknown }];
// //     return list;
// //   }, [byCountryHQRaw, stats.totalOrgs]);

// //   const countryConc = useMemo(() => top1Share(byCountryHQExclusive), [byCountryHQExclusive]);
// //   const regionConc = useMemo(() => top1Share(byRegionRaw), [byRegionRaw]);

// //   // Visual datasets
// //   const topCountriesRank = useMemo(
// //     () => asXY(byCountryFootprint, "country", "count").slice(0, 16),
// //     [byCountryFootprint]
// //   );

// //   // Make region donut exclusive and tidy: top 4 + "Other regions"
// //   const topRegionsDonut = useMemo(
// //     () => withOtherExclusive(byRegionRaw || [], stats.totalOrgs, 4, "Other regions"),
// //     [byRegionRaw, stats.totalOrgs]
// //   );

// //   // HQ country donut: top 7 + "Other" (exclusive), plus "HQ unknown" if present (kept explicit)
// //   const topCountriesDonut = useMemo(() => {
// //     const total = stats.totalOrgs || 0;
// //     const unknownRow = byCountryHQExclusive.find((x) => x?.label === "HQ unknown");
// //     const unknownVal = Number(unknownRow?.value || 0);

// //     const withoutUnknown = byCountryHQExclusive.filter((x) => x?.label !== "HQ unknown");
// //     const top7 = withoutUnknown.slice(0, 7);
// //     const top7Sum = top7.reduce((s, x) => s + (Number(x?.value) || 0), 0);

// //     const remainder = Math.max(0, total - top7Sum - unknownVal);

// //     const out = [...top7];
// //     if (remainder > 0) out.push({ label: "Other", value: remainder });
// //     if (unknownVal > 0) out.push({ label: "HQ unknown", value: unknownVal });

// //     return out;
// //   }, [byCountryHQExclusive, stats.totalOrgs]);

// //   // Keep one bar chart for ranked categories; avoid repetitive 3+ bars by making infra a compact list.
// //   const servicesRank = useMemo(
// //     () => asXY(topServicesRaw, "service", "count").slice(0, 16),
// //     [topServicesRaw]
// //   );

// //   const topInfraList = useMemo(
// //     () => (topInfrasRaw || []).slice(0, 16),
// //     [topInfrasRaw]
// //   );

// //   const topCitiesList = useMemo(
// //     () => (byCityFootprint || []).filter((x) => x?.label && x.label !== "Unknown").slice(0, 30),
// //     [byCityFootprint]
// //   );

// //   const coverage = useMemo(() => {
// //     const cohort = stats.totalOrgs || 0;
// //     const topService = topServicesRaw?.[0];
// //     const topTool = topInfrasRaw?.[0];

// //     const topServicePct = cohort ? pct(Number(topService?.value || 0), cohort) : 0;
// //     const topToolPct = cohort ? pct(Number(topTool?.value || 0), cohort) : 0;

// //     return {
// //       topServiceLabel: topService?.label,
// //       topServicePct,
// //       topToolLabel: topTool?.label,
// //       topToolPct,
// //     };
// //   }, [stats.totalOrgs, topServicesRaw, topInfrasRaw]);

// //   const notableSignals = useMemo(() => {
// //     if (!data) return [];
// //     const notes = [];

// //     const topCountry = byCountryHQExclusive?.[0]?.label;
// //     const topRegion = byRegionRaw?.[0]?.label;

// //     if (topCountry) notes.push(`Largest HQ concentration is in **${topCountry}** (${countryConc.share.toFixed(0)}% of the cohort).`);
// //     if (topRegion) notes.push(`Cohort clusters most in **${topRegion}** (${regionConc.share.toFixed(0)}% of the cohort).`);

// //     if (coverage.topServiceLabel) notes.push(`Most common service: **${coverage.topServiceLabel}** (coverage ~${coverage.topServicePct.toFixed(0)}%).`);
// //     if (coverage.topToolLabel) notes.push(`Most prevalent infra tool: **${coverage.topToolLabel}** (coverage ~${coverage.topToolPct.toFixed(0)}%).`);

// //     const unknownHQ = Number(byCountryHQExclusive.find((x) => x?.label === "HQ unknown")?.value || 0);
// //     if (unknownHQ > 0) notes.push(`HQ country is missing for **${unknownHQ} orgs** — shown as **HQ unknown** in the donut.`);

// //     notes.push(`Representation: **${stats.countryCount} HQ countries** across 4 sales regions in this cohort.`);

// //     return notes.slice(0, 8);
// //   }, [
// //     data,
// //     byCountryHQExclusive,
// //     byRegionRaw,
// //     countryConc.share,
// //     regionConc.share,
// //     coverage.topServiceLabel,
// //     coverage.topServicePct,
// //     coverage.topToolLabel,
// //     coverage.topToolPct,
// //     stats.countryCount,
// //   ]);

// //   function goToOrgsWithCity(city) {
// //     const qs = new URLSearchParams();
// //     qs.set("locationScope", "all");
// //     qs.set("CITY", city);
// //     nav(`/participants/organizations?${qs.toString()}`);
// //   }

// //   return (
// //     <InsightsShell
// //       title="Org Insights"
// //       subtitle='Lens: Organizations with headcounts of more than 10,000 employees.'
// //       active="orgs"
// //     >
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -6, marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
// //         <button
// //           onClick={() => nav("/participants/organizations")}
// //           style={{
// //             border: "1px solid rgba(30,42,120,0.18)",
// //             background: "rgba(255,255,255,0.85)",
// //             borderRadius: 999,
// //             padding: "10px 14px",
// //             fontWeight: 950,
// //             cursor: "pointer",
// //             boxShadow: "0 10px 24px rgba(17,24,39,0.10)",
// //           }}
// //         >
// //           ← Back to Orgs
// //         </button>

// //         <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
// //           <Pill tone="brand">Mega cohort</Pill>
// //           <Pill tone="neutral">{stats.totalOrgs || 0} orgs</Pill>
// //         </div>
// //       </div>

// //       {/* KPIs */}
// //       <CardGrid min={230}>
// //         <StatCard label="Organizations" value={stats.totalOrgs} sublabel="Mega org cohort" icon={<span>{ICONS.orgs}</span>} loading={loading} />
// //         <StatCard label="Countries represented" value={stats.countryCount} sublabel="HQ Breadth" icon={<span>{ICONS.globe}</span>} loading={loading} />
// //         <StatCard label="Regions represented" value={4} sublabel="Sales regions" icon={<span>{ICONS.map}</span>} loading={loading} />
// //         <StatCard label="Total employees" value={stats.totalAdjEmp} compact icon={<span>{ICONS.people}</span>} loading={loading} />
// //         <StatCard label="Avg org size" value={stats.avgAdjEmp} sublabel="Adjusted employees" icon={<span>{ICONS.avg}</span>} loading={loading} />
// //         <StatCard label="Top HQ Country share (%)" value={countryConc.share} sublabel={byCountryHQExclusive?.[0]?.label || "Concentration"} icon={<span>{ICONS.focus}</span>} loading={loading} />
// //         <StatCard label="Top Region share (%)" value={regionConc.share} sublabel={byRegionRaw?.[0]?.label || "Concentration"} icon={<span>{ICONS.focus}</span>} loading={loading} />
// //       </CardGrid>

// //       <Divider style={{ margin: "18px 0" }} />

// //       {/* Signals */}
// //       <Card title="Notable signals" subtitle="Auto-generated takeaways from the Insight Orgs cohort" right={<Pill tone="brand">Summary</Pill>}>
// //         {loading ? (
// //           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
// //         ) : (
// //           <div style={{ display: "grid", gap: 10 }}>
// //             {notableSignals.map((s, i) => (
// //               <div
// //                 key={`sig_${i}`}
// //                 style={{
// //                   padding: "12px 14px",
// //                   borderRadius: 16,
// //                   border: "1px solid rgba(30,42,120,0.10)",
// //                   background: "rgba(255,255,255,0.65)",
// //                   lineHeight: 1.55,
// //                   fontSize: 14,
// //                   fontWeight: 850,
// //                 }}
// //                 dangerouslySetInnerHTML={{ __html: safeHTML(s) }}
// //               />
// //             ))}
// //           </div>
// //         )}
// //       </Card>

// //       <Divider style={{ margin: "18px 0" }} />

// //       {/* Geography visuals */}
// //       <Card title="Top countries (footprint)" subtitle="Org incidence within the cohort (counts an org once per country it operates in)" right={<Pill>Orgs</Pill>}>
// //         <BarChart
// //           data={topCountriesRank}
// //           xKey="country"
// //           yKey="count"
// //           height={720}
// //           orientation="horizontal"
// //           emptyLabel={loading ? "Loading…" : "No country data"}
// //         />
// //       </Card>

// //       {/* Make both donuts identical visual size by forcing the SAME height */}
// //       <TwoCol
// //         left={
// //           <Card title="Sales regions" subtitle="Exclusive share of orgs by region" right={<Pill>Share</Pill>}>
// //             <DonutChart data={topRegionsDonut} height={520} centerLabel="Orgs" />
// //           </Card>
// //         }
// //         right={
// //           <Card title="HQ country share (Top 8)" subtitle="Exclusive HQ distribution (includes HQ unknown)" right={<Pill tone="neutral">Share</Pill>}>
// //             <DonutChart data={topCountriesDonut} height={520} centerLabel="Orgs" />
// //           </Card>
// //         }
// //       />

// //       <Divider style={{ margin: "18px 0" }} />

// //       {/* Production cities (tags, not another bar chart) */}
// //       <Card
// //         title="Top production cities"
// //         subtitle="Footprint cities across all locations (click a city to filter Orgs page)"
// //         right={<Pill tone="neutral">Click to filter</Pill>}
// //       >
// //         {loading ? (
// //           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
// //         ) : (
// //           <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
// //             {topCitiesList.map((c) => (
// //               <button
// //                 key={`city_${c.label}`}
// //                 onClick={() => goToOrgsWithCity(c.label)}
// //                 style={{
// //                   border: "1px solid rgba(30,42,120,0.16)",
// //                   background: "rgba(255,255,255,0.78)",
// //                   borderRadius: 999,
// //                   padding: "8px 12px",
// //                   cursor: "pointer",
// //                   fontWeight: 900,
// //                   boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
// //                 }}
// //                 title="Open Orgs page with Production City filter"
// //               >
// //                 {c.label} <span style={{ opacity: 0.7, marginLeft: 6 }}>({Number(c.value) || 0})</span>
// //               </button>
// //             ))}
// //           </div>
// //         )}
// //       </Card>

// //       <Divider style={{ margin: "18px 0" }} />

// //       {/* Ranked charts */}
// //       <Card title="Top services" subtitle="Incidence among Insight Orgs" right={<Pill>Orgs</Pill>}>
// //         <BarChart
// //           data={servicesRank}
// //           xKey="service"
// //           yKey="count"
// //           height={720}
// //           orientation="horizontal"
// //           emptyLabel={loading ? "Loading…" : "No service data"}
// //         />
// //       </Card>

// //       {/* Avoid 3rd repetitive bar: show infra as a compact list */}
// //       <Card title="Top infrastructure" subtitle="Tool incidence among Insight Orgs" right={<Pill tone="neutral">Orgs</Pill>}>
// //         {loading ? (
// //           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
// //         ) : (
// //           <div style={{ display: "grid", gap: 10 }}>
// //             {topInfraList.map((x, i) => (
// //               <div
// //                 key={`infra_${x.label}_${i}`}
// //                 style={{
// //                   display: "grid",
// //                   gridTemplateColumns: "1fr auto",
// //                   gap: 12,
// //                   alignItems: "center",
// //                   padding: "12px 14px",
// //                   borderRadius: 16,
// //                   border: "1px solid rgba(30,42,120,0.12)",
// //                   background: "rgba(255,255,255,0.70)",
// //                   fontWeight: 900,
// //                 }}
// //               >
// //                 <div style={{ fontSize: 14, lineHeight: 1.2 }}>{x.label}</div>
// //                 <div style={{ fontSize: 14, opacity: 0.85 }}>{Number(x.value) || 0}</div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </Card>

// //       <Divider style={{ margin: "18px 0" }} />

// //       {/* Cohort list */}
// //       <Card title="Insight Orgs" subtitle="All organizations with headcounts more than 10,000 employees" right={<Pill tone="neutral">Search + paginate</Pill>}>
// //         <PaginatedOrgTable
// //           baseFilters={{ ORG_SIZING_CALCULATED: "10001-None" }}
// //           title="Cohort Organizations"
// //           subtitle="Click an org name to open details."
// //         />
// //       </Card>
// //     </InsightsShell>
// //   );
// // }

// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import InsightsShell from "../components/insights/InsightsShell";
// import { StatCard, Card, CardGrid, TwoCol, Pill, Divider } from "../components/insights/Cards";
// import BarChart from "../components/insights/BarChart";
// import DonutChart from "../components/insights/DonutChart";
// import PaginatedOrgTable from "../components/insights/PaginatedOrgTable";

// const ICONS = {
//   orgs: "🏢",
//   people: "👥",
//   avg: "📊",
//   focus: "🎯",
//   map: "🗺️",
//   globe: "🌍",
//   bolt: "⚡",
//   stack: "🧱",
//   network: "🕸️",
//   time: "⏳",
//   trophy: "🏆",
// };

// function asXY(list, xKeyName, yKeyName) {
//   return (list || []).map((d) => ({
//     [xKeyName]: d?.label ?? d?.name ?? "",
//     [yKeyName]: Number(d?.value ?? d?.count ?? 0) || 0,
//   }));
// }

// function pct(part, total) {
//   if (!total) return 0;
//   return (part / total) * 100;
// }

// function top1Share(list) {
//   const first = Number((list || [])[0]?.value || 0);
//   const total = (list || []).reduce((s, x) => s + (Number(x?.value) || 0), 0);
//   return { first, total, share: pct(first, total) };
// }

// function withOtherExclusive(list, total, topN, otherLabel) {
//   const safe = (list || []).filter((x) => Number(x?.value) > 0);
//   const top = safe.slice(0, topN);
//   const sumTop = top.reduce((s, x) => s + (Number(x?.value) || 0), 0);
//   const remainder = Math.max(0, (Number(total) || 0) - sumTop);
//   return remainder > 0 ? [...top, { label: otherLabel, value: remainder }] : top;
// }

// function safeHTML(s) {
//   return String(s ?? "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
// }

// function fmtPct(x) {
//   const n = Number(x);
//   if (!Number.isFinite(n)) return "0%";
//   return `${n.toFixed(0)}%`;
// }

// function fmtNum(x) {
//   const n = Number(x);
//   if (!Number.isFinite(n)) return "0";
//   return n.toLocaleString();
// }

// function RankList({ items = [], emptyLabel = "No data", onClickItem }) {
//   if (!items?.length) return <div style={{ fontWeight: 850, opacity: 0.75 }}>{emptyLabel}</div>;
//   return (
//     <div style={{ display: "grid", gap: 10 }}>
//       {items.map((x, i) => (
//         <div
//           key={`${x.label || x.name || "item"}_${i}`}
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr auto",
//             gap: 12,
//             alignItems: "center",
//             padding: "12px 14px",
//             borderRadius: 16,
//             border: "1px solid rgba(30,42,120,0.12)",
//             background: "rgba(255,255,255,0.70)",
//             fontWeight: 900,
//             cursor: onClickItem ? "pointer" : "default",
//           }}
//           onClick={() => onClickItem?.(x)}
//           title={onClickItem ? "Click" : undefined}
//         >
//           <div style={{ fontSize: 14, lineHeight: 1.2 }}>{x.label ?? x.name ?? ""}</div>
//           <div style={{ fontSize: 14, opacity: 0.85 }}>{fmtNum(x.value ?? x.count ?? 0)}</div>
//         </div>
//       ))}
//     </div>
//   );
// }

// function TableList({ rows = [], emptyLabel = "No data" }) {
//   if (!rows?.length) return <div style={{ fontWeight: 850, opacity: 0.75 }}>{emptyLabel}</div>;
//   return (
//     <div style={{ display: "grid", gap: 10 }}>
//       {rows.map((r, i) => (
//         <div
//           key={`row_${i}`}
//           style={{
//             padding: "12px 14px",
//             borderRadius: 16,
//             border: "1px solid rgba(30,42,120,0.10)",
//             background: "rgba(255,255,255,0.65)",
//             lineHeight: 1.5,
//             fontSize: 13,
//             fontWeight: 850,
//           }}
//           dangerouslySetInnerHTML={{ __html: safeHTML(r) }}
//         />
//       ))}
//     </div>
//   );
// }

// export default function OrgInsights() {
//   const nav = useNavigate();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let alive = true;

//     // New unified mega-org insights endpoint (keeps existing data + adds more)
//     fetch("/api/insights/orgs/mega")
//       .then((r) => r.json())
//       .then((d) => {
//         if (!alive) return;
//         setData(d);
//         setLoading(false);
//       })
//       .catch(() => {
//         if (!alive) return;
//         setLoading(false);
//       });

//     return () => {
//       alive = false;
//     };
//   }, []);

//   // ---------- Back-compat defaults ----------
//   const topOrgs = data?.top || [];
//   const byCountryFootprint = data?.byCountryFootprint || [];
//   const byCountryHQRaw = data?.byCountryHQ || [];
//   const byRegionRaw = data?.byRegion || [];
//   const byCityFootprint = data?.byCityFootprint || [];
//   const topServicesRaw = data?.topServices || [];
//   const topInfrasRaw = data?.topInfras || [];

//   // ---------- NEW datasets ----------
//   const totals = data?.totals || {};
//   const concentration = data?.concentration || {};
//   const depth = data?.depth || {};
//   const complexity = data?.complexity || {};
//   const maturity = data?.maturity || {};
//   const indices = data?.indices || {};
//   const specializations = data?.specializations || {};
//   const correlations = data?.correlations || {};

//   const stats = useMemo(() => {
//     const totalOrgs = topOrgs.length;
//     const totalAdjEmp = topOrgs.reduce((s, o) => s + (Number(o?.ADJUSTED_EMPLOYEE_COUNT) || 0), 0);
//     const avgAdjEmp = totalOrgs ? Math.round(totalAdjEmp / totalOrgs) : 0;

//     const countriesHQ = new Set(topOrgs.map((o) => o?.GEONAME_COUNTRY_NAME).filter(Boolean));
//     const regions = new Set(topOrgs.map((o) => o?.SALES_REGION_PRIMARY || o?.SALES_REGION).filter(Boolean));

//     return {
//       totalOrgs,
//       totalAdjEmp,
//       avgAdjEmp,
//       countryCount: countriesHQ.size,
//       regionCount: regions.size,
//     };
//   }, [topOrgs]);

//   /**
//    * HQ distribution must be exclusive and sum to cohort size.
//    * If server has missing HQ, represent them as "HQ unknown".
//    */
//   const byCountryHQExclusive = useMemo(() => {
//     const list = (byCountryHQRaw || []).filter((x) => Number(x?.value) > 0);
//     const known = list.reduce((s, x) => s + (Number(x?.value) || 0), 0);
//     const unknown = Math.max(0, (stats.totalOrgs || 0) - known);
//     if (unknown > 0) return [...list, { label: "Other", value: unknown }];
//     return list;
//   }, [byCountryHQRaw, stats.totalOrgs]);

//   const countryConc = useMemo(() => top1Share(byCountryHQExclusive), [byCountryHQExclusive]);
//   const regionConc = useMemo(() => top1Share(byRegionRaw), [byRegionRaw]);

//   // Visual datasets (existing)
//   const topCountriesRank = useMemo(
//     () => asXY(byCountryFootprint, "country", "count").slice(0, 16),
//     [byCountryFootprint]
//   );

//   const topRegionsDonut = useMemo(
//     () => withOtherExclusive(byRegionRaw || [], stats.totalOrgs, 4, "Other regions"),
//     [byRegionRaw, stats.totalOrgs]
//   );

//   const topCountriesDonut = useMemo(() => {
//     const total = stats.totalOrgs || 0;
//     const unknownRow = byCountryHQExclusive.find((x) => x?.label === "HQ unknown");
//     const unknownVal = Number(unknownRow?.value || 0);

//     const withoutUnknown = byCountryHQExclusive.filter((x) => x?.label !== "HQ unknown");
//     const top7 = withoutUnknown.slice(0, 7);
//     const top7Sum = top7.reduce((s, x) => s + (Number(x?.value) || 0), 0);

//     const remainder = Math.max(0, total - top7Sum - unknownVal);

//     const out = [...top7];
//     if (remainder > 0) out.push({ label: "Other", value: remainder });
//     if (unknownVal > 0) out.push({ label: "HQ unknown", value: unknownVal });

//     return out;
//   }, [byCountryHQExclusive, stats.totalOrgs]);

//   const servicesRank = useMemo(
//     () => asXY(topServicesRaw, "service", "count").slice(0, 16),
//     [topServicesRaw]
//   );

//   const topInfraList = useMemo(() => (topInfrasRaw || []).slice(0, 16), [topInfrasRaw]);

//   const topCitiesList = useMemo(
//     () => (byCityFootprint || []).filter((x) => x?.label && x.label !== "Unknown").slice(0, 30),
//     [byCityFootprint]
//   );

//   const coverage = useMemo(() => {
//     const cohort = stats.totalOrgs || 0;
//     const topService = topServicesRaw?.[0];
//     const topTool = topInfrasRaw?.[0];

//     const topServicePct = cohort ? pct(Number(topService?.value || 0), cohort) : 0;
//     const topToolPct = cohort ? pct(Number(topTool?.value || 0), cohort) : 0;

//     return {
//       topServiceLabel: topService?.label,
//       topServicePct,
//       topToolLabel: topTool?.label,
//       topToolPct,
//     };
//   }, [stats.totalOrgs, topServicesRaw, topInfrasRaw]);

//   const notableSignals = useMemo(() => {
//     if (!data) return [];
//     const notes = [];

//     const topCountry = byCountryHQExclusive?.[0]?.label;
//     const topRegion = byRegionRaw?.[0]?.label;

//     if (topCountry) notes.push(`Largest HQ concentration is in **${topCountry}** (${countryConc.share.toFixed(0)}% of the cohort).`);
//     if (topRegion) notes.push(`Cohort clusters most in **${topRegion}** (${regionConc.share.toFixed(0)}% of the cohort).`);

//     if (coverage.topServiceLabel) notes.push(`Most common service: **${coverage.topServiceLabel}** (coverage ~${coverage.topServicePct.toFixed(0)}%).`);
//     if (coverage.topToolLabel) notes.push(`Most prevalent infra tool: **${coverage.topToolLabel}** (coverage ~${coverage.topToolPct.toFixed(0)}%).`);

//     const unknownHQ = Number(byCountryHQExclusive.find((x) => x?.label === "HQ unknown")?.value || 0);
//     if (unknownHQ > 0) notes.push(`HQ country is missing for **${unknownHQ} orgs** — shown as **HQ unknown** in the donut.`);

//     if (Number(concentration?.top10EmpSharePct) > 0) {
//       notes.push(`Power concentration: top 10 orgs account for **${concentration.top10EmpSharePct.toFixed(0)}%** of total cohort headcount.`);
//     }
//     if (Number(depth?.servicesMedian) > 0) {
//       notes.push(`Median capability breadth: **${depth.servicesMedian} services** and **${depth.infrasMedian} infra tools** per org.`);
//     }
//     if (Number(complexity?.multiCountryPct) >= 0) {
//       notes.push(`Global footprint: **${complexity.multiCountryPct.toFixed(0)}%** of orgs operate in multiple countries (from production locations).`);
//     }

//     notes.push(`Representation: **${stats.countryCount} HQ countries** across 4 sales regions in this cohort.`);

//     return notes.slice(0, 10);
//   }, [
//     data,
//     byCountryHQExclusive,
//     byRegionRaw,
//     countryConc.share,
//     regionConc.share,
//     coverage.topServiceLabel,
//     coverage.topServicePct,
//     coverage.topToolLabel,
//     coverage.topToolPct,
//     stats.countryCount,
//     concentration?.top10EmpSharePct,
//     depth?.servicesMedian,
//     depth?.infrasMedian,
//     complexity?.multiCountryPct,
//   ]);

//   function goToOrgsWithCity(city) {
//     const qs = new URLSearchParams();
//     qs.set("locationScope", "all");
//     qs.set("CITY", city);
//     nav(`/participants/organizations?${qs.toString()}`);
//   }

//   return (
//     <InsightsShell
//       title="Org Insights"
//       subtitle='Lens: Organizations with headcounts of more than 10,000 employees.'
//       active="orgs"
//     >
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -6, marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
//         <button
//           onClick={() => nav("/participants/organizations")}
//           style={{
//             border: "1px solid rgba(30,42,120,0.18)",
//             background: "rgba(255,255,255,0.85)",
//             borderRadius: 999,
//             padding: "10px 14px",
//             fontWeight: 950,
//             cursor: "pointer",
//             boxShadow: "0 10px 24px rgba(17,24,39,0.10)",
//           }}
//         >
//           ← Back to Orgs
//         </button>

//         <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
//           <Pill tone="brand">Mega cohort</Pill>
//           <Pill tone="neutral">{stats.totalOrgs || 0} orgs</Pill>
//         </div>
//       </div>

//       {/* KPIs (expanded) */}
//       <CardGrid min={230}>
//         <StatCard label="Organizations" value={stats.totalOrgs} sublabel="Mega org cohort" icon={<span>{ICONS.orgs}</span>} loading={loading} />
//         <StatCard label="Countries represented" value={stats.countryCount} sublabel="HQ Breadth" icon={<span>{ICONS.globe}</span>} loading={loading} />
//         <StatCard label="Regions represented" value={4} sublabel="Sales regions" icon={<span>{ICONS.map}</span>} loading={loading} />
//         <StatCard label="Total employees" value={stats.totalAdjEmp} compact icon={<span>{ICONS.people}</span>} loading={loading} />
//         <StatCard label="Avg org size" value={stats.avgAdjEmp} sublabel="Adjusted employees" icon={<span>{ICONS.avg}</span>} loading={loading} />
//         <StatCard label="Top HQ Country share (%)" value={countryConc.share} sublabel={byCountryHQExclusive?.[0]?.label || "Concentration"} icon={<span>{ICONS.focus}</span>} loading={loading} />
//         <StatCard label="Top Region share (%)" value={regionConc.share} sublabel={byRegionRaw?.[0]?.label || "Concentration"} icon={<span>{ICONS.focus}</span>} loading={loading} />

//         {/* NEW: concentration + depth quick stats */}
//         <StatCard
//           label="Top 10 headcount share (%)"
//           value={concentration?.top10EmpSharePct || 0}
//           sublabel="Employees concentration"
//           icon={<span>{ICONS.bolt}</span>}
//           loading={loading}
//         />
//         <StatCard
//           label="Median services"
//           value={depth?.servicesMedian || 0}
//           sublabel="Per org"
//           icon={<span>{ICONS.stack}</span>}
//           loading={loading}
//         />
//         <StatCard
//           label="Median infra tools"
//           value={depth?.infrasMedian || 0}
//           sublabel="Per org"
//           icon={<span>{ICONS.stack}</span>}
//           loading={loading}
//         />
//         <StatCard
//           label="Multi-country orgs (%)"
//           value={complexity?.multiCountryPct || 0}
//           sublabel="Footprint complexity"
//           icon={<span>{ICONS.network}</span>}
//           loading={loading}
//         />
//       </CardGrid>

//       <Divider style={{ margin: "18px 0" }} />

//       {/* Signals */}
//       <Card title="Notable signals" subtitle="Auto-generated takeaways from the Mega Org cohort" right={<Pill tone="brand">Summary</Pill>}>
//         {loading ? (
//           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//         ) : (
//           <div style={{ display: "grid", gap: 10 }}>
//             {notableSignals.map((s, i) => (
//               <div
//                 key={`sig_${i}`}
//                 style={{
//                   padding: "12px 14px",
//                   borderRadius: 16,
//                   border: "1px solid rgba(30,42,120,0.10)",
//                   background: "rgba(255,255,255,0.65)",
//                   lineHeight: 1.55,
//                   fontSize: 14,
//                   fontWeight: 850,
//                 }}
//                 dangerouslySetInnerHTML={{ __html: safeHTML(s) }}
//               />
//             ))}
//           </div>
//         )}
//       </Card>

//       <Divider style={{ margin: "18px 0" }} />

//       {/* NEW: Power & concentration */}
//       <TwoCol
//         left={
//           <Card title="Headcount concentration" subtitle="How much of the cohort is controlled by the largest employers" right={<Pill tone="neutral">Employees</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <div style={{ display: "grid", gap: 10 }}>
//                 <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//                   <Pill tone="brand">Top 5: {fmtPct(concentration?.top5EmpSharePct || 0)}</Pill>
//                   <Pill tone="brand">Top 10: {fmtPct(concentration?.top10EmpSharePct || 0)}</Pill>
//                   <Pill tone="brand">Top 20: {fmtPct(concentration?.top20EmpSharePct || 0)}</Pill>
//                 </div>

//                 <BarChart
//                   data={asXY(concentration?.curve || [], "bucket", "sharePct")}
//                   xKey="bucket"
//                   yKey="sharePct"
//                   height={360}
//                   orientation="horizontal"
//                   emptyLabel="No concentration data"
//                 />
//               </div>
//             )}
//           </Card>
//         }
//         right={
//           <Card title="Composite leaders" subtitle="Top orgs by global scale and production sophistication" right={<Pill tone="neutral">Top 10</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <div style={{ display: "grid", gap: 14 }}>
//                 <div>
//                   <div style={{ fontWeight: 950, marginBottom: 8 }}>Global Scale Index</div>
//                   <RankList items={indices?.globalScaleTop || []} emptyLabel="No index data" />
//                 </div>
//                 <div>
//                   <div style={{ fontWeight: 950, marginBottom: 8 }}>Production Sophistication Index</div>
//                   <RankList items={indices?.prodSophTop || []} emptyLabel="No index data" />
//                 </div>
//               </div>
//             )}
//           </Card>
//         }
//       />

//       <Divider style={{ margin: "18px 0" }} />

//       {/* Geography visuals (existing) */}
//       <Card title="Top countries (footprint)" subtitle="Org incidence within the cohort (counts an org once per country it operates in)" right={<Pill>Orgs</Pill>}>
//         <BarChart
//           data={topCountriesRank}
//           xKey="country"
//           yKey="count"
//           height={720}
//           orientation="horizontal"
//           emptyLabel={loading ? "Loading…" : "No country data"}
//         />
//       </Card>

//       <TwoCol
//         left={
//           <Card title="Sales regions" subtitle="Exclusive share of orgs by region" right={<Pill>Share</Pill>}>
//             <DonutChart data={topRegionsDonut} height={520} centerLabel="Orgs" />
//           </Card>
//         }
//         right={
//           <Card title="HQ country share (Top 8)" subtitle="Exclusive HQ distribution (includes HQ unknown)" right={<Pill tone="neutral">Share</Pill>}>
//             <DonutChart data={topCountriesDonut} height={520} centerLabel="Orgs" />
//           </Card>
//         }
//       />

//       <Divider style={{ margin: "18px 0" }} />

//       {/* NEW: Capability depth */}
//       <TwoCol
//         left={
//           <Card title="Service depth distribution" subtitle="How broad each org’s service stack is" right={<Pill>Orgs</Pill>}>
//             <BarChart
//               data={asXY(depth?.servicesBuckets || [], "bucket", "count")}
//               xKey="bucket"
//               yKey="count"
//               height={420}
//               orientation="horizontal"
//               emptyLabel={loading ? "Loading…" : "No service depth data"}
//             />
//           </Card>
//         }
//         right={
//           <Card title="Infrastructure depth distribution" subtitle="How many tools each org runs (incidence-based)" right={<Pill tone="neutral">Orgs</Pill>}>
//             <BarChart
//               data={asXY(depth?.infrasBuckets || [], "bucket", "count")}
//               xKey="bucket"
//               yKey="count"
//               height={420}
//               orientation="horizontal"
//               emptyLabel={loading ? "Loading…" : "No infra depth data"}
//             />
//           </Card>
//         }
//       />

//       <TwoCol
//         left={
//           <Card title="Tool adoption vs scale" subtitle="Relationship between headcount and infra/service breadth (cohort-level correlation)" right={<Pill tone="neutral">Signals</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <TableList
//                 rows={[
//                   `Infra tools vs headcount correlation: <strong>${Number(correlations?.infraEmpPearson ?? 0).toFixed(2)}</strong>`,
//                   `Services vs headcount correlation: <strong>${Number(correlations?.servicesEmpPearson ?? 0).toFixed(2)}</strong>`,
//                   `Interpretation: values closer to <strong>1.0</strong> mean breadth rises strongly with scale; closer to <strong>0</strong> means weak linkage.`,
//                 ]}
//               />
//             )}
//           </Card>
//         }
//         right={
//           <Card title="Operational complexity" subtitle="Distribution of geographic spread across orgs" right={<Pill tone="neutral">Orgs</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <div style={{ display: "grid", gap: 14 }}>
//                 <div style={{ fontWeight: 950 }}>Country footprint per org</div>
//                 <DonutChart data={complexity?.countryBuckets || []} height={340} centerLabel="Orgs" />
//                 <div style={{ fontWeight: 950, marginTop: 4 }}>Region footprint per org</div>
//                 <DonutChart data={complexity?.regionBuckets || []} height={340} centerLabel="Orgs" />
//               </div>
//             )}
//           </Card>
//         }
//       />

//       <Divider style={{ margin: "18px 0" }} />

//       {/* Production cities (existing, clickable) */}
//       <Card
//         title="Top production cities"
//         subtitle="Footprint cities across all locations (click a city to filter Orgs page)"
//         right={<Pill tone="neutral">Click to filter</Pill>}
//       >
//         {loading ? (
//           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//         ) : (
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
//             {topCitiesList.map((c) => (
//               <button
//                 key={`city_${c.label}`}
//                 onClick={() => goToOrgsWithCity(c.label)}
//                 style={{
//                   border: "1px solid rgba(30,42,120,0.16)",
//                   background: "rgba(255,255,255,0.78)",
//                   borderRadius: 999,
//                   padding: "8px 12px",
//                   cursor: "pointer",
//                   fontWeight: 900,
//                   boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
//                 }}
//                 title="Open Orgs page with Production City filter"
//               >
//                 {c.label} <span style={{ opacity: 0.7, marginLeft: 6 }}>({Number(c.value) || 0})</span>
//               </button>
//             ))}
//           </div>
//         )}
//       </Card>

//       <Divider style={{ margin: "18px 0" }} />

//       {/* NEW: City specialization */}
//       <TwoCol
//         left={
//           <Card title="City specialization (services)" subtitle="Cities that over-index for a service vs cohort baseline" right={<Pill tone="neutral">Over-index</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <TableList
//                 rows={(specializations?.cityServiceOverIndex || []).slice(0, 12).map((r) => {
//                   return `In <strong>${r.city}</strong>, <strong>${r.service}</strong> over-indexes at <strong>${Number(r.index).toFixed(2)}×</strong> (city coverage ${fmtPct(r.cityPct)} vs cohort ${fmtPct(r.cohortPct)}).`;
//                 })}
//                 emptyLabel="No city specialization data"
//               />
//             )}
//           </Card>
//         }
//         right={
//           <Card title="City specialization (infra)" subtitle="Cities that over-index for a tool vs cohort baseline" right={<Pill tone="neutral">Over-index</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <TableList
//                 rows={(specializations?.cityInfraOverIndex || []).slice(0, 12).map((r) => {
//                   return `In <strong>${r.city}</strong>, <strong>${r.infra}</strong> over-indexes at <strong>${Number(r.index).toFixed(2)}×</strong> (city coverage ${fmtPct(r.cityPct)} vs cohort ${fmtPct(r.cohortPct)}).`;
//                 })}
//                 emptyLabel="No city specialization data"
//               />
//             )}
//           </Card>
//         }
//       />

//       <Divider style={{ margin: "18px 0" }} />

//       {/* Ranked charts (existing) */}
//       <Card title="Top services" subtitle="Incidence among Mega Orgs" right={<Pill>Orgs</Pill>}>
//         <BarChart
//           data={servicesRank}
//           xKey="service"
//           yKey="count"
//           height={720}
//           orientation="horizontal"
//           emptyLabel={loading ? "Loading…" : "No service data"}
//         />
//       </Card>

//       <Card title="Top infrastructure" subtitle="Tool incidence among Mega Orgs" right={<Pill tone="neutral">Orgs</Pill>}>
//         {loading ? (
//           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//         ) : (
//           <RankList items={topInfraList} emptyLabel="No infra data" />
//         )}
//       </Card>

//       <Divider style={{ margin: "18px 0" }} />

//       {/* NEW: Regional specialization */}
//       <Card title="Regional specialization" subtitle="Top services + tools by primary sales region" right={<Pill tone="neutral">Region</Pill>}>
//         {loading ? (
//           <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//         ) : (
//           <CardGrid min={320}>
//             {(specializations?.byRegion || []).map((r) => (
//               <Card
//                 key={`reg_${r.region}`}
//                 title={r.region}
//                 subtitle="Most common services and tools (within region cohort)"
//                 right={<Pill>{fmtNum(r.totalOrgs)} orgs</Pill>}
//               >
//                 <div style={{ display: "grid", gap: 12 }}>
//                   <div>
//                     <div style={{ fontWeight: 950, marginBottom: 6 }}>Top services</div>
//                     <RankList items={r.topServices} emptyLabel="No services" />
//                   </div>
//                   <div>
//                     <div style={{ fontWeight: 950, marginBottom: 6 }}>Top tools</div>
//                     <RankList items={r.topInfras} emptyLabel="No tools" />
//                   </div>
//                 </div>
//               </Card>
//             ))}
//           </CardGrid>
//         )}
//       </Card>

//       <Divider style={{ margin: "18px 0" }} />

//       {/* NEW: Time & maturity */}
//       <TwoCol
//         left={
//           <Card title="Org age distribution" subtitle="Based on ORG_ACTIVE_AS_OF_YEAR (if present)" right={<Pill tone="neutral">Orgs</Pill>}>
//             <BarChart
//               data={asXY(maturity?.ageBuckets || [], "bucket", "count")}
//               xKey="bucket"
//               yKey="count"
//               height={420}
//               orientation="horizontal"
//               emptyLabel={loading ? "Loading…" : "No age data"}
//             />
//           </Card>
//         }
//         right={
//           <Card title="Capability by age" subtitle="Median services + infra by org age bucket" right={<Pill tone="neutral">Median</Pill>}>
//             {loading ? (
//               <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
//             ) : (
//               <TableList
//                 rows={(maturity?.byAge || []).map((b) => {
//                   return `<strong>${b.bucket}</strong>: median services <strong>${b.servicesMedian}</strong>, median infra <strong>${b.infrasMedian}</strong> (n=${b.count}).`;
//                 })}
//                 emptyLabel="No capability-by-age data"
//               />
//             )}
//           </Card>
//         }
//       />

//       <Divider style={{ margin: "18px 0" }} />

//       {/* Cohort list (existing) */}
//       <Card title="Mega Orgs" subtitle="All organizations with headcounts more than 10,000 employees" right={<Pill tone="neutral">Search + paginate</Pill>}>
//         <PaginatedOrgTable
//           baseFilters={{ ORG_SIZING_CALCULATED: "10001-None" }}
//           title="Cohort Organizations"
//           subtitle="Click an org name to open details."
//         />
//       </Card>
//     </InsightsShell>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InsightsShell from "../components/insights/InsightsShell";
import { StatCard, Card, CardGrid, TwoCol, Pill, Divider } from "../components/insights/Cards";
import BarChart from "../components/insights/BarChart";
import DonutChart from "../components/insights/DonutChart";
import PaginatedOrgTable from "../components/insights/PaginatedOrgTable";

const ICONS = {
  orgs: "🏢",
  people: "👥",
  avg: "📊",
  focus: "🎯",
  map: "🗺️",
  globe: "🌍",
  bolt: "⚡",
  stack: "🧱",
  network: "🕸️",
  time: "⏳",
  trophy: "🏆",
};

function asXY(list, xKeyName, yKeyName) {
  return (list || []).map((d) => ({
    [xKeyName]: d?.label ?? d?.name ?? "",
    [yKeyName]: Number(d?.value ?? d?.count ?? 0) || 0,
  }));
}

function pct(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
}

function top1Share(list) {
  const first = Number((list || [])[0]?.value || 0);
  const total = (list || []).reduce((s, x) => s + (Number(x?.value) || 0), 0);
  return { first, total, share: pct(first, total) };
}

function withOtherExclusive(list, total, topN, otherLabel) {
  const safe = (list || []).filter((x) => Number(x?.value) > 0);
  const top = safe.slice(0, topN);
  const sumTop = top.reduce((s, x) => s + (Number(x?.value) || 0), 0);
  const remainder = Math.max(0, (Number(total) || 0) - sumTop);
  return remainder > 0 ? [...top, { label: otherLabel, value: remainder }] : top;
}

function safeHTML(s) {
  return String(s ?? "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function fmtPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(0)}%`;
}

function fmtNum(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}


function barHeight(n, { min = 360, per = 54, max = 1040 } = {}) {
  const len = Number(n) || 0;
  const h = Math.round(Math.max(min, Math.min(max, len * per + 140)));
  return h;
}

function RankList({ items = [], emptyLabel = "No data", onClickItem }) {
  if (!items?.length) return <div style={{ fontWeight: 850, opacity: 0.75 }}>{emptyLabel}</div>;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((x, i) => (
        <div
          key={`${x.label || x.name || "item"}_${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "center",
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(30,42,120,0.12)",
            background: "rgba(255,255,255,0.70)",
            fontWeight: 900,
            cursor: onClickItem ? "pointer" : "default",
          }}
          onClick={() => onClickItem?.(x)}
          title={onClickItem ? "Click" : undefined}
        >
          <div style={{ fontSize: 14, lineHeight: 1.2 }}>{x.label ?? x.name ?? ""}</div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{fmtNum(x.value ?? x.count ?? 0)}</div>
        </div>
      ))}
    </div>
  );
}

function TableList({ rows = [], emptyLabel = "No data" }) {
  if (!rows?.length) return <div style={{ fontWeight: 850, opacity: 0.75 }}>{emptyLabel}</div>;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((r, i) => (
        <div
          key={`row_${i}`}
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            border: "1px solid rgba(30,42,120,0.10)",
            background: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
            fontSize: 13,
            fontWeight: 850,
          }}
          dangerouslySetInnerHTML={{ __html: safeHTML(r) }}
        />
      ))}
    </div>
  );
}

export default function OrgInsights() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // New unified mega-org insights endpoint (keeps existing data + adds more)
    fetch("/api/insights/orgs/mega")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // ---------- Back-compat defaults ----------
  const topOrgs = data?.top || [];
  const byCountryFootprint = data?.byCountryFootprint || [];
  const byCountryHQRaw = data?.byCountryHQ || [];
  const byRegionRaw = data?.byRegion || [];
  const byCityFootprint = data?.byCityFootprint || [];
  const topServicesRaw = data?.topServices || [];
  const topInfrasRaw = data?.topInfras || [];

  // ---------- NEW datasets ----------
  const totals = data?.totals || {};
  const concentration = data?.concentration || {};
  const depth = data?.depth || {};
  const complexity = data?.complexity || {};
  const maturity = data?.maturity || {};
  const indices = data?.indices || {};
  const specializations = data?.specializations || {};
  const correlations = data?.correlations || {};

  const stats = useMemo(() => {
    const totalOrgs = topOrgs.length;
    const totalAdjEmp = topOrgs.reduce((s, o) => s + (Number(o?.ADJUSTED_EMPLOYEE_COUNT) || 0), 0);
    const avgAdjEmp = totalOrgs ? Math.round(totalAdjEmp / totalOrgs) : 0;

    const countriesHQ = new Set(topOrgs.map((o) => o?.GEONAME_COUNTRY_NAME).filter(Boolean));
    const regions = new Set(topOrgs.map((o) => o?.SALES_REGION_PRIMARY || o?.SALES_REGION).filter(Boolean));

    return {
      totalOrgs,
      totalAdjEmp,
      avgAdjEmp,
      countryCount: countriesHQ.size,
      regionCount: regions.size,
    };
  }, [topOrgs]);

  /**
   * HQ distribution must be exclusive and sum to cohort size.
   * If server has missing HQ, represent them as "HQ unknown".
   */
  const byCountryHQExclusive = useMemo(() => {
    const list = (byCountryHQRaw || []).filter((x) => Number(x?.value) > 0);
    const known = list.reduce((s, x) => s + (Number(x?.value) || 0), 0);
    const unknown = Math.max(0, (stats.totalOrgs || 0) - known);
    if (unknown > 0) return [...list, { label: "Other", value: unknown }];
    return list;
  }, [byCountryHQRaw, stats.totalOrgs]);

  const countryConc = useMemo(() => top1Share(byCountryHQExclusive), [byCountryHQExclusive]);
  const regionConc = useMemo(() => top1Share(byRegionRaw), [byRegionRaw]);

  // Visual datasets (existing)
  const topCountriesRank = useMemo(
    () => asXY(byCountryFootprint, "country", "count").slice(0, 16),
    [byCountryFootprint]
  );

  const topRegionsDonut = useMemo(
    () => withOtherExclusive(byRegionRaw || [], stats.totalOrgs, 4, "Other regions"),
    [byRegionRaw, stats.totalOrgs]
  );

  const topCountriesDonut = useMemo(() => {
    const total = stats.totalOrgs || 0;
    const unknownRow = byCountryHQExclusive.find((x) => x?.label === "HQ unknown");
    const unknownVal = Number(unknownRow?.value || 0);

    const withoutUnknown = byCountryHQExclusive.filter((x) => x?.label !== "HQ unknown");
    const top7 = withoutUnknown.slice(0, 7);
    const top7Sum = top7.reduce((s, x) => s + (Number(x?.value) || 0), 0);

    const remainder = Math.max(0, total - top7Sum - unknownVal);

    const out = [...top7];
    if (remainder > 0) out.push({ label: "Other", value: remainder });
    if (unknownVal > 0) out.push({ label: "HQ unknown", value: unknownVal });

    return out;
  }, [byCountryHQExclusive, stats.totalOrgs]);

  const servicesRank = useMemo(
    () => asXY(topServicesRaw, "service", "count").slice(0, 16),
    [topServicesRaw]
  );

  const topInfraList = useMemo(() => (topInfrasRaw || []).slice(0, 16), [topInfrasRaw]);

  const topCitiesList = useMemo(
    () => (byCityFootprint || []).filter((x) => x?.label && x.label !== "Unknown").slice(0, 30),
    [byCityFootprint]
  );

  const coverage = useMemo(() => {
    const cohort = stats.totalOrgs || 0;
    const topService = topServicesRaw?.[0];
    const topTool = topInfrasRaw?.[0];

    const topServicePct = cohort ? pct(Number(topService?.value || 0), cohort) : 0;
    const topToolPct = cohort ? pct(Number(topTool?.value || 0), cohort) : 0;

    return {
      topServiceLabel: topService?.label,
      topServicePct,
      topToolLabel: topTool?.label,
      topToolPct,
    };
  }, [stats.totalOrgs, topServicesRaw, topInfrasRaw]);

  const notableSignals = useMemo(() => {
    if (!data) return [];
    const notes = [];

    const topCountry = byCountryHQExclusive?.[0]?.label;
    const topRegion = byRegionRaw?.[0]?.label;

    if (topCountry) notes.push(`Largest HQ concentration is in **${topCountry}** (${countryConc.share.toFixed(0)}% of the cohort).`);
    if (topRegion) notes.push(`Cohort clusters most in **${topRegion}** (${regionConc.share.toFixed(0)}% of the cohort).`);

    if (coverage.topServiceLabel) notes.push(`Most common service: **${coverage.topServiceLabel}** (coverage ~${coverage.topServicePct.toFixed(0)}%).`);
    if (coverage.topToolLabel) notes.push(`Most prevalent infra tool: **${coverage.topToolLabel}** (coverage ~${coverage.topToolPct.toFixed(0)}%).`);

    const unknownHQ = Number(byCountryHQExclusive.find((x) => x?.label === "HQ unknown")?.value || 0);
    if (unknownHQ > 0) notes.push(`HQ country is missing for **${unknownHQ} orgs** — shown as **HQ unknown** in the donut.`);

    if (Number(concentration?.top10EmpSharePct) > 0) {
      notes.push(`Power concentration: top 10 orgs account for **${concentration.top10EmpSharePct.toFixed(0)}%** of total cohort headcount.`);
    }
    if (Number(depth?.servicesMedian) > 0) {
      notes.push(`Median capability breadth: **${depth.servicesMedian} services** and **${depth.infrasMedian} infra tools** per org.`);
    }
    if (Number(complexity?.multiCountryPct) >= 0) {
      notes.push(`Global footprint: **${complexity.multiCountryPct.toFixed(0)}%** of orgs operate in multiple countries (from production locations).`);
    }

    notes.push(`Representation: **${stats.countryCount} HQ countries** across 4 sales regions in this cohort.`);

    return notes.slice(0, 10);
  }, [
    data,
    byCountryHQExclusive,
    byRegionRaw,
    countryConc.share,
    regionConc.share,
    coverage.topServiceLabel,
    coverage.topServicePct,
    coverage.topToolLabel,
    coverage.topToolPct,
    stats.countryCount,
    concentration?.top10EmpSharePct,
    depth?.servicesMedian,
    depth?.infrasMedian,
    complexity?.multiCountryPct,
  ]);

  function goToOrgsWithCity(city) {
    const qs = new URLSearchParams();
    qs.set("locationScope", "all");
    qs.set("CITY", city);
    nav(`/participants/organizations?${qs.toString()}`);
  }

  return (
    <InsightsShell
      title="Org Insights"
      subtitle='Lens: Organizations with headcounts of more than 10,000 employees.'
      active="orgs"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -6, marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => nav("/participants/organizations")}
          style={{
            border: "1px solid rgba(30,42,120,0.18)",
            background: "rgba(255,255,255,0.85)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 950,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(17,24,39,0.10)",
          }}
        >
          ← Back to Orgs
        </button>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Pill tone="brand">Mega cohort</Pill>
          <Pill tone="neutral">{stats.totalOrgs || 0} orgs</Pill>
        </div>
      </div>

      {/* KPIs (expanded) */}
      <CardGrid min={230}>
        <StatCard label="Organizations" value={stats.totalOrgs} sublabel="Mega org cohort" icon={<span>{ICONS.orgs}</span>} loading={loading} />
        <StatCard label="Countries represented" value={stats.countryCount} sublabel="HQ Breadth" icon={<span>{ICONS.globe}</span>} loading={loading} />
        <StatCard label="Regions represented" value={4} sublabel="Sales regions" icon={<span>{ICONS.map}</span>} loading={loading} />
        <StatCard label="Total employees" value={stats.totalAdjEmp} compact icon={<span>{ICONS.people}</span>} loading={loading} />
        <StatCard label="Avg org size" value={stats.avgAdjEmp} sublabel="Adjusted employees" icon={<span>{ICONS.avg}</span>} loading={loading} />
        <StatCard label="Top HQ Country share (%)" value={countryConc.share} sublabel={byCountryHQExclusive?.[0]?.label || "Concentration"} icon={<span>{ICONS.focus}</span>} loading={loading} />
        <StatCard label="Top Region share (%)" value={regionConc.share} sublabel={byRegionRaw?.[0]?.label || "Concentration"} icon={<span>{ICONS.focus}</span>} loading={loading} />

        {/* NEW: concentration + depth quick stats */}
        <StatCard
          label="Top 10 headcount share (%)"
          value={concentration?.top10EmpSharePct || 0}
          sublabel="Employees concentration"
          icon={<span>{ICONS.bolt}</span>}
          loading={loading}
        />
        <StatCard
          label="Median services"
          value={depth?.servicesMedian || 0}
          sublabel="Per org"
          icon={<span>{ICONS.stack}</span>}
          loading={loading}
        />
        <StatCard
          label="Median infra tools"
          value={depth?.infrasMedian || 0}
          sublabel="Per org"
          icon={<span>{ICONS.stack}</span>}
          loading={loading}
        />
        <StatCard
          label="Multi-country orgs (%)"
          value={complexity?.multiCountryPct || 0}
          sublabel="Footprint complexity"
          icon={<span>{ICONS.network}</span>}
          loading={loading}
        />
      </CardGrid>

      <Divider style={{ margin: "18px 0" }} />

      {/* Signals */}
      <Card title="Notable signals" subtitle="Auto-generated takeaways from the Mega Org cohort" right={<Pill tone="brand">Summary</Pill>}>
        {loading ? (
          <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {notableSignals.map((s, i) => (
              <div
                key={`sig_${i}`}
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(30,42,120,0.10)",
                  background: "rgba(255,255,255,0.65)",
                  lineHeight: 1.55,
                  fontSize: 14,
                  fontWeight: 850,
                }}
                dangerouslySetInnerHTML={{ __html: safeHTML(s) }}
              />
            ))}
          </div>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* NEW: Power & concentration */}
      <div style={{ display: "grid", gap: 18 }}>
        <Card title="Headcount concentration" subtitle="How much of the cohort is controlled by the largest employers" right={<Pill tone="neutral">Employees</Pill>}>
          {loading ? (
            <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pill tone="brand">Top 5: {fmtPct(concentration?.top5EmpSharePct || 0)}</Pill>
                <Pill tone="brand">Top 10: {fmtPct(concentration?.top10EmpSharePct || 0)}</Pill>
                <Pill tone="brand">Top 20: {fmtPct(concentration?.top20EmpSharePct || 0)}</Pill>
              </div>

              <BarChart
                data={asXY(concentration?.curve || [], "bucket", "sharePct")}
                xKey="bucket"
                yKey="sharePct"
                height={barHeight((concentration?.curve || []).length, { min: 360, per: 110, max: 560 })}
                orientation="horizontal"
                emptyLabel="No concentration data"
              />
            </div>
          )}
        </Card>

        <Card title="Composite leaders" subtitle="Top orgs by global scale and production sophistication" right={<Pill tone="neutral">Top 10</Pill>}>
          {loading ? (
            <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontWeight: 950, marginBottom: 8 }}>Global Scale Index</div>
                <RankList items={indices?.globalScaleTop || []} emptyLabel="No index data" />
              </div>
              <div>
                <div style={{ fontWeight: 950, marginBottom: 8 }}>Production Sophistication Index</div>
                <RankList items={indices?.prodSophTop || []} emptyLabel="No index data" />
              </div>
            </div>
          )}
        </Card>
      </div>

<Divider style={{ margin: "18px 0" }} />

      {/* Geography visuals (existing) */}
      <Card title="Top countries (footprint)" subtitle="Org incidence within the cohort (counts an org once per country it operates in)" right={<Pill>Orgs</Pill>}>
        <BarChart
          data={topCountriesRank}
          xKey="country"
          yKey="count"
          height={barHeight((topCountriesRank || []).length, { min: 620, per: 54, max: 1040 })}
          orientation="horizontal"
          emptyLabel={loading ? "Loading…" : "No country data"}
        />
      </Card>

      <TwoCol
        left={
          <Card title="Sales regions" subtitle="Exclusive share of orgs by region" right={<Pill>Share</Pill>}>
            <DonutChart data={topRegionsDonut} height={520} centerLabel="Orgs" />
          </Card>
        }
        right={
          <Card title="HQ country share (Top 8)" subtitle="Exclusive HQ distribution (includes HQ unknown)" right={<Pill tone="neutral">Share</Pill>}>
            <DonutChart data={topCountriesDonut} height={520} centerLabel="Orgs" />
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* NEW: Capability depth */}
      <TwoCol
        left={
          <Card title="Service depth distribution" subtitle="How broad each org’s service stack is" right={<Pill>Orgs</Pill>}>
            <BarChart
              data={asXY(depth?.servicesBuckets || [], "bucket", "count")}
              xKey="bucket"
              yKey="count"
              height={barHeight((depth?.servicesBuckets || []).length, { min: 360, per: 110, max: 560 })}
              orientation="horizontal"
              emptyLabel={loading ? "Loading…" : "No service depth data"}
            />
          </Card>
        }
        right={
          <Card title="Infrastructure depth distribution" subtitle="How many tools each org runs (incidence-based)" right={<Pill tone="neutral">Orgs</Pill>}>
            <BarChart
              data={asXY(depth?.infrasBuckets || [], "bucket", "count")}
              xKey="bucket"
              yKey="count"
              height={barHeight((depth?.infrasBuckets || []).length, { min: 360, per: 110, max: 560 })}
              orientation="horizontal"
              emptyLabel={loading ? "Loading…" : "No infra depth data"}
            />
          </Card>
        }
      />
      <div style={{ display: "grid", gap: 18 }}>
        <Card title="Tool adoption vs scale" subtitle="Relationship between headcount and infra/service breadth (cohort-level correlation)" right={<Pill tone="neutral">Signals</Pill>}>
          {loading ? (
            <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
          ) : (
            <TableList
              rows={[
                `Infra tools vs headcount correlation: <strong>${Number(correlations?.infraEmpPearson ?? 0).toFixed(2)}</strong>`,
                `Services vs headcount correlation: <strong>${Number(correlations?.servicesEmpPearson ?? 0).toFixed(2)}</strong>`,
                `Interpretation: values closer to <strong>1.0</strong> mean breadth rises strongly with scale; closer to <strong>0</strong> means weak linkage.`,
              ]}
            />
          )}
        </Card>

        <Card title="Operational complexity" subtitle="Distribution of geographic spread across orgs" right={<Pill tone="neutral">Orgs</Pill>}>
          {loading ? (
            <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ fontWeight: 950 }}>Country footprint per org</div>
              <DonutChart data={complexity?.countryBuckets || []} height={360} centerLabel="Orgs" />
              <div style={{ fontWeight: 950, marginTop: 4 }}>Region footprint per org</div>
              <DonutChart data={complexity?.regionBuckets || []} height={360} centerLabel="Orgs" />
            </div>
          )}
        </Card>
      </div>

<Divider style={{ margin: "18px 0" }} />

      {/* Production cities (existing, clickable) */}
      <Card
        title="Top production cities"
        subtitle="Footprint cities across all locations (click a city to filter Orgs page)"
        right={<Pill tone="neutral">Click to filter</Pill>}
      >
        {loading ? (
          <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {topCitiesList.map((c) => (
              <button
                key={`city_${c.label}`}
                onClick={() => goToOrgsWithCity(c.label)}
                style={{
                  border: "1px solid rgba(30,42,120,0.16)",
                  background: "rgba(255,255,255,0.78)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 900,
                  boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
                }}
                title="Open Orgs page with Production City filter"
              >
                {c.label} <span style={{ opacity: 0.7, marginLeft: 6 }}>({Number(c.value) || 0})</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* NEW: City specialization */}
      <TwoCol
        left={
          <Card title="City specialization (services)" subtitle="Cities that over-index for a service vs cohort baseline" right={<Pill tone="neutral">Over-index</Pill>}>
            {loading ? (
              <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
            ) : (
              <TableList
                rows={(specializations?.cityServiceOverIndex || []).slice(0, 12).map((r) => {
                  return `In <strong>${r.city}</strong>, <strong>${r.service}</strong> over-indexes at <strong>${Number(r.index).toFixed(2)}×</strong> (city coverage ${fmtPct(r.cityPct)} vs cohort ${fmtPct(r.cohortPct)}).`;
                })}
                emptyLabel="No city specialization data"
              />
            )}
          </Card>
        }
        right={
          <Card title="City specialization (infra)" subtitle="Cities that over-index for a tool vs cohort baseline" right={<Pill tone="neutral">Over-index</Pill>}>
            {loading ? (
              <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
            ) : (
              <TableList
                rows={(specializations?.cityInfraOverIndex || []).slice(0, 12).map((r) => {
                  return `In <strong>${r.city}</strong>, <strong>${r.infra}</strong> over-indexes at <strong>${Number(r.index).toFixed(2)}×</strong> (city coverage ${fmtPct(r.cityPct)} vs cohort ${fmtPct(r.cohortPct)}).`;
                })}
                emptyLabel="No city specialization data"
              />
            )}
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* Ranked charts (existing) */}
      <Card title="Top services" subtitle="Incidence among Mega Orgs" right={<Pill>Orgs</Pill>}>
        <BarChart
          data={servicesRank}
          xKey="service"
          yKey="count"
          height={barHeight((servicesRank || []).length, { min: 620, per: 54, max: 1040 })}
          orientation="horizontal"
          emptyLabel={loading ? "Loading…" : "No service data"}
        />
      </Card>

      <Card title="Top infrastructure" subtitle="Tool incidence among Mega Orgs" right={<Pill tone="neutral">Orgs</Pill>}>
        {loading ? (
          <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
        ) : (
          <RankList items={topInfraList} emptyLabel="No infra data" />
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* NEW: Regional specialization */}
      <Card title="Regional specialization" subtitle="Top services + tools by primary sales region" right={<Pill tone="neutral">Region</Pill>}>
        {loading ? (
          <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
        ) : (
          <CardGrid min={320}>
            {(specializations?.byRegion || []).map((r) => (
              <Card
                key={`reg_${r.region}`}
                title={r.region}
                subtitle="Most common services and tools (within region cohort)"
                right={<Pill>{fmtNum(r.totalOrgs)} orgs</Pill>}
              >
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Top services</div>
                    <RankList items={r.topServices} emptyLabel="No services" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Top tools</div>
                    <RankList items={r.topInfras} emptyLabel="No tools" />
                  </div>
                </div>
              </Card>
            ))}
          </CardGrid>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* NEW: Time & maturity */}
      <div style={{ display: "grid", gap: 18 }}>
        <Card title="Org age distribution" subtitle="Based on ORG_ACTIVE_AS_OF_YEAR (if present)" right={<Pill tone="neutral">Orgs</Pill>}>
          <BarChart
            data={asXY(maturity?.ageBuckets || [], "bucket", "count")}
            xKey="bucket"
            yKey="count"
            height={barHeight((maturity?.ageBuckets || []).length, { min: 360, per: 110, max: 560 })}
            orientation="horizontal"
            emptyLabel={loading ? "Loading…" : "No age data"}
          />
        </Card>

        <Card title="Capability by age" subtitle="Median services + infra by org age bucket" right={<Pill tone="neutral">Median</Pill>}>
          {loading ? (
            <div style={{ fontWeight: 850, opacity: 0.75 }}>Loading…</div>
          ) : (
            <TableList
              rows={(maturity?.byAge || []).map((b) => {
                return `<strong>${b.bucket}</strong>: median services <strong>${b.servicesMedian}</strong>, median infra <strong>${b.infrasMedian}</strong> (n=${b.count}).`;
              })}
              emptyLabel="No capability-by-age data"
            />
          )}
        </Card>
      </div>

<Divider style={{ margin: "18px 0" }} />

      {/* Cohort list (existing) */}
      <Card title="Mega Orgs" subtitle="All organizations with headcounts more than 10,000 employees" right={<Pill tone="neutral">Search + paginate</Pill>}>
        <PaginatedOrgTable
          baseFilters={{ ORG_SIZING_CALCULATED: "10001-None" }}
          title="Cohort Organizations"
          subtitle="Click an org name to open details."
        />
      </Card>
    </InsightsShell>
  );
}
