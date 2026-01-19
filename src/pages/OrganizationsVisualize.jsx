import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* =========================
   Brand + layout constants
========================= */

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
};

const PAGE = { max: 1280 };
const CARD_MIN_HEIGHT = 600;
const BAR_LIST_MAX_HEIGHT = 520;

const UNKNOWN_NORMALIZED = new Set([
  "unknown",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
  "-",
  "—",
  "",
]);

/* =========================
   Helpers
========================= */

function normalize(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isUnknownLabel(label) {
  return UNKNOWN_NORMALIZED.has(normalize(label));
}

function splitExactList(raw) {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function firstExactToken(raw) {
  const xs = splitExactList(raw);
  const first = xs[0] || String(raw ?? "").trim() || "—";
  return isUnknownLabel(first) ? "—" : first;
}

function uniqExactList(raw) {
  const seen = new Map();
  for (const t of splitExactList(raw)) {
    const k = normalize(t);
    if (!k) continue;
    if (!seen.has(k)) seen.set(k, t);
  }
  return Array.from(seen.values());
}

function isProbablyMultiExact(raw) {
  return String(raw ?? "").includes(",");
}

function splitTokens(s) {
  return String(s ?? "")
    .split(/,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function uniqTokensForOrg(raw) {
  const seen = new Map();
  for (const t of splitTokens(raw)) {
    const k = normalize(t);
    if (!k) continue;
    if (!seen.has(k)) seen.set(k, t);
  }
  return Array.from(seen.values());
}

function parseCSVFilterValue(value) {
  if (value == null) return [];
  // Split commas that are NOT followed by a digit (so "$10,001+" stays intact)
  return String(value)
    .split(/,(?!\d)/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function formatMaybeNumber(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function isTrue(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function toQueryString(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      sp.set(k, v.join(","));
      continue;
    }
    const s = String(v).trim();
    if (!s) continue;
    sp.set(k, s);
  }
  const out = sp.toString();
  return out ? `?${out}` : "";
}

function clampInt(n, lo, hi) {
  const x = Number.parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

/* =========================
   Counting
========================= */

/**
 * Smart exact counting:
 * - If comma-separated, counts EACH token (multi-valued)
 * - Removes Unknown-ish labels
 */
function countByExactSmart(rows, field) {
  const m = new Map();
  for (const r of rows || []) {
    const raw = r?.[field];
    const values = isProbablyMultiExact(raw)
      ? uniqExactList(raw)
      : [String(raw ?? "").trim() || "Unknown"];

    for (const v of values) {
      if (!v) continue;
      if (isUnknownLabel(v)) continue;
      m.set(v, (m.get(v) || 0) + 1);
    }
  }
  return m;
}

/**
 * Primary exact counting:
 * - Always uses ONLY the first token (prevents double counting above org total)
 * - Removes Unknown-ish labels
 *
 * Use this for dimensions that should be 1 bucket per org (e.g., SALES_REGION, ORG_SIZING_CALCULATED).
 */
function countByExactPrimary(rows, field) {
  const m = new Map();
  for (const r of rows || []) {
    const v = firstExactToken(r?.[field]);
    if (!v || v === "—" || isUnknownLabel(v)) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return m;
}

function countTokenBy(rows, field) {
  const m = new Map();
  for (const r of rows || []) {
    const tokens = uniqTokensForOrg(r?.[field]);
    for (const t of tokens) {
      const k = String(t ?? "").trim();
      if (!k) continue;
      if (isUnknownLabel(k)) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
  }
  return m;
}

function toSortedRows(map) {
  return [...(map?.entries?.() || [])]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* =========================
   UI bits (theme)
========================= */

function Pill({ children, onClick, active, title }) {
  const clickable = typeof onClick === "function" && !active;
  return (
    <button
      type="button"
      title={title}
      onClick={clickable ? onClick : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "rgba(30,42,120,0.32)" : "rgba(30,42,120,0.22)"}`,
        background: active ? "rgba(207,239,247,0.75)" : "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 900,
        fontSize: 12,
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {children}
    </button>
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
        maxWidth: 420,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
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

function Card({ children, style }) {
  return (
    <div
      style={{
        width: "100%",
        border: `1px solid rgba(30,42,120,0.14)`,
        background: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        padding: 0,
        boxShadow: "0 16px 56px rgba(30,42,120,0.07)",
        ...style,
      }}
    >
      <div
        style={{
          height: 10,
          background: "linear-gradient(90deg, rgba(207,239,247,1), rgba(207,239,247,0.55))",
          borderBottom: "1px solid rgba(30,42,120,0.10)",
        }}
      />
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function SectionTitle({ k, title, right }) {
  return (
    <div
      style={{
        padding: "2px 2px 10px",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>{k}</div>
        <div style={{ fontSize: 14, fontWeight: 1100, color: BRAND.ink }}>{title}</div>
      </div>
      {right ? (
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.65)" }}>{right}</div>
      ) : null}
    </div>
  );
}

function SmallButton({ children, onClick, kind = "secondary", disabled }) {
  const primary = kind === "primary";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${primary ? "rgba(30,42,120,0.22)" : "rgba(30,42,120,0.18)"}`,
        background: primary ? BRAND.ink : "white",
        color: primary ? "white" : BRAND.ink,
        fontWeight: 1000,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px solid rgba(30,42,120,0.18)",
        outline: "none",
        fontWeight: 900,
        fontSize: 13,
      }}
    />
  );
}

function ScrollBox({ children, maxHeight = BAR_LIST_MAX_HEIGHT }) {
  return <div style={{ maxHeight, overflow: "auto", paddingRight: 6 }}>{children}</div>;
}

function BarRow({ label, value, maxValue, selected, onClick }) {
  const pct = maxValue > 0 ? Math.max(0, Math.min(1, value / maxValue)) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        width: "100%",
        textAlign: "left",
        border: "1px solid rgba(30,42,120,0.12)",
        background: selected ? "rgba(207,239,247,0.7)" : "white",
        borderRadius: 14,
        padding: 12,
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 1100, color: BRAND.text, fontSize: 13 }}>{label}</div>
          <div style={{ fontWeight: 1100, color: BRAND.ink, fontSize: 13 }}>{(value ?? 0).toLocaleString()}</div>
        </div>
        <div
          style={{
            height: 9,
            borderRadius: 999,
            background: "rgba(30,42,120,0.08)",
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <div style={{ width: `${pct * 100}%`, height: "100%", background: "rgba(30,42,120,0.65)" }} />
        </div>
      </div>
      <div style={{ display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "1px solid rgba(30,42,120,0.18)",
            background: selected ? "rgba(30,42,120,0.14)" : "rgba(30,42,120,0.06)",
            display: "grid",
            placeItems: "center",
            color: BRAND.ink,
            fontWeight: 1100,
          }}
        >
          {selected ? "✓" : "+"}
        </div>
      </div>
    </button>
  );
}

/* =========================
   Donut/Pie (SVG) + hover
========================= */

function brandBlue(i, n) {
  const hue = 230;
  const sat = 55;
  const light = 34 + Math.round((i / Math.max(1, n - 1)) * 32);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

function Donut({
  title,
  k,
  rows,
  selectedValues,
  onToggle, // optional now
  maxSlices = 12,
  height = 520,
  subtitleRight,
}) {
  const [hover, setHover] = useState(null); // {label,count,pct}
  const canToggle = typeof onToggle === "function";

  const total = useMemo(() => rows.reduce((s, r) => s + (r.count || 0), 0), [rows]);

  const { slices, legendRows } = useMemo(() => {
    const clean = rows.filter((r) => r?.label && !isUnknownLabel(r.label) && (r.count || 0) > 0);
    const top = clean.slice(0, maxSlices);
    const rest = clean.slice(maxSlices);
    const otherCount = rest.reduce((s, r) => s + (r.count || 0), 0);
    const slices = otherCount > 0 ? [...top, { label: "Other", count: otherCount }] : [...top];
    return { slices, legendRows: clean };
  }, [rows, maxSlices]);

  const size = 260;
  const stroke = 22;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;

  let acc = 0;

  const centerTop = hover?.label ? hover.label : total.toLocaleString();
  const centerMid = hover?.label ? `${hover.pct.toFixed(1)}% • ${hover.count.toLocaleString()}` : "orgs in cohort";

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: height }}>
      <SectionTitle k={k} title={title} right={subtitleRight} />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, alignItems: "center" }}>
        <div style={{ display: "grid", placeItems: "center" }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(30,42,120,0.10)"
              strokeWidth={stroke}
            />

            {slices.map((s, i) => {
              const frac = total > 0 ? s.count / total : 0;
              const seg = frac * c;
              const dash = `${seg} ${c - seg}`;
              const offset = -acc;
              acc += seg;

              const isSelected =
                (selectedValues || []).some((v) => normalize(v) === normalize(s.label)) && s.label !== "Other";

              const color = isSelected ? BRAND.ink : brandBlue(i, slices.length);
              const pct = total > 0 ? (s.count / total) * 100 : 0;

              const titleTxt =
                s.label === "Other"
                  ? `Other: ${s.count.toLocaleString()} (${pct.toFixed(1)}%)`
                  : `${s.label}: ${s.count.toLocaleString()} (${pct.toFixed(1)}%)`;

              return (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeDasharray={dash}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{
                    cursor: canToggle && s.label !== "Other" ? "pointer" : "default",
                    opacity: s.label === "Other" ? 0.35 : hover?.label === s.label ? 1 : 0.9,
                    transition: "opacity 120ms ease",
                  }}
                  onClick={() => {
                    if (!canToggle) return;
                    if (s.label === "Other") return;
                    onToggle(s.label);
                  }}
                  onMouseEnter={() => setHover({ label: s.label, count: s.count, pct })}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{titleTxt}</title>
                </circle>
              );
            })}

            <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill="white" />

            <text
              x={size / 2}
              y={size / 2 - 6}
              textAnchor="middle"
              style={{ fontWeight: 1200, fill: BRAND.ink, fontSize: hover?.label ? 13 : 20 }}
            >
              {centerTop}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 16}
              textAnchor="middle"
              style={{ fontWeight: 900, fill: "rgba(17,24,39,0.62)", fontSize: 12 }}
            >
              {centerMid}
            </text>
          </svg>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)", marginBottom: 8 }}>
            Hover for details{canToggle ? " • Click legend to filter" : ""}
          </div>

          <ScrollBox maxHeight={380}>
            <div style={{ display: "grid", gap: 10 }}>
              {legendRows.map((rRow, idx) => {
                const isSel = (selectedValues || []).some((v) => normalize(v) === normalize(rRow.label));
                const pct = total > 0 ? (rRow.count / total) * 100 : 0;

                return (
                  <button
                    key={rRow.label}
                    type="button"
                    onClick={() => {
                      if (!canToggle) return;
                      onToggle(rRow.label);
                    }}
                    onMouseEnter={() => setHover({ label: rRow.label, count: rRow.count, pct })}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "1px solid rgba(30,42,120,0.12)",
                      background: isSel ? "rgba(207,239,247,0.7)" : "white",
                      borderRadius: 14,
                      padding: 12,
                      cursor: canToggle ? "pointer" : "default",
                      display: "grid",
                      gridTemplateColumns: "18px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      opacity: canToggle ? 1 : 0.92,
                    }}
                    title={`${rRow.label}: ${rRow.count.toLocaleString()} (${pct.toFixed(1)}%)`}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: isSel ? BRAND.ink : brandBlue(idx, Math.min(24, legendRows.length)),
                        opacity: isSel ? 1 : 0.75,
                      }}
                    />
                    <div
                      style={{
                        fontWeight: 1100,
                        color: BRAND.text,
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {rRow.label}
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <div style={{ fontSize: 12, fontWeight: 1000, color: "rgba(17,24,39,0.60)" }}>
                        {pct.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 1200, color: BRAND.ink }}>
                        {rRow.count.toLocaleString()}
                      </div>
                    </div>
                  </button>
                );
              })}
              {!legendRows.length ? (
                <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No data.</div>
              ) : null}
            </div>
          </ScrollBox>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Axes helper
