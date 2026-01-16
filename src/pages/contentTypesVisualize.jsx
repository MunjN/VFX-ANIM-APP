import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CONTENT_TYPES_REFERENCE } from "./ContentTypes";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const PAGE = { max: 1280 };

const base = import.meta.env.VITE_API_BASE;
function normalize(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function splitTokens(s) {
  return String(s ?? "")
    .split(/,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function uniqTokensForOrg(raw) {
  const seen = new Set();
  for (const t of splitTokens(raw)) seen.add(t);
  return Array.from(seen);
}

/* =========================
   UI bits
========================= */

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        borderRadius: 999,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "normal",
      }}
    >
      {children}
    </span>
  );
}

function Chip({ label, onRemove, title }) {
  return (
    <span
      title={title || label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 999,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(207,239,247,0.45)",
        color: BRAND.ink,
        fontWeight: 1000,
        fontSize: 12,
        maxWidth: 320,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 1100,
            color: "rgba(30,42,120,0.75)",
          }}
          title="Remove"
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}

function RowLink({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        color: BRAND.ink,
        fontWeight: 1100,
        textDecoration: "underline",
        textUnderlineOffset: 3,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, onClick, active, style, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        border: `1px solid rgba(30,42,120,0.14)`,
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        boxShadow: active ? "0 18px 60px rgba(30,42,120,0.16)" : "0 16px 56px rgba(30,42,120,0.07)",
        transform: active ? "translateY(-1px)" : "none",
        transition: "transform 140ms ease, box-shadow 140ms ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function CardTopBar() {
  return (
    <div
      style={{
        height: 10,
        background: "linear-gradient(90deg, rgba(207,239,247,1), rgba(207,239,247,0.55))",
        borderBottom: "1px solid rgba(30,42,120,0.10)",
      }}
    />
  );
}

function NodeRow({ label, value, rightMeta }) {
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 1100, color: BRAND.text, fontSize: 14 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          {rightMeta ? (
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, color: BRAND.ink }}>{rightMeta}</div>
          ) : null}
          <div style={{ fontWeight: 1100, color: BRAND.ink, fontSize: 14 }}>{(value ?? 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ k, title }) {
  return (
    <div style={{ padding: "10px 2px 8px" }}>
      <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>{k}</div>
      <div style={{ fontSize: 14, fontWeight: 1100, color: BRAND.ink }}>{title}</div>
    </div>
  );
}

function BarRow({ label, value, maxValue, selected, onClick, title }) {
  const pct = maxValue > 0 ? Math.max(0, Math.min(1, value / maxValue)) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || `${label}: ${(value ?? 0).toLocaleString()} orgs`}
      style={{
        width: "100%",
        border: selected ? "2px solid rgba(30,42,120,0.35)" : "1px solid rgba(30,42,120,0.12)",
        background: "#FFFFFF",
        borderRadius: 14,
        padding: 12,
        cursor: "pointer",
        textAlign: "left",
        boxShadow: "0 14px 46px rgba(30,42,120,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            fontWeight: 1100,
            color: BRAND.text,
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
                          lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        <div style={{ fontWeight: 1100, color: BRAND.ink, fontSize: 13 }}>{(value ?? 0).toLocaleString()}</div>
      </div>

      <div
        style={{
          marginTop: 8,
          height: 10,
          borderRadius: 999,
          background: "rgba(207,239,247,0.85)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct * 100}%`,
            background: selected ? BRAND.ink : "rgba(30,42,120,0.45)",
          }}
        />
      </div>
    </button>
  );
}

/* =========================
   Donut chart (single, with real hover tooltip)
========================= */

const DONUT_PALETTE = [
  BRAND.ink,
  "rgba(30,42,120,0.78)",
  "rgba(30,42,120,0.62)",
  "rgba(30,42,120,0.48)",
  "rgba(30,42,120,0.36)",
  "rgba(207,239,247,1)",
  "rgba(207,239,247,0.78)",
  "rgba(207,239,247,0.58)",
  "rgba(207,239,247,0.40)",
];

