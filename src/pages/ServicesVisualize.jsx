import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Expectation:
 * - Similar to ContentTypes, you have a services taxonomy reference list exported from "./Services".
 * - Each row should look like:
 *   {
 *     SERVICE_L1_NAME: string,
 *     SERVICE_L2_NAME: string,
 *     SERVICE_L3_NAME: string,
 *     Description?: string
 *   }
 *
 * If your fields are named differently, adjust them in the "hierarchy" useMemo below.
 */
import { SERVICES_REFERENCE } from "./Services";

/* =========================
   Brand + layout constants
========================= */

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const base = import.meta.env.VITE_API_BASE;
const PAGE = { max: 1280 };

/* =========================
   Small string helpers
========================= */

/**
 * Normalize for stable keying + case-insensitive comparisons.
 */
function normalize(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Split comma-separated tokens coming from the API (e.g., "A, B, C").
 */
function splitTokens(s) {
  return String(s ?? "")
    .split(/,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Dedupe tokens within a single org row.
 * Keeps original casing for display.
 */
function uniqTokensForOrg(raw) {
  const seen = new Set();
  for (const t of splitTokens(raw)) seen.add(t);
  return Array.from(seen);
}

/* =========================
   UI bits (same as before)
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
   Donut chart (same as before)
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
  const [tip, setTip] = useState(null);

  const sumCounts = rows.reduce((s, r) => s + (r.count || 0), 0) || 0;
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

/* =========================
   Data helpers (same as before)
========================= */

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
  const counts = new Map();
  const labelByKey = new Map();

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

/**
 * Fetch ALL orgs under current filters (paged).
 * NOTE: services are the primary hierarchy filter in this page.
 */
async function fetchAllOrgs({
  services, // primary filter coming from the Service tree
  svcMatch, // any|all for services (if your API supports it)
  ct, // secondary filter (content types) from bar list
  ctMatch, // any|all for content types
  infra,
  regions,
  countries,
  sizing,
}) {
  const pageSize = 500;
  let page = 1;
  let out = [];

  const base = new URLSearchParams();

  // Primary: SERVICES
  if (services?.length) {
    base.set("SERVICES", services.join(","));
    // IMPORTANT: server/index.js does NOT support SVC_MATCH.
    // Sending unknown params makes the backend treat them like real filters.
    // We implement services match mode (any/all) client-side below.
  }

  // Secondary filters (kept from previous page)
  if (ct?.length) {
    base.set("CONTENT_TYPES", ct.join(","));
    base.set("CT_MATCH", ctMatch || "any");
  }
  if (infra?.length) base.set("INFRASTRUCTURE_TOOLS", infra.join(","));
  if (regions?.length) base.set("SALES_REGION", regions.join(","));
  if (countries?.length) base.set("GEONAME_COUNTRY_NAME", countries.join(","));
  if (sizing?.length) base.set("ORG_SIZING_CALCULATED", sizing.join(","));

  while (true) {
    const p = new URLSearchParams(base.toString());
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));

    const r = await fetch(`${base}/api/orgs?${p.toString()}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const rows = Array.isArray(j?.data) ? j.data : [];
    out = out.concat(rows);

    if (rows.length < pageSize) break;
    page += 1;
  }

  // Dedupe across pages
  const byId = new Map();
  for (const o of out) {
    const k = String(o?.ORG_ID ?? o?.orgId ?? o?.id ?? o?.ORG_NAME ?? "").trim();
    if (!k) continue;
    if (!byId.has(k)) byId.set(k, o);
  }

  let rows = Array.from(byId.values());

  // Client-side SERVICES match mode (server only supports OR-style matching)
  if (services?.length && String(svcMatch || "any").toLowerCase() === "all") {
    const need = services.map(normalize).filter(Boolean);
    rows = rows.filter((org) => {
      const have = new Set(uniqTokensForOrg(org?.SERVICES).map(normalize).filter(Boolean));
      return need.every((t) => have.has(t));
    });
  }

  return rows;
}

function countByTokensNormalized(orgs, field) {
  const counts = new Map();
  const labelByKey = new Map();

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
  return String(org?.ORG_SIZING_CALCULATED || "").trim();
}

/**
 * Build main orgs URL with current filters.
 */
function buildMainOrgsUrl({ services, svcMatch, ct, ctMatch, infra, regions, sizing, countries }) {
  const p = new URLSearchParams();

  if (services?.length) {
    p.set("SERVICES", services.join(","));
    // Keep svcMatch out of the URL because the backend doesn't support it.
    // (We still show it in UI + apply it client-side on this page.)
  }

  if (ct?.length) {
    p.set("CONTENT_TYPES", ct.join(","));
    p.set("CT_MATCH", ctMatch || "any");
  }

  if (infra?.length) p.set("INFRASTRUCTURE_TOOLS", infra.join(","));
  if (regions?.length) p.set("SALES_REGION", regions.join(","));
  if (sizing?.length) p.set("ORG_SIZING_CALCULATED", sizing.join(","));
  if (countries?.length) p.set("GEONAME_COUNTRY_NAME", countries.join(","));

  const qs = p.toString();
  return `/participants/organizations${qs ? `?${qs}` : ""}`;
}

/* =========================
   Page
   - Services hierarchy is the "tree"
   - Everything else stays the same (infra/countries/donuts/org table)
   - Added LEVEL 3 for services
========================= */

export default function ServicesVisualize() {
  const navigate = useNavigate();

  // counts (for services)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [totalsByService, setTotalsByService] = useState({});
  const [totalOrgs, setTotalOrgs] = useState(0);
  // For non-double-counted tree counts we need *sets of org ids* per service token.
  // We compute this client-side once (12.9k orgs is fine) so L1/L2 counts represent
  // unique orgs (union), not a sum of leaf counts.
  const [serviceOrgIdMap, setServiceOrgIdMap] = useState(null); // Map<normalizedService, Set<orgId>>

  // tree focus/search (L1 -> L2 -> L3)
  const [focusedL1, setFocusedL1] = useState("");
  const [focusedL2, setFocusedL2] = useState("");
  const [searchL1, setSearchL1] = useState("");
  const [searchL2, setSearchL2] = useState("");
  const [searchL3, setSearchL3] = useState("");

  // primary selection: services (can include L1/L2/L3 names)
  const [selectedServicesTree, setSelectedServicesTree] = useState(() => new Set());
  const [svcMatch, setSvcMatch] = useState("any"); // "any" or "all" for SERVICES

  // secondary filters (kept from previous page)
  const [selectedCTs, setSelectedCTs] = useState(() => new Set());
  const [ctMatch, setCtMatch] = useState("any");
  const [selectedInfra, setSelectedInfra] = useState(() => new Set());
  const [selectedRegions, setSelectedRegions] = useState(() => new Set());
  const [selectedCountries, setSelectedCountries] = useState(() => new Set());
  const [selectedSizing, setSelectedSizing] = useState(() => new Set());

  // bar searches
  const [searchCTs, setSearchCTs] = useState("");
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

  /**
   * Initial fetch: overall service totals + total org count.
   * Expected endpoint:
   *   GET /api/orgs/services/counts
   *   => { totalsByService: { [normalizedServiceName]: count }, totalOrgs }
   *
   * If your backend uses a different endpoint or keys, adjust here.
   */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        // 1) Leaf counts from the backend (fast)
        const r = await fetch(base+"/api/orgs/services/counts");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!alive) return;
        setTotalsByService(j?.totalsByService || {});
        setTotalOrgs(Number(j?.totalOrgs || 0));

        // 2) Build org-id sets per leaf service so L1/L2 counts are *unique orgs*.
        //    This fixes the "double counting" where L1/L2 can exceed total orgs.
        const pageSize = 500;
        let page = 1;
        let all = [];
        let total = Infinity;
        while (alive && all.length < total) {
          const rr = await fetch(`${base}/api/orgs?page=${page}&pageSize=${pageSize}`);
          if (!rr.ok) throw new Error(`HTTP ${rr.status} while loading orgs`);
          const jj = await rr.json();
          // Server returns { data, total, page, pageSize }
          const rows = Array.isArray(jj?.data)
            ? jj.data
            : Array.isArray(jj?.orgs)
              ? jj.orgs
              : Array.isArray(jj?.rows)
                ? jj.rows
                : [];
          total = Number(jj?.total ?? jj?.totalOrgs ?? rows.length ?? 0);
          all = all.concat(rows);
          if (!rows.length) break;
          page += 1;
          // safety break in case total is not provided
          if (page > 200) break;
        }

        if (!alive) return;

        const m = new Map();
        for (const org of all) {
          const orgId = org?.ORG_ID ?? org?.id ?? org?.orgId ?? org?.participantId;
          if (!orgId) continue;
          for (const t of uniqTokensForOrg(org?.SERVICES)) {
            const k = normalize(t);
            if (!k) continue;
            if (!m.has(k)) m.set(k, new Set());
            m.get(k).add(orgId);
          }
        }
        setServiceOrgIdMap(m);
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

  /**
   * Build L1/L2/L3 hierarchy from SERVICES_REFERENCE.
   *
   * Structure:
   *  L1 -> (Map of L2 -> { desc?, l3Map })
   *  L2 -> (Map of L3 -> desc)
   */
  const hierarchy = useMemo(() => {
    const byL1 = new Map();

    // Leaf maps let us expand L1/L2 clicks into actual selectable service tokens.
    // Assumption: org records store leaf service names (usually L3).
    const l1LeafMap = new Map(); // L1 -> Set(leafName)
    const l2LeafMap = new Map(); // `${l1}||${l2}` -> Set(leafName)


    for (const r of SERVICES_REFERENCE || []) {
      const l1 = String(r?.SERVICE_L1_NAME || "").trim();
      const l2 = String(r?.SERVICE_L2_NAME || "").trim();
      const l3 = String(r?.SERVICE_L3_NAME || "").trim();
      // The reference file uses DESCRIPTION (uppercase). Keep a fallback for older data.
      const desc = String(r?.DESCRIPTION || r?.Description || "").trim();

      if (!l1) continue;
      if (!byL1.has(l1)) byL1.set(l1, new Map());
      const l2Map = byL1.get(l1);

      if (!l2) continue;
      if (!l2Map.has(l2)) l2Map.set(l2, { l3Map: new Map(), description: "" });

      // Keep first non-empty L2 description.
      if (desc && !l2Map.get(l2).description) l2Map.get(l2).description = desc;

      // L3 description (if present)
      if (l3) {
        if (!l2Map.get(l2).l3Map.has(l3)) l2Map.get(l2).l3Map.set(l3, desc || "");
      }

      // Track selectable leaves.
      // If L3 exists, that's the selectable leaf.
      // If no L3, fall back to L2 as the leaf (rare, but keeps behavior sane).
      const leaf = l3 || l2;
      if (leaf) {
        if (!l1LeafMap.has(l1)) l1LeafMap.set(l1, new Set());
        l1LeafMap.get(l1).add(leaf);
        const k = `${l1}||${l2}`;
        if (!l2LeafMap.has(k)) l2LeafMap.set(k, new Set());
        l2LeafMap.get(k).add(leaf);
      }
    }

    const leafCountOf = (name) => Number(totalsByService?.[normalize(name)] || 0);

    // IMPORTANT:
    // - Summing leaf counts overcounts when an org has multiple leaves under the same node.
    // - We want *unique org* counts for L1/L2 nodes (union of org sets).
    const unionLeafOrgCount = (leaves) => {
      if (!leaves) return 0;
      if (!serviceOrgIdMap) {
        // fallback while org-id map loads
        let s = 0;
        for (const leaf of leaves) s += leafCountOf(leaf);
        return s;
      }
      const union = new Set();
      for (const leaf of leaves) {
        const set = serviceOrgIdMap.get(normalize(leaf));
        if (!set) continue;
        for (const id of set) union.add(id);
      }
      return union.size;
    };

    // L1 rows (counts are SUMS of descendant leaf counts)
    const l1Rows = [...byL1.entries()].map(([l1, l2Map]) => ({
      name: l1,
      count: unionLeafOrgCount(l1LeafMap.get(l1)),
      l2Count: l2Map.size,
      l2Map,
    }));
    l1Rows.sort((a, b) => b.count - a.count);

    // default L1 focus
    const defaultL1 = focusedL1 || (l1Rows.find((x) => x.count > 0)?.name || l1Rows[0]?.name || "");

    // L2 rows for focused L1
    const l2Rows = (() => {
      const row = l1Rows.find((x) => x.name === defaultL1);
      if (!row) return [];

      const out = [];
      for (const [l2, meta] of row.l2Map.entries()) {
        const k = `${row.name}||${l2}`;
        out.push({
          l1: row.name,
          name: l2,
          count: unionLeafOrgCount(l2LeafMap.get(k)),
          l3Count: meta?.l3Map?.size || 0,
          description: meta?.description || "",
          l3Map: meta?.l3Map || new Map(),
        });
      }
      out.sort((a, b) => b.count - a.count);
      return out;
    })();

    // default L2 focus (first with count > 0, else first)
    const defaultL2 = focusedL2 || (l2Rows.find((x) => x.count > 0)?.name || l2Rows[0]?.name || "");

    // L3 rows for focused L1 + L2
    const l3Rows = (() => {
      const l2Row = l2Rows.find((x) => x.name === defaultL2);
      if (!l2Row) return [];
      const out = [];
      for (const [l3, desc] of l2Row.l3Map.entries()) {
        out.push({ l1: l2Row.l1, l2: l2Row.name, name: l3, count: leafCountOf(l3), description: desc || "" });
      }
      out.sort((a, b) => b.count - a.count);
      return out;
    })();

    return { l1Rows, l2Rows, l3Rows, defaultL1, defaultL2, l1LeafMap, l2LeafMap };
  }, [totalsByService, serviceOrgIdMap, focusedL1, focusedL2]);

  // initialize focused levels after counts load
  useEffect(() => {
    if (!loading && !err && hierarchy.defaultL1 && !focusedL1) setFocusedL1(hierarchy.defaultL1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, err, hierarchy.defaultL1]);

  useEffect(() => {
    if (!loading && !err && hierarchy.defaultL2 && !focusedL2) setFocusedL2(hierarchy.defaultL2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, err, hierarchy.defaultL2]);

  // visible rows for searches
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

  const visibleL3 = useMemo(() => {
    const q = normalize(searchL3);
    const rows = hierarchy.l3Rows || [];
    if (!q) return rows;
    return rows.filter((r) => normalize(r.name).includes(q));
  }, [hierarchy.l3Rows, searchL3]);

  // Set -> arrays for query params / hook deps
  const selectedServicesTreeArr = useMemo(() => Array.from(selectedServicesTree), [selectedServicesTree]);
  const selectedCTsArr = useMemo(() => Array.from(selectedCTs), [selectedCTs]);
  const selectedInfraArr = useMemo(() => Array.from(selectedInfra), [selectedInfra]);
  const selectedRegionsArr = useMemo(() => Array.from(selectedRegions), [selectedRegions]);
  const selectedCountriesArr = useMemo(() => Array.from(selectedCountries), [selectedCountries]);
  const selectedSizingArr = useMemo(() => Array.from(selectedSizing), [selectedSizing]);

  const selectedServicesSorted = useMemo(() => {
    const a = Array.from(selectedServicesTree);
    a.sort((x, y) => x.localeCompare(y));
    return a;
  }, [selectedServicesTree]);

  function toggleSet(setter, name) {
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

  /**
   * Services tree selection
   * - L3 click: toggle that leaf service
   * - L2 click: toggle ALL descendant leaves under (L1, L2)
   * - L1 click: toggle ALL descendant leaves under L1
   *
   * This prevents "blank everything" when L1/L2 are grouping labels
   * that don't exist in org SERVICE tokens.
   */
  function toggleServiceNode({ level, l1, l2, l3 }) {
    const nextLeaves = (() => {
      if (level === "L3") {
        const leaf = String(l3 || "").trim();
        return leaf ? [leaf] : [];
      }
      if (level === "L2") {
        const key = `${String(l1 || "").trim()}||${String(l2 || "").trim()}`;
        const set = hierarchy?.l2LeafMap?.get?.(key);
        return set ? Array.from(set) : [];
      }
      if (level === "L1") {
        const set = hierarchy?.l1LeafMap?.get?.(String(l1 || "").trim());
        return set ? Array.from(set) : [];
      }
      return [];
    })();

    if (!nextLeaves.length) return;

    setSelectedServicesTree((prev) => {
      const next = new Set(Array.from(prev));
      const allSelected = nextLeaves.every((x) => next.has(x));
      if (allSelected) {
        for (const x of nextLeaves) next.delete(x);
      } else {
        for (const x of nextLeaves) next.add(x);
      }
      return next;
    });

    setOrgPage(1);
  }

  function clearAll() {
    setFocusedL1(hierarchy.l1Rows?.[0]?.name || "");
    setFocusedL2("");
    setSearchL1("");
    setSearchL2("");
    setSearchL3("");
    setSelectedServicesTree(new Set());

    setSelectedCTs(new Set());
    setCtMatch("any");
    setSelectedInfra(new Set());
    setSelectedRegions(new Set());
    setSelectedCountries(new Set());
    setSelectedSizing(new Set());

    setOrgPage(1);
  }

  /**
   * Aggregate fetch: load ALL orgs under current filters so visuals
   * (bars + donuts + countries) reflect the entire filtered population.
   */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setAggLoading(true);
        setAggErr("");

        const rows = await fetchAllOrgs({
          services: selectedServicesTreeArr,
          svcMatch,
          ct: selectedCTsArr,
          ctMatch,
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
  }, [svcMatch, ctMatch, selectedServicesTreeArr, selectedCTsArr, selectedInfraArr, selectedRegionsArr, selectedCountriesArr, selectedSizingArr]);

  /**
   * Table fetch: server-mode pagination (one page).
   */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setOrgLoading(true);
        setOrgErr("");

        // When svcMatch=all, the backend can't do AND semantics for SERVICES.
        // We already fetched the full filtered universe into aggOrgs (with client-side AND applied),
        // so paginate locally to keep totals + pages correct.
        if (selectedServicesTree.size > 0 && String(svcMatch || "any").toLowerCase() === "all") {
          const total = aggOrgs.length || 0;
          const start = (orgPage - 1) * orgPageSize;
          const end = start + orgPageSize;
          const pageRows = aggOrgs.slice(start, end);
          if (!alive) return;
          setOrgRows(pageRows);
          setOrgTotal(total);
          return;
        }

        const params = new URLSearchParams();
        params.set("page", String(orgPage));
        params.set("pageSize", String(orgPageSize));

        if (selectedServicesTree.size > 0) {
          params.set("SERVICES", selectedServicesTreeArr.join(","));
          // IMPORTANT: do not send SVC_MATCH (server doesn't support it).
        }

        if (selectedCTs.size > 0) {
          params.set("CONTENT_TYPES", selectedCTsArr.join(","));
          params.set("CT_MATCH", ctMatch);
        }

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
    svcMatch,
    ctMatch,
    aggOrgs,
    selectedServicesTreeArr,
    selectedCTsArr,
    selectedInfraArr,
    selectedRegionsArr,
    selectedCountriesArr,
    selectedSizingArr,
    selectedServicesTree.size,
    selectedCTs.size,
    selectedInfra.size,
    selectedRegions.size,
    selectedCountries.size,
    selectedSizing.size,
    aggOrgs,
  ]);

  /* =========================
     VISUALS data (kept same idea)
     Now that Services are primary, the "bars" become:
       - Top Content Types (secondary)
       - Top Infra Tools (secondary)
  ========================= */

  const topCTsAll = useMemo(() => countByTokens(aggOrgs, "CONTENT_TYPES"), [aggOrgs]);
  const topInfraAll = useMemo(() => countByTokens(aggOrgs, "INFRASTRUCTURE_TOOLS"), [aggOrgs]);
  const topCountriesAll = useMemo(() => countByTokensNormalized(aggOrgs, "GEONAME_COUNTRY_NAME"), [aggOrgs]);

  const topCTs = useMemo(() => {
    const q = normalize(searchCTs);
    const rows = topCTsAll || [];
    const filtered = q ? rows.filter((r) => normalize(r.name).includes(q)) : rows;
    return filtered.slice(0, 7);
  }, [topCTsAll, searchCTs]);

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
    return filtered.slice(0, 80);
  }, [topCountriesAll, searchCountries]);

  const maxCT = topCTsAll?.[0]?.count || 0;
  const maxInfra = topInfraAll?.[0]?.count || 0;
  const maxCountry = topCountriesAll?.[0]?.count || 0;

  // donuts
  const salesRegionRows = useMemo(() => countBySingleTokenNormalized(aggOrgs, "SALES_REGION"), [aggOrgs]);

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

  /**
   * Safety client filter for donut/country filters
   * (same as before, only filtering the current page).
   */
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
        services: selectedServicesTreeArr,
        svcMatch,
        ct: selectedCTsArr,
        ctMatch,
        infra: selectedInfraArr,
        regions: selectedRegionsArr,
        countries: selectedCountriesArr,
        sizing: selectedSizingArr,
      }),
    [selectedServicesTreeArr, svcMatch, selectedCTsArr, ctMatch, selectedInfraArr, selectedRegionsArr, selectedCountriesArr, selectedSizingArr]
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
              onClick={() => navigate("/participants/organizations/services")}
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
              Services
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>
            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Visualize</span>

            <Pill>{(totalOrgs || 0).toLocaleString()} orgs</Pill>
            {selectedServicesTree.size > 0 ? <Pill>{selectedServicesTree.size} services</Pill> : null}
            {selectedCTs.size > 0 ? <Pill>{selectedCTs.size} CT</Pill> : null}
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
            <h1 style={{ margin: "6px 0 6px", fontSize: 32, fontWeight: 1100, color: BRAND.ink }}>Service Paths</h1>
            <p style={{ margin: 0, maxWidth: 1100, fontWeight: 850, opacity: 0.85, lineHeight: 1.35 }}>
              Click cards to toggle service selection. Bars + donuts are interactive and filter the org table.
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
                {/* TREE: Root + L1 + L2 + L3 */}
                <div style={{ display: "grid", gridTemplateColumns: "1.0fr 1.4fr 1.4fr 1.4fr", gap: 16, alignItems: "start" }}>
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
                      <SectionTitle k="LEVEL 1" title="L1 Services" />
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
                          width: 200,
                          background: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                      {visibleL1.map((r) => {
                        const focused = r.name === focusedL1;
                        const leaves = hierarchy?.l1LeafMap?.get?.(r.name);
                        const selected = leaves ? Array.from(leaves).some((x) => selectedServicesTree.has(x)) : false;
                        return (
                          <Card
                            key={r.name}
                            active={focused}
                            onClick={() => {
                              setFocusedL1(r.name);
                              setFocusedL2(""); // reset L2 focus so L2 defaults recompute naturally
                              toggleServiceNode({ level: "L1", l1: r.name });
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
                      <SectionTitle k="LEVEL 2" title={focusedL1 || "L2 Services"} />
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
                          width: 200,
                          background: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                      {visibleL2.map((r) => {
                        const focused = r.name === focusedL2;
                        const k = `${focusedL1}||${r.name}`;
                        const leaves = hierarchy?.l2LeafMap?.get?.(k);
                        const selected = leaves ? Array.from(leaves).some((x) => selectedServicesTree.has(x)) : false;
                        return (
                          <Card
                            key={r.name}
                            active={focused}
                            onClick={() => {
                              setFocusedL2(r.name);
                              toggleServiceNode({ level: "L2", l1: focusedL1, l2: r.name });
                            }}
                            title={r.description ? r.description : "Click to focus + toggle selection"}
                            style={{ outline: selected ? "2px solid rgba(30,42,120,0.35)" : "none" }}
                          >
                            <CardTopBar />
                            <NodeRow label={r.name} value={r.count} rightMeta={`${r.l3Count} L3`} />
                          </Card>
                        );
                      })}
                      {!visibleL2.length ? <div style={{ padding: 10, fontWeight: 900, opacity: 0.7 }}>No L2 items (or no matches).</div> : null}
                    </div>
                  </div>

                  {/* LEVEL 3 */}
                  <div>
                    <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                      <SectionTitle k="LEVEL 3" title={focusedL2 || "L3 Services"} />
                      <input
                        value={searchL3}
                        onChange={(e) => setSearchL3(e.target.value)}
                        placeholder="Search L3…"
                        style={{
                          height: 36,
                          borderRadius: 12,
                          border: "1px solid rgba(30,42,120,0.16)",
                          padding: "0 12px",
                          fontWeight: 900,
                          outline: "none",
                          color: BRAND.text,
                          width: 200,
                          background: "#FFFFFF",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                      {visibleL3.map((r) => {
                        const selected = selectedServicesTree.has(r.name);
                        return (
                          <Card
                            key={r.name}
                            onClick={() => toggleServiceNode({ level: "L3", l1: focusedL1, l2: focusedL2, l3: r.name })}
                            title={r.description ? r.description : "Click to toggle selection"}
                            style={{ outline: selected ? "2px solid rgba(30,42,120,0.35)" : "none" }}
                          >
                            <CardTopBar />
                            <NodeRow label={r.name} value={r.count} />
                          </Card>
                        );
                      })}
                      {!visibleL3.length ? <div style={{ padding: 10, fontWeight: 900, opacity: 0.7 }}>No L3 items (or no matches).</div> : null}
                    </div>
                  </div>
                </div>

                {/* Selected Services chips + SVC_MATCH */}
                {selectedServicesSorted.length > 0 ? (
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
                    <div style={{ fontWeight: 1100, color: BRAND.ink, marginRight: 6 }}>Selected Services:</div>
                    {selectedServicesSorted.slice(0, 18).map((t) => (
                      <Chip key={t} label={t} onRemove={() => toggleSet(setSelectedServicesTree, t)} />
                    ))}
                    {selectedServicesSorted.length > 18 ? (
                      <span style={{ fontWeight: 950, opacity: 0.7 }}>+{selectedServicesSorted.length - 18} more</span>
                    ) : null}

                    <div style={{ flex: 1 }} />

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={svcMatch}
                        onChange={(e) => {
                          setSvcMatch(e.target.value);
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
                        title="SVC_MATCH applies to SERVICES"
                      >
                        <option value="any">SVC_MATCH: any</option>
                        <option value="all">SVC_MATCH: all</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {/* VISUALS */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>VISUALS</div>
                      <div style={{ fontSize: 18, fontWeight: 1100, color: BRAND.ink }}>Content Types × Services & Services × Infra</div>
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
                            <SectionTitle k="CONTENT TYPES × SERVICES" title="Top Content Types" />
                            <input
                              value={searchCTs}
                              onChange={(e) => setSearchCTs(e.target.value)}
                              placeholder="Search CT…"
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
                              {topCTs.map((r) => (
                                <BarRow
                                  key={r.name}
                                  label={r.name}
                                  value={r.count}
                                  maxValue={maxCT}
                                  selected={selectedCTs.has(r.name)}
                                  onClick={() => toggleSet(setSelectedCTs, r.name)}
                                  title="Click to toggle content type filter"
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                            <SectionTitle k="SERVICES × INFRA" title="Top Infra Tools" />
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
                                  onClick={() => toggleSet(setSelectedInfra, r.name)}
                                  title="Click to toggle infra filter"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedCTs.size > 0 || selectedInfra.size > 0 ? (
                        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          {Array.from(selectedCTs).map((t) => (
                            <Chip key={t} label={t} onRemove={() => toggleSet(setSelectedCTs, t)} />
                          ))}
                          {Array.from(selectedInfra).map((t) => (
                            <Chip key={t} label={t} onRemove={() => toggleSet(setSelectedInfra, t)} />
                          ))}
                          <div style={{ flex: 1 }} />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCTs(new Set());
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
                      onToggle={(name) => toggleSet(setSelectedSizing, name)}
                      maxSlices={8}
                      totalOverride={aggOrgs.length}
                    />

                    <DonutChart
                      title="SALES REGION"
                      subtitle="Hover for values — click to filter"
                      rows={salesRegionRows}
                      selectedSet={selectedRegions}
                      onToggle={(name) => toggleSet(setSelectedRegions, name)}
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
                              onClick={() => toggleSet(setSelectedCountries, r.name)}
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
                            <Chip key={t} label={t} onRemove={() => toggleSet(setSelectedCountries, t)} />
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
                            {["Org ID", "Org Name", "Services", "Sales Region"].map((h) => (
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
                            const svcs = splitTokens(org?.SERVICES);

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
                                    {svcs.slice(0, 12).map((t) => (
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
                                    {svcs.length > 12 ? <span style={{ fontSize: 12, fontWeight: 950, opacity: 0.65 }}>+{svcs.length - 12}</span> : null}
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


