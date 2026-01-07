import React, { useMemo } from "react";
import { INSIGHTS_BRAND as BRAND } from "./theme";

/**
 * Premium SVG bar chart (no clipping, big-label friendly).
 *
 * Fixes requested:
 * - Numbers not cut: increased top padding, safer label placement, more right padding
 * - Country names less cut: larger left gutter + longer truncation + title tooltip
 *
 * Props:
 * - orientation: "vertical" | "horizontal"
 * - height: number (minimum respected for horizontal)
 * - frame: boolean (default false) - rarely needed inside Cards
 */
export default function BarChart({
  data = [],
  xKey,
  yKey,
  height = 360,
  emptyLabel = "No data",
  orientation = "vertical",
  maxBars,
  frame = false,
}) {
  const rows = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    const sliced = typeof maxBars === "number" ? arr.slice(0, maxBars) : arr;
    return sliced
      .map((d, i) => {
        const label = String(d?.[xKey] ?? "");
        const raw = d?.[yKey];
        const val = Number(raw);
        return {
          label,
          value: Number.isFinite(val) ? val : 0,
          key: `${label}__${i}`,
        };
      })
      .filter((d) => d.label.length > 0);
  }, [data, xKey, yKey, maxBars]);

  const max = useMemo(() => rows.reduce((m, r) => Math.max(m, r.value), 0), [rows]);

  if (!rows.length) {
    return (
      <div
        style={{
          height,
          display: "grid",
          placeItems: "center",
          color: BRAND.text,
          opacity: 0.72,
          fontWeight: 850,
          borderRadius: 18,
          border: `1px dashed ${BRAND.border}`,
          background: "rgba(255,255,255,0.55)",
        }}
      >
        {emptyLabel}
      </div>
    );
  }

  return orientation === "horizontal" ? (
    <Horizontal rows={rows} max={max} height={height} frame={frame} />
  ) : (
    <Vertical rows={rows} max={max} height={height} frame={frame} />
  );
}

function formatCompact(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(num);
}

function Vertical({ rows, max, height, frame }) {
  const width = 980;
  const pad = { t: 26, r: 28, b: 58, l: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const gap = 14;
  const barW = Math.max(26, (innerW - gap * (rows.length - 1)) / rows.length);

  const grid = [0.25, 0.5, 0.75].map((p, i) => ({
    y: pad.t + innerH * (1 - p),
    key: `g${i}`,
    val: max * p,
  }));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }} role="img" aria-label="Bar chart">
      <defs>
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={BRAND.bar} stopOpacity="0.95" />
          <stop offset="100%" stopColor={BRAND.bar} stopOpacity="0.65" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#111827" floodOpacity="0.10" />
        </filter>
      </defs>

      {frame ? (
        <rect x="0" y="0" width={width} height={height} rx="18" fill="rgba(255,255,255,0.55)" stroke={BRAND.border} />
      ) : null}

      {grid.map((g) => (
        <g key={g.key}>
          <line x1={pad.l} x2={width - pad.r} y1={g.y} y2={g.y} stroke="rgba(17,24,39,0.08)" />
          <text x={width - pad.r} y={g.y - 8} textAnchor="end" fontSize="12" fontWeight="850" fill={BRAND.text} opacity="0.55">
            {formatCompact(g.val)}
          </text>
        </g>
      ))}

      <line x1={pad.l} x2={width - pad.r} y1={pad.t + innerH} y2={pad.t + innerH} stroke="rgba(17,24,39,0.14)" />

      {rows.map((r, i) => {
        const h = max > 0 ? (r.value / max) * innerH : 0;
        const x = pad.l + i * (barW + gap);
        const y = pad.t + (innerH - h);
        return (
          <g key={r.key}>
            <rect x={x} y={y} width={barW} height={h} rx="12" fill="url(#barGrad)" filter="url(#softShadow)" />

            {/* value pill */}
            <g>
              <rect x={x + barW / 2 - 28} y={Math.max(pad.t + 8, y - 26)} width={56} height={18} rx={9} fill="rgba(255,255,255,0.90)" stroke="rgba(17,24,39,0.10)" />
              <text x={x + barW / 2} y={Math.max(pad.t + 21, y - 13)} textAnchor="middle" fontSize="11" fontWeight="950" fill={BRAND.text}>
                {formatCompact(r.value)}
              </text>
            </g>

            <text x={x + barW / 2} y={height - 24} textAnchor="middle" fontSize="11" fontWeight="900" fill={BRAND.text} opacity="0.9">
              {truncate(r.label, 18)}
              <title>{r.label}</title>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Horizontal({ rows, max, height, frame }) {
  const width = 980;
  const pad = { t: 28, r: 64, b: 18, l: 320 }; // BIG label gutter + right padding for numbers
  const innerW = width - pad.l - pad.r;

  const rowH = 32;
  const gap = 12;
  const needed = pad.t + pad.b + rows.length * rowH + (rows.length - 1) * gap;
  const h = Math.max(height, needed);

  const grid = [0.25, 0.5, 0.75].map((p, i) => ({
    x: pad.l + innerW * p,
    key: `hg${i}`,
    val: max * p,
  }));

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} style={{ display: "block" }} role="img" aria-label="Bar chart">
      <defs>
        <linearGradient id="hBarGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={BRAND.bar} stopOpacity="0.90" />
          <stop offset="100%" stopColor={BRAND.bar} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {frame ? (
        <rect x="0" y="0" width={width} height={h} rx="18" fill="rgba(255,255,255,0.55)" stroke={BRAND.border} />
      ) : null}

      {/* grid + labels (moved down so nothing clips) */}
      {grid.map((g) => (
        <g key={g.key}>
          <line x1={g.x} x2={g.x} y1={pad.t - 6} y2={h - pad.b} stroke="rgba(17,24,39,0.08)" />
          <text x={g.x} y={pad.t - 10} textAnchor="middle" fontSize="11" fontWeight="850" fill={BRAND.text} opacity="0.55">
            {formatCompact(g.val)}
          </text>
        </g>
      ))}

      {rows.map((r, i) => {
        const y = pad.t + i * (rowH + gap);
        const w = max > 0 ? (r.value / max) * innerW : 0;

        // keep the value inside the viewBox; if bar is near the end, pin to the right edge
        const valueX = Math.min(width - pad.r + 6, pad.l + Math.max(10, w) + 12);

        return (
          <g key={r.key}>
            <text x={pad.l - 14} y={y + rowH / 2 + 4} textAnchor="end" fontSize="12" fontWeight="900" fill={BRAND.text} opacity="0.92">
              {truncate(r.label, 40)}
              <title>{r.label}</title>
            </text>

            <rect x={pad.l} y={y} width={Math.max(2, w)} height={rowH} rx="12" fill="url(#hBarGrad)" />

            <text x={valueX} y={y + rowH / 2 + 4} textAnchor="start" fontSize="12" fontWeight="950" fill={BRAND.text} opacity="0.92">
              {formatCompact(r.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function truncate(s, n) {
  const str = String(s ?? "");
  if (str.length <= n) return str;
  return str.slice(0, Math.max(0, n - 1)) + "…";
}
