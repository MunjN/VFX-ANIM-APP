// FINAL – ContentTypeInsights.jsx
// Uses canonical chart shape: [{ label, value }] everywhere.
// Updated:
// ✅ Bring back pill-click interface for Sales Regions + Countries (single chart per selector).
// ✅ Replace DonutChart usage with an inline, standalone Donut (SVG) that shows:
//    - ring slices = % of orgs per content type
//    - legend shows ONLY percent (no raw numbers)
//    - center shows "12.9K Orgs" (or whatever overview.totalOrgs is)
//    - does NOT depend on ../components/insights/DonutChart

import React, { useEffect, useMemo, useState } from "react";
import InsightsShell from "../components/insights/InsightsShell";
import { Card, CardGrid, StatCard, Pill, Divider, TwoCol } from "../components/insights/Cards";
import BarChart from "../components/insights/BarChart";

const base = import.meta.env.VITE_API_BASE;

function fmtPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0%";
  if (n < 1 && n > 0) return "<1%";
  return `${n.toFixed(0)}%`;
}

function fmtCompact(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  const abs = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${Math.round(x)}`;
}

// Matches BarChart Horizontal layout constants
function barHeight(n, min = 260) {
  const padT = 28,
    padB = 18,
    rowH = 32,
    gap = 12;
  const needed = padT + padB + n * rowH + Math.max(0, n - 1) * gap;
  return Math.max(min, needed);
}

function niceLabel(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function objEntriesSorted(obj = {}) {
  return Object.entries(obj).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

const SIZING_ORDER = [
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001-None",
  "Unknown",
];

/* ---------------------------
   Inline SVG Donut (standalone)
   --------------------------- */

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// A clean palette (no external dep). You can swap to your brand palette later.
const DONUT_COLORS = [
  "#2563EB", // blue-600
  "#3B82F6", // blue-500
  "#60A5FA", // blue-400
  "#38BDF8", // sky-400
  "#818CF8", // indigo-400
  "#22C55E", // green-500
  "#F59E0B", // amber-500
  "#A855F7", // purple-500
  "#EC4899", // pink-500
  "#14B8A6", // teal-500
];

function InlineDonut({
  data, // [{ label, value }] where value is PERCENT (0-100)
  height = 420,
  centerTop = "Orgs",
  centerValue = "—",
  ringWidth = 20,
}) {
  const size = Math.max(320, height);
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) - 26;
  const stroke = ringWidth;

  const cleaned = useMemo(() => {
    const rows = (Array.isArray(data) ? data : [])
      .map((d) => ({ label: String(d.label ?? ""), value: Number(d.value || 0) }))
      .filter((d) => d.label && Number.isFinite(d.value) && d.value > 0);

    return rows.slice(0, 10);
  }, [data]);

  const total = useMemo(() => cleaned.reduce((s, d) => s + d.value, 0), [cleaned]);

  const [hovered, setHovered] = useState(null); // { label, value, color, index } | null
  const [tip, setTip] = useState({ x: 0, y: 0, show: false });

  const onEnter = (e, payload) => {
    // tooltip anchored to the donut container (not page)
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect?.();
    if (rect) {
      setTip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        show: true,
      });
    } else {
      setTip((t) => ({ ...t, show: true }));
    }
    setHovered(payload);
  };

  const onMove = (e) => {
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect?.();
    if (!rect) return;
    setTip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      show: true,
    });
  };

  const onLeave = () => {
    setTip((t) => ({ ...t, show: false }));
    setHovered(null);
  };

  if (!cleaned.length || total <= 0) {
    return (
      <div style={{ height, display: "grid", placeItems: "center", opacity: 0.7, fontWeight: 900 }}>
        No data
      </div>
    );
  }

  // Precompute arcs so we can hover by index reliably
  const arcs = [];
  let cursor = 0;
  cleaned.forEach((d, i) => {
    const start = cursor;
    const sweep = (d.value / total) * 360;
    const end = cursor + sweep;
    cursor = end;
    arcs.push({
      ...d,
      start,
      end: Math.max(end, start + 0.2),
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      index: i,
    });
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18, alignItems: "center" }}>
      {/* Donut */}
      <div style={{ position: "relative", height, display: "grid", placeItems: "center" }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ maxWidth: "100%", overflow: "visible" }}
        >
          {/* background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(17,24,39,0.08)"
            strokeWidth={stroke}
          />

          {/* slices */}
          {arcs.map((a) => {
            const isHot = hovered?.index === a.index;
            return (
              <path
                key={`${a.label}-${a.index}`}
                d={describeArc(cx, cy, r, a.start, a.end)}
                fill="none"
                stroke={a.color}
                strokeWidth={isHot ? stroke + 4 : stroke}
                strokeOpacity={hovered ? (isHot ? 1 : 0.45) : 1}
                strokeLinecap="butt"
                style={{ cursor: "pointer", transition: "stroke-width 120ms ease, stroke-opacity 120ms ease" }}
                onMouseEnter={(e) => onEnter(e, a)}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
              >
                {/* fallback native tooltip */}
                <title>
                  {a.label}: {fmtPct(a.value)}
                </title>
              </path>
            );
          })}

          {/* center cutout */}
          <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="rgba(255,255,255,0.98)" />

          {/* center text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            style={{ fontWeight: 950, fontSize: 14, fill: "rgba(17,24,39,0.9)" }}
          >
            {centerTop}
          </text>
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            style={{ fontWeight: 950, fontSize: 34, fill: "rgba(17,24,39,0.95)" }}
          >
            {centerValue}
          </text>

          {/* Custom tooltip */}
          {tip.show && hovered ? (
            <g>
              {/* tooltip background via foreignObject keeps text crisp */}
              <foreignObject
                x={Math.min(Math.max(tip.x + 12, 8), size - 220)}
                y={Math.min(Math.max(tip.y + 12, 8), size - 70)}
                width={212}
                height={60}
                style={{ pointerEvents: "none" }}
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(30,42,120,0.16)",
                    borderRadius: 12,
                    boxShadow: "0 12px 26px rgba(17,24,39,0.14)",
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 900,
                    color: "rgba(17,24,39,0.92)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: hovered.color,
                        display: "inline-block",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {hovered.label}
                    </div>
                    <div style={{ opacity: 0.85 }}>{fmtPct(hovered.value)}</div>
                  </div>
                </div>
              </foreignObject>
            </g>
          ) : null}
        </svg>
      </div>

      {/* Legend (hover sync) */}
      <div style={{ maxHeight: height - 20, overflow: "auto", paddingRight: 6 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {arcs.map((a) => {
            const isHot = hovered?.index === a.index;
            return (
              <div
                key={`legend-${a.label}-${a.index}`}
                style={{
                  border: `1px solid ${isHot ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
                  borderRadius: 16,
                  background: isHot ? "rgba(60,130,255,0.10)" : "rgba(255,255,255,0.74)",
                  padding: "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "16px 1fr auto",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  transition: "background 120ms ease, border-color 120ms ease",
                }}
                title={`${a.label}: ${fmtPct(a.value)}`}
                onMouseEnter={(e) => onEnter(e, a)}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: a.color,
                    display: "inline-block",
                  }}
                />
                <div style={{ fontWeight: 950 }}>{a.label}</div>
                <div style={{ fontWeight: 950, opacity: 0.85 }}>{fmtPct(a.value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export default function ContentTypeInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetch(base+"/api/insights/content")
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
        setError(e?.message || "Failed to load insights");
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
  const contentTypes = data?.contentTypes || [];

  const topContent = useMemo(() => (contentTypes || []).slice(0, 10), [contentTypes]);

  // ---- Core charts ----
  const landscape = useMemo(
    () => topContent.map((c) => ({ label: c.contentType, value: Number(c.orgCount || 0) })),
    [topContent]
  );

  // Donut expects percent values in "value"
  const orgSharePctRows = useMemo(
    () => topContent.map((c) => ({ label: c.contentType, value: Number(c.orgSharePct || 0) })),
    [topContent]
  );

  const medianSize = useMemo(
    () => topContent.map((c) => ({ label: c.contentType, value: Number(c.medianOrgSize || 0) })),
    [topContent]
  );

  // ---- Prevalent by org sizing ----
  const contentBySizing = useMemo(() => {
    const map = new Map(); // sizing -> Map(contentType -> count)

    for (const ct of contentTypes) {
      const ctName = ct?.contentType;
      const breakdown = Array.isArray(ct?.sizingBreakdown) ? ct.sizingBreakdown : [];
      for (const b of breakdown) {
        const sizing = String(b?.label ?? "Unknown") || "Unknown";
        const v = Number(b?.value || 0);
        if (!v || !ctName) continue;
        if (!map.has(sizing)) map.set(sizing, new Map());
        const inner = map.get(sizing);
        inner.set(ctName, (inner.get(ctName) || 0) + v);
      }
    }

    const sizes = [...map.keys()].sort((a, b) => {
      const ia = SIZING_ORDER.indexOf(a);
      const ib = SIZING_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return String(a).localeCompare(String(b));
    });

    return sizes
      .map((sizing) => {
        const inner = map.get(sizing);
        const rows = [...inner.entries()]
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        return rows.length ? { sizing, rows } : null;
      })
      .filter(Boolean);
  }, [contentTypes]);

  // ---- Region/Country prevalence (pill-select) ----
  const topContentTypesByRegion = useMemo(() => data?.topContentTypesByRegion || {}, [data]);
  const topContentTypesByCountry = useMemo(() => data?.topContentTypesByCountry || {}, [data]);

  const regionKeys = useMemo(() => objEntriesSorted(topContentTypesByRegion).map(([k]) => k), [topContentTypesByRegion]);
  const countryKeys = useMemo(() => {
    // keep only top 10 countries by total prevalence (sum of list), but pills still clickable among these
    const entries = objEntriesSorted(topContentTypesByCountry);
    const scored = entries
      .map(([country, rows]) => ({
        country,
        total: (rows || []).reduce((s, r) => s + (Number(r?.value) || 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((x) => x.country);
    return scored;
  }, [topContentTypesByCountry]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    if (!selectedRegion && regionKeys.length) setSelectedRegion(regionKeys[0]);
  }, [selectedRegion, regionKeys]);

  useEffect(() => {
    if (!selectedCountry && countryKeys.length) setSelectedCountry(countryKeys[0]);
  }, [selectedCountry, countryKeys]);

  const regionRows = useMemo(() => {
    const rows = topContentTypesByRegion?.[selectedRegion] || [];
    return (rows || []).slice(0, 10).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [topContentTypesByRegion, selectedRegion]);

  const countryRows = useMemo(() => {
    const rows = topContentTypesByCountry?.[selectedCountry] || [];
    return (rows || []).slice(0, 10).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [topContentTypesByCountry, selectedCountry]);

  // ---- Services/Infra drilldown ----
  const topServicesByContentType = useMemo(() => data?.topServicesByContentType || {}, [data]);
  const topInfraByContentType = useMemo(() => data?.topInfraByContentType || {}, [data]);

  const ctSelector = useMemo(() => topContent.map((c) => c.contentType), [topContent]);
  const [selectedCT, setSelectedCT] = useState("");

  useEffect(() => {
    if (!selectedCT && ctSelector.length) setSelectedCT(ctSelector[0]);
  }, [selectedCT, ctSelector]);

  const servicesForCT = useMemo(() => {
    const rows = topServicesByContentType?.[selectedCT] || [];
    return (rows || []).slice(0, 12).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [topServicesByContentType, selectedCT]);

  const infraForCT = useMemo(() => {
    const rows = topInfraByContentType?.[selectedCT] || [];
    return (rows || []).slice(0, 12).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [topInfraByContentType, selectedCT]);

  const topSharePct = topContent?.[0]?.orgSharePct ?? 0;
  const topShareName = topContent?.[0]?.contentType ?? "";

  const totalOrgs = Number(overview.totalOrgs || 0);

  return (
    <InsightsShell
      title="Content Type Insights"
      subtitle="What kinds of content exist, who produces them, and what tools/services tend to show up with each content type."
      active="content"
    >
      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <a
          href="/participants/organizations/content-types"
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
          View organizations by content type →
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
          Couldn’t load content insights: <span style={{ fontWeight: 900 }}>{error}</span>
        </div>
      ) : null}

      {/* KPIs */}
      <CardGrid min={220}>
        <StatCard label="Content types" value={overview.totalContentTypes || 0} loading={loading} />
        <StatCard label="Organizations" value={overview.totalOrgs || 0} loading={loading} />
        <StatCard
          label="Median content types / org"
          value={overview.medianContentTypesPerOrg || 0}
          loading={loading}
        />
        <StatCard
          label="Top content by org share"
          value={fmtPct(topSharePct)}
          sublabel={topShareName}
          loading={loading}
        />
      </CardGrid>

      <Divider style={{ margin: "18px 0" }} />

      {/* Landscape + NEW Donut */}
      <TwoCol
        left={
          <Card
            title="Content type landscape"
            subtitle="Most common capabilities across organizations"
            right={<Pill>Orgs</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
              Count of organizations that list each content type.
            </div>
            <BarChart
              data={landscape}
              xKey="label"
              yKey="value"
              orientation="horizontal"
              height={barHeight(landscape.length, 260)}
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>
        }
        right={
          <Card
            title="Percent of orgs per content type"
            subtitle="Percent of all organizations that list each content type"
            right={<Pill>%</Pill>}
          >
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
              Showing percentages only. Center shows total organizations.
            </div>

            <InlineDonut
              data={orgSharePctRows}
              height={420}
              centerTop="Orgs"
              centerValue={`${fmtCompact(totalOrgs)} Orgs`}
              ringWidth={22}
            />
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* Scale */}
      <Card
        title="Scale by content type"
        subtitle="Median org size for organizations that list each content type"
        right={<Pill>Employees</Pill>}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Median adjusted employee count for organizations that list each content type.
        </div>
        <BarChart
          data={medianSize}
          xKey="label"
          yKey="value"
          orientation="horizontal"
          height={barHeight(medianSize.length, 260)}
          emptyLabel={loading ? "Loading…" : "No data"}
        />
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Prevalent by sizing */}
      <Card
        title="Prevalent content types by org sizing"
        subtitle="Within each size band, which content types show up most"
        right={<Pill>By Size</Pill>}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          For each org size band, this ranks content types by number of orgs in that band.
        </div>

        {loading ? (
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 850 }}>Loading…</div>
        ) : contentBySizing.length ? (
          <div style={{ display: "grid", gap: 14 }}>
            {contentBySizing.map((sec) => (
              <div key={sec.sizing} style={{ borderTop: "1px solid rgba(30,42,120,0.10)", paddingTop: 12 }}>
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}
                >
                  <div style={{ fontWeight: 950 }}>{sec.sizing}</div>
                  <Pill>Top content types</Pill>
                </div>
                <BarChart
                  data={sec.rows}
                  xKey="label"
                  yKey="value"
                  orientation="horizontal"
                  height={barHeight(sec.rows.length, 220)}
                  emptyLabel="No data"
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 850 }}>No data</div>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Regions + Countries (STACKED, WITH PILLS) */}
      <div style={{ display: "grid", gap: 18 }}>
        <Card
          title="Content types by sales region"
          subtitle="Pick a region to see which content types are most prevalent"
          right={<Pill>Regions</Pill>}
        >
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
            Counts are “# of orgs in this region that list the content type”.
          </div>

          {/* region pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {regionKeys.map((k) => {
              const active = k === selectedRegion;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedRegion(k)}
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    border: `1px solid ${active ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
                    background: active ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.72)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                  title={niceLabel(k)}
                >
                  {niceLabel(k)}
                </button>
              );
            })}
          </div>

          <BarChart
            data={regionRows}
            xKey="label"
            yKey="value"
            orientation="horizontal"
            height={barHeight(regionRows.length || 8, 260)}
            emptyLabel={loading ? "Loading…" : "No data"}
          />
        </Card>

        <Card
          title="Content types by country"
          subtitle="Pick a country to see which content types are most prevalent"
          right={<Pill>Countries</Pill>}
        >
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
            Counts are “# of orgs in this country that list the content type”.
          </div>

          {/* country pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {countryKeys.map((k) => {
              const active = k === selectedCountry;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedCountry(k)}
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    border: `1px solid ${active ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
                    background: active ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.72)",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                  title={niceLabel(k)}
                >
                  {niceLabel(k)}
                </button>
              );
            })}
          </div>

          <BarChart
            data={countryRows}
            xKey="label"
            yKey="value"
            orientation="horizontal"
            height={barHeight(countryRows.length || 8, 260)}
            emptyLabel={loading ? "Loading…" : "No data"}
          />
        </Card>
      </div>

      <Divider style={{ margin: "18px 0" }} />

      {/* Services + Infra drilldown per content type */}
      <Card
        title="Popular services and infrastructure by content type"
        subtitle="Pick a content type to see what shows up most often"
        right={<Pill>Popularity</Pill>}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Counts are “# of orgs” within the selected content type.
        </div>

        {/* selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {ctSelector.map((name) => {
            const active = name === selectedCT;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedCT(name)}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: `1px solid ${active ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
                  background: active ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.72)",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
                title={name}
              >
                {name}
              </button>
            );
          })}
        </div>

        <TwoCol
          left={
            <Card
              title={`Popular services for: ${selectedCT || "—"}`}
              subtitle="Most frequently listed services within this content type"
              right={<Pill>Services</Pill>}
            >
              <BarChart
                data={servicesForCT}
                xKey="label"
                yKey="value"
                orientation="horizontal"
                height={barHeight(servicesForCT.length || 8, 260)}
                emptyLabel={loading ? "Loading…" : "No data"}
              />
            </Card>
          }
          right={
            <Card
              title={`Popular infrastructure for: ${selectedCT || "—"}`}
              subtitle="Most frequently listed tools within this content type"
              right={<Pill>Infra</Pill>}
            >
              <BarChart
                data={infraForCT}
                xKey="label"
                yKey="value"
                orientation="horizontal"
                height={barHeight(infraForCT.length || 8, 260)}
                emptyLabel={loading ? "Loading…" : "No data"}
              />
            </Card>
          }
        />
      </Card>
    </InsightsShell>
  );
}
