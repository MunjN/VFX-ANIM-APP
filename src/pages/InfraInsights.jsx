// FINAL – InfraInsights.jsx
// Sleek infra insights UI for /api/insights/infra
// Goals:
// - Fast + memoized
// - Keeps pill-click drilldowns (region/country/content/service/sizing)
// - Avoids overusing BarChart: uses lightweight “rank list” rows with progress bars + compact cards
// - Uses ONLY a couple BarCharts where they’re most legible (Top tools)
// - Adds “insight” sections beyond counts (pair lift/jaccard, skew, complexity assoc, correlations)
// - Includes CTA button to /participants/organizations/infrastructure
// NOTE: This file does NOT modify any shared components.

import React, { useEffect, useMemo, useState } from "react";
import InsightsShell from "../components/insights/InsightsShell";
import { Card, CardGrid, StatCard, Pill, Divider, TwoCol } from "../components/insights/Cards";
import BarChart from "../components/insights/BarChart";

const base = import.meta.env.VITE_API_BASE;

// ----------------------- helpers -----------------------
function fmtPct0(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0%";
  if (n < 1 && n > 0) return "<1%";
  return `${Math.round(n)}%`;
}

function fmtPct1(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0.0%";
  if (n < 0.1 && n > 0) return "<0.1%";
  return `${n.toFixed(1)}%`;
}

function fmtNum(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return new Intl.NumberFormat().format(Math.trunc(x));
}

function fmtK(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
  if (x >= 10_000) return `${Math.round(x / 1000)}K`;
  if (x >= 1000) return `${(x / 1000).toFixed(1)}K`;
  return `${Math.trunc(x)}`;
}

function niceLabel(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim() || "Unknown";
}

function objKeysSorted(obj = {}) {
  return Object.keys(obj || {}).sort((a, b) => String(a).localeCompare(String(b)));
}

function barHeight(n, min = 260) {
  const padT = 28,
    padB = 18,
    rowH = 32,
    gap = 12;
  const needed = padT + padB + n * rowH + Math.max(0, n - 1) * gap;
  return Math.max(min, needed);
}

// Lightweight rank list (no BarChart) — supports hover + “smooth”
function RankList({ rows, maxRows = 12, valueLabel = "Orgs", subtitle, emptyLabel = "No data" }) {
  const list = (rows || []).slice(0, maxRows);
  const max = Math.max(1, ...list.map((r) => Number(r?.value || 0)));

  if (!list.length) {
    return <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 850 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {subtitle ? <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 2 }}>{subtitle}</div> : null}

      {list.map((r, idx) => {
        const label = niceLabel(r?.label);
        const v = Number(r?.value || 0);
        const pct = Math.max(0, Math.min(1, v / max));
        const secondary = r?.secondary;

        return (
          <div
            key={`${label}-${idx}`}
            title={`${label} — ${fmtNum(v)} ${valueLabel}${secondary ? ` • ${secondary}` : ""}`}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(180px, 1fr) 112px",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.1 }}>{label}</div>
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(30,42,120,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, rgba(60,130,255,0.65), rgba(60,130,255,0.25))",
                    transition: "width 220ms ease",
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: "right", fontWeight: 950 }}>
              {fmtK(v)}{" "}
              <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 850 }}>{valueLabel}</span>
              {secondary ? (
                <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 850, marginTop: 2 }}>
                  {secondary}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Small stat rows (for correlations, etc.)
function MiniStatRow({ label, value, hint }) {
  return (
    <div
      title={hint || ""}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 16,
        border: "1px solid rgba(30,42,120,0.12)",
        background: "rgba(255,255,255,0.72)",
      }}
    >
      <div style={{ fontWeight: 950 }}>{label}</div>
      <div style={{ textAlign: "right", fontWeight: 1000 }}>{value}</div>
    </div>
  );
}

