import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BRAND = {
  bg: "#F6F8FF",
  card: "rgba(255,255,255,0.78)",
  text: "#0B1020",
  ink: "#1E2A78",
  border: "rgba(30,42,120,0.14)",
  bar: "#3C82FF",
  fill: "#CFEFF7",
  shadow: "0 12px 30px rgba(17, 24, 39, 0.10)",
  radius: 22,
  grad:
    "radial-gradient(1200px 700px at 0% 0%, rgba(60,130,255,0.18), transparent 55%)," +
    "radial-gradient(900px 600px at 100% 0%, rgba(125,211,252,0.14), transparent 55%)," +
    "radial-gradient(900px 600px at 0% 100%, rgba(99,102,241,0.12), transparent 55%)",
};

const TOKEN_FIELDS = new Set(["INFRA_RELATED_SERVICES", "INFRA_RELATED_CONTENT_TYPES"]);
const base = import.meta.env.VITE_API_BASE;

const EXCLUDED_TABLE_FIELDS = new Set(["ME_NEXUS_INFRA_ID", "ME-NEXUS_INFRA_ID", "Id", "ID", "id"]);

const FIELD_LABELS = {
  INFRA_NAME: "Infrastructure",
  INFRA_IS_ACTIVE: "Active",
  INFRA_DESCRIPTION: "Description",
  INFRA_PARENT_ORGANIZATION: "Parent Organization",
  INFRA_HAS_API: "Has API",
  INFRA_RELEASE_DATE: "Release Date",
  INFRA_LATEST_VERSION: "Latest Version",
  INFRA_LICENSE: "License",
  INFRA_YEARLY_CORPORATE_PRICING: "Yearly Corporate Pricing",
  INFRA_FUNCTIONAL_TYPE: "Functional Type",
  INFRA_STRUCTURAL_TYPE: "Structural Type",
  INFRA_RELATED_SERVICES: "Related Services",
  INFRA_RELATED_CONTENT_TYPES: "Related Content Types",
  ME_NEXUS_INFRA_ID: "Infra ID",
  "ME-NEXUS_INFRA_ID": "Infra ID",
};

