// FINAL – ServicesInsights.jsx
// Mirrors ContentTypeInsights UX, but for SERVICES.
// - Landscape + percent-only donut (custom, hoverable) with center "12.9K Orgs"
// - Scale (median org size)
// - Prevalent services by org sizing
// - Prevalent services by sales region + country (pill click)
// - Drilldown: popular content types + infra by service (pill click)

import React, { useEffect, useMemo, useState } from "react";
import InsightsShell from "../components/insights/InsightsShell";
import { Card, CardGrid, StatCard, Pill, Divider } from "../components/insights/Cards";
import BarChart from "../components/insights/BarChart";

function fmtPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0%";
  if (n < 1 && n > 0) return "<1%";
  return `${Math.round(n)}%`;
}

function fmtK(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  if (x >= 1000) return `${(x / 1000).toFixed(1)}K`;
  return String(Math.round(x));
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

/* -------------------------
   Inline Donut (percent-only)
   - Hover tooltip works
   - Legend hover sync
------------------------- */

const DONUT_COLORS = [
  "#3B82F6",
  "#2563EB",
  "#60A5FA",
  "#38BDF8",
  "#818CF8",
  "#22C55E",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

function InlineDonut({
  data, // [{ label, value }] where value is percent (0-100)
  height = 420,
  centerTop = "Orgs",
  centerValue = "—",
  ringWidth = 26,
}) {
  const size = Math.max(320, height);
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) - 26;
  const stroke = ringWidth;

  const cleaned = useMemo(() => {
    const rows = (Array.isArray(data) ? data : [])
      .map((d) => ({ label: String(d.label ?? ""), value: Number(d.value || 0) }))
      .filter((d) => d.label && Number.isFinite(d.value) && d.value > 0)
      .slice(0, 10);
    return rows;
  }, [data]);

  const total = useMemo(() => cleaned.reduce((s, d) => s + d.value, 0), [cleaned]);

  const arcs = useMemo(() => {
    if (!cleaned.length || total <= 0) return [];
    let cursor = 0;
    return cleaned.map((d, i) => {
      const start = cursor;
      const sweep = (d.value / total) * 360;
      const end = cursor + sweep;
      cursor = end;
      return {
        ...d,
        start,
        end: Math.max(end, start + 0.2),
        color: DONUT_COLORS[i % DONUT_COLORS.length],
        index: i,
      };
    });
  }, [cleaned, total]);

  const [hovered, setHovered] = useState(null); // arc payload
  const [tip, setTip] = useState({ x: 0, y: 0, show: false });

  const onEnter = (e, payload) => {
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect?.();
    if (rect) {
      setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true });
    } else {
      setTip((t) => ({ ...t, show: true }));
    }
    setHovered(payload);
  };

  const onMove = (e) => {
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect?.();
    if (!rect) return;
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true });
  };

  const onLeave = () => {
    setTip((t) => ({ ...t, show: false }));
    setHovered(null);
  };

  if (!arcs.length) {
    return (
      <div style={{ height, display: "grid", placeItems: "center", opacity: 0.7, fontWeight: 900 }}>
        No data
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18, alignItems: "center" }}>
      <div style={{ position: "relative", height, display: "grid", placeItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "100%" }}>
          {/* track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(17,24,39,0.08)" strokeWidth={stroke} />

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
                <title>
                  {a.label}: {fmtPct(a.value)}
                </title>
              </path>
            );
          })}

          {/* center */}
          <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="rgba(255,255,255,0.98)" />
          <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontWeight: 950, fontSize: 14, fill: "rgba(17,24,39,0.9)" }}>
            {centerTop}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontWeight: 950, fontSize: 34, fill: "rgba(17,24,39,0.95)" }}>
            {centerValue}
          </text>

          {/* tooltip */}
          {tip.show && hovered ? (
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
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: hovered.color, display: "inline-block" }} />
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hovered.label}
                  </div>
                  <div style={{ opacity: 0.85 }}>{fmtPct(hovered.value)}</div>
                </div>
              </div>
            </foreignObject>
          ) : null}
        </svg>
      </div>

      {/* legend */}
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
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: a.color, display: "inline-block" }} />
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