// Independent donut (no dependency on DonutChart component)
function DonutLite({ data, centerTop = "—", centerBottom = "", height = 360 }) {
  const size = 280;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const slices = useMemo(() => {
    const rows = (data || []).filter((d) => Number(d?.value) > 0);
    const total = rows.reduce((s, d) => s + Number(d.value || 0), 0) || 1;

    let acc = 0;
    return rows.map((d, i) => {
      const v = Number(d.value || 0);
      const frac = v / total;
      const dash = frac * c;
      const gap = c - dash;
      const start = acc;
      acc += dash;
      return {
        i,
        label: niceLabel(d.label),
        value: v,
        pct: frac * 100,
        dasharray: `${dash} ${gap}`,
        dashoffset: -start,
      };
    });
  }, [data, c]);

  const [tip, setTip] = useState(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 18,
        alignItems: "center",
        minHeight: height,
      }}
    >
      <div style={{ position: "relative", width: 320, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(30,42,120,0.08)"
            strokeWidth={stroke}
          />
          {slices.map((s) => (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                cursor: "pointer",
                transition: "opacity 160ms ease",
                opacity: tip?.label && tip.label !== s.label ? 0.35 : 1,
                stroke: `hsl(${(s.i * 42) % 360} 85% 55%)`,
              }}
              onMouseEnter={() => setTip({ label: s.label, pct: s.pct })}
              onMouseLeave={() => setTip(null)}
            />
          ))}
        </svg>

        <div
          style={{
            position: "absolute",
            textAlign: "center",
            lineHeight: 1.05,
            transform: "translateY(2px)",
          }}
        >
          <div style={{ fontWeight: 950, opacity: 0.75 }}>{centerTop}</div>
          <div style={{ fontWeight: 1000, fontSize: 34 }}>{centerBottom}</div>
        </div>

        {tip ? (
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(17,24,39,0.92)",
              color: "white",
              padding: "8px 10px",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 850,
              pointerEvents: "none",
              maxWidth: 280,
              textAlign: "center",
            }}
          >
            {tip.label} • {fmtPct0(tip.pct)}
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 10, maxHeight: height, overflow: "auto", paddingRight: 6 }}>
        {(slices || []).map((s) => (
          <div
            key={s.label}
            onMouseEnter={() => setTip({ label: s.label, pct: s.pct })}
            onMouseLeave={() => setTip(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "14px 1fr 64px",
              gap: 10,
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 16,
              border: "1px solid rgba(30,42,120,0.12)",
              background: "rgba(255,255,255,0.72)",
              cursor: "pointer",
            }}
            title={`${s.label} — ${fmtPct0(s.pct)}`}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: `hsl(${(s.i * 42) % 360} 85% 55%)`,
              }}
            />
            <div style={{ fontWeight: 950 }}>{s.label}</div>
            <div style={{ textAlign: "right", fontWeight: 950 }}>{fmtPct0(s.pct)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact “card list” for tool cards with meta + associations (avoids charts)
function ToolCards({ rows, titleHint = "", maxRows = 12, emptyLabel = "No data" }) {
  const list = (rows || []).slice(0, maxRows);
  if (!list.length) return <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 850 }}>{emptyLabel}</div>;

  const badge = (text) =>
    text ? (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid rgba(30,42,120,0.12)",
          background: "rgba(255,255,255,0.72)",
          fontSize: 12,
          fontWeight: 900,
          opacity: 0.9,
        }}
      >
        {text}
      </span>
    ) : null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {titleHint ? <div style={{ fontSize: 13, opacity: 0.7 }}>{titleHint}</div> : null}
      {list.map((t, i) => {
        const label = niceLabel(t.label);
        const orgCount = Number(t.value ?? t.orgCount ?? 0);

        const release = t.releaseYear ? `${t.releaseYear}` : "";
        const lic = niceLabel(t.license || "");
        const pricing = niceLabel(t.pricingModel || "");
        const bucket = niceLabel(t.pricingBucket || "");
        const assocA = Number(t.avgInfraToolsInUserOrgs ?? t.avgInfraToolsInUserOrgs ?? 0);
        const assocE = Number(t.avgEmployeesInUserOrgs ?? 0);

        return (
          <div
            key={`${label}-${i}`}
            title={`${label} — ${fmtNum(orgCount)} Orgs`}
            style={{
              padding: "12px 12px",
              borderRadius: 18,
              border: "1px solid rgba(30,42,120,0.12)",
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 10px 22px rgba(17,24,39,0.06)",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 1000, fontSize: 14, lineHeight: 1.1 }}>{label}</div>
              <div style={{ fontWeight: 1000 }}>
                {fmtK(orgCount)} <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 850 }}>Orgs</span>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {badge(release ? `Release: ${release}` : "")}
              {badge(lic && lic !== "Unknown" ? `License: ${lic}` : "")}
              {badge(pricing && pricing !== "Unknown" ? `Pricing: ${pricing}` : "")}
              {badge(bucket && bucket !== "Unknown" ? `Bucket: ${bucket}` : "")}
            </div>

            {(assocA > 0 || assocE > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 16,
                    border: "1px solid rgba(30,42,120,0.10)",
                    background: "rgba(30,42,120,0.03)",
                  }}
                  title="Average infra tool count among orgs that use this tool"
                >
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>Avg stack size</div>
                  <div style={{ fontWeight: 1000, fontSize: 16 }}>{Number.isFinite(assocA) ? assocA.toFixed(1) : "—"}</div>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 16,
                    border: "1px solid rgba(30,42,120,0.10)",
                    background: "rgba(30,42,120,0.03)",
                  }}
                  title="Average employee count among orgs that use this tool"
                >
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>Avg org size</div>
                  <div style={{ fontWeight: 1000, fontSize: 16 }}>{assocE > 0 ? fmtK(assocE) : "—"}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Pill selector row
function PillRow({ keys, active, onPick }) {
  const pillRowStyle = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 };
  const pillBtn = (isActive) => ({
    borderRadius: 999,
    padding: "8px 12px",
    border: `1px solid ${isActive ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
    background: isActive ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.72)",
    fontWeight: 950,
    cursor: "pointer",
  });

  return (
    <div style={pillRowStyle}>
      {(keys || []).map((k) => (
        <button key={k} type="button" onClick={() => onPick(k)} style={pillBtn(k === active)} title={niceLabel(k)}>
          {niceLabel(k)}
        </button>
      ))}
    </div>
  );
}

// ----------------------- page -----------------------
export default function InfraInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // drilldowns
  const [regionKey, setRegionKey] = useState("");
  const [countryKey, setCountryKey] = useState("");
  const [contentKey, setContentKey] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [sizingKey, setSizingKey] = useState("");

  useEffect(() => {
    let alive = true;

    fetch(base+"/api/insights/infra")
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) throw new Error(text || `Request failed: ${r.status}`);
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Expected JSON, got: ${text.slice(0, 140)}...`);
        }
      })
      .then((d) => {
        if (!alive) return;
        setData(d);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Failed to load infra insights");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const overview = data?.overview || {};

  // top tools for donut + bar
  const topInfraTools = useMemo(() => (data?.topInfraTools || []).slice(0, 12), [data]);
  const topToolsBar = useMemo(() => (data?.topInfraTools || []).slice(0, 20), [data]);

  // pill-click maps
  const byRegion = useMemo(() => data?.topInfraToolsByRegion || {}, [data]);
  const byCountry = useMemo(() => data?.topInfraToolsByCountry || {}, [data]);
  const byContent = useMemo(() => data?.topInfraToolsByContentType || {}, [data]);
  const byService = useMemo(() => data?.topInfraToolsByService || {}, [data]);
  const bySizing = useMemo(() => data?.topInfraToolsBySizing || {}, [data]);

  const regionKeys = useMemo(() => objKeysSorted(byRegion), [byRegion]);
  const countryKeys = useMemo(() => objKeysSorted(byCountry), [byCountry]);
  const contentKeys = useMemo(() => objKeysSorted(byContent), [byContent]);
  const serviceKeys = useMemo(() => objKeysSorted(byService), [byService]);
  const sizingKeys = useMemo(() => objKeysSorted(bySizing), [bySizing]);

  // initialize defaults once data arrives
  useEffect(() => {
    if (!regionKey && regionKeys.length) setRegionKey(regionKeys[0]);
  }, [regionKey, regionKeys]);
  useEffect(() => {
    if (!countryKey && countryKeys.length) setCountryKey(countryKeys[0]);
  }, [countryKey, countryKeys]);
  useEffect(() => {
    if (!contentKey && contentKeys.length) setContentKey(contentKeys[0]);
  }, [contentKey, contentKeys]);
  useEffect(() => {
    if (!serviceKey && serviceKeys.length) setServiceKey(serviceKeys[0]);
  }, [serviceKey, serviceKeys]);
  useEffect(() => {
    if (!sizingKey && sizingKeys.length) setSizingKey(sizingKeys[0]);
  }, [sizingKey, sizingKeys]);

  const regionRows = useMemo(() => byRegion?.[regionKey] || [], [byRegion, regionKey]);
  const countryRows = useMemo(() => byCountry?.[countryKey] || [], [byCountry, countryKey]);
  const contentRows = useMemo(() => byContent?.[contentKey] || [], [byContent, contentKey]);
  const serviceRows = useMemo(() => byService?.[serviceKey] || [], [byService, serviceKey]);
  const sizingRows = useMemo(() => bySizing?.[sizingKey] || [], [bySizing, sizingKey]);

  // meta (kept only for newest/oldest cards, but removed all mix/coverage/segment breakdown UI)
  const meta = data?.catalogMeta || {};
  const newestTools = meta?.newestTools || [];
  const oldestTools = meta?.oldestTools || [];

  // relationships / insights beyond counts
  const rel = data?.relationships || {};
  const correlations = rel?.correlations || {};
  const mostSizeSkewedTools = rel?.mostSizeSkewedTools || [];
  const complexityAssociation = rel?.complexityAssociation || [];

  // pairs
  const topPairs = useMemo(() => (data?.topToolPairs || []).slice(0, 12), [data]);
  const topLiftPairs = useMemo(() => (data?.topLiftPairs || []).slice(0, 12), [data]);
  const topJaccardPairs = useMemo(() => (data?.topJaccardPairs || []).slice(0, 12), [data]);

  const orgsWithInfra = Number(overview?.orgsWithInfra || 0);
  const centerOrgs = useMemo(() => `${fmtK(orgsWithInfra)}`, [orgsWithInfra]);

  // Turn pair rows into RankList-friendly rows with secondary metric
  const pairToRows = (pairs, metricKey, metricFmt) =>
    (pairs || []).slice(0, 12).map((p) => ({
      label: p.label,
      value: Number(p.value || 0),
      secondary: metricKey ? `${metricKey}: ${metricFmt(p[metricKey])}` : "",
    }));

  const skewRows = useMemo(() => {
    return (mostSizeSkewedTools || []).slice(0, 12).map((t) => ({
      label: `${niceLabel(t.label)} • ${niceLabel(t.topSizingBand)}`,
      value: Math.trunc(Number(t.orgCount || 0)),
      secondary: `Top-band share: ${fmtPct1(t.topSizingSharePct)}`,
    }));
  }, [mostSizeSkewedTools]);

  const complexityRows = useMemo(() => {
    return (complexityAssociation || []).slice(0, 12).map((t) => ({
      label: niceLabel(t.label),
      value: Math.trunc(Number(t.value || 0)),
      secondary: `Avg stack: ${Number(t.avgInfraToolsInUserOrgs || 0).toFixed(1)} • Avg size: ${fmtK(
        t.avgEmployeesInUserOrgs || 0
      )}`,
    }));
  }, [complexityAssociation]);

  const toolUniverse = useMemo(() => data?.infraTools || [], [data]);

  const topToolsCards = useMemo(() => {
    // pick top 10 tools with richer meta/assoc fields, keep it snappy
    return (toolUniverse || []).slice(0, 10);
  }, [toolUniverse]);

  const newestCards = useMemo(() => (newestTools || []).slice(0, 8), [newestTools]);
  const oldestCards = useMemo(() => (oldestTools || []).slice(0, 8), [oldestTools]);

  const correlationsUI = useMemo(() => {
    const r1 = Number(correlations.releaseYear_vs_orgAdoption || 0);
    const r2 = Number(correlations.pricingNumeric_vs_orgAdoption || 0);

    const hint1 =
      "Pearson correlation between tool release year and adoption (# orgs). Positive means newer tools tend to be more adopted; negative means older tools dominate.";
    const hint2 =
      "Pearson correlation between numeric pricing proxy and adoption (# orgs). This is heuristic because pricing parsing is messy.";

    const fmtR = (r) => (Number.isFinite(r) ? r.toFixed(2) : "0.00");

    return [
      { label: "Release year ↔ adoption (r)", value: fmtR(r1), hint: hint1 },
      { label: "Pricing ↔ adoption (r)", value: fmtR(r2), hint: hint2 },
    ];
  }, [correlations]);

  return (
    <InsightsShell
      title="Infrastructure Insights"
      subtitle=""
      active="infra"
    >
      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <a
          href="/participants/organizations/infrastructure"
          style={{
            border: "1px solid rgba(30,42,120,0.18)",
            background: "rgba(255,255,255,0.9)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 900,
            textDecoration: "none",
            color: "inherit",
            boxShadow: "0 10px 24px rgba(17,24,39,0.10)",
          }}
        >
          View organizations by infrastructure →
        </a>
      </div>

      {/* Error */}
      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(220,38,38,0.22)",
            background: "rgba(254,242,242,0.85)",
            color: "rgba(127,29,29,0.95)",
            fontWeight: 850,
            fontSize: 13,
          }}
        >
          Couldn’t load infra insights: <span style={{ fontWeight: 900 }}>{error}</span>
        </div>
      ) : null}

      {/* KPIs */}
      <CardGrid min={220}>
        <StatCard label="Organizations" value={overview.totalOrgs || 0} loading={loading} />
        <StatCard label="Orgs with infra" value={overview.orgsWithInfra || 0} loading={loading} />
        <StatCard label="Infra tools used" value={overview.totalInfraToolsUsed || 0} loading={loading} />
        <StatCard label="Median tools / org" value={overview.medianInfraToolsPerOrg || 0} loading={loading} />
        <StatCard label="Single-tool orgs" value={fmtPct0(overview.pctSingleToolOrgs)} loading={loading} />
        <StatCard label="Minimalist orgs (≤3)" value={fmtPct0(overview.pctMinimalistOrgs)} loading={loading} />
        <StatCard label="Top-5 concentration" value={fmtPct0(overview.top5ConcentrationPct)} loading={loading} />
        <StatCard label="Pipeline penetration" value={fmtPct0(overview.pipelinePct)} loading={loading} />
      </CardGrid>

      <Divider style={{ margin: "18px 0" }} />

      {/* Donut + Bar (bar BELOW donut) */}
      <Card
        title="Top infra tools by org prevalence"
        subtitle="Percent + counts for the most commonly listed tools"
        right={<Pill>Orgs</Pill>}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          Donut shows percent split among the top tools (hover works on slices + legend). Bar below shows raw org counts
          for readability of long labels.
        </div>

        {loading ? (
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 850 }}>Loading…</div>
        ) : (
          <>
            <DonutLite data={topInfraTools} centerTop="Orgs" centerBottom={`${centerOrgs} Orgs`} height={360} />

            <Divider style={{ margin: "18px 0" }} />

            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Counts: # of orgs listing each tool.
            </div>

            <BarChart
              data={topToolsBar}
              xKey="label"
              yKey="value"
              orientation="horizontal"
              height={barHeight(Math.min(20, topToolsBar.length || 12), 320)}
              emptyLabel="No data"
            />
          </>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Quick “rich tool cards” (meta + association insights beyond counts) */}
      <Card
        title="What the top tools “look like”"
        subtitle="For each tool: meta (license/pricing/release) + the kinds of orgs that tend to use it"
        right={<Pill>Beyond counts</Pill>}
      >
        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 8 }}>
          Stack size = number of infrastructure tools an organization uses.
        </div>

        <ToolCards
          rows={topToolsCards}
          maxRows={10}
          titleHint="These cards are built from infraTools (which includes per-tool averages like avg stack size and avg org size among adopters). Hover each card for counts."
          emptyLabel={loading ? "Loading…" : "No data"}
        />
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Pill-click drilldowns (kept) — uses RankList */}
      <TwoCol
        left={
          <Card
            title="Top tools by sales region"
            subtitle="Pick a region to see which tools are most prevalent"
            right={<Pill>Regions</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Counts are “# of orgs in this region that list the tool”.
            </div>

            <PillRow keys={regionKeys} active={regionKey} onPick={setRegionKey} />
            <RankList rows={regionRows} maxRows={12} valueLabel="Orgs" emptyLabel={loading ? "Loading…" : "No data"} />
          </Card>
        }
        right={
          <Card
            title="Top tools by country"
            subtitle="Pick a country to see which tools are most prevalent"
            right={<Pill>Countries</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Counts are “# of orgs in this country that list the tool”.
            </div>

            <PillRow keys={countryKeys} active={countryKey} onPick={setCountryKey} />
            <RankList rows={countryRows} maxRows={12} valueLabel="Orgs" emptyLabel={loading ? "Loading…" : "No data"} />
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      <TwoCol
        left={
          <Card
            title="Top tools by content type"
            subtitle="Pick a content type → see the tools that show up most"
            right={<Pill>Content</Pill>}
          >
            <PillRow keys={contentKeys} active={contentKey} onPick={setContentKey} />
            <RankList rows={contentRows} maxRows={12} valueLabel="Orgs" emptyLabel={loading ? "Loading…" : "No data"} />
          </Card>
        }
        right={
          <Card
            title="Top tools by service"
            subtitle="Pick a service → see tools that co-occur most"
            right={<Pill>Services</Pill>}
          >
            <PillRow keys={serviceKeys} active={serviceKey} onPick={setServiceKey} />
            <RankList rows={serviceRows} maxRows={12} valueLabel="Orgs" emptyLabel={loading ? "Loading…" : "No data"} />
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      <Card
        title="Top tools by org sizing"
        subtitle="Pick a size band → see tools that dominate that segment"
        right={<Pill>By Size</Pill>}
      >
        <PillRow keys={sizingKeys} active={sizingKey} onPick={setSizingKey} />
        <RankList rows={sizingRows} maxRows={12} valueLabel="Orgs" emptyLabel={loading ? "Loading…" : "No data"} />
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Co-usage patterns: common + lift + jaccard */}
      <TwoCol
        left={
          <Card
            title="Stack pairs"
            subtitle="Same underlying pairs, viewed three ways"
            right={<Pill>Co-usage</Pill>}
          >
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontWeight: 950, marginBottom: 8 }}>Most common (raw co-usage)</div>
                <RankList
                  rows={pairToRows(topPairs, null, () => "")}
                  maxRows={12}
                  valueLabel="Orgs"
                  emptyLabel={loading ? "Loading…" : "No data"}
                />
              </div>

              <div style={{ borderTop: "1px solid rgba(30,42,120,0.10)", paddingTop: 12 }}>
                <div style={{ fontWeight: 950, marginBottom: 8 }}>Strongest lift (unexpected co-usage)</div>
                <RankList
                  rows={pairToRows(topLiftPairs, "lift", (x) => Number(x || 0).toFixed(2))}
                  maxRows={12}
                  valueLabel="Orgs"
                  emptyLabel={loading ? "Loading…" : "No data"}
                />
              </div>
            </div>
          </Card>
        }
        right={
          <Card
            title="Overlap strength"
            subtitle="Jaccard: how much the two tool user sets overlap"
            right={<Pill>Overlap</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Higher Jaccard means the pair is used by many of the same orgs (not just “big tools”).
            </div>
            <RankList
              rows={pairToRows(topJaccardPairs, "jaccard", (x) => Number(x || 0).toFixed(2))}
              maxRows={12}
              valueLabel="Orgs"
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* Skew + complexity assoc */}
      <TwoCol
        left={
          <Card
            title="Most size-skewed tools"
            subtitle="Tools that concentrate heavily in one org size band"
            right={<Pill>Skew</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Uses “topSizingSharePct” (share of a tool’s adopters in its most-dominant size band).
            </div>
            <RankList rows={skewRows} maxRows={12} valueLabel="Orgs" emptyLabel={loading ? "Loading…" : "No data"} />
          </Card>
        }
        right={
          <Card
            title="Tools associated with complex stacks"
            subtitle="Among adopters, which tools show up with larger average stacks"
            right={<Pill>Complexity</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Uses avg stack size among adopter orgs (not global counts).
            </div>
            <RankList
              rows={complexityRows}
              maxRows={12}
              valueLabel="Orgs"
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* Correlations only (coverage/mixes/segment breakdown removed) */}
      <Card
        title="Signals & relationships"
        subtitle="Correlations derived from tool meta vs adoption"
        right={<Pill>Signals</Pill>}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          These are directional signals, not causal claims. Pricing correlation is especially heuristic.
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {correlationsUI.map((r) => (
            <MiniStatRow key={r.label} label={r.label} value={r.value} hint={r.hint} />
          ))}
        </div>
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Newest vs oldest as cards (kept) */}
      <TwoCol
        left={
          <Card title="Newest tools in catalog" subtitle="Sorted by release year (then adoption)" right={<Pill>New</Pill>}>
            <ToolCards
              rows={newestCards}
              maxRows={8}
              titleHint="These are tools with the newest release years in infra.csv, shown with their adoption counts."
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>
        }
        right={
          <Card title="Oldest tools in catalog" subtitle="Sorted by release year (then adoption)" right={<Pill>Old</Pill>}>
            <ToolCards
              rows={oldestCards}
              maxRows={8}
              titleHint="These are tools with the oldest release years in infra.csv, shown with their adoption counts."
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>
        }
      />
    </InsightsShell>
  );
}