========================= */

function niceStep(range, targetTicks = 5) {
  if (range <= 0) return 1;
  const raw = range / Math.max(1, targetTicks - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / pow;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * pow;
}

/* =========================
   Active-as-of LINE chart
   - hover tooltip for dots (title)
   - click dot => set year to that year (min=max)
========================= */

function ActiveAsOfLine({ yearCounts, height = 560, onPickYear }) {
  const W = 760;
  const H = 300;
  const padL = 52;
  const padR = 18;
  const padT = 18;
  const padB = 44;

  const years = yearCounts.map((d) => d.year);
  const minX = years.length ? Math.min(...years) : 2000;
  const maxX = years.length ? Math.max(...years) : 2025;

  const maxY = Math.max(1, ...yearCounts.map((d) => d.count || 0));

  const xRange = Math.max(1e-9, maxX - minX);

  const xScale = (x) => padL + ((x - minX) / xRange) * (W - padL - padR);
  const yScale = (y) => padT + (1 - y / Math.max(1, maxY)) * (H - padT - padB);

  const yStep = niceStep(maxY, 5);
  const yTicks = [];
  for (let v = 0; v <= maxY + 1e-9; v += yStep) yTicks.push(v);

  const xTicks = 6;
  const xTickVals = Array.from({ length: xTicks }).map((_, i) => Math.round(minX + (i / (xTicks - 1)) * xRange));

  const pts = yearCounts.map((d) => ({ x: xScale(d.year), y: yScale(d.count), d }));
  const dLine = pts.length ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ") : "";

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: height }}>
      <SectionTitle k="TIME" title="Active As Of (Year Trend)" right="Hover dots • Click a year" />

      <div style={{ border: "1px solid rgba(30,42,120,0.12)", borderRadius: 14, padding: 12 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          {/* y grid + labels */}
          {yTicks.map((v) => {
            const y = yScale(v);
            return (
              <g key={`gy-${v}`}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(30,42,120,0.07)" />
                <text
                  x={padL - 10}
                  y={y + 4}
                  textAnchor="end"
                  style={{ fontSize: 12, fontWeight: 900, fill: "rgba(17,24,39,0.60)" }}
                >
                  {Math.round(v)}
                </text>
              </g>
            );
          })}

          {/* x grid + labels */}
          {xTickVals.map((v, i) => {
            const x = xScale(v);
            return (
              <g key={`gx-${i}`}>
                <line x1={x} y1={padT} x2={x} y2={H - padB} stroke="rgba(30,42,120,0.07)" />
                <text
                  x={x}
                  y={H - padB + 24}
                  textAnchor="middle"
                  style={{ fontSize: 12, fontWeight: 900, fill: "rgba(17,24,39,0.60)" }}
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* axes */}
          <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="rgba(30,42,120,0.22)" />
          <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="rgba(30,42,120,0.22)" />

          {/* line + dots */}
          {pts.length ? (
            <>
              <path d={dLine} fill="none" stroke={BRAND.ink} strokeWidth="3" />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={BRAND.ink}
                  opacity="0.9"
                  style={{ cursor: typeof onPickYear === "function" ? "pointer" : "default" }}
                  onClick={() => {
                    if (typeof onPickYear === "function") onPickYear(p.d.year);
                  }}
                >
                  <title>
                    {p.d.year}: {p.d.count.toLocaleString()} orgs (click to set year)
                  </title>
                </circle>
              ))}
            </>
          ) : null}
        </svg>

        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.60)" }}>
          Hover a dot to see org count for that year. Click a dot to set Active ≥ Year and Active ≤ Year to that year.
        </div>
      </div>
    </div>
  );
}