/* -------------------------
   Page
------------------------- */

export default function ServicesInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetch("/api/insights/services")
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
  const services = data?.services || [];
  const topServices = useMemo(() => services.slice(0, 10), [services]);

  const landscape = useMemo(
    () => topServices.map((s) => ({ label: s.service, value: Number(s.orgCount || 0) })),
    [topServices]
  );

  const orgSharePct = useMemo(
    () => topServices.map((s) => ({ label: s.service, value: Number(s.orgSharePct || 0) })),
    [topServices]
  );

  const medianSize = useMemo(
    () => topServices.map((s) => ({ label: s.service, value: Number(s.medianOrgSize || 0) })),
    [topServices]
  );

  // sizing -> [{label: service, value: orgsInSize}]
  const servicesBySizing = useMemo(() => {
    const map = new Map(); // sizing -> Map(service -> count)

    for (const svc of services) {
      const name = svc?.service;
      const breakdown = Array.isArray(svc?.sizingBreakdown) ? svc.sizingBreakdown : [];
      for (const b of breakdown) {
        const sizing = String(b?.label ?? "Unknown") || "Unknown";
        const v = Number(b?.value || 0);
        if (!v || !name) continue;

        if (!map.has(sizing)) map.set(sizing, new Map());
        const inner = map.get(sizing);
        inner.set(name, (inner.get(name) || 0) + v);
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
          .map(([label, value]) => ({ label, value: Number(value || 0) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        return { sizing, rows };
      })
      .filter((x) => x.rows.length);
  }, [services]);

  // ---- Region pills ----
  const byRegion = data?.topServicesByRegion || {};
  const regionKeys = useMemo(() => Object.keys(byRegion).map(niceLabel), [byRegion]);
  const [selectedRegion, setSelectedRegion] = useState("");

  useEffect(() => {
    if (!selectedRegion && regionKeys.length) setSelectedRegion(regionKeys[0]);
  }, [selectedRegion, regionKeys]);

  const regionRows = useMemo(() => {
    const raw = byRegion?.[selectedRegion] || byRegion?.[regionKeys[0]] || [];
    return (raw || []).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [byRegion, selectedRegion, regionKeys]);

  // ---- Country pills ----
  const byCountry = data?.topServicesByCountry || {};
  const countryKeys = useMemo(() => Object.keys(byCountry).map(niceLabel), [byCountry]);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    if (!selectedCountry && countryKeys.length) setSelectedCountry(countryKeys[0]);
  }, [selectedCountry, countryKeys]);

  const countryRows = useMemo(() => {
    const raw = byCountry?.[selectedCountry] || byCountry?.[countryKeys[0]] || [];
    return (raw || []).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [byCountry, selectedCountry, countryKeys]);

  // ---- Drilldown pills (service -> content types + infra) ----
  const topContentTypesByService = data?.topContentTypesByService || {};
  const topInfraByService = data?.topInfraByService || {};

  const drillServices = useMemo(() => topServices.map((s) => s.service), [topServices]);
  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    if (!selectedService && drillServices.length) setSelectedService(drillServices[0]);
  }, [selectedService, drillServices]);

  const contentTypesForService = useMemo(() => {
    const rows = topContentTypesByService?.[selectedService] || [];
    return (rows || []).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [topContentTypesByService, selectedService]);

  const infraForService = useMemo(() => {
    const rows = topInfraByService?.[selectedService] || [];
    return (rows || []).map((d) => ({ label: d.label, value: Number(d.value || 0) }));
  }, [topInfraByService, selectedService]);

  const topSharePct = topServices?.[0]?.orgSharePct ?? 0;
  const topShareName = topServices?.[0]?.service ?? "";

  return (
    <InsightsShell
      title="Services Insights"
      subtitle="What services exist, where they’re most prevalent, and what content/tools tend to show up with each service."
      active="services"
    >
      {/* CTA */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <a
          href="/participants/organizations/services"
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
          View organizations by service →
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
          Couldn’t load services insights: <span style={{ fontWeight: 900 }}>{error}</span>
        </div>
      ) : null}

      {/* KPIs */}
      <CardGrid min={220}>
        <StatCard label="Services" value={overview.totalServices || 0} loading={loading} />
        <StatCard label="Organizations" value={overview.totalOrgs || 0} loading={loading} />
        <StatCard label="Median services / org" value={overview.medianServicesPerOrg || 0} loading={loading} />
        <StatCard label="Top service by org share" value={fmtPct(topSharePct)} sublabel={topShareName} loading={loading} />
      </CardGrid>

      <Divider style={{ margin: "18px 0" }} />

      {/* Landscape */}
      <Card title="Service landscape" subtitle="Most common services across organizations" right={<Pill>Orgs</Pill>}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Count of organizations that list each service.
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

      <Divider style={{ margin: "18px 0" }} />

      {/* Percent-only donut */}
      <Card title="Percent of orgs per service" subtitle="Share of all organizations that list each service" right={<Pill>%</Pill>}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Hover to see service + percent (no raw counts shown here).
        </div>
        <InlineDonut
          data={orgSharePct}
          height={420}
          centerTop="Orgs"
          centerValue={`${fmtK(overview.totalOrgs || 0)} Orgs`}
          ringWidth={26}
        />
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Scale */}
      <Card title="Scale by service" subtitle="Median org size for organizations that list each service" right={<Pill>Employees</Pill>}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Median adjusted employee count for orgs that list each service.
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
      <Card title="Prevalent services by org sizing" subtitle="Within each size band, which services show up most" right={<Pill>By Size</Pill>}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
          For each org size band, this ranks services by number of orgs in that band.
        </div>

        {loading ? (
          <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 850 }}>Loading…</div>
        ) : servicesBySizing.length ? (
          <div style={{ display: "grid", gap: 14 }}>
            {servicesBySizing.map((sec) => (
              <div key={sec.sizing} style={{ borderTop: "1px solid rgba(30,42,120,0.10)", paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 950 }}>{sec.sizing}</div>
                  <Pill>Top services</Pill>
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

      {/* Region pills */}
      <Card title="Most prevalent services by sales region" subtitle="Pick a region to see what services are most common there" right={<Pill>Regions</Pill>}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Counts are org-level prevalence within the region.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {regionKeys.map((r) => {
            const active = r === selectedRegion;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: `1px solid ${active ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
                  background: active ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.72)",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
                title={r}
              >
                {r}
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

      <Divider style={{ margin: "18px 0" }} />

      {/* Country pills */}
      <Card title="Most prevalent services by country" subtitle="Pick a country to see the most common services there" right={<Pill>Countries</Pill>}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Showing top countries (by prevalence) with their top services.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {countryKeys.map((c) => {
            const active = c === selectedCountry;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCountry(c)}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: `1px solid ${active ? "rgba(60,130,255,0.30)" : "rgba(30,42,120,0.14)"}`,
                  background: active ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.72)",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
                title={c}
              >
                {c}
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

      <Divider style={{ margin: "18px 0" }} />

      {/* Drilldown */}
      <Card
        title="Popular content types and infrastructure by service"
        subtitle="Pick a service to see what content and tools tend to show up with it"
        right={<Pill>Popularity</Pill>}
      >
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>
          Counts are “# of orgs” within the selected service.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {drillServices.map((name) => {
            const active = name === selectedService;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedService(name)}
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

        {/* stacked, not side-by-side */}
        <div style={{ display: "grid", gap: 14 }}>
          <Card title={`Popular content types for: ${selectedService || "—"}`} subtitle="Most common content types among orgs listing this service" right={<Pill>Content</Pill>}>
            <BarChart
              data={contentTypesForService}
              xKey="label"
              yKey="value"
              orientation="horizontal"
              height={barHeight(contentTypesForService.length || 8, 260)}
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>

          <Card title={`Popular infrastructure for: ${selectedService || "—"}`} subtitle="Most common tools among orgs listing this service" right={<Pill>Infra</Pill>}>
            <BarChart
              data={infraForService}
              xKey="label"
              yKey="value"
              orientation="horizontal"
              height={barHeight(infraForService.length || 8, 260)}
              emptyLabel={loading ? "Loading…" : "No data"}
            />
          </Card>
        </div>
      </Card>
    </InsightsShell>
  );
}