function polar(cx, cy, r, a) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, rOuter, rInner, a0, a1) {
  const p0 = polar(cx, cy, rOuter, a0);
  const p1 = polar(cx, cy, rOuter, a1);
  const p2 = polar(cx, cy, rInner, a1);
  const p3 = polar(cx, cy, rInner, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({ title, subtitle, rows, selectedSet, onToggle, maxSlices = 8, totalOverride }) {
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null); // {x,y,text}

  const sumCounts = rows.reduce((s, r) => s + (r.count || 0), 0) || 0;

  // denom is what we *display* (unique orgs) and what we use for % labels
  const denom = Number(totalOverride ?? sumCounts) || 0;

  const display = useMemo(() => {
    const top = rows.slice(0, maxSlices);
    const rest = rows.slice(maxSlices);
    const restCount = rest.reduce((s, r) => s + (r.count || 0), 0);
    const out = [...top];
    if (restCount > 0) out.push({ name: "Other", count: restCount, __other: true });
    return out;
  }, [rows, maxSlices]);

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 95;
  const rInner = 60;

  const showTip = (evt, text) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    setTip({ x, y, text });
  };

  const hideTip = () => setTip(null);

  let a = -Math.PI / 2;

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        border: `1px solid rgba(30,42,120,0.14)`,
        borderRadius: 18,
        background: "#FFFFFF",
        boxShadow: "0 22px 80px rgba(30,42,120,0.06)",
        overflow: "hidden",
      }}
      onMouseLeave={hideTip}
    >
      {tip ? (
        <div
          style={{
            position: "absolute",
            left: Math.min(Math.max(8, tip.x + 12), 380),
            top: Math.max(8, tip.y + 12),
            zIndex: 5,
            pointerEvents: "none",
            background: "rgba(17,24,39,0.96)",
            color: "white",
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 950,
            maxWidth: 260,
            boxShadow: "0 16px 50px rgba(0,0,0,0.25)",
            lineHeight: 1.25,
          }}
        >
          {tip.text}
        </div>
      ) : null}

      <div style={{ padding: 14, borderBottom: "1px solid rgba(30,42,120,0.10)" }}>
        <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>{title}</div>
        <div style={{ fontSize: 14, fontWeight: 1100, color: BRAND.ink }}>{subtitle}</div>
      </div>

      <div style={{ padding: 14, display: "grid", gridTemplateColumns: "260px 1fr", gap: 14, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={rOuter} fill="rgba(207,239,247,0.22)" />
          {display.map((r, idx) => {
            const frac = sumCounts > 0 ? (r.count || 0) / sumCounts : 0;
            const a0 = a;
            const a1 = a + frac * Math.PI * 2;
            a = a1;

            const isSelected = selectedSet?.has(r.name);
            const fill = DONUT_PALETTE[idx % DONUT_PALETTE.length];
            const path = arcPath(cx, cy, rOuter, rInner, a0, a1);

            const pct = denom > 0 ? Math.round(((r.count || 0) / denom) * 1000) / 10 : 0;
            const hoverText = `${r.name}: ${(r.count || 0).toLocaleString()} orgs (${pct}%)${r.__other ? "" : " — click to toggle"}`;

            return (
              <path
                key={r.name}
                d={path}
                fill={fill}
                stroke={isSelected ? "rgba(30,42,120,0.95)" : "rgba(255,255,255,0.9)"}
                strokeWidth={isSelected ? 2.5 : 1}
                style={{ cursor: r.__other ? "default" : "pointer", opacity: r.__other ? 0.55 : 1 }}
                onMouseMove={(e) => showTip(e, hoverText)}
                onClick={() => {
                  if (r.__other) return;
                  onToggle?.(r.name);
                }}
              />
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontWeight: 1100, fill: BRAND.ink, fontSize: 18 }}>
            {denom.toLocaleString()}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            style={{ fontWeight: 900, fill: "rgba(30,42,120,0.75)", fontSize: 11 }}
          >
            orgs
          </text>
        </svg>

        <div style={{ maxHeight: 220, overflow: "auto", paddingRight: 4 }}>
          <div style={{ display: "grid", gap: 8 }}>
            {display.map((r, idx) => {
              const isSelected = selectedSet?.has(r.name);
              const pct = denom > 0 ? Math.round(((r.count || 0) / denom) * 1000) / 10 : 0;
              const hoverText = r.__other
                ? `Other: ${(r.count || 0).toLocaleString()} orgs (${pct}%)`
                : `${r.name}: ${(r.count || 0).toLocaleString()} orgs (${pct}%) — click to toggle`;

              return (
                <button
                  key={r.name}
                  type="button"
                  disabled={r.__other}
                  onClick={() => !r.__other && onToggle?.(r.name)}
                  onMouseMove={(e) => showTip(e, hoverText)}
                  style={{
                    border: isSelected ? "2px solid rgba(30,42,120,0.35)" : "1px solid rgba(30,42,120,0.12)",
                    background: "#FFFFFF",
                    borderRadius: 14,
                    padding: "10px 12px",
                    textAlign: "left",
                    cursor: r.__other ? "default" : "pointer",
                    opacity: r.__other ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: DONUT_PALETTE[idx % DONUT_PALETTE.length],
                          border: "1px solid rgba(30,42,120,0.16)",
                          flex: "0 0 auto",
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 1050,
                          color: BRAND.text,
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.name}
                      </span>
                    </div>
                    <div style={{ fontWeight: 1100, color: BRAND.ink, fontSize: 13 }}>
                      {(r.count || 0).toLocaleString()} <span style={{ opacity: 0.7, fontWeight: 950 }}>({pct}%)</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSet?.size ? (
        <div
          style={{
            padding: 12,
            borderTop: "1px solid rgba(30,42,120,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(207,239,247,0.18))",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {Array.from(selectedSet).slice(0, 10).map((t) => (
              <Chip key={t} label={t} onRemove={() => onToggle?.(t)} />
            ))}
            {selectedSet.size > 10 ? <span style={{ fontWeight: 950, opacity: 0.7 }}>+{selectedSet.size - 10} more</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}


function dedupeOrgsById(rows) {
  const map = new Map();
  for (const r of rows || []) {
    const id = String(r?.ORG_ID ?? "").trim();
    if (!id) continue;
    if (!map.has(id)) map.set(id, r);
  }
  return Array.from(map.values());
}

function firstToken(raw) {
  const toks = splitTokens(raw);
  return toks.length ? toks[0] : "";
}

function countBySingleTokenNormalized(orgs, field) {
  // For categorical fields like SALES_REGION where we want exactly 1 bucket per org.
  const counts = new Map(); // key -> count
  const labelByKey = new Map(); // key -> label
  for (const org of orgs || []) {
    const tok = firstToken(org?.[field]);
    const key = normalize(tok);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!labelByKey.has(key)) labelByKey.set(key, String(tok).trim());
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ name: labelByKey.get(key) || key, count, __key: key }))
    .sort((a, b) => b.count - a.count);
}

/* =========================
   Data helpers
========================= */

// async function fetchAllOrgs({ ct, ctMatch, services, infra, regions, countries, sizing }) {
//   const pageSize = 500;
//   let page = 1;
//   let out = [];

//   const base = new URLSearchParams();
//   if (ct?.length) {
//     base.set("CONTENT_TYPES", ct.join(","));
//     base.set("CT_MATCH", ctMatch || "any");
//   }
//   if (services?.length) base.set("SERVICES", services.join(","));
//   if (infra?.length) base.set("INFRASTRUCTURE_TOOLS", infra.join(","));
//   if (regions?.length) base.set("SALES_REGION", regions.join(","));
//   if (countries?.length) base.set("GEONAME_COUNTRY_NAME", countries.join(","));
//   if (sizing?.length) base.set("ORG_SIZING_CALCULATED", sizing.join(","));

//   while (true) {
//     const p = new URLSearchParams(base.toString());
//     p.set("page", String(page));
//     p.set("pageSize", String(pageSize));

//     const r = await fetch(`${base}/api/orgs?${p.toString()}`);
//     if (!r.ok) throw new Error(`HTTP ${r.status}`);
//     const j = await r.json();
//     const rows = Array.isArray(j?.data) ? j.data : [];
//     out = out.concat(rows);

//     if (rows.length < pageSize) break;
//     page += 1;
//   }

//   // De-dupe: /api/orgs can return the same org multiple times across pages
//   const byId = new Map();
//   for (const o of out) {
//     const k = String(o?.ORG_ID ?? o?.orgId ?? o?.id ?? o?.ORG_NAME ?? '').trim();
//     if (!k) continue;
//     if (!byId.has(k)) byId.set(k, o);
//   }
//   return Array.from(byId.values());
// }

async function fetchAllOrgs({ ct, ctMatch, services, infra, regions, countries, sizing }) {
  const pageSize = 500;
  let page = 1;
  let out = [];

  // ✅ rename this so it doesn't shadow your API base URL string
  const qsBase = new URLSearchParams();

  if (ct?.length) {
    qsBase.set("CONTENT_TYPES", ct.join(","));
    qsBase.set("CT_MATCH", ctMatch || "any");
  }
  if (services?.length) qsBase.set("SERVICES", services.join(","));
  if (infra?.length) qsBase.set("INFRASTRUCTURE_TOOLS", infra.join(","));
  if (regions?.length) qsBase.set("SALES_REGION", regions.join(","));
  if (countries?.length) qsBase.set("GEONAME_COUNTRY_NAME", countries.join(","));
  if (sizing?.length) qsBase.set("ORG_SIZING_CALCULATED", sizing.join(","));

  while (true) {
    const p = new URLSearchParams(qsBase.toString());
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));

    // ✅ uses your module-level: const base = import.meta.env.VITE_API_BASE;
    const r = await fetch(`${base}/api/orgs?${p.toString()}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const rows = Array.isArray(j?.data) ? j.data : [];
    out = out.concat(rows);

    if (rows.length < pageSize) break;
    page += 1;
  }

  // De-dupe: /api/orgs can return the same org multiple times across pages
  const byId = new Map();
  for (const o of out) {
    const k = String(o?.ORG_ID ?? o?.orgId ?? o?.id ?? o?.ORG_NAME ?? "").trim();
    if (!k) continue;
    if (!byId.has(k)) byId.set(k, o);
  }

  return Array.from(byId.values());
}

function countByTokensNormalized(orgs, field) {
  // Dedupe within org AND normalize keys so "North America" vs "north  america" doesn't double count.
  const counts = new Map(); // key -> count
  const labelByKey = new Map(); // key -> first label seen

  for (const org of orgs || []) {
    const uniq = uniqTokensForOrg(org?.[field]);
    const perOrg = new Set();
    for (const raw of uniq) {
      const key = normalize(raw);
      if (!key) continue;
      perOrg.add(key);
      if (!labelByKey.has(key)) labelByKey.set(key, String(raw).trim());
    }
    for (const key of perOrg) counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ name: labelByKey.get(key) || key, count, __key: key }))
    .sort((a, b) => b.count - a.count);
}

function countByTokens(orgs, field) {
  const counts = new Map();
  for (const org of orgs || []) {
    for (const t of uniqTokensForOrg(org?.[field])) {
      if (!t) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function getOrgSizingToken(org) {
  const raw = String(org?.ORG_SIZING_CALCULATED || "").trim();
  return raw;
}

function buildMainOrgsUrl({ ct, ctMatch, services, infra, regions, sizing, countries }) {
  const p = new URLSearchParams();
  if (ct?.length) {
    p.set("CONTENT_TYPES", ct.join(","));
    p.set("CT_MATCH", ctMatch || "any");
  }
  if (services?.length) p.set("SERVICES", services.join(","));
  if (infra?.length) p.set("INFRASTRUCTURE_TOOLS", infra.join(","));
  if (regions?.length) p.set("SALES_REGION", regions.join(","));
  if (sizing?.length) p.set("ORG_SIZING_CALCULATED", sizing.join(","));
  if (countries?.length) p.set("GEONAME_COUNTRY_NAME", countries.join(","));
  const qs = p.toString();
  return `/participants/organizations${qs ? `?${qs}` : ""}`;
}

/* =========================
   Page
========================= */

export default function ContentTypesVisualizeV2() {
  const navigate = useNavigate();

  // counts
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [totalsByType, setTotalsByType] = useState({});
  const [totalOrgs, setTotalOrgs] = useState(0);

  // tree focus/search
  const [focusedL1, setFocusedL1] = useState("");
  const [searchL1, setSearchL1] = useState("");
  const [searchL2, setSearchL2] = useState("");

  // filters
  const [selectedCTs, setSelectedCTs] = useState(() => new Set());
  const [ctMatch, setCtMatch] = useState("any");
  const [selectedServices, setSelectedServices] = useState(() => new Set());
  const [selectedInfra, setSelectedInfra] = useState(() => new Set());
  const [selectedRegions, setSelectedRegions] = useState(() => new Set());
  const [selectedCountries, setSelectedCountries] = useState(() => new Set());
  const [selectedSizing, setSelectedSizing] = useState(() => new Set());

  // bar searches
  const [searchServices, setSearchServices] = useState("");
  const [searchInfra, setSearchInfra] = useState("");
  const [searchCountries, setSearchCountries] = useState("");

  // org table state
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgErr, setOrgErr] = useState("");
  const [orgRows, setOrgRows] = useState([]);
  const [orgTotal, setOrgTotal] = useState(0);
  const [orgPage, setOrgPage] = useState(1);
  const [orgPageSize, setOrgPageSize] = useState(25);

  // aggregate state (ALL orgs under filters)
  const [aggLoading, setAggLoading] = useState(false);
  const [aggErr, setAggErr] = useState("");
  const [aggOrgs, setAggOrgs] = useState([]);

  // fetch counts
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const r = await fetch(`${base}/api/orgs/content-types/counts`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!alive) return;
        setTotalsByType(j?.totalsByType || {});
        setTotalOrgs(Number(j?.totalOrgs || 0));
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const hierarchy = useMemo(() => {
    const byL1 = new Map();
    for (const r of CONTENT_TYPES_REFERENCE || []) {
      const l1 = String(r?.CONTENT_TYPE_L1_NAME || "").trim();
      const l2 = String(r?.CONTENT_TYPE_L2_NAME || "").trim();
      if (!l1) continue;
      if (!byL1.has(l1)) byL1.set(l1, new Map());
      if (l2) byL1.get(l1).set(l2, r?.Description || "");
    }

    const countOf = (name) => Number(totalsByType?.[normalize(name)] || 0);

    const l1Rows = [...byL1.entries()].map(([l1, l2Map]) => ({
      name: l1,
      count: countOf(l1),
      l2Count: l2Map.size,
      l2Map,
    }));
    l1Rows.sort((a, b) => b.count - a.count);

    const defaultL1 = focusedL1 || (l1Rows.find((x) => x.count > 0)?.name || l1Rows[0]?.name || "");

    const l2Rows = (() => {
      const row = l1Rows.find((x) => x.name === defaultL1);
      if (!row) return [];
      const out = [];
      for (const [l2, desc] of row.l2Map.entries()) {
        out.push({ l1: row.name, name: l2, count: countOf(l2), description: desc || "" });
      }
      out.sort((a, b) => b.count - a.count);
      return out;
    })();

    return { l1Rows, l2Rows, defaultL1 };
  }, [totalsByType, focusedL1]);

  useEffect(() => {
    if (!loading && !err && hierarchy.defaultL1 && !focusedL1) setFocusedL1(hierarchy.defaultL1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, err, hierarchy.defaultL1]);

  const visibleL1 = useMemo(() => {
    const q = normalize(searchL1);
    const rows = hierarchy.l1Rows || [];
    if (!q) return rows;
    return rows.filter((r) => normalize(r.name).includes(q));
  }, [hierarchy.l1Rows, searchL1]);

  const visibleL2 = useMemo(() => {
    const q = normalize(searchL2);
    const rows = hierarchy.l2Rows || [];
    if (!q) return rows;
    return rows.filter((r) => normalize(r.name).includes(q));
  }, [hierarchy.l2Rows, searchL2]);

  const selectedCTsArr = useMemo(() => Array.from(selectedCTs), [selectedCTs]);
  const selectedServicesArr = useMemo(() => Array.from(selectedServices), [selectedServices]);
  const selectedInfraArr = useMemo(() => Array.from(selectedInfra), [selectedInfra]);
  const selectedRegionsArr = useMemo(() => Array.from(selectedRegions), [selectedRegions]);
  const selectedCountriesArr = useMemo(() => Array.from(selectedCountries), [selectedCountries]);
  const selectedSizingArr = useMemo(() => Array.from(selectedSizing), [selectedSizing]);

  const selectedCTsSorted = useMemo(() => {
    const a = Array.from(selectedCTs);
    a.sort((x, y) => x.localeCompare(y));
    return a;
  }, [selectedCTs]);

  function toggle(setter, name) {
    const t = String(name || "").trim();
    if (!t) return;
    setter((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
    setOrgPage(1);
  }

  function clearAll() {
    setFocusedL1(hierarchy.l1Rows?.[0]?.name || "");
    setSearchL1("");
    setSearchL2("");
    setSelectedCTs(new Set());
    setSelectedServices(new Set());
    setSelectedInfra(new Set());
    setSelectedRegions(new Set());
    setSelectedCountries(new Set());
    setSelectedSizing(new Set());
    setOrgPage(1);
  }

  // aggregate fetch (ALL orgs under current filters)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setAggLoading(true);
        setAggErr("");

        const rows = await fetchAllOrgs({
          ct: selectedCTsArr,
          ctMatch,
          services: selectedServicesArr,
          infra: selectedInfraArr,
          regions: selectedRegionsArr,
          countries: selectedCountriesArr,
          sizing: selectedSizingArr,
        });

        if (!alive) return;
        setAggOrgs(dedupeOrgsById(rows));
      } catch (e) {
        if (!alive) return;
        setAggErr(e?.message || "Failed to load aggregates");
        setAggOrgs([]);
      } finally {
        if (!alive) return;
        setAggLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [ctMatch, selectedCTsArr, selectedServicesArr, selectedInfraArr, selectedRegionsArr, selectedCountriesArr, selectedSizingArr]);

  // org table fetch (server mode)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setOrgLoading(true);
        setOrgErr("");

        const params = new URLSearchParams();
        params.set("page", String(orgPage));
        params.set("pageSize", String(orgPageSize));

        if (selectedCTs.size > 0) {
          params.set("CONTENT_TYPES", selectedCTsArr.join(","));
          params.set("CT_MATCH", ctMatch);
        }
        if (selectedServices.size > 0) params.set("SERVICES", selectedServicesArr.join(","));
        if (selectedInfra.size > 0) params.set("INFRASTRUCTURE_TOOLS", selectedInfraArr.join(","));
        if (selectedRegions.size > 0) params.set("SALES_REGION", selectedRegionsArr.join(","));
        if (selectedCountries.size > 0) params.set("GEONAME_COUNTRY_NAME", selectedCountriesArr.join(","));
        if (selectedSizing.size > 0) params.set("ORG_SIZING_CALCULATED", selectedSizingArr.join(","));

        const r = await fetch(`${base}/api/orgs?${params.toString()}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();

        if (!alive) return;
        setOrgRows(Array.isArray(j?.data) ? j.data : []);
        setOrgTotal(Number(j?.total || 0));
      } catch (e) {
        if (!alive) return;
        setOrgErr(e?.message || "Failed to load orgs");
      } finally {
        if (!alive) return;
        setOrgLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    orgPage,
    orgPageSize,
    ctMatch,
    selectedCTsArr,
    selectedServicesArr,
    selectedInfraArr,
    selectedRegionsArr,
    selectedCountriesArr,
    selectedSizingArr,
    selectedCTs.size,
    selectedServices.size,
    selectedInfra.size,
    selectedRegions.size,
    selectedCountries.size,
    selectedSizing.size,
  ]);

  const topServicesAll = useMemo(() => countByTokens(aggOrgs, "SERVICES"), [aggOrgs]);
  const topInfraAll = useMemo(() => countByTokens(aggOrgs, "INFRASTRUCTURE_TOOLS"), [aggOrgs]);
  const topCountriesAll = useMemo(() => countByTokensNormalized(aggOrgs, "GEONAME_COUNTRY_NAME"), [aggOrgs]);

  const topServices = useMemo(() => {
    const q = normalize(searchServices);
    const rows = topServicesAll || [];
    const filtered = q ? rows.filter((r) => normalize(r.name).includes(q)) : rows;
    return filtered.slice(0, 7);
  }, [topServicesAll, searchServices]);

  const topInfra = useMemo(() => {
    const q = normalize(searchInfra);
    const rows = topInfraAll || [];
    const filtered = q ? rows.filter((r) => normalize(r.name).includes(q)) : rows;
    return filtered.slice(0, 7);
  }, [topInfraAll, searchInfra]);

  const topCountries = useMemo(() => {
    const q = normalize(searchCountries);
    const rows = topCountriesAll || [];
    const filtered = q ? rows.filter((r) => normalize(r.name).includes(q)) : rows;
    // show more here; it's a big list and scrollable
    return filtered.slice(0, 80);
  }, [topCountriesAll, searchCountries]);

  const maxService = topServicesAll?.[0]?.count || 0;
  const maxInfra = topInfraAll?.[0]?.count || 0;
  const maxCountry = topCountriesAll?.[0]?.count || 0;

  // sales regions normalized + per-org dedupe (no double counting)
  const salesRegionRows = useMemo(() => countBySingleTokenNormalized(aggOrgs, "SALES_REGION"), [aggOrgs]);
// sizing counted as a single categorical value per org (ORG_SIZING_CALCULATED)
  const sizingRows = useMemo(() => {
    const counts = new Map();
    for (const org of aggOrgs || []) {
      const t = getOrgSizingToken(org);
      if (!t) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [aggOrgs]);

  const totalPages = Math.max(1, Math.ceil((orgTotal || 0) / (orgPageSize || 25)));

  // safety client filter (in case server ignores SALES_REGION / ORG_SIZING_CALCULATED / GEONAME_COUNTRY_NAME)
  const filteredOrgRows = useMemo(() => {
    let rows = orgRows || [];

    if (selectedRegions.size > 0) {
      const allowed = new Set(Array.from(selectedRegions));
      rows = rows.filter((o) => uniqTokensForOrg(o?.SALES_REGION).some((t) => allowed.has(t)));
    }

    if (selectedCountries.size > 0) {
      const allowed = new Set(Array.from(selectedCountries));
      rows = rows.filter((o) => {
        const raw = String(o?.GEONAME_COUNTRY_NAME || "").trim();
        if (!raw) return false;
        return uniqTokensForOrg(raw).some((t) => allowed.has(t));
      });
    }

    if (selectedSizing.size > 0) {
      const allowed = new Set(Array.from(selectedSizing));
      rows = rows.filter((o) => {
        const raw = String(o?.ORG_SIZING_CALCULATED || "").trim();
        return raw ? uniqTokensForOrg(raw).some((t) => allowed.has(t)) : false;
      });
    }

    return rows;
  }, [orgRows, selectedRegions, selectedCountries, selectedSizing]);


  const viewInMainUrl = useMemo(
    () =>
      buildMainOrgsUrl({
        ct: selectedCTsArr,
        ctMatch,
        services: selectedServicesArr,
        infra: selectedInfraArr,
        regions: selectedRegionsArr,
        countries: selectedCountriesArr,
        sizing: selectedSizingArr,
      }),
    [selectedCTsArr, ctMatch, selectedServicesArr, selectedInfraArr, selectedRegionsArr, selectedCountriesArr, selectedSizingArr]
  );

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, color: BRAND.text, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: "22px 26px 10px" }}>
        <div
          style={{
            maxWidth: PAGE.max,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
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
                boxShadow: "0 10px 34px rgba(30,42,120,0.12)",
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
            <button
              type="button"
              onClick={() => navigate("/participants/organizations/content-types")}
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
              Content Types
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>
            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Visualize</span>

            <Pill>{(totalOrgs || 0).toLocaleString()} orgs</Pill>
            {selectedCTs.size > 0 ? <Pill>{selectedCTs.size} CT</Pill> : null}
            {selectedServices.size > 0 ? <Pill>{selectedServices.size} services</Pill> : null}
            {selectedInfra.size > 0 ? <Pill>{selectedInfra.size} infra</Pill> : null}
            {selectedRegions.size > 0 ? <Pill>{selectedRegions.size} regions</Pill> : null}
            {selectedCountries.size > 0 ? <Pill>{selectedCountries.size} countries</Pill> : null}
            {selectedSizing.size > 0 ? <Pill>{selectedSizing.size} sizing</Pill> : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={clearAll}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                opacity: 0.92,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Clear All
            </button>

            <button
              type="button"
              onClick={() => navigate(viewInMainUrl)}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                opacity: 0.92,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
              title="Open Organizations page with the same filters"
            >
              View in Main
            </button>

            <a
              href="https://me-dmz.com"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: BRAND.ink,
                fontWeight: 1000,
                opacity: 0.92,
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
      </div>

      {/* Hero + Body */}
      <div style={{ padding: "0 26px 16px" }}>
        <div
          style={{
            maxWidth: PAGE.max,
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: 18,
            border: `1px solid rgba(30,42,120,0.14)`,
            boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 18,
              borderBottom: "1px solid rgba(30,42,120,0.12)",
              background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.90))",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>TREE</div>
            <h1 style={{ margin: "6px 0 6px", fontSize: 32, fontWeight: 1100, color: BRAND.ink }}>Content Type Paths</h1>
            <p style={{ margin: 0, maxWidth: 1100, fontWeight: 850, opacity: 0.85, lineHeight: 1.35 }}>
              Click cards to toggle CT selection. Bars + donuts are interactive and filter the org table.
            </p>
          </div>

          <div style={{ padding: 18 }}>
            {loading ? (
              <div
                style={{
                  border: `1px solid rgba(30,42,120,0.14)`,
                  background: "rgba(207,239,247,0.25)",
                  borderRadius: 16,
                  padding: 16,
                  fontWeight: 900,
                  color: "rgba(30,42,120,0.85)",
                }}
              >
                Loading…
              </div>
            ) : err ? (
              <div
                style={{
                  border: `1px solid rgba(220,38,38,0.25)`,
                  background: "rgba(220,38,38,0.06)",
                  borderRadius: 16,
                  padding: 16,
                  fontWeight: 900,
                  color: "rgba(220,38,38,0.95)",
                }}
              >
                {err}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr 1.9fr", gap: 16, alignItems: "start" }}>
                  {/* ROOT */}
                  <div>
                    <SectionTitle k="ROOT" title="Total Organizations" />
                    <Card onClick={null}>
                      <CardTopBar />
                      <NodeRow label="Total Organizations" value={totalOrgs} />
                    </Card>
                  </div>

                  {/* LEVEL 1 */}
                  <div>
                    <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                      <SectionTitle k="LEVEL 1" title="L1 Content Types" />
                      <input
                        value={searchL1}
                        onChange={(e) => setSearchL1(e.target.value)}
                        placeholder="Search L1…"
                        style={{
                          height: 36,
                          borderRadius: 12,
                          border: "1px solid rgba(30,42,120,0.16)",
                          padding: "0 12px",
                          fontWeight: 900,
                          outline: "none",
                          color: BRAND.text,
                          width: 220,
                          background: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {visibleL1.map((r) => {
                        const focused = r.name === focusedL1;
                        const selected = selectedCTs.has(r.name);
                        return (
                          <Card
                            key={r.name}
                            active={focused}
                            onClick={() => {
                              setFocusedL1(r.name);
                              toggle(setSelectedCTs, r.name);
                            }}
                            title="Click to focus + toggle selection"
                            style={{ outline: selected ? "2px solid rgba(30,42,120,0.35)" : "none" }}
                          >
                            <CardTopBar />
                            <NodeRow label={r.name} value={r.count} rightMeta={`${r.l2Count} L2`} />
                          </Card>
                        );
                      })}
                      {!visibleL1.length ? <div style={{ padding: 10, fontWeight: 900, opacity: 0.7 }}>No L1 matches.</div> : null}
                    </div>
                  </div>

                  {/* LEVEL 2 */}
                  <div>
                    <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                      <SectionTitle k="LEVEL 2" title={focusedL1 || "L2 Content Types"} />
                      <input
                        value={searchL2}
                        onChange={(e) => setSearchL2(e.target.value)}
                        placeholder="Search L2…"
                        style={{
                          height: 36,
                          borderRadius: 12,
                          border: "1px solid rgba(30,42,120,0.16)",
                          padding: "0 12px",
                          fontWeight: 900,
                          outline: "none",
                          color: BRAND.text,
                          width: 220,
                          background: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {visibleL2.map((r) => {
                        const selected = selectedCTs.has(r.name);
                        return (
                          <Card
                            key={r.name}
                            onClick={() => toggle(setSelectedCTs, r.name)}
                            title={r.description ? r.description : "Click to toggle selection"}
                            style={{ outline: selected ? "2px solid rgba(30,42,120,0.35)" : "none" }}
                          >
                            <CardTopBar />
                            <NodeRow label={r.name} value={r.count} />
                          </Card>
                        );
                      })}
                      {!visibleL2.length ? <div style={{ padding: 10, fontWeight: 900, opacity: 0.7 }}>No L2 items (or no matches).</div> : null}
                    </div>
                  </div>
                </div>

                {/* Selected CT chips */}
                {selectedCTsSorted.length > 0 ? (
                  <div
                    style={{
                      marginTop: 16,
                      border: `1px solid rgba(30,42,120,0.14)`,
                      borderRadius: 18,
                      background: "#FFFFFF",
                      boxShadow: "0 22px 80px rgba(30,42,120,0.06)",
                      padding: 14,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 1100, color: BRAND.ink, marginRight: 6 }}>Selected CT:</div>
                    {selectedCTsSorted.slice(0, 18).map((t) => (
                      <Chip key={t} label={t} onRemove={() => toggle(setSelectedCTs, t)} />
                    ))}
                    {selectedCTsSorted.length > 18 ? <span style={{ fontWeight: 950, opacity: 0.7 }}>+{selectedCTsSorted.length - 18} more</span> : null}
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={ctMatch}
                        onChange={(e) => {
                          setCtMatch(e.target.value);
                          setOrgPage(1);
                        }}
                        style={{
                          height: 36,
                          borderRadius: 12,
                          border: "1px solid rgba(30,42,120,0.16)",
                          padding: "0 12px",
                          fontWeight: 950,
                          outline: "none",
                          color: BRAND.text,
                          background: "#FFFFFF",
                        }}
                        title="CT_MATCH applies to CONTENT_TYPES"
                      >
                        <option value="any">CT_MATCH: any</option>
                        <option value="all">CT_MATCH: all</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {/* VISUALS */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>VISUALS</div>
                      <div style={{ fontSize: 18, fontWeight: 1100, color: BRAND.ink }}>Services × CT & CT × Infra</div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      border: `1px solid rgba(30,42,120,0.14)`,
                      borderRadius: 18,
                      background: "#FFFFFF",
                      overflow: "hidden",
                      boxShadow: "0 22px 80px rgba(30,42,120,0.06)",
                    }}
                  >
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(30,42,120,0.10)" }}>
                      {aggLoading ? (
                        <div style={{ fontWeight: 950, color: "rgba(30,42,120,0.85)" }}>Loading visual aggregates…</div>
                      ) : aggErr ? (
                        <div style={{ fontWeight: 950, color: "rgba(220,38,38,0.95)" }}>{aggErr}</div>
                      ) : (
                        <div style={{ fontWeight: 950, color: "rgba(30,42,120,0.75)" }}>
                          Aggregated over {aggOrgs.length.toLocaleString()} orgs (click bars/donuts to filter the table)
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                            <SectionTitle k="SERVICES × CT" title="Top Services" />
                            <input
                              value={searchServices}
                              onChange={(e) => setSearchServices(e.target.value)}
                              placeholder="Search services…"
                              style={{
                                height: 36,
                                borderRadius: 12,
                                border: "1px solid rgba(30,42,120,0.16)",
                                padding: "0 12px",
                                fontWeight: 900,
                                outline: "none",
                                color: BRAND.text,
                                width: 220,
                                background: "#FFFFFF",
                              }}
                            />
                          </div>

                          <div style={{ maxHeight: 320, overflow: "auto", paddingRight: 4, marginTop: 10 }}>
                            <div style={{ display: "grid", gap: 10 }}>
                              {topServices.map((r) => (
                                <BarRow
                                  key={r.name}
                                  label={r.name}
                                  value={r.count}
                                  maxValue={maxService}
                                  selected={selectedServices.has(r.name)}
                                  onClick={() => toggle(setSelectedServices, r.name)}
                                  title="Click to toggle service filter"
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                            <SectionTitle k="CT × INFRA" title="Top Infra Tools" />
                            <input
                              value={searchInfra}
                              onChange={(e) => setSearchInfra(e.target.value)}
                              placeholder="Search infra…"
                              style={{
                                height: 36,
                                borderRadius: 12,
                                border: "1px solid rgba(30,42,120,0.16)",
                                padding: "0 12px",
                                fontWeight: 900,
                                outline: "none",
                                color: BRAND.text,
                                width: 220,
                                background: "#FFFFFF",
                              }}
                            />
                          </div>

                          <div style={{ maxHeight: 320, overflow: "auto", paddingRight: 4, marginTop: 10 }}>
                            <div style={{ display: "grid", gap: 10 }}>
                              {topInfra.map((r) => (
                                <BarRow
                                  key={r.name}
                                  label={r.name}
                                  value={r.count}
                                  maxValue={maxInfra}
                                  selected={selectedInfra.has(r.name)}
                                  onClick={() => toggle(setSelectedInfra, r.name)}
                                  title="Click to toggle infra filter"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedServices.size > 0 || selectedInfra.size > 0 ? (
                        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          {Array.from(selectedServices).map((t) => (
                            <Chip key={t} label={t} onRemove={() => toggle(setSelectedServices, t)} />
                          ))}
                          {Array.from(selectedInfra).map((t) => (
                            <Chip key={t} label={t} onRemove={() => toggle(setSelectedInfra, t)} />
                          ))}
                          <div style={{ flex: 1 }} />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedServices(new Set());
                              setSelectedInfra(new Set());
                              setOrgPage(1);
                            }}
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
                            Clear Bars
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* DONUTS */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>DONUTS</div>
                      <div style={{ fontSize: 18, fontWeight: 1100, color: BRAND.ink }}>Org Sizing & Sales Region</div>
                    </div>

                    {selectedRegions.size > 0 || selectedSizing.size > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegions(new Set());
                          setSelectedSizing(new Set());
                          setOrgPage(1);
                        }}
                        style={{
                          border: `1px solid rgba(30,42,120,0.18)`,
                          background: "#FFFFFF",
                          color: BRAND.ink,
                          fontWeight: 1000,
                          padding: "10px 12px",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                        title="Clear donut filters"
                      >
                        Clear Donuts
                      </button>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                    <DonutChart
                      title="ORG SIZING"
                      subtitle="Hover for values — click to filter"
                      rows={sizingRows}
                      selectedSet={selectedSizing}
                      onToggle={(name) => toggle(setSelectedSizing, name)}
                      maxSlices={8}
                      totalOverride={aggOrgs.length}
                    />

                    <DonutChart
                      title="SALES REGION"
                      subtitle="Hover for values — click to filter"
                      rows={salesRegionRows}
                      selectedSet={selectedRegions}
                      onToggle={(name) => toggle(setSelectedRegions, name)}
                      maxSlices={8}
                      totalOverride={aggOrgs.length}
                    />
                  </div>
                </div>

                
                {/* GEOGRAPHY */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>GEOGRAPHY</div>
                      <div style={{ fontSize: 18, fontWeight: 1100, color: BRAND.ink }}>Countries</div>
                      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 900, opacity: 0.7 }}>
                        Scroll + search. Click bars to filter (and other visuals will update).
                      </div>
                    </div>

                    {selectedCountries.size > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCountries(new Set());
                          setOrgPage(1);
                        }}
                        style={{
                          border: `1px solid rgba(30,42,120,0.18)`,
                          background: "#FFFFFF",
                          color: BRAND.ink,
                          fontWeight: 1000,
                          padding: "10px 12px",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                        title="Clear country filter"
                      >
                        Clear Countries
                      </button>
                    ) : null}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      border: `1px solid rgba(30,42,120,0.14)`,
                      borderRadius: 18,
                      background: "#FFFFFF",
                      overflow: "hidden",
                      boxShadow: "0 22px 80px rgba(30,42,120,0.06)",
                    }}
                  >
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(30,42,120,0.10)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 950, color: "rgba(30,42,120,0.75)" }}>
                        {aggLoading ? "Loading…" : aggErr ? "—" : `Aggregated over ${aggOrgs.length.toLocaleString()} orgs`}
                      </div>
                      <div style={{ flex: 1 }} />
                      <input
                        value={searchCountries}
                        onChange={(e) => setSearchCountries(e.target.value)}
                        placeholder="Search countries…"
                        style={{
                          height: 36,
                          borderRadius: 12,
                          border: "1px solid rgba(30,42,120,0.16)",
                          padding: "0 12px",
                          fontWeight: 900,
                          outline: "none",
                          color: BRAND.text,
                          width: 260,
                          background: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ padding: 14 }}>
                      <div style={{ maxHeight: 520, overflow: "auto", paddingRight: 4 }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {topCountries.map((r) => (
                            <BarRow
                              key={r.name}
                              label={r.name}
                              value={r.count}
                              maxValue={maxCountry}
                              selected={selectedCountries.has(r.name)}
                              onClick={() => toggle(setSelectedCountries, r.name)}
                              title="Click to toggle country filter"
                            />
                          ))}
                          {!topCountries.length && !aggLoading ? (
                            <div style={{ padding: 10, fontWeight: 900, opacity: 0.7 }}>No country matches.</div>
                          ) : null}
                        </div>
                      </div>

                      {selectedCountries.size > 0 ? (
                        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          {Array.from(selectedCountries).map((t) => (
                            <Chip key={t} label={t} onRemove={() => toggle(setSelectedCountries, t)} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

{/* ORGS */}
                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "end",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      padding: "6px 2px 10px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>ORGS</div>
                      <div style={{ fontSize: 18, fontWeight: 1100, color: BRAND.ink }}>
                        Organizations{" "}
                        <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 1000, opacity: 0.7 }}>({orgTotal.toLocaleString()} total)</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => navigate(viewInMainUrl)}
                        style={{
                          border: `1px solid rgba(30,42,120,0.18)`,
                          background: "#FFFFFF",
                          color: BRAND.ink,
                          fontWeight: 1000,
                          padding: "10px 12px",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                        title="Open Organizations page with the same filters"
                      >
                        View in Main
                      </button>

                      <select
                        value={orgPageSize}
                        onChange={(e) => {
                          setOrgPageSize(Number(e.target.value) || 25);
                          setOrgPage(1);
                        }}
                        style={{
                          height: 36,
                          borderRadius: 12,
                          border: "1px solid rgba(30,42,120,0.16)",
                          padding: "0 12px",
                          fontWeight: 950,
                          outline: "none",
                          color: BRAND.text,
                          background: "#FFFFFF",
                        }}
                      >
                        {[10, 25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}/page
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      border: `1px solid rgba(30,42,120,0.14)`,
                      borderRadius: 18,
                      background: "#FFFFFF",
                      overflow: "hidden",
                      boxShadow: "0 22px 80px rgba(30,42,120,0.06)",
                    }}
                  >
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(30,42,120,0.10)" }}>
                      {orgLoading ? (
                        <div style={{ fontWeight: 950, color: "rgba(30,42,120,0.85)" }}>Loading orgs…</div>
                      ) : orgErr ? (
                        <div style={{ fontWeight: 950, color: "rgba(220,38,38,0.95)" }}>{orgErr}</div>
                      ) : (
                        <div style={{ fontWeight: 950, color: "rgba(30,42,120,0.75)" }}>
                          Showing page {orgPage} of {totalPages}
                        </div>
                      )}
                    </div>

                    <div style={{ maxHeight: 420, overflow: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "#FFFFFF" }}>
                          <tr>
                            {["Org ID", "Org Name", "Content Types", "Sales Region"].map((h) => (
                              <th
                                key={h}
                                style={{
                                  textAlign: "left",
                                  padding: "12px 14px",
                                  fontSize: 12,
                                  fontWeight: 1100,
                                  color: "rgba(30,42,120,0.75)",
                                  borderBottom: "1px solid rgba(30,42,120,0.10)",
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {!orgLoading && !orgErr && filteredOrgRows.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ padding: 16, fontWeight: 950, opacity: 0.7 }}>
                                No organizations match this selection.
                              </td>
                            </tr>
                          ) : null}

                          {filteredOrgRows.map((org) => {
                            const orgId = String(org?.ORG_ID ?? "").trim();
                            const orgName = String(org?.ORG_NAME ?? "").trim();
                            const salesRegion = String(org?.SALES_REGION ?? "").trim();
                            const cts = splitTokens(org?.CONTENT_TYPES);

                            return (
                              <tr key={orgId || orgName} style={{ borderBottom: "1px solid rgba(30,42,120,0.06)" }}>
                                <td style={{ padding: "12px 14px", fontWeight: 950, color: "rgba(17,24,39,0.75)" }}>{orgId}</td>

                                <td style={{ padding: "12px 14px" }}>
                                  <RowLink onClick={() => navigate(`/participants/organizations/${encodeURIComponent(orgId)}`)} title="Open org details">
                                    {orgName || "(Unnamed org)"}
                                  </RowLink>
                                </td>

                                <td style={{ padding: "12px 14px" }}>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {cts.slice(0, 12).map((t) => (
                                      <span
                                        key={t}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          padding: "6px 10px",
                                          borderRadius: 999,
                                          border: "1px solid rgba(30,42,120,0.14)",
                                          background: "rgba(207,239,247,0.35)",
                                          color: BRAND.ink,
                                          fontWeight: 950,
                                          fontSize: 12,
                                        }}
                                      >
                                        {t}
                                      </span>
                                    ))}
                                    {cts.length > 12 ? <span style={{ fontSize: 12, fontWeight: 950, opacity: 0.65 }}>+{cts.length - 12}</span> : null}
                                  </div>
                                </td>

                                <td style={{ padding: "12px 14px", fontWeight: 950, color: "rgba(17,24,39,0.75)" }}>{salesRegion || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: 14,
                        borderTop: "1px solid rgba(30,42,120,0.10)",
                        background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(207,239,247,0.18))",
                      }}
                    >
                      <div style={{ fontWeight: 950, color: "rgba(30,42,120,0.75)" }}>{orgTotal.toLocaleString()} orgs</div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                          disabled={orgPage <= 1 || orgLoading}
                          style={{
                            border: `1px solid rgba(30,42,120,0.18)`,
                            background: "#FFFFFF",
                            color: BRAND.ink,
                            fontWeight: 1000,
                            padding: "10px 12px",
                            borderRadius: 12,
                            cursor: orgPage <= 1 || orgLoading ? "not-allowed" : "pointer",
                            opacity: orgPage <= 1 || orgLoading ? 0.5 : 1,
                          }}
                        >
                          Prev
                        </button>

                        <div style={{ fontWeight: 1100, color: BRAND.ink }}>
                          Page {orgPage} / {totalPages}
                        </div>

                        <button
                          type="button"
                          onClick={() => setOrgPage((p) => Math.min(totalPages, p + 1))}
                          disabled={orgLoading || orgPage >= totalPages}
                          style={{
                            border: `1px solid rgba(30,42,120,0.18)`,
                            background: "#FFFFFF",
                            color: BRAND.ink,
                            fontWeight: 1000,
                            padding: "10px 12px",
                            borderRadius: 12,
                            cursor: orgLoading || orgPage >= totalPages ? "not-allowed" : "pointer",
                            opacity: orgLoading || orgPage >= totalPages ? 0.5 : 1,
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