function toPrettyLabel(field) {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return String(field)
    .replace(/^INFRA_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function splitTokens(v) {
  if (v == null) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeBool(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return null;
}

function yearFromReleaseDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m1 = s.match(/(\d{4})/);
  if (!m1) return null;
  const y = Number(m1[1]);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  return y;
}

function compact(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  const abs = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(x);
}

function qsFromSelection(selected) {
  const params = new URLSearchParams();
  for (const [k, set] of Object.entries(selected || {})) {
    if (!set || set.size === 0) continue;
    params.set(k, Array.from(set).join(","));
  }
  return params;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function truncate(s, n) {
  const str = String(s ?? "");
  if (str.length <= n) return str;
  return str.slice(0, Math.max(0, n - 1)) + "…";
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function normalizeLicense(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "Unknown";
  if (s.includes("open") && s.includes("source")) return "Open-Source";
  if (s.includes("subscription") || s.includes("saas") || s.includes("monthly") || s.includes("annual")) return "Subscription";
  if (s.includes("free") || s.includes("freemium")) return "Free";
  if (s.includes("permanent") || s.includes("perpetual") || s.includes("one-time") || s.includes("onetime")) return "Permanent";
  return s.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function clamp2Style() {
  return {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

function Card({ title, right, children, style }) {
  return (
    <div
      style={{
        borderRadius: BRAND.radius,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.card,
        boxShadow: BRAND.shadow,
        overflow: "hidden",
        ...style,
      }}
    >
      {title ? (
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            background: "rgba(247,251,254,0.65)",
          }}
        >
          <div style={{ fontWeight: 950, color: BRAND.text }}>{title}</div>
          {right ? <div>{right}</div> : null}
        </div>
      ) : null}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function Pill({ children, onClick, active = false, title }) {
  return (
    <span
      title={title}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 999,
        border: active ? "1px solid rgba(30,42,120,0.35)" : "1px solid rgba(30,42,120,0.18)",
        background: active ? "rgba(207,239,247,0.95)" : "rgba(207,239,247,0.55)",
        color: BRAND.text,
        fontWeight: 950,
        fontSize: 12,
        lineHeight: 1,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        boxShadow: active ? "0 10px 20px rgba(17,24,39,0.06)" : "none",
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, disabled, variant = "primary", title }) {
  const primary = variant === "primary";
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: 12,
        padding: "10px 12px",
        border: primary ? "1px solid rgba(30,42,120,0.25)" : "1px solid rgba(0,0,0,0.12)",
        background: primary ? BRAND.fill : "rgba(255,255,255,0.9)",
        color: BRAND.text,
        fontWeight: 950,
        boxShadow: "0 10px 20px rgba(17,24,39,0.06)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(17,24,39,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(1100px, 96vw)",
          maxHeight: "92vh",
          overflow: "hidden",
          borderRadius: 18,
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 980, color: BRAND.text }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              cursor: "pointer",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.9)",
              padding: "8px 10px",
              fontWeight: 950,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 14, overflow: "auto", flex: 1, paddingBottom: footer ? 96 : 14 }}>{children}</div>

        {footer ? (
          <div
            style={{
              padding: 14,
              borderTop: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(247,251,254,0.92)",
              position: "sticky",
              bottom: 0,
              zIndex: 2,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Clickable horizontal bar chart */
function ClickBarChart({ rows, onPick, pickedLabel, maxBars = 30, height = 420 }) {
  const data = useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    return arr.slice(0, maxBars);
  }, [rows, maxBars]);

  const max = useMemo(() => data.reduce((m, r) => Math.max(m, r.value || 0), 0), [data]);

  const width = 980;
  const pad = { t: 30, r: 76, b: 18, l: 340 };
  const innerW = width - pad.l - pad.r;

  const rowH = 32;
  const gap = 12;
  const needed = pad.t + pad.b + data.length * rowH + (data.length - 1) * gap;
  const h = Math.max(height, needed);

  return (
    <div>
      {!data.length ? (
        <div
          style={{
            height: 240,
            display: "grid",
            placeItems: "center",
            color: BRAND.text,
            opacity: 0.7,
            fontWeight: 850,
            borderRadius: 18,
            border: `1px dashed ${BRAND.border}`,
            background: "rgba(255,255,255,0.55)",
          }}
        >
          No data
        </div>
      ) : (
        <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id="hBarGradPick" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={BRAND.bar} stopOpacity="0.90" />
              <stop offset="100%" stopColor={BRAND.bar} stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="hBarGradDim" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={BRAND.bar} stopOpacity="0.35" />
              <stop offset="100%" stopColor={BRAND.bar} stopOpacity="0.20" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((p, i) => {
            const x = pad.l + innerW * p;
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={pad.t - 6} y2={h - pad.b} stroke="rgba(17,24,39,0.08)" />
                <text x={x} y={pad.t - 10} textAnchor="middle" fontSize="11" fontWeight="850" fill={BRAND.text} opacity="0.55">
                  {compact(max * p)}
                </text>
              </g>
            );
          })}

          {data.map((r, i) => {
            const y = pad.t + i * (rowH + gap);
            const w = max > 0 ? ((r.value || 0) / max) * innerW : 0;
            const isPicked = pickedLabel && r.label === pickedLabel;
            const anyPicked = Boolean(pickedLabel);
            const fill = !anyPicked ? "url(#hBarGradPick)" : isPicked ? "url(#hBarGradPick)" : "url(#hBarGradDim)";

            return (
              <g key={r.key || `${r.label}__${i}`} style={{ cursor: "pointer" }} onClick={() => onPick?.(r.label)}>
                <text x={pad.l - 14} y={y + rowH / 2 + 4} textAnchor="end" fontSize="12" fontWeight="900" fill={BRAND.text} opacity="0.92">
                  {truncate(r.label, 44)}
                  <title>{r.label}</title>
                </text>

                <rect x={pad.l} y={y} width={Math.max(2, w)} height={rowH} rx="12" fill={fill} />
                <text x={Math.min(width - pad.r + 6, pad.l + Math.max(10, w) + 12)} y={y + rowH / 2 + 4} textAnchor="start" fontSize="12" fontWeight="980" fill={BRAND.text} opacity="0.92">
                  {compact(r.value)}
                </text>

                <rect x={0} y={y} width={width} height={rowH} fill="transparent" />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Clickable donut */
function ClickDonut({ data, pickedLabel, onPick, height = 360 }) {
  const rows = useMemo(() => (Array.isArray(data) ? data.filter((d) => Number(d?.value) > 0) : []), [data]);
  const total = useMemo(() => rows.reduce((s, d) => s + (Number(d.value) || 0), 0), [rows]);

  const size = clamp(Math.floor(height - 40), 280, 480);
  const stroke = 30;
  const r = size / 2 - stroke / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const palette = ["rgba(60,130,255,0.95)", "rgba(30,42,120,0.85)", "rgba(125,211,252,0.85)", "rgba(99,102,241,0.78)", "rgba(59,130,246,0.62)", "rgba(147,197,253,0.62)", "rgba(96,165,250,0.55)"];

  const segs = useMemo(() => {
    if (!rows.length || total <= 0) return [];
    let acc = 0;
    return rows.map((d, idx) => {
      const v = Number(d.value) || 0;
      const frac = v / total;
      const len = frac * circ;
      const dasharray = `${len} ${circ - len}`;
      const dashoffset = -acc;
      acc += len;
      return { label: String(d.label ?? ""), value: v, frac, dasharray, dashoffset, color: palette[idx % palette.length] };
    });
  }, [rows, total, circ]);

  return (
    <div>
      {!segs.length ? (
        <div
          style={{
            height: 240,
            display: "grid",
            placeItems: "center",
            color: BRAND.text,
            opacity: 0.7,
            fontWeight: 850,
            borderRadius: 18,
            border: `1px dashed ${BRAND.border}`,
            background: "rgba(255,255,255,0.55)",
          }}
        >
          No data
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 520px) 1fr", gap: 14, alignItems: "center" }}>
          <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
            <circle cx={cx} cy={cy} r={r} stroke="rgba(17,24,39,0.08)" strokeWidth={stroke} fill="transparent" />
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {segs.map((s) => {
                const isPicked = pickedLabel && pickedLabel === s.label;
                const anyPicked = Boolean(pickedLabel);
                const opacity = !anyPicked ? 1 : isPicked ? 1 : 0.25;

                return (
                  <circle
                    key={s.label}
                    cx={cx}
                    cy={cy}
                    r={r}
                    stroke={s.color}
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={s.dasharray}
                    strokeDashoffset={s.dashoffset}
                    strokeLinecap="round"
                    style={{ cursor: "pointer", opacity }}
                    onClick={() => onPick?.(s.label)}
                  >
                    <title>
                      {s.label}: {compact(s.value)} ({Math.round(s.frac * 100)}%)
                    </title>
                  </circle>
                );
              })}
            </g>

            <circle cx={cx} cy={cy} r={r - stroke / 2 - 8} fill="rgba(255,255,255,0.92)" />
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="18" fontWeight="980" fill={BRAND.text}>
              {compact(total)}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12" fontWeight="900" fill={BRAND.text} opacity="0.65">
              total
            </text>
          </svg>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {segs
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((s) => {
                const isPicked = pickedLabel && pickedLabel === s.label;
                return (
                  <div
                    key={s.label}
                    onClick={() => onPick?.(s.label)}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: isPicked ? "1px solid rgba(30,42,120,0.35)" : "1px solid rgba(0,0,0,0.10)",
                      background: isPicked ? "rgba(207,239,247,0.85)" : "rgba(255,255,255,0.70)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color, display: "inline-block" }} />
                      <div style={{ fontWeight: 950, color: BRAND.text }}>{s.label}</div>
                    </div>
                    <div style={{ fontWeight: 980, color: BRAND.text, opacity: 0.9 }}>
                      {compact(s.value)} <span style={{ opacity: 0.6, fontWeight: 900 }}>({Math.round(s.frac * 100)}%)</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function ClickYearLine({ buckets, pickedYear, onPick, height = 230 }) {
  const years = useMemo(() => {
    const keys = Object.keys(buckets || {})
      .map((k) => Number(k))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    return keys;
  }, [buckets]);

  const points = useMemo(() => years.map((y) => ({ year: y, value: Number(buckets[y] || 0) })), [years, buckets]);
  const max = useMemo(() => points.reduce((m, p) => Math.max(m, p.value), 0), [points]);

  const width = 980;
  const pad = { t: 18, r: 18, b: 30, l: 36 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const toX = (i) => pad.l + (years.length <= 1 ? 0 : (i / (years.length - 1)) * innerW);
  const toY = (v) => pad.t + (max > 0 ? innerH * (1 - v / max) : innerH);

  const d = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(p.value).toFixed(2)}`).join(" ");
  }, [points, innerW, innerH, max]);

  const areaD = useMemo(() => {
    if (!d) return "";
    const lastX = toX(points.length - 1);
    const baseY = pad.t + innerH;
    return `${d} L ${lastX.toFixed(2)} ${baseY.toFixed(2)} L ${toX(0).toFixed(2)} ${baseY.toFixed(2)} Z`;
  }, [d, points.length, innerH]);

  return (
    <div>
      {!points.length ? (
        <div
          style={{
            height: 180,
            display: "grid",
            placeItems: "center",
            color: BRAND.text,
            opacity: 0.7,
            fontWeight: 850,
            borderRadius: 18,
            border: `1px dashed ${BRAND.border}`,
            background: "rgba(255,255,255,0.55)",
          }}
        >
          No data
        </div>
      ) : (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={BRAND.bar} stopOpacity="0.25" />
              <stop offset="100%" stopColor={BRAND.bar} stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((p, i) => {
            const y = pad.t + innerH * (1 - p);
            return (
              <g key={i}>
                <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="rgba(17,24,39,0.08)" />
                <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11" fontWeight="850" fill={BRAND.text} opacity="0.55">
                  {compact(max * p)}
                </text>
              </g>
            );
          })}

          <path d={areaD} fill="url(#areaGrad)" />
          <path d={d} fill="none" stroke={BRAND.bar} strokeWidth="3" />

          {points.map((p, i) => {
            const x = toX(i);
            const y = toY(p.value);
            const isPicked = pickedYear === p.year;
            const anyPicked = Number.isFinite(pickedYear);
            const opacity = !anyPicked ? 1 : isPicked ? 1 : 0.25;
            return (
              <g key={p.year} style={{ cursor: "pointer", opacity }} onClick={() => onPick?.(p.year)}>
                <circle cx={x} cy={y} r={isPicked ? 6 : 4} fill="rgba(255,255,255,0.95)" stroke={BRAND.bar} strokeWidth="2" />
                <title>
                  {p.year}: {compact(p.value)}
                </title>
              </g>
            );
          })}

          {points.map((p, i) => {
            if (points.length > 28 && i % 2 === 1) return null;
            if (points.length > 44 && i % 3 !== 0) return null;
            const x = toX(i);
            return (
              <text key={`x${p.year}`} x={x} y={height - 10} textAnchor="middle" fontSize="10" fontWeight="850" fill={BRAND.text} opacity="0.65">
                {p.year}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export default function InfraVisualize() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialQuery = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialQ = initialQuery.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [infraRows, setInfraRows] = useState([]);

  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({});

  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  // year filters (match Infrastructure.jsx)
  const [yearMin, setYearMin] = useState(initialQuery.get("INFRA_RELEASE_YEAR_MIN") || "");
  const [yearMax, setYearMax] = useState(initialQuery.get("INFRA_RELEASE_YEAR_MAX") || "");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(() => {
    const s = {};
    for (const [k, v] of initialQuery.entries()) {
      if (k === "q") continue;
      if (k === "INFRA_RELEASE_YEAR_MIN") continue;
      if (k === "INFRA_RELEASE_YEAR_MAX") continue;
      if (!v) continue;
      s[k] = new Set(splitTokens(v));
    }
    return s;
  });
  const [draftSelected, setDraftSelected] = useState({});
  const [filterSearch, setFilterSearch] = useState({}); // exact same as Infrastructure.jsx

  // selection from visuals
  const [pickedService, setPickedService] = useState(null);
  const [pickedFunctional, setPickedFunctional] = useState(null);
  const [pickedStructural, setPickedStructural] = useState(null);
  const [pickedContentType, setPickedContentType] = useState(null);
  const [pickedApi, setPickedApi] = useState(null);
  const [pickedLicense, setPickedLicense] = useState(null);
  const [pickedYear, setPickedYear] = useState(null);
  const [pickedParentOrg, setPickedParentOrg] = useState(null);
  const [pickedActive, setPickedActive] = useState(null); // "Active" | "Inactive"

  // services chart switch view
  const [servicesView, setServicesView] = useState("services"); // "services" | "functional"

  // tool selection set derived from clicking visuals
  const [selectedInfra, setSelectedInfra] = useState(() => new Set());

  // org modal preview (kept)
  const [orgsOpen, setOrgsOpen] = useState(false);
  const [orgsMode, setOrgsMode] = useState("selected"); // selected | filtered
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsData, setOrgsData] = useState([]);
  const [orgsTotal, setOrgsTotal] = useState(0);
  const [orgsPage, setOrgsPage] = useState(1);
  const [orgsPageSize, setOrgsPageSize] = useState(25);
  const [orgsQ, setOrgsQ] = useState("");
  const [orgsDebouncedQ, setOrgsDebouncedQ] = useState("");

  // cache for fast refetches
  const infraCacheRef = useRef(new Map());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => setOrgsDebouncedQ(orgsQ.trim()), 200);
    return () => clearTimeout(t);
  }, [orgsQ]);

  // Fetch filter options (once)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setFiltersLoading(true);
        const res = await fetch(`${base}/api/infra/filters`);
        const json = await res.json();
        if (cancelled) return;
        setFilterOptions(json || {});
      } catch {
        if (!cancelled) setFilterOptions({});
      } finally {
        if (!cancelled) setFiltersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch infra rows (filtered by UI filters)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const params = qsFromSelection(selected);
      if (debouncedQ) params.set("q", debouncedQ);

      params.set("page", "1");
      params.set("pageSize", "5000");

      if (yearMin) params.set("INFRA_RELEASE_YEAR_MIN", yearMin);
      if (yearMax) params.set("INFRA_RELEASE_YEAR_MAX", yearMax);

      const key = params.toString();
      if (infraCacheRef.current.has(key)) {
        const cached = infraCacheRef.current.get(key);
        setInfraRows(cached || []);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${base}/api/infra?${key}`);
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (cancelled) return;
        infraCacheRef.current.set(key, rows);
        setInfraRows(rows);
      } catch {
        if (!cancelled) setInfraRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected, debouncedQ, yearMin, yearMax]);

  const filteredInfraNames = useMemo(() => infraRows.map((r) => String(r?.INFRA_NAME || "")).filter(Boolean), [infraRows]);

  // ===== Selection logic (PowerBI-style crossfilter)
  const clearSelectionTray = useCallback(() => {
    setPickedService(null);
    setPickedFunctional(null);
    setPickedStructural(null);
    setPickedContentType(null);
    setPickedApi(null);
    setPickedLicense(null);
    setPickedYear(null);
    setPickedParentOrg(null);
    setPickedActive(null);
    setSelectedInfra(new Set());
  }, []);

  const deriveToolSelection = useCallback(
    ({ type, value }) => {
      const set = new Set();
      if (!value || !type) return set;

      for (const row of infraRows) {
        const name = String(row?.INFRA_NAME || "").trim();
        if (!name) continue;

        if (type === "service") {
          const tokens = splitTokens(row?.INFRA_RELATED_SERVICES);
          if (tokens.includes(value)) set.add(name);
        } else if (type === "contentType") {
          const tokens = splitTokens(row?.INFRA_RELATED_CONTENT_TYPES);
          if (tokens.includes(value)) set.add(name);
        } else if (type === "functional") {
          const rawFT = String(row?.INFRA_FUNCTIONAL_TYPE ?? "").trim();
          const tokens = splitTokens(rawFT);
          const has = tokens.length ? tokens.includes(value) : rawFT === value;
          if (has) set.add(name);
        } else if (type === "structural") {
          const rawST = String(row?.INFRA_STRUCTURAL_TYPE ?? "").trim();
          const tokens = splitTokens(rawST);
          const has = tokens.length ? tokens.includes(value) : rawST === value;
          if (has) set.add(name);
        } else if (type === "parentOrg") {
          const po = String(row?.INFRA_PARENT_ORGANIZATION || "").trim() || "Unknown";
          if (po === value) set.add(name);
        } else if (type === "active") {
          const b = normalizeBool(row?.INFRA_IS_ACTIVE);
          if (value === "Active" && b === true) set.add(name);
          if (value === "Inactive" && b === false) set.add(name);
        } else if (type === "api") {
          const b = normalizeBool(row?.INFRA_HAS_API);
          if (value === "Has API" && b === true) set.add(name);
          if (value === "No API" && b === false) set.add(name);
        } else if (type === "license") {
          const lic = normalizeLicense(row?.INFRA_LICENSE);
          if (lic === value) set.add(name);
        } else if (type === "year") {
          const y = yearFromReleaseDate(row?.INFRA_RELEASE_DATE);
          if (String(y) === String(value)) set.add(name);
        }
      }

      return set;
    },
    [infraRows]
  );

  const togglePick = useCallback(
    (type, value) => {
      const isSame =
        (type === "service" && pickedService === value) ||
        (type === "functional" && pickedFunctional === value) ||
        (type === "structural" && pickedStructural === value) ||
        (type === "contentType" && pickedContentType === value) ||
        (type === "api" && pickedApi === value) ||
        (type === "license" && pickedLicense === value) ||
        (type === "year" && pickedYear === value) ||
        (type === "parentOrg" && pickedParentOrg === value) ||
        (type === "active" && pickedActive === value);

      if (isSame) {
        clearSelectionTray();
        return;
      }

      // ✅ Don't allow picking Unknown parent org
      if (type === "parentOrg" && (value == null || String(value).trim() === "" || String(value).trim() === "Unknown")) {
        return;
      }

      // set pick
      if (type === "service") setPickedService(value);
      if (type === "functional") setPickedFunctional(value);
      if (type === "structural") setPickedStructural(value);
      if (type === "contentType") setPickedContentType(value);
      if (type === "api") setPickedApi(value);
      if (type === "license") setPickedLicense(value);
      if (type === "year") setPickedYear(value);
      if (type === "parentOrg") setPickedParentOrg(value);
      if (type === "active") setPickedActive(value);

      // clear others (single selection mental model)
      if (type !== "service") setPickedService(null);
      if (type !== "functional") setPickedFunctional(null);
      if (type !== "structural") setPickedStructural(null);
      if (type !== "contentType") setPickedContentType(null);
      if (type !== "api") setPickedApi(null);
      if (type !== "license") setPickedLicense(null);
      if (type !== "year") setPickedYear(null);
      if (type !== "parentOrg") setPickedParentOrg(null);
      if (type !== "active") setPickedActive(null);

      setSelectedInfra(deriveToolSelection({ type, value }));
    },
    [
      pickedService,
      pickedFunctional,
      pickedStructural,
      pickedContentType,
      pickedApi,
      pickedLicense,
      pickedYear,
      pickedParentOrg,
      pickedActive,
      deriveToolSelection,
      clearSelectionTray,
    ]
  );

  // If UI filters/search/year change, ensure chart-derived selection can't go stale
  useEffect(() => {
    setSelectedInfra((prev) => {
      if (!prev || prev.size === 0) return prev;
      const allowed = new Set(infraRows.map((r) => String(r?.INFRA_NAME || "").trim()).filter(Boolean));
      const next = new Set();
      for (const n of prev) if (allowed.has(n)) next.add(n);
      if (next.size === prev.size) return prev;
      // if selection collapses to empty, clear picks too
      if (next.size === 0) {
        setPickedService(null);
        setPickedFunctional(null);
        setPickedStructural(null);
        setPickedContentType(null);
        setPickedApi(null);
        setPickedLicense(null);
        setPickedYear(null);
        setPickedParentOrg(null);
        setPickedActive(null);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infraRows]);

  const selectionCount = selectedInfra.size;

  // Selected infra rows (based on current infraRows + selectedInfra set)
  const selectedInfraRows = useMemo(() => {
    if (!selectedInfra.size) return [];
    const set = selectedInfra;
    return infraRows.filter((r) => set.has(String(r?.INFRA_NAME || "").trim()));
  }, [infraRows, selectedInfra]);

  // Scope rows for aggregations:
  // - if a visual selection exists => scope = selectedInfraRows (crossfilters other visuals)
  // - else => scope = infraRows (UI filtered)
  const scopeRows = useMemo(() => {
    if (selectionCount > 0) return selectedInfraRows;
    return infraRows;
  }, [infraRows, selectionCount, selectedInfraRows]);

  // KPI should crossfilter too
  const kpis = useMemo(() => {
    const names = scopeRows.map((r) => String(r?.INFRA_NAME || "")).filter(Boolean);
    const infraCount = names.length;
    const parents = uniq(scopeRows.map((r) => String(r?.INFRA_PARENT_ORGANIZATION || "").trim()).filter(Boolean));
    return { infraCount, parentOrgCount: parents.length };
  }, [scopeRows]);

  // Aggregations driven by scopeRows
  const agg = useMemo(() => {
    const serviceCounts = new Map();
    const functionalCounts = new Map();
    const structuralCounts = new Map();
    const parentCounts = new Map();
    const ctCounts = new Map();
    const yearCounts = new Map();
    const apiCounts = { "Has API": 0, "No API": 0 };
    const licenseCounts = new Map();
    const activeCounts = { Active: 0, Inactive: 0 };

    const addCount = (map, key, inc = 1) => {
      if (!key) return;
      map.set(key, (map.get(key) || 0) + inc);
    };

    for (const row of scopeRows) {
      // services (token list)
      for (const s of splitTokens(row?.INFRA_RELATED_SERVICES)) addCount(serviceCounts, s);

      // content types (token list)
      for (const c of splitTokens(row?.INFRA_RELATED_CONTENT_TYPES)) addCount(ctCounts, c);

      // functional types (single or comma list)
      {
        const rawFT = String(row?.INFRA_FUNCTIONAL_TYPE ?? "").trim();
        const fts = splitTokens(rawFT);
        if (fts.length) fts.forEach((f) => addCount(functionalCounts, f));
        else addCount(functionalCounts, rawFT || "Unknown");
      }

      // structural types (single or comma list)
      {
        const rawST = String(row?.INFRA_STRUCTURAL_TYPE ?? "").trim();
        const sts = splitTokens(rawST);
        if (sts.length) sts.forEach((s) => addCount(structuralCounts, s));
        else addCount(structuralCounts, rawST || "Unknown");
      }

      // parent org
      addCount(parentCounts, String(row?.INFRA_PARENT_ORGANIZATION || "").trim() || "Unknown");

      // year
      const y = yearFromReleaseDate(row?.INFRA_RELEASE_DATE);
      if (y != null) addCount(yearCounts, String(y));

      // api
      const bApi = normalizeBool(row?.INFRA_HAS_API);
      if (bApi === true) apiCounts["Has API"] += 1;
      else if (bApi === false) apiCounts["No API"] += 1;

      // active
      const bActive = normalizeBool(row?.INFRA_IS_ACTIVE);
      if (bActive === true) activeCounts.Active += 1;
      else if (bActive === false) activeCounts.Inactive += 1;

      // license
      addCount(licenseCounts, normalizeLicense(row?.INFRA_LICENSE));
    }

    const toRows = (map) =>
      Array.from(map.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

    const yearsSorted = Array.from(yearCounts.entries())
      .map(([k, v]) => [Number(k), v])
      .filter(([y]) => Number.isFinite(y))
      .sort((a, b) => a[0] - b[0]);

    const yearBuckets = {};
    for (const [y, v] of yearsSorted) yearBuckets[y] = v;

    return {
      services: toRows(serviceCounts),
      functionalTypes: toRows(functionalCounts),
      structuralTypes: toRows(structuralCounts),

      // ✅ Remove Unknown from parent org visual options
      parentOrgs: toRows(parentCounts).filter((d) => d.label !== "Unknown"),

      contentTypes: toRows(ctCounts),
      api: [
        { label: "Has API", value: apiCounts["Has API"] },
        { label: "No API", value: apiCounts["No API"] },
      ].filter((d) => d.value > 0),
      active: [
        { label: "Active", value: activeCounts.Active },
        { label: "Inactive", value: activeCounts.Inactive },
      ].filter((d) => d.value > 0),
      licenses: toRows(licenseCounts),
      yearBuckets,
    };
  }, [scopeRows]);

  const visibleFilterChips = useMemo(() => {
    const chips = [];
    for (const [field, set] of Object.entries(selected || {})) {
      if (!set || set.size === 0) continue;
      chips.push(`${toPrettyLabel(field)}: ${set.size}`);
    }
    if (yearMin || yearMax) chips.push(`Release year: ${yearMin || "…"}–${yearMax || "…"}`);
    if (debouncedQ) chips.push(`Search: “${debouncedQ}”`);
    if (selectionCount > 0) chips.push(`Visual selection: 1`);
    return chips;
  }, [selected, yearMin, yearMax, debouncedQ, selectionCount]);

  const openFilters = useCallback(() => {
    const copy = {};
    for (const [k, v] of Object.entries(selected || {})) copy[k] = new Set(Array.from(v || []));
    setDraftSelected(copy);
    setFiltersOpen(true);
  }, [selected]);

  const clearAllFilters = useCallback(() => {
    setSelected({});
    setDraftSelected({});
    setFilterSearch({});
    setYearMin("");
    setYearMax("");
    clearSelectionTray();
  }, [clearSelectionTray]);

  const applyFilters = useCallback(() => {
    setSelected(draftSelected || {});
    setFiltersOpen(false);
    clearSelectionTray();
  }, [draftSelected, clearSelectionTray]);

  const goBackToSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (yearMin) params.set("INFRA_RELEASE_YEAR_MIN", yearMin);
    if (yearMax) params.set("INFRA_RELEASE_YEAR_MAX", yearMax);

    for (const [k, set] of Object.entries(selected || {})) {
      if (!set || set.size === 0) continue;
      params.set(k, Array.from(set).join(","));
    }
    navigate(`/participants/organizations/infrastructure?${params.toString()}`);
  }, [navigate, selected, debouncedQ, yearMin, yearMax]);

  const goToOrgsWithInfraList = useCallback(
    (infras) => {
      const list = Array.isArray(infras) ? infras : [];
      if (!list.length) return;
      const params = new URLSearchParams();
      params.set("INFRASTRUCTURE_TOOLS", list.join(","));
      navigate(`/participants/organizations?${params.toString()}`);
    },
    [navigate]
  );

  const viewOrgsSelected = useCallback(() => goToOrgsWithInfraList(Array.from(selectedInfra)), [goToOrgsWithInfraList, selectedInfra]);
  const viewOrgsFiltered = useCallback(() => goToOrgsWithInfraList(filteredInfraNames.slice(0, 100)), [goToOrgsWithInfraList, filteredInfraNames]);

  const openOrgsModal = useCallback((mode) => {
    setOrgsMode(mode);
    setOrgsOpen(true);
    setOrgsPage(1);
    setOrgsQ("");
    setOrgsDebouncedQ("");
  }, []);

  const orgInfras = useMemo(() => {
    if (orgsMode === "selected") return Array.from(selectedInfra);
    return filteredInfraNames.slice(0, 100);
  }, [orgsMode, selectedInfra, filteredInfraNames]);

  useEffect(() => {
    if (!orgsOpen) return;
    let cancelled = false;

    (async () => {
      const infras = orgInfras;
      if (!infras.length) {
        setOrgsData([]);
        setOrgsTotal(0);
        return;
      }

      setOrgsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("infras", infras.join(","));
        params.set("page", String(orgsPage));
        params.set("pageSize", String(orgsPageSize));
        if (orgsDebouncedQ) params.set("q", orgsDebouncedQ);

        const res = await fetch(`${base}/api/infra/orgs?${params.toString()}`);
        const json = await res.json();
        if (cancelled) return;

        setOrgsData(Array.isArray(json?.data) ? json.data : []);
        setOrgsTotal(Number(json?.total || 0));
      } catch {
        if (!cancelled) {
          setOrgsData([]);
          setOrgsTotal(0);
        }
      } finally {
        if (!cancelled) setOrgsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orgsOpen, orgInfras, orgsPage, orgsPageSize, orgsDebouncedQ]);

  const orgsTotalPages = useMemo(() => Math.max(1, Math.ceil((orgsTotal || 0) / orgsPageSize)), [orgsTotal, orgsPageSize]);

  // filters ordering (same as Infrastructure.jsx)
  const filterFieldsOrdered = useMemo(() => {
    const keys = Object.keys(filterOptions || {});
    const priority = [
      "INFRA_LICENSE",
      "INFRA_FUNCTIONAL_TYPE",
      "INFRA_STRUCTURAL_TYPE",
      "INFRA_HAS_API",
      "INFRA_IS_ACTIVE",
      "INFRA_PARENT_ORGANIZATION",
      "INFRA_YEARLY_CORPORATE_PRICING",
      "INFRA_RELATED_SERVICES",
      "INFRA_RELATED_CONTENT_TYPES",
    ];
    keys.sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    return keys;
  }, [filterOptions]);

  // ===== Infra table (shows selected tools if visual clicked; otherwise shows filtered tools)
  const PREFERRED_ORDER = useMemo(
    () => [
      "INFRA_NAME",
      "INFRA_PARENT_ORGANIZATION",
      "INFRA_LICENSE",
      "INFRA_YEARLY_CORPORATE_PRICING",
      "INFRA_FUNCTIONAL_TYPE",
      "INFRA_STRUCTURAL_TYPE",
      "INFRA_RELEASE_DATE",
      "INFRA_LATEST_VERSION",
      "INFRA_HAS_API",
      "INFRA_IS_ACTIVE",
      "INFRA_RELATED_SERVICES",
      "INFRA_RELATED_CONTENT_TYPES",
      "INFRA_DESCRIPTION",
    ],
    []
  );

  const tableRows = useMemo(() => {
    if (selectionCount > 0) return selectedInfraRows;
    return infraRows;
  }, [selectionCount, selectedInfraRows, infraRows]);

  const selectedTableColumns = useMemo(() => {
    const firstRow = tableRows?.[0];
    const keys = firstRow ? Object.keys(firstRow).filter((k) => !EXCLUDED_TABLE_FIELDS.has(k)) : PREFERRED_ORDER.filter((k) => k !== "ME_NEXUS_INFRA_ID");

    const keySet = new Set(keys);
    const preferred = PREFERRED_ORDER.filter((k) => keySet.has(k));
    const rest = keys.filter((k) => !preferred.includes(k)).sort((a, b) => a.localeCompare(b));
    const ordered = [...preferred, ...rest].filter(Boolean);

    return ordered.map((k) => ({ key: k, label: toPrettyLabel(k) }));
  }, [tableRows, PREFERRED_ORDER]);

  const isTruthy = (v) => {
    if (v === true) return true;
    const s = String(v ?? "").trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  };

  const renderTokenPills = (tokens) => {
    const shown = tokens.slice(0, 3);
    const remaining = Math.max(0, tokens.length - shown.length);
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {shown.map((t) => (
          <Pill key={t} title={t}>
            {t}
          </Pill>
        ))}
        {remaining ? <Pill title={tokens.join(", ")}>+{remaining} more</Pill> : null}
      </div>
    );
  };

  const renderCell = (field, value) => {
    if (value == null || value === "") return <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 800 }}>—</span>;

    if (field === "INFRA_HAS_API") {
      const on = isTruthy(value);
      return <Pill active={on}>{on ? "API" : "No API"}</Pill>;
    }

    if (field === "INFRA_IS_ACTIVE") {
      const on = isTruthy(value);
      return <Pill active={on}>{on ? "Active" : "Inactive"}</Pill>;
    }

    if (TOKEN_FIELDS.has(field)) {
      const tokens = splitTokens(value);
      if (tokens.length === 0) return <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 800 }}>—</span>;
      return renderTokenPills(tokens);
    }

    if (field === "INFRA_DESCRIPTION") {
      return (
        <div style={{ ...clamp2Style(), maxWidth: 560, fontWeight: 750, color: "rgba(0,0,0,0.70)" }} title={String(value)}>
          {String(value)}
        </div>
      );
    }

    return (
      <div style={{ ...clamp2Style(), maxWidth: 520, fontWeight: 800, color: "rgba(0,0,0,0.72)" }} title={String(value)}>
        {String(value)}
      </div>
    );
  };

  // ✅ Bottom table pagination (+ UX polish)
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(25);
  const [tableJump, setTableJump] = useState("1");

  const tableTotal = tableRows.length;

  const tableTotalPages = useMemo(() => Math.max(1, Math.ceil(tableTotal / tablePageSize)), [tableTotal, tablePageSize]);

  useEffect(() => {
    // reset page when dataset changes
    setTablePage(1);
    setTableJump("1");
  }, [selectionCount, infraRows, selectedInfraRows]);

  useEffect(() => {
    // clamp page if pageSize changes or rows shrink
    setTablePage((p) => clamp(p, 1, tableTotalPages));
  }, [tableTotalPages]);

  useEffect(() => {
    setTableJump(String(tablePage));
  }, [tablePage]);

  const pagedTableRows = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize;
    return tableRows.slice(start, start + tablePageSize);
  }, [tableRows, tablePage, tablePageSize]);

  const applyJump = useCallback(() => {
    const raw = String(tableJump || "").trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const target = clamp(Math.floor(n), 1, tableTotalPages);
    setTablePage(target);
  }, [tableJump, tableTotalPages]);

  // ===== UI =====
  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, color: BRAND.text }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: BRAND.grad, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, padding: 18 }}>
        {/* Header / Breadcrumb */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Pill onClick={() => navigate("/participants")} title="Back to Participants">
                ME-NEXUS
              </Pill>
              <span style={{ opacity: 0.55, fontWeight: 950 }}>›</span>
              <Pill onClick={() => navigate("/participants/organizations")} title="Organizations">
                Participants
              </Pill>
              <span style={{ opacity: 0.55, fontWeight: 950 }}>›</span>
              <Pill onClick={goBackToSearch} title="Back to Infrastructure Search">
                Infrastructure
              </Pill>
              <span style={{ opacity: 0.55, fontWeight: 950 }}>›</span>
              <Pill active>Visualize</Pill>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 40, fontWeight: 1000, color: BRAND.ink, letterSpacing: -0.6, lineHeight: 1 }}>Infrastructure ISV</div>
              <div style={{ marginTop: 6, fontWeight: 900, opacity: 0.72 }}>
                {selectionCount > 0 ? "Crossfiltered View (by selected visual)" : "Infrastructure Overview"}
              </div>
            </div>
          </div>

          {/* Controls (match search: search + year + filters) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Infrastructure ISV…"
              style={{
                width: 360,
                maxWidth: "90vw",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "rgba(255,255,255,0.92)",
                fontWeight: 900,
              }}
            />
            <input
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="Release year min"
              style={{
                width: 160,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "rgba(255,255,255,0.92)",
                fontWeight: 900,
              }}
            />
            <input
              value={yearMax}
              onChange={(e) => setYearMax(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="Release year max"
              style={{
                width: 160,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "rgba(255,255,255,0.92)",
                fontWeight: 900,
              }}
            />
            <Button onClick={openFilters} disabled={filtersLoading} title="Filter the infra catalog">
              Filters {visibleFilterChips.length ? `(${visibleFilterChips.length})` : ""}
            </Button>
            <Button variant="secondary" onClick={clearAllFilters} disabled={Object.keys(selected).length === 0 && !yearMin && !yearMax && !debouncedQ && selectionCount === 0}>
              Clear
            </Button>
          </div>
        </div>

        {/* Top row: KPI + actions + main switch chart */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "340px 1fr", gap: 14, alignItems: "stretch" }}>
          <Card style={{ padding: 2 }}>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  borderRadius: 20,
                  border: "2px solid rgba(0,0,0,0.08)",
                  background: "rgba(255,255,255,0.85)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 1000, color: BRAND.text }}>{compact(kpis.infraCount)}</div>
                <div style={{ fontWeight: 950, opacity: 0.65 }}>Infrastructure Count</div>
              </div>

              <div
                style={{
                  borderRadius: 20,
                  border: "2px solid rgba(0,0,0,0.08)",
                  background: "rgba(255,255,255,0.85)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 1000, color: BRAND.text }}>{compact(kpis.parentOrgCount)}</div>
                <div style={{ fontWeight: 950, opacity: 0.65 }}>Parent Org Count</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
                <Pill active={selectionCount > 0} title="Selection derived from clicking visuals">
                  Visual selection: {selectionCount ? "ON" : "OFF"}
                </Pill>
                <Button variant="secondary" onClick={clearSelectionTray} disabled={selectionCount === 0} title="Clear visual selection (show full filtered dataset)">
                  Clear selection
                </Button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <Button
                  onClick={viewOrgsSelected}
                  disabled={selectionCount === 0}
                  title={selectionCount === 0 ? "Click a bar/segment/year to crossfilter (and select tools)" : "Open orgs filtered by selected infra"}
                >
                  View orgs (selected)
                </Button>
                <Button variant="secondary" onClick={viewOrgsFiltered} disabled={filteredInfraNames.length === 0} title="Open orgs for filtered infra (capped at 100)">
                  View orgs (filtered)
                </Button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <Button variant="secondary" onClick={() => openOrgsModal("selected")} disabled={selectionCount === 0}>
                  Preview orgs (selected)
                </Button>
                <Button variant="secondary" onClick={() => openOrgsModal("filtered")} disabled={filteredInfraNames.length === 0}>
                  Preview orgs (filtered)
                </Button>
              </div>

              <div style={{ textAlign: "center", fontWeight: 900, opacity: 0.65 }}>{loading ? "Loading infra…" : `${compact(filteredInfraNames.length)} tools in current filtered view`}</div>
            </div>
          </Card>

          <Card
            title={servicesView === "services" ? "Services by Count of Infrastructure" : "Functional Types by Count of Infrastructure"}
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Pill active={servicesView === "services"} onClick={() => setServicesView("services")} title="View Services bars">
                  Services
                </Pill>
                <Pill active={servicesView === "functional"} onClick={() => setServicesView("functional")} title="View Functional Types bars">
                  Functional Types
                </Pill>
                <Pill title="Click a bar to crossfilter all visuals">Click bars</Pill>
              </div>
            }
          >
            {servicesView === "services" ? (
              <ClickBarChart rows={agg.services.map((d, i) => ({ ...d, key: `${d.label}__${i}` }))} pickedLabel={pickedService} onPick={(label) => togglePick("service", label)} maxBars={34} height={480} />
            ) : (
              <ClickBarChart rows={agg.functionalTypes.map((d, i) => ({ ...d, key: `${d.label}__${i}` }))} pickedLabel={pickedFunctional} onPick={(label) => togglePick("functional", label)} maxBars={28} height={480} />
            )}
          </Card>
        </div>

        {/* Year line */}
        <div style={{ marginTop: 14 }}>
          <Card title="Tools Launched by Year" right={<Pill title="Click a point to crossfilter all visuals">Click points</Pill>}>
            <ClickYearLine buckets={agg.yearBuckets} pickedYear={pickedYear} onPick={(year) => togglePick("year", year)} height={230} />
          </Card>
        </div>

        {/* API + Content Types */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 14, alignItems: "stretch" }}>
          <Card title="Infrastructures with APIs" right={<Pill title="Click a segment to crossfilter all visuals">Click segments</Pill>}>
            <ClickDonut data={agg.api} pickedLabel={pickedApi} onPick={(label) => togglePick("api", label)} height={360} />
          </Card>

          <Card title="Content Types by Count of Infrastructure" right={<Pill title="Click a bar to crossfilter all visuals">Click bars</Pill>}>
            <ClickBarChart rows={agg.contentTypes.map((d, i) => ({ ...d, key: `${d.label}__${i}` }))} pickedLabel={pickedContentType} onPick={(label) => togglePick("contentType", label)} maxBars={16} height={360} />
          </Card>
        </div>

        {/* ✅ Structural (BIG, full width) */}
        <div style={{ marginTop: 14 }}>
          <Card title="Structural Types by Count of Infrastructure" right={<Pill title="Click a bar to crossfilter all visuals">Click bars</Pill>}>
            <ClickBarChart rows={agg.structuralTypes.map((d, i) => ({ ...d, key: `${d.label}__${i}` }))} pickedLabel={pickedStructural} onPick={(label) => togglePick("structural", label)} maxBars={26} height={560} />
          </Card>
        </div>

        {/* ✅ Parent Orgs (below) — Unknown removed */}
        <div style={{ marginTop: 14 }}>
          <Card title="Top Parent Organizations" right={<Pill title="Click a bar to crossfilter all visuals">Click bars</Pill>}>
            <ClickBarChart rows={agg.parentOrgs.map((d, i) => ({ ...d, key: `${d.label}__${i}` }))} pickedLabel={pickedParentOrg} onPick={(label) => togglePick("parentOrg", label)} maxBars={18} height={460} />
          </Card>
        </div>

        {/* Active donut + Licenses */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14, alignItems: "stretch" }}>
          <Card title="Active vs Inactive Tools" right={<Pill title="Click a segment to crossfilter all visuals">Click segments</Pill>}>
            <ClickDonut data={agg.active} pickedLabel={pickedActive} onPick={(label) => togglePick("active", label)} height={380} />
          </Card>

          <Card title="Popular Types of Licenses" right={<Pill title="Click a segment to crossfilter all visuals">Click segments</Pill>}>
            <ClickDonut data={agg.licenses.map((d) => ({ label: d.label, value: d.value }))} pickedLabel={pickedLicense} onPick={(label) => togglePick("license", label)} height={420} />
          </Card>
        </div>

        {/* Infra tools table: shows filtered tools by default, selected tools when a visual is clicked */}
        <div style={{ marginTop: 14 }}>
          <Card
            title={selectionCount > 0 ? "Selected Infrastructure Tools (from visual selection)" : "Filtered Infrastructure Tools"}
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Pill active title="Pagination">
                  {selectionCount > 0 ? `${selectionCount} tools (selected)` : `${compact(infraRows.length)} tools (filtered)`}
                  <span style={{ opacity: 0.6, fontWeight: 900 }}> • Page {tablePage}/{tableTotalPages}</span>
                </Pill>

                <label style={{ fontWeight: 950, opacity: 0.7, fontSize: 12 }}>Rows</label>
                <select
                  value={tablePageSize}
                  onChange={(e) => {
                    setTablePageSize(Number(e.target.value));
                    setTablePage(1);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontWeight: 950,
                    background: "rgba(255,255,255,0.9)",
                    cursor: "pointer",
                  }}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {/* UX polish: First/Prev/Next/Last + Jump */}
                <Button variant="secondary" onClick={() => setTablePage(1)} disabled={tablePage <= 1} title="First page">
                  « First
                </Button>
                <Button variant="secondary" onClick={() => setTablePage((p) => Math.max(1, p - 1))} disabled={tablePage <= 1} title="Previous page">
                  Prev
                </Button>
                <Button variant="secondary" onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))} disabled={tablePage >= tableTotalPages} title="Next page">
                  Next
                </Button>
                <Button variant="secondary" onClick={() => setTablePage(tableTotalPages)} disabled={tablePage >= tableTotalPages} title="Last page">
                  Last »
                </Button>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 950, opacity: 0.7 }}>Jump</span>
                  <input
                    value={tableJump}
                    onChange={(e) => setTableJump(e.target.value.replace(/[^\d]/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyJump();
                    }}
                    inputMode="numeric"
                    placeholder="Page"
                    style={{
                      width: 74,
                      padding: "10px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.14)",
                      background: "rgba(255,255,255,0.92)",
                      fontWeight: 950,
                      outline: "none",
                    }}
                  />
                  <Button variant="secondary" onClick={applyJump} disabled={tableTotalPages <= 1} title="Go to page">
                    Go
                  </Button>
                </div>

                <Button variant="secondary" onClick={clearSelectionTray} disabled={selectionCount === 0}>
                  Clear selection
                </Button>
              </div>
            }
          >
            {tableRows.length === 0 ? (
              <div style={{ fontWeight: 850, opacity: 0.65 }}>{loading ? "Loading…" : "No tools match the current filters."}</div>
            ) : (
              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.85)",
                }}
              >
                <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 850, opacity: 0.75 }}>
                  {selectionCount > 0 ? (
                    <>
                      Crossfiltered view: click <b>Clear selection</b> to return to full filtered dataset.
                    </>
                  ) : (
                    <>
                      Showing tools matching UI filters. Click any visual to <b>crossfilter</b> and narrow the dataset.
                    </>
                  )}
                  <span style={{ marginLeft: 10, opacity: 0.65 }}>
                    Showing <b>{pagedTableRows.length}</b> of <b>{tableTotal}</b>.
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        {selectedTableColumns.map((c) => (
                          <th
                            key={c.key}
                            style={{
                              textAlign: "left",
                              padding: "12px 12px",
                              borderBottom: "1px solid rgba(0,0,0,0.10)",
                              background: "rgba(247,251,254,0.95)",
                              fontWeight: 980,
                              color: "rgba(0,0,0,0.70)",
                              whiteSpace: "nowrap",
                              minWidth: c.key === "INFRA_NAME" ? 260 : 170,
                            }}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTableRows.map((row, idx) => {
                        const name = String(row?.INFRA_NAME || "").trim();
                        const rowKey = name || String(idx);
                        return (
                          <tr key={rowKey}>
                            {selectedTableColumns.map((c) => {
                              const isName = c.key === "INFRA_NAME";
                              const v = row?.[c.key];
                              return (
                                <td
                                  key={c.key}
                                  style={{
                                    padding: "12px 12px",
                                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                                    verticalAlign: "top",
                                    cursor: isName ? "pointer" : "default",
                                    color: isName ? BRAND.ink : "inherit",
                                    fontWeight: isName ? 1000 : 800,
                                  }}
                                  onClick={() => {
                                    if (isName && name) navigate(`/participants/organizations/infrastructure/${encodeURIComponent(name)}`);
                                  }}
                                  title={isName ? "Open infrastructure details" : undefined}
                                >
                                  {isName ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                      <div style={{ ...clamp2Style(), maxWidth: 520 }}>{name}</div>
                                      <span style={{ opacity: 0.45, fontWeight: 900 }}>↗</span>
                                    </div>
                                  ) : (
                                    renderCell(c.key, v)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* FILTER MODAL — matches Infrastructure.jsx */}
      <Modal
        open={filtersOpen}
        title="Infrastructure Filters"
        onClose={() => setFiltersOpen(false)}
        footer={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setDraftSelected({});
                  setFilterSearch({});
                }}
              >
                Clear modal selections
              </Button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button variant="secondary" onClick={() => setFiltersOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applyFilters}>Apply filters</Button>
            </div>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {filterFieldsOrdered.map((field) => {
            const values = filterOptions?.[field];
            const list = Array.isArray(values) ? values : [];
            const search = (filterSearch[field] || "").toLowerCase();
            const filteredList = search ? list.filter((v) => String(v).toLowerCase().includes(search)) : list;

            const currentSet = draftSelected[field] || new Set();

            return (
              <div
                key={field}
                style={{
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.92)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  <div style={{ fontWeight: 950, color: BRAND.text, marginBottom: 8 }}>{toPrettyLabel(field)}</div>
                  <input
                    value={filterSearch[field] || ""}
                    onChange={(e) => setFilterSearch((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={`Search ${toPrettyLabel(field)}…`}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.12)",
                      fontWeight: 800,
                    }}
                  />
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.6)" }}>{currentSet.size} selected</span>
                    <button
                      onClick={() => {
                        setDraftSelected((prev) => ({ ...prev, [field]: new Set() }));
                      }}
                      style={{
                        cursor: "pointer",
                        border: "1px solid rgba(0,0,0,0.10)",
                        background: "rgba(247,251,254,0.9)",
                        borderRadius: 12,
                        padding: "6px 10px",
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: 260, overflow: "auto", padding: 10 }}>
                  {filteredList.length === 0 ? (
                    <div style={{ padding: 8, color: "rgba(0,0,0,0.55)", fontWeight: 800, fontSize: 12 }}>No values</div>
                  ) : (
                    filteredList.map((v) => {
                      const value = String(v);
                      const checked = currentSet.has(value);
                      return (
                        <label
                          key={value}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "6px 6px",
                            borderRadius: 10,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setDraftSelected((prev) => {
                                const next = { ...prev };
                                const s = new Set(Array.from(next[field] || []));
                                if (s.has(value)) s.delete(value);
                                else s.add(value);
                                next[field] = s;
                                return next;
                              });
                            }}
                          />
                          <span style={{ fontWeight: 800, color: "rgba(0,0,0,0.72)", fontSize: 13 }}>{value}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(filterOptions || {}).length === 0 ? (
          <div style={{ marginTop: 12, color: "rgba(0,0,0,0.6)", fontWeight: 800 }}>Filters are unavailable right now. You can still use the search + year range inputs.</div>
        ) : null}
      </Modal>

      {/* ORGS PREVIEW MODAL */}
      <Modal
        open={orgsOpen}
        title={`Organizations tagged with ${orgsMode === "selected" ? "selected" : "filtered"} infra`}
        onClose={() => setOrgsOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Pill active>
                {orgsLoading ? "Loading…" : `${compact(orgsTotal)} orgs`}{" "}
                <span style={{ opacity: 0.6, fontWeight: 900 }}>
                  • Page {orgsPage}/{orgsTotalPages}
                </span>
              </Pill>

              <label style={{ fontWeight: 950, opacity: 0.7, fontSize: 12 }}>Rows</label>
              <select
                value={orgsPageSize}
                onChange={(e) => {
                  setOrgsPageSize(Number(e.target.value));
                  setOrgsPage(1);
                }}
                style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 950 }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <Button variant="secondary" onClick={() => setOrgsPage((p) => Math.max(1, p - 1))} disabled={orgsPage <= 1}>
                Prev
              </Button>
              <Button variant="secondary" onClick={() => setOrgsPage((p) => Math.min(orgsTotalPages, p + 1))} disabled={orgsPage >= orgsTotalPages}>
                Next
              </Button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  if (orgsMode === "selected") viewOrgsSelected();
                  else viewOrgsFiltered();
                }}
                disabled={orgInfras.length === 0}
              >
                Open in Org Search
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, opacity: 0.7 }}>
            Infra tools: <b>{orgInfras.length}</b> {orgsMode === "filtered" ? <span style={{ opacity: 0.65 }}>(capped at 100 infra)</span> : null}
          </div>

          <input
            value={orgsQ}
            onChange={(e) => {
              setOrgsQ(e.target.value);
              setOrgsPage(1);
            }}
            placeholder="Search orgs…"
            style={{
              width: 360,
              maxWidth: "90vw",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.14)",
              background: "rgba(255,255,255,0.92)",
              fontWeight: 900,
            }}
          />
        </div>

        <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.10)", overflow: "hidden", background: "rgba(255,255,255,0.80)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {["ORG_NAME", "GEONAME_COUNTRY_NAME", "ORG_SIZING_CALCULATED", "SERVICES"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        borderBottom: "1px solid rgba(0,0,0,0.10)",
                        background: "rgba(247,251,254,0.95)",
                        fontWeight: 980,
                        color: "rgba(0,0,0,0.70)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {toPrettyLabel(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgsLoading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, fontWeight: 900, opacity: 0.65 }}>
                      Loading orgs…
                    </td>
                  </tr>
                ) : orgsData.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, fontWeight: 900, opacity: 0.65 }}>
                      No orgs found for this selection.
                    </td>
                  </tr>
                ) : (
                  orgsData.map((o, idx) => {
                    const orgId = o?.ORG_ID || o?.ME_NEXUS_ORG_ID || o?.ID || null;
                    return (
                      <tr
                        key={`${orgId || o?.ORG_NAME || idx}`}
                        style={{ cursor: orgId ? "pointer" : "default" }}
                        onClick={() => {
                          if (orgId) navigate(`/participants/organizations/${orgId}`);
                        }}
                        title={orgId ? "Open org profile" : undefined}
                      >
                        <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 980 }}>{o?.ORG_NAME || "—"}</td>
                        <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900, opacity: 0.85 }}>{o?.GEONAME_COUNTRY_NAME || "—"}</td>
                        <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 900, opacity: 0.85 }}>{o?.ORG_SIZING_CALCULATED || "—"}</td>
                        <td style={{ padding: "12px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 850, opacity: 0.8 }}>{truncate(String(o?.SERVICES || "—"), 90)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