/* =========================
   Persona Scoring PIE (Donut)
   - buckets numeric values into quantile-ish ranges
========================= */

function PersonaPie({ values, height = CARD_MIN_HEIGHT }) {
  const rows = useMemo(() => {
    const xs = (values || []).filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
    if (!xs.length) return [];

    // 4 buckets using quartile cutpoints (by index)
    const q1 = xs[Math.floor((xs.length - 1) * 0.25)];
    const q2 = xs[Math.floor((xs.length - 1) * 0.5)];
    const q3 = xs[Math.floor((xs.length - 1) * 0.75)];

    let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
    for (const v of xs) {
      if (v <= q1) b1++;
      else if (v <= q2) b2++;
      else if (v <= q3) b3++;
      else b4++;
    }

    const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2) : "—");
    return [
      { label: `Low (≤ ${fmt(q1)})`, count: b1 },
      { label: `Mid-Low (${fmt(q1)}–${fmt(q2)})`, count: b2 },
      { label: `Mid-High (${fmt(q2)}–${fmt(q3)})`, count: b3 },
      { label: `High (> ${fmt(q3)})`, count: b4 },
    ].filter((r) => r.count > 0);
  }, [values]);

  const total = useMemo(() => rows.reduce((s, r) => s + (r.count || 0), 0), [rows]);

  return (
    <div style={{ minHeight: height }}>
      <Donut
        k="SIGNAL"
        title="Persona Scoring (Pie)"
        rows={rows}
        selectedValues={[]} // no filtering by persona in this version
        onToggle={undefined}
        subtitleRight={total ? `${total.toLocaleString()} orgs` : "No data"}
        maxSlices={10}
        height={height - 28}
      />
      {!total ? (
        <div style={{ padding: "0 14px 14px", fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
          No persona scoring data in the current cohort.
        </div>
      ) : (
        <div style={{ padding: "0 14px 14px", fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
          Hover slices/legend for counts and %.
        </div>
      )}
    </div>
  );
}

/* =========================
   Page
========================= */

const FILTER_FIELDS = {
  ORG_FUNCTIONAL_TYPE: { label: "Functional Type" },
  ORG_SIZING_CALCULATED: { label: "Org Size" },
  SALES_REGION: { label: "Sales Region" },
  GEONAME_COUNTRY_NAME: { label: "Country" },
  ORG_IS_ACTIVE: { label: "Active" },
  ORG_IS_ULTIMATE_PARENT: { label: "Ultimate Parent" },

  SERVICES: { label: "Services" },
  CONTENT_TYPES: { label: "Content Types" },
  INFRASTRUCTURE_TOOLS: { label: "Infrastructure Tools" },
};

export default function OrganizationsVisualize() {
  const navigate = useNavigate();
  const location = useLocation();

  const didHydrate = useRef(false);

  const [q, setQ] = useState("");
  const [locationScope, setLocationScope] = useState("hq"); // hq | all
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [selected, setSelected] = useState({}); // field -> string[]

  // CITY multi-select (server param CITY)
  const [selectedCities, setSelectedCities] = useState([]); // string[]

  // Bar chart searches
  const [searchFunctional, setSearchFunctional] = useState("");
  const [searchCountries, setSearchCountries] = useState("");
  const [searchServices, setSearchServices] = useState("");
  const [searchContent, setSearchContent] = useState("");
  const [searchTools, setSearchTools] = useState("");
  const [searchCities, setSearchCities] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orgs, setOrgs] = useState([]);
  const [locationsPoints, setLocationsPoints] = useState([]);

  // Table pagination (client-side)
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(50);

  useEffect(() => {
    setTablePage(1);
  }, [q, locationScope, yearMin, yearMax, selected, selectedCities]);

  // Initial hydrate from URL
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    const sp = new URLSearchParams(location.search);
    setQ(sp.get("q") || "");

    const scope = (sp.get("locationScope") || "hq").toLowerCase();
    setLocationScope(scope === "all" ? "all" : "hq");

    setYearMin(sp.get("ORG_ACTIVE_AS_OF_YEAR_MIN") || "");
    setYearMax(sp.get("ORG_ACTIVE_AS_OF_YEAR_MAX") || "");

    const next = {};
    for (const key of Object.keys(FILTER_FIELDS)) {
      const raw = sp.get(key);
      if (!raw) continue;
      const vals = parseCSVFilterValue(raw);
      if (vals.length) next[key] = vals;
    }
    setSelected(next);

    // CITY multi-select hydrate
    const cityRaw = sp.get("CITY");
    setSelectedCities(cityRaw ? parseCSVFilterValue(cityRaw) : []);

    setTablePage(clampInt(sp.get("tablePage"), 1, 1000000));
    setTablePageSize(clampInt(sp.get("tablePageSize"), 10, 200));
  }, [location.search]);

  // Keep URL in sync
  const filtersToUrl = useMemo(() => {
    const out = {
      q,
      locationScope,
      ORG_ACTIVE_AS_OF_YEAR_MIN: yearMin,
      ORG_ACTIVE_AS_OF_YEAR_MAX: yearMax,
      CITY: selectedCities,
      tablePage,
      tablePageSize,
    };
    for (const [k, v] of Object.entries(selected || {})) out[k] = v;
    return out;
  }, [q, locationScope, yearMin, yearMax, selected, selectedCities, tablePage, tablePageSize]);

  useEffect(() => {
    if (!didHydrate.current) return;
    const qs = toQueryString(filtersToUrl);
    const nextUrl = `${location.pathname}${qs}`;
    const curUrl = `${location.pathname}${location.search || ""}`;
    if (nextUrl !== curUrl) navigate(nextUrl, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersToUrl]);

  // Fetch orgs (cohort)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const params = {
          q,
          page: 1,
          pageSize: 50000,
          locationScope,
          ORG_ACTIVE_AS_OF_YEAR_MIN: yearMin,
          ORG_ACTIVE_AS_OF_YEAR_MAX: yearMax,
          CITY: selectedCities, // multi-select
          ...selected,
        };
        const res = await fetch(`/api/orgs${toQueryString(params)}`);
        if (!res.ok) throw new Error(`Orgs request failed (${res.status})`);
        const json = await res.json();
        if (cancelled) return;
        setOrgs(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (cancelled) return;
        setError(String(e?.message || e));
        setOrgs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q, locationScope, yearMin, yearMax, selected, selectedCities]);

  // Fetch location points
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`/api/locations/points`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setLocationsPoints(Array.isArray(json) ? json : []);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleFilter(field, value) {
    const v = String(value ?? "").trim();
    if (!v) return;

    setSelected((prev) => {
      const cur = prev?.[field] ? [...prev[field]] : [];
      const idx = cur.findIndex((x) => normalize(x) === normalize(v));
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(v);

      const next = { ...(prev || {}) };
      if (cur.length) next[field] = cur;
      else delete next[field];
      return next;
    });
  }

  // MULTI-SELECT CITY toggle
  function toggleCity(city) {
    const v = String(city ?? "").trim();
    if (!v || isUnknownLabel(v)) return;
    setSelectedCities((prev) => {
      const cur = [...(prev || [])];
      const idx = cur.findIndex((x) => normalize(x) === normalize(v));
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(v);
      return cur;
    });
  }

  function clearAll() {
    setSelected({});
    setSelectedCities([]);
    setQ("");
    setYearMin("");
    setYearMax("");
    setLocationScope("hq");
    setTablePage(1);
  }

  function clearField(field) {
    setSelected((prev) => {
      const next = { ...(prev || {}) };
      delete next[field];
      return next;
    });
  }

  function clearCities() {
    setSelectedCities([]);
  }

  const activeChips = useMemo(() => {
    const chips = [];
    if (q?.trim()) chips.push({ key: "q", label: `Search: ${q.trim()}`, remove: () => setQ("") });
    if (locationScope !== "hq")
      chips.push({ key: "locationScope", label: "Geo Scope: All Locations", remove: () => setLocationScope("hq") });
    if (String(yearMin || "").trim())
      chips.push({ key: "yearMin", label: `Active ≥ ${yearMin}`, remove: () => setYearMin("") });
    if (String(yearMax || "").trim())
      chips.push({ key: "yearMax", label: `Active ≤ ${yearMax}`, remove: () => setYearMax("") });

    for (const c of selectedCities || []) {
      chips.push({ key: `CITY:${c}`, label: `City: ${c}`, remove: () => toggleCity(c) });
    }

    for (const [field, values] of Object.entries(selected || {})) {
      const nice = FILTER_FIELDS[field]?.label || field;
      for (const v of values || []) {
        chips.push({ key: `${field}:${v}`, label: `${nice}: ${v}`, remove: () => toggleFilter(field, v) });
      }
    }
    return chips;
  }, [q, locationScope, yearMin, yearMax, selected, selectedCities]);

  // KPI metrics
  const kpis = useMemo(() => {
    const total = orgs.length;

    let active = 0;
    let parents = 0;
    let sumEmp = 0;

    const countries = new Set();
    const regions = new Set();

    for (const o of orgs) {
      if (isTrue(o?.ORG_IS_ACTIVE)) active += 1;
      if (isTrue(o?.ORG_IS_ULTIMATE_PARENT)) parents += 1;

      const emp = formatMaybeNumber(o?.ADJUSTED_EMPLOYEE_COUNT);
      if (emp != null) sumEmp += emp;

      // Countries can be multi-valued
      const rawC = o?.GEONAME_COUNTRY_NAME;
      const cs = isProbablyMultiExact(rawC) ? uniqExactList(rawC) : [String(rawC ?? "").trim()].filter(Boolean);
      for (const c of cs) if (c && !isUnknownLabel(c)) countries.add(c);

      // Regions should be 1 per org (use primary)
      const r = firstExactToken(o?.SALES_REGION);
      if (r && r !== "—" && !isUnknownLabel(r)) regions.add(r);
    }

    return { total, active, parents, countries: countries.size, regions: regions.size, sumEmp };
  }, [orgs]);

  // Distributions
  const sizeRows = useMemo(() => toSortedRows(countByExactPrimary(orgs, "ORG_SIZING_CALCULATED")), [orgs]);
  const regionRows = useMemo(() => toSortedRows(countByExactPrimary(orgs, "SALES_REGION")), [orgs]);

  const funcRowsAll = useMemo(() => toSortedRows(countByExactSmart(orgs, "ORG_FUNCTIONAL_TYPE")), [orgs]);
  const countryRowsAll = useMemo(() => toSortedRows(countByExactSmart(orgs, "GEONAME_COUNTRY_NAME")), [orgs]);

  const servicesRowsAll = useMemo(() => toSortedRows(countTokenBy(orgs, "SERVICES")), [orgs]);
  const contentRowsAll = useMemo(() => toSortedRows(countTokenBy(orgs, "CONTENT_TYPES")), [orgs]);
  const toolsRowsAll = useMemo(() => toSortedRows(countTokenBy(orgs, "INFRASTRUCTURE_TOOLS")), [orgs]);

  const maxFunctional = useMemo(() => Math.max(1, ...funcRowsAll.map((x) => x.count)), [funcRowsAll]);
  const maxCountries = useMemo(() => Math.max(1, ...countryRowsAll.map((x) => x.count)), [countryRowsAll]);
  const maxServices = useMemo(() => Math.max(1, ...servicesRowsAll.map((x) => x.count)), [servicesRowsAll]);
  const maxContent = useMemo(() => Math.max(1, ...contentRowsAll.map((x) => x.count)), [contentRowsAll]);
  const maxTools = useMemo(() => Math.max(1, ...toolsRowsAll.map((x) => x.count)), [toolsRowsAll]);

  const funcRows = useMemo(() => {
    const qn = normalize(searchFunctional);
    if (!qn) return funcRowsAll;
    return funcRowsAll.filter((r) => normalize(r.label).includes(qn));
  }, [funcRowsAll, searchFunctional]);

  const countryRows = useMemo(() => {
    const qn = normalize(searchCountries);
    if (!qn) return countryRowsAll;
    return countryRowsAll.filter((r) => normalize(r.label).includes(qn));
  }, [countryRowsAll, searchCountries]);

  const servicesRows = useMemo(() => {
    const qn = normalize(searchServices);
    if (!qn) return servicesRowsAll;
    return servicesRowsAll.filter((r) => normalize(r.label).includes(qn));
  }, [servicesRowsAll, searchServices]);

  const contentRows = useMemo(() => {
    const qn = normalize(searchContent);
    if (!qn) return contentRowsAll;
    return contentRowsAll.filter((r) => normalize(r.label).includes(qn));
  }, [contentRowsAll, searchContent]);

  const toolsRows = useMemo(() => {
    const qn = normalize(searchTools);
    if (!qn) return toolsRowsAll;
    return toolsRowsAll.filter((r) => normalize(r.label).includes(qn));
  }, [toolsRowsAll, searchTools]);

  // Cities (bar chart) from location points, filtered to current cohort org IDs.
  const citiesAll = useMemo(() => {
    const orgIdSet = new Set((orgs || []).map((o) => String(o?.ORG_ID ?? "").trim()).filter(Boolean));
    if (!orgIdSet.size) return [];

    const m = new Map();
    for (const p of locationsPoints || []) {
      const orgId = String(p?.orgId ?? "").trim();
      if (!orgIdSet.has(orgId)) continue;
      if (locationScope === "hq" && !p?.isHQ) continue;

      const city = String(p?.city ?? "").trim();
      if (!city || isUnknownLabel(city)) continue;
      m.set(city, (m.get(city) || 0) + 1);
    }
    return toSortedRows(m);
  }, [orgs, locationsPoints, locationScope]);

  const cities = useMemo(() => {
    const qn = normalize(searchCities);
    if (!qn) return citiesAll;
    return citiesAll.filter((r) => normalize(r.label).includes(qn));
  }, [citiesAll, searchCities]);

  const maxCities = useMemo(() => Math.max(1, ...citiesAll.map((x) => x.count)), [citiesAll]);

  // Persona values for pie
  const personaValues = useMemo(() => {
    return orgs.map((o) => formatMaybeNumber(o?.PERSONA_SCORING)).filter((x) => Number.isFinite(x));
  }, [orgs]);

  // Active-as-of year counts (line chart)
  const activeYearCounts = useMemo(() => {
    const m = new Map();
    for (const o of orgs) {
      const y = formatMaybeNumber(o?.ORG_ACTIVE_AS_OF_YEAR);
      if (!Number.isFinite(y)) continue;
      const yr = Math.round(y);
      if (yr < 1900 || yr > 2100) continue;
      m.set(yr, (m.get(yr) || 0) + 1);
    }
    const arr = [...m.entries()].map(([year, count]) => ({ year, count }));
    arr.sort((a, b) => a.year - b.year);
    return arr;
  }, [orgs]);

  // Table (sorted by Adj. Emp but not displayed)
  const tableRowsSorted = useMemo(() => {
    const arr = [...(orgs || [])];
    arr.sort(
      (a, b) =>
        (formatMaybeNumber(b?.ADJUSTED_EMPLOYEE_COUNT) || 0) - (formatMaybeNumber(a?.ADJUSTED_EMPLOYEE_COUNT) || 0)
    );
    return arr;
  }, [orgs]);

  const tableTotal = tableRowsSorted.length;
  const tableTotalPages = Math.max(1, Math.ceil(tableTotal / tablePageSize));
  const safeTablePage = Math.min(tablePage, tableTotalPages);

  useEffect(() => {
    if (safeTablePage !== tablePage) setTablePage(safeTablePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTablePage]);

  const tableSlice = useMemo(() => {
    const start = (safeTablePage - 1) * tablePageSize;
    return tableRowsSorted.slice(start, start + tablePageSize);
  }, [tableRowsSorted, safeTablePage, tablePageSize]);

  const goToOrgSearch = () => {
    const params = {
      q,
      locationScope,
      ORG_ACTIVE_AS_OF_YEAR_MIN: yearMin,
      ORG_ACTIVE_AS_OF_YEAR_MAX: yearMax,
      CITY: selectedCities,
      ...selected,
      page: 1,
      pageSize: 25,
    };
    navigate(`/participants/organizations${toQueryString(params)}`);
  };

  const pickYearFromDot = (yr) => {
    const y = String(yr);
    setYearMin(y);
    setYearMax(y);
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg }}>
      <div style={{ maxWidth: PAGE.max, margin: "0 auto", padding: "22px 16px 40px" }}>
        {/* Header / Breadcrumbs (clickable like code #2) */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill onClick={() => navigate("/participants")} title="Back to Participants">
                ME-NEXUS
              </Pill>
              <span style={{ opacity: 0.55, fontWeight: 950 }}>›</span>
              <Pill onClick={() => navigate("/participants")} title="Participants Hub">
                Participants
              </Pill>
              <span style={{ opacity: 0.55, fontWeight: 950 }}>›</span>
              <Pill onClick={() => navigate("/participants/organizations")} title="Organizations">
                Organizations
              </Pill>
              <span style={{ opacity: 0.55, fontWeight: 950 }}>›</span>
              <Pill active>Visualize</Pill>
            </div>

            <div style={{ fontSize: 26, fontWeight: 1100, color: BRAND.text, letterSpacing: -0.2 }}>
              Organization Visualization Dashboard
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.65)" }}>
              Hover for details. Click to filter. URL stays shareable.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <SmallButton kind="secondary" onClick={goToOrgSearch}>
              Open Org Explorer →
            </SmallButton>
            <SmallButton kind="secondary" onClick={() => navigate("/participants")}>
              Participants Hub
            </SmallButton>
            <SmallButton kind="primary" onClick={clearAll} disabled={loading}>
              Clear All
            </SmallButton>
          </div>
        </div>

        {/* Controls */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.6fr 0.6fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)", marginBottom: 6 }}>Search</div>
                <Input value={q} onChange={setQ} placeholder="Search organizations by name…" />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)", marginBottom: 6 }}>Geo Scope</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <SmallButton kind={locationScope === "hq" ? "primary" : "secondary"} onClick={() => setLocationScope("hq")}>
                    HQ Only
                  </SmallButton>
                  <SmallButton kind={locationScope === "all" ? "primary" : "secondary"} onClick={() => setLocationScope("all")}>
                    All Locations
                  </SmallButton>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)", marginBottom: 6 }}>Active ≥ Year</div>
                <Input value={yearMin} onChange={setYearMin} placeholder="e.g. 2015" />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)", marginBottom: 6 }}>Active ≤ Year</div>
                <Input value={yearMax} onChange={setYearMax} placeholder="e.g. 2024" />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {activeChips.length ? (
                  activeChips.map((c) => <Chip key={c.key} label={c.label} onRemove={c.remove} />)
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
                    No filters applied. Start by clicking any donut/bar.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <SmallButton kind="secondary" onClick={() => clearField("SERVICES")} disabled={!selected?.SERVICES?.length}>
                  Clear Services
                </SmallButton>
                <SmallButton kind="secondary" onClick={() => clearField("CONTENT_TYPES")} disabled={!selected?.CONTENT_TYPES?.length}>
                  Clear Content
                </SmallButton>
                <SmallButton kind="secondary" onClick={() => clearField("INFRASTRUCTURE_TOOLS")} disabled={!selected?.INFRASTRUCTURE_TOOLS?.length}>
                  Clear Tools
                </SmallButton>
                <SmallButton kind="secondary" onClick={clearCities} disabled={!selectedCities?.length}>
                  Clear Cities
                </SmallButton>
              </div>
            </div>

            {error ? (
              <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                <div style={{ fontWeight: 1100, color: "rgba(185,28,28,0.95)" }}>Error</div>
                <div style={{ fontWeight: 900, color: "rgba(17,24,39,0.72)", marginTop: 4 }}>{error}</div>
              </div>
            ) : null}
          </div>
        </Card>

        {/* KPI tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12, marginBottom: 12 }}>
          {[
            { k: "ORGS", label: "Total Orgs", value: kpis.total },
            { k: "STATUS", label: "Active Orgs", value: kpis.active },
            { k: "STRUCTURE", label: "Ultimate Parents", value: kpis.parents },
            { k: "GEO", label: "Countries Covered", value: kpis.countries },
            { k: "FOOTPRINT", label: "Regions Covered", value: kpis.regions },
            { k: "SCALE", label: "Total Adj. Employees", value: kpis.sumEmp },
          ].map((x) => (
            <div key={x.label} style={{ gridColumn: "span 2" }}>
              <Card>
                <SectionTitle k={x.k} title={x.label} />
                <div style={{ fontSize: 24, fontWeight: 1200, color: BRAND.ink, marginTop: 6 }}>
                  {(x.value ?? 0).toLocaleString()}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
                  {loading ? "Updating…" : "Current cohort"}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Dashboard grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
          {/* Donut: Size */}
          <div style={{ gridColumn: "span 6" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <Donut
                k="COMPOSITION"
                title="Org Size"
                rows={sizeRows}
                selectedValues={selected?.ORG_SIZING_CALCULATED || []}
                onToggle={(v) => toggleFilter("ORG_SIZING_CALCULATED", v)}
                subtitleRight="Hover slices/legend"
              />
              {(selected?.ORG_SIZING_CALCULATED || []).length ? (
                <div style={{ padding: "0 14px 14px" }}>
                  <SmallButton onClick={() => clearField("ORG_SIZING_CALCULATED")}>Clear size filter</SmallButton>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Donut: Sales Regions */}
          <div style={{ gridColumn: "span 6" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <Donut
                k="GEOGRAPHY"
                title="Sales Regions"
                rows={regionRows}
                selectedValues={selected?.SALES_REGION || []}
                onToggle={(v) => toggleFilter("SALES_REGION", v)}
                subtitleRight="Hover slices/legend"
                maxSlices={10}
              />
              {(selected?.SALES_REGION || []).length ? (
                <div style={{ padding: "0 14px 14px" }}>
                  <SmallButton onClick={() => clearField("SALES_REGION")}>Clear region filter</SmallButton>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Functional Types */}
          <div style={{ gridColumn: "span 4" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <SectionTitle k="COMPOSITION" title="Functional Types" right="Search + click to filter" />
              <div style={{ marginBottom: 10 }}>
                <Input value={searchFunctional} onChange={setSearchFunctional} placeholder="Search functional types…" />
              </div>
              <ScrollBox>
                <div style={{ display: "grid", gap: 10 }}>
                  {funcRows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      value={r.count}
                      maxValue={maxFunctional}
                      selected={(selected?.ORG_FUNCTIONAL_TYPE || []).some((v) => normalize(v) === normalize(r.label))}
                      onClick={() => toggleFilter("ORG_FUNCTIONAL_TYPE", r.label)}
                    />
                  ))}
                  {!funcRows.length ? (
                    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No matches.</div>
                  ) : null}
                </div>
              </ScrollBox>
              {(selected?.ORG_FUNCTIONAL_TYPE || []).length ? (
                <div style={{ marginTop: 10 }}>
                  <SmallButton onClick={() => clearField("ORG_FUNCTIONAL_TYPE")}>Clear functional filter</SmallButton>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Countries */}
          <div style={{ gridColumn: "span 4" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <SectionTitle k="GEOGRAPHY" title="Countries" right="Search + click to filter" />
              <div style={{ marginBottom: 10 }}>
                <Input value={searchCountries} onChange={setSearchCountries} placeholder="Search countries…" />
              </div>
              <ScrollBox>
                <div style={{ display: "grid", gap: 10 }}>
                  {countryRows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      value={r.count}
                      maxValue={maxCountries}
                      selected={(selected?.GEONAME_COUNTRY_NAME || []).some((v) => normalize(v) === normalize(r.label))}
                      onClick={() => toggleFilter("GEONAME_COUNTRY_NAME", r.label)}
                    />
                  ))}
                  {!countryRows.length ? (
                    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No matches.</div>
                  ) : null}
                </div>
              </ScrollBox>
              {(selected?.GEONAME_COUNTRY_NAME || []).length ? (
                <div style={{ marginTop: 10 }}>
                  <SmallButton onClick={() => clearField("GEONAME_COUNTRY_NAME")}>Clear country filter</SmallButton>
                </div>
              ) : null}
            </Card>
          </div>

          {/* Services */}
          <div style={{ gridColumn: "span 4" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <SectionTitle k="TAGS" title="Services" right="Search + click to filter" />
              <div style={{ marginBottom: 10 }}>
                <Input value={searchServices} onChange={setSearchServices} placeholder="Search services…" />
              </div>
              <ScrollBox>
                <div style={{ display: "grid", gap: 10 }}>
                  {servicesRows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      value={r.count}
                      maxValue={maxServices}
                      selected={(selected?.SERVICES || []).some((v) => normalize(v) === normalize(r.label))}
                      onClick={() => toggleFilter("SERVICES", r.label)}
                    />
                  ))}
                  {!servicesRows.length ? (
                    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No matches.</div>
                  ) : null}
                </div>
              </ScrollBox>
            </Card>
          </div>

          {/* Content */}
          <div style={{ gridColumn: "span 4" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <SectionTitle k="TAGS" title="Content Types" right="Search + click to filter" />
              {/* add a marginTop as well */}
              <div style={{ marginBottom: 50 }}>
                <Input value={searchContent} onChange={setSearchContent} placeholder="Search content types…" />
              </div>
              <ScrollBox>
                <div style={{ display: "grid", gap: 10 }}>
                  {contentRows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      value={r.count}
                      maxValue={maxContent}
                      selected={(selected?.CONTENT_TYPES || []).some((v) => normalize(v) === normalize(r.label))}
                      onClick={() => toggleFilter("CONTENT_TYPES", r.label)}
                    />
                  ))}
                  {!contentRows.length ? (
                    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No matches.</div>
                  ) : null}
                </div>
              </ScrollBox>
            </Card>
          </div>

          {/* Tools */}
          <div style={{ gridColumn: "span 8" }}>
            <Card style={{ minHeight: CARD_MIN_HEIGHT }}>
              <SectionTitle k="TAGS" title="Infrastructure Tools" right="Search + click to filter" />
              <div style={{ marginBottom: 10 }}>
                <Input value={searchTools} onChange={setSearchTools} placeholder="Search tools…" />
              </div>
              <ScrollBox>
                <div style={{ display: "grid", gap: 10 }}>
                  {toolsRows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      value={r.count}
                      maxValue={maxTools}
                      selected={(selected?.INFRASTRUCTURE_TOOLS || []).some((v) => normalize(v) === normalize(r.label))}
                      onClick={() => toggleFilter("INFRASTRUCTURE_TOOLS", r.label)}
                    />
                  ))}
                  {!toolsRows.length ? (
                    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No matches.</div>
                  ) : null}
                </div>
              </ScrollBox>
            </Card>
          </div>

          

          {/* Active As Of line (with hover + click on dot = set year) */}
          <div style={{ gridColumn: "span 12" }}>
            <Card>
              <ActiveAsOfLine yearCounts={activeYearCounts} height={560} onPickYear={pickYearFromDot} />
            </Card>
          </div>

          {/* Cities (bar + search) - MULTI SELECT */}
          <div style={{ gridColumn: "span 12" }}>
            <Card>
              <SectionTitle k="GEOGRAPHY" title="Cities" right={locationScope === "hq" ? "HQ points" : "All location points"} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 10 }}>
                <Input value={searchCities} onChange={setSearchCities} placeholder="Search cities…" />
              </div>
              <ScrollBox maxHeight={360}>
                <div style={{ display: "grid", gap: 10 }}>
                  {cities.map((r) => {
                    const isSel = (selectedCities || []).some((c) => normalize(c) === normalize(r.label));
                    return (
                      <BarRow
                        key={r.label}
                        label={r.label}
                        value={r.count}
                        maxValue={maxCities}
                        selected={isSel}
                        onClick={() => toggleCity(r.label)} // multi-select toggle
                      />
                    );
                  })}
                  {!cities.length ? (
                    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>No matches.</div>
                  ) : null}
                </div>
              </ScrollBox>

              {selectedCities?.length ? (
                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <SmallButton onClick={clearCities}>Clear city filter</SmallButton>
                </div>
              ) : null}

              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
                City is a multi-select filter using server param <code style={{ fontWeight: 1100 }}>CITY</code>.
              </div>
            </Card>
          </div>

          {/* Paginated org table (NO org id shown, NO Adj Emp shown; Country -> Sales Region) */}
          <div style={{ gridColumn: "span 12" }}>
            <Card>
              <SectionTitle k="DETAILS" title="Organizations (cohort table)" right={`${tableTotal.toLocaleString()} orgs`} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <SmallButton kind="secondary" onClick={() => setTablePage(1)} disabled={safeTablePage <= 1}>
                    ⟪ First
                  </SmallButton>
                  <SmallButton kind="secondary" onClick={() => setTablePage((p) => Math.max(1, p - 1))} disabled={safeTablePage <= 1}>
                    ← Prev
                  </SmallButton>

                  <Pill active>
                    Page {safeTablePage.toLocaleString()} / {tableTotalPages.toLocaleString()}
                  </Pill>

                  <SmallButton kind="secondary" onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))} disabled={safeTablePage >= tableTotalPages}>
                    Next →
                  </SmallButton>
                  <SmallButton kind="secondary" onClick={() => setTablePage(tableTotalPages)} disabled={safeTablePage >= tableTotalPages}>
                    Last ⟫
                  </SmallButton>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 1100, color: "rgba(30,42,120,0.75)" }}>Rows</div>
                  {[25, 50, 100, 200].map((n) => (
                    <SmallButton
                      key={n}
                      kind={tablePageSize === n ? "primary" : "secondary"}
                      onClick={() => {
                        setTablePageSize(n);
                        setTablePage(1);
                      }}
                    >
                      {n}
                    </SmallButton>
                  ))}
                </div>
              </div>

              <div style={{ border: "1px solid rgba(30,42,120,0.12)", borderRadius: 14, overflow: "hidden" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(320px, 1.6fr) 1fr 1fr 0.9fr",
                    gap: 10,
                    padding: "10px 12px",
                    background: "rgba(207,239,247,0.35)",
                    borderBottom: "1px solid rgba(30,42,120,0.10)",
                    fontSize: 12,
                    fontWeight: 1100,
                    color: "rgba(30,42,120,0.85)",
                  }}
                >
                  <div>Organization</div>
                  <div>Functional Type</div>
                  <div>Sales Region</div>
                  <div>Org Size</div>
                </div>

                <div style={{ maxHeight: 640, overflow: "auto" }}>
                  {tableSlice.map((o, idx) => {
                    const orgId = String(o?.ORG_ID ?? "").trim();
                    const name = String(o?.ORG_NAME ?? "").trim();
                    const ft = firstExactToken(o?.ORG_FUNCTIONAL_TYPE);
                    const region = firstExactToken(o?.SALES_REGION);
                    const size = firstExactToken(o?.ORG_SIZING_CALCULATED);

                    return (
                      <button
                        key={`${orgId || idx}:${name}`}
                        type="button"
                        onClick={() => {
                          if (!orgId) return;
                          navigate(`/participants/organizations/${encodeURIComponent(orgId)}`);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "none",
                          background: "white",
                          padding: 0,
                          cursor: orgId ? "pointer" : "default",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(320px, 1.6fr) 1fr 1fr 0.9fr",
                            gap: 10,
                            padding: "12px 12px",
                            borderBottom: "1px solid rgba(30,42,120,0.08)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 1100,
                              color: BRAND.ink,
                              textDecoration: orgId ? "underline" : "none",
                              textUnderlineOffset: 3,
                            }}
                          >
                            {name || "—"}
                          </div>
                          <div style={{ fontWeight: 900, color: BRAND.text, opacity: 0.9 }}>{ft}</div>
                          <div style={{ fontWeight: 900, color: BRAND.text, opacity: 0.9 }}>{region}</div>
                          <div style={{ fontWeight: 900, color: BRAND.text, opacity: 0.9 }}>{size}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
                Showing {tableSlice.length.toLocaleString()} of {tableTotal.toLocaleString()} organizations in current cohort.
              </div>
            </Card>
          </div>
        </div>

        <div style={{ height: 26 }} />
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
        </div>
      </div>
    </div>
  );
}
