import React from "react";
import { INSIGHTS_BRAND as BRAND } from "./theme";

/**
 * Premium, dependency-free card primitives used across Insights.
 * Backwards compatible exports: StatCard, Card.
 */

function isFiniteNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function fmtInt(n) {
  const num = isFiniteNumber(n);
  if (num === null) return String(n ?? "");
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(num);
}

function fmtCompact(n) {
  const num = isFiniteNumber(n);
  if (num === null) return String(n ?? "");
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return fmtInt(num);
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function softShadow() {
  // Slightly richer shadow than BRAND.shadow for “premium” depth.
  return "0 14px 34px rgba(17, 24, 39, 0.10), 0 1px 0 rgba(255, 255, 255, 0.7) inset";
}

function subtleNoiseBg() {
  // Tiny SVG noise to reduce “flat” look. Data URI keeps it self-contained.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">` +
    `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter>` +
    `<rect width="160" height="160" filter="url(#n)" opacity=".04"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export function Pill({ children, tone = "brand" }) {
  const tones = {
    brand: { bg: "rgba(60,130,255,0.14)", bd: "rgba(60,130,255,0.22)", fg: BRAND.ink },
    good: { bg: "rgba(16,185,129,0.12)", bd: "rgba(16,185,129,0.20)", fg: "#065F46" },
    warn: { bg: "rgba(245,158,11,0.12)", bd: "rgba(245,158,11,0.20)", fg: "#92400E" },
    bad: { bg: "rgba(239,68,68,0.10)", bd: "rgba(239,68,68,0.18)", fg: "#991B1B" },
    neutral: { bg: "rgba(17,24,39,0.06)", bd: "rgba(17,24,39,0.10)", fg: "#111827" },
  };
  const t = tones[tone] || tones.brand;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.fg,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Divider({ style }) {
  return (
    <div
      style={{
        height: 1,
        background: "linear-gradient(90deg, rgba(30,42,120,0.00), rgba(30,42,120,0.18), rgba(30,42,120,0.00))",
        margin: "10px 0",
        ...style,
      }}
    />
  );
}

/**
 * Backwards compatible — used by existing pages.
 * Upgraded visuals + optional delta/footnote/icon.
 */
export function StatCard({
  label,
  value,
  sublabel,
  delta, // number: positive/negative
  deltaLabel, // string
  icon, // ReactNode
  compact = false, // use compact formatting
  loading = false,
}) {
  const deltaNum = isFiniteNumber(delta);
  const tone =
    deltaNum === null ? "neutral" : deltaNum > 0 ? "good" : deltaNum < 0 ? "bad" : "neutral";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${BRAND.border}`,
        borderRadius: 20,
        background: BRAND.card,
        boxShadow: softShadow(),
        padding: 16,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `${BRAND.grad}, ${subtleNoiseBg()}`,
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {icon ? (
                <div
                  aria-hidden="true"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 12,
                    border: `1px solid ${BRAND.border}`,
                    background: "rgba(255,255,255,0.75)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 6px 18px rgba(17,24,39,0.08)",
                  }}
                >
                  {icon}
                </div>
              ) : null}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 950,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: BRAND.ink,
                  opacity: 0.82,
                }}
              >
                {label}
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 32,
                lineHeight: 1.05,
                fontWeight: 950,
                letterSpacing: "-0.03em",
                color: BRAND.text,
              }}
            >
              {loading ? <Skeleton width={120} height={34} /> : compact ? fmtCompact(value) : fmtInt(value)}
            </div>

            {sublabel ? (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, opacity: 0.78, color: BRAND.text }}>
                {sublabel}
              </div>
            ) : (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, opacity: 0.0 }}>.</div>
            )}
          </div>

          {deltaNum !== null || deltaLabel ? (
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {deltaNum !== null ? (
                <Pill tone={tone}>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {deltaNum > 0 ? "▲" : deltaNum < 0 ? "▼" : "•"} {Math.abs(deltaNum).toFixed(1)}%
                  </span>
                </Pill>
              ) : null}
              {deltaLabel ? (
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8, color: BRAND.text, textAlign: "right" }}>
                  {deltaLabel}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Premium section card with a sticky-looking header + optional right slot.
 * Backwards compatible — used by existing pages.
 */
export function Card({ title, right, children, subtitle, actions }) {
  return (
    <div
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 22,
        background: BRAND.card,
        boxShadow: softShadow(),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          backgroundImage: `${BRAND.grad}, ${subtleNoiseBg()}`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, color: BRAND.ink, letterSpacing: "-0.02em", fontSize: 16 }}>
              {title}
            </div>
            {subtitle ? (
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, opacity: 0.8, color: BRAND.text }}>
                {subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {right ? (
              <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.ink, opacity: 0.85 }}>{right}</div>
            ) : null}
            {actions ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{actions}</div> : null}
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

/**
 * Layout helpers — optional to adopt in pages for a more premium composition.
 */
export function CardGrid({ children, min = 260, gap = 14, style }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap,
        alignItems: "stretch",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// export function TwoCol({ left, right, gap = 14, style }) {
//   return (
//     <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap, ...style }}>
//       <div>{left}</div>
//       <div>{right}</div>
//     </div>
//   );
// }

export function TwoCol({ left, right, children, gap = 14, style }) {
  const childArray = React.Children.toArray(children);
  const col1 = left ?? childArray[0] ?? null;
  const col2 = right ?? childArray[1] ?? null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap, ...style }}>
      <div>{col1}</div>
      <div>{col2}</div>
    </div>
  );
}


export function Skeleton({ width = "100%", height = 12, radius = 10, style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, rgba(17,24,39,0.06), rgba(17,24,39,0.12), rgba(17,24,39,0.06))",
        backgroundSize: "200% 100%",
        animation: "insightsShimmer 1.2s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// Inject shimmer keyframes once (no CSS file needed)
const SHIMMER_ID = "__insights_shimmer__";
if (typeof document !== "undefined" && !document.getElementById(SHIMMER_ID)) {
  const style = document.createElement("style");
  style.id = SHIMMER_ID;
  style.textContent = `
@keyframes insightsShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;
  document.head.appendChild(style);
}
