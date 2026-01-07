import React, { useMemo, useState, useCallback } from "react";

/**
 * DonutChart (SVG)
 * - Fixed visual size per `height`
 * - Legend scrolls inside the same height (prevents layout shifts)
 * - Hover tooltip (slice + legend)
 * - Expects data: [{ label, value }]
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function sumValues(data) {
  return (data || []).reduce((s, d) => s + (Number(d?.value) || 0), 0);
}

function fmtPct(p) {
  if (!Number.isFinite(p)) return "0%";
  if (p < 1 && p > 0) return "<1%";
  return `${Math.round(p)}%`;
}

function fmtNum(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString();
}

export default function DonutChart({
  data = [],
  height = 460,
  centerLabel = "Orgs",
}) {
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [tip, setTip] = useState(null); // { x, y, label, value, pct, color }

  const total = useMemo(() => sumValues(data), [data]);

  // Chart square size derived from card height (stable even if legend differs).
  const size = useMemo(() => clamp(Math.floor(height - 90), 300, 420), [height]);

  const strokeBase = 26;
  const r = (size / 2) - (strokeBase / 2) - 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  // Palette (blue-forward)
  const palette = [
    "#3B82F6", "#2563EB", "#60A5FA", "#38BDF8",
    "#818CF8", "#22C55E", "#F59E0B", "#EC4899",
    "#8B5CF6", "#06B6D4", "#A3A3A3"
  ];

  // Convert to ring segments (dash offsets)
  const segments = useMemo(() => {
    const safe = (data || []).filter((d) => Number(d?.value) > 0);
    const t = sumValues(safe);
    if (!t) return [];

    let acc = 0;
    return safe.map((d, i) => {
      const v = Number(d.value) || 0;
      const frac = v / t;
      const len = frac * circ;
      const dasharray = `${len} ${circ - len}`;
      const dashoffset = -acc;
      acc += len;

      return {
        label: String(d.label ?? ""),
        value: v,
        pct: frac * 100,
        color: palette[i % palette.length],
        dasharray,
        dashoffset,
      };
    });
  }, [data, circ]);

  const clearTip = useCallback(() => {
    setTip(null);
    setHoverIdx(-1);
  }, []);

  const onSliceMove = useCallback((evt, seg, idx) => {
    // position relative to the viewport (fixed tooltip)
    const x = evt?.clientX ?? 0;
    const y = evt?.clientY ?? 0;
    setHoverIdx(idx);
    setTip({
      x,
      y,
      label: seg.label,
      value: seg.value,
      pct: seg.pct,
      color: seg.color,
    });
  }, []);

  const onLegendEnter = useCallback((seg, idx) => {
    setHoverIdx(idx);
    // No mouse position on enter via keyboard/legend; keep any existing tooltip or show a default anchored tooltip.
    // We’ll show a tooltip anchored near the middle-right of the chart area.
    setTip((prev) => ({
      x: prev?.x ?? 0,
      y: prev?.y ?? 0,
      label: seg.label,
      value: seg.value,
      pct: seg.pct,
      color: seg.color,
      // mark as "no cursor"; we won't reposition until mouse moves
      noFollow: true,
    }));
  }, []);

  const onLegendLeave = useCallback(() => {
    clearTip();
  }, [clearTip]);

  // Tooltip positioning
  const tooltipStyle = useMemo(() => {
    if (!tip) return null;

    // If we don't have a cursor position (legend hover), place it nicely near the donut
    const hasCursor = Number.isFinite(tip.x) && Number.isFinite(tip.y) && !tip.noFollow;
    const left = hasCursor ? tip.x + 14 : undefined;
    const top = hasCursor ? tip.y + 14 : undefined;

    return {
      position: "fixed",
      left,
      top,
      right: hasCursor ? undefined : 24,
      bottom: hasCursor ? undefined : 24,
      zIndex: 9999,
      pointerEvents: "none",
      background: "rgba(255,255,255,0.98)",
      border: "1px solid rgba(30,42,120,0.18)",
      borderRadius: 12,
      padding: "10px 12px",
      boxShadow: "0 18px 40px rgba(17,24,39,0.18)",
      color: "#0f172a",
      minWidth: 180,
    };
  }, [tip]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${size}px 1fr`,
        alignItems: "center",
        gap: 18,
        height,
        minHeight: height,
        position: "relative",
      }}
    >
      {/* Fixed square chart area */}
      <div
        style={{
          width: size,
          height: size,
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* subtle track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(15, 23, 42, 0.06)"
            strokeWidth={strokeBase}
          />

          {/* segments */}
          {segments.map((s, idx) => {
            const isHover = idx === hoverIdx;
            const strokeWidth = isHover ? strokeBase + 3 : strokeBase;
            const opacity = hoverIdx === -1 ? 1 : isHover ? 1 : 0.55;

            return (
              <circle
                key={`${s.label}_${idx}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ cursor: "default", opacity, transition: "opacity 120ms ease, stroke-width 120ms ease" }}
                onMouseMove={(e) => onSliceMove(e, s, idx)}
                onMouseEnter={(e) => onSliceMove(e, s, idx)}
                onMouseLeave={clearTip}
              />
            );
          })}

          {/* center */}
          <circle cx={cx} cy={cy} r={r - strokeBase / 2 - 10} fill="white" />

          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            style={{
              fontSize: 14,
              fontWeight: 900,
              fill: "rgba(30, 42, 120, 0.95)",
              userSelect: "none",
            }}
          >
            {centerLabel}
          </text>
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            style={{
              fontSize: 34,
              fontWeight: 950,
              fill: "rgba(15, 23, 42, 0.95)",
              userSelect: "none",
            }}
          >
            {fmtNum(total)}
          </text>
        </svg>
      </div>

      {/* Legend: locked height, scroll if needed */}
      <div
        style={{
          height: size,
          overflowY: "auto",
          paddingRight: 6,
        }}
        onMouseMove={(e) => {
          // If tooltip is active and we are moving mouse over legend, keep following the cursor
          if (!tip) return;
          setTip((prev) =>
            prev
              ? { ...prev, x: e.clientX, y: e.clientY, noFollow: false }
              : prev
          );
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {segments.map((s, idx) => {
            const isHover = idx === hoverIdx;
            return (
              <div
                key={`lg_${s.label}_${idx}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: isHover
                    ? "1px solid rgba(30,42,120,0.28)"
                    : "1px solid rgba(30,42,120,0.14)",
                  background: isHover
                    ? "rgba(255,255,255,0.92)"
                    : "rgba(255,255,255,0.72)",
                  fontWeight: 850,
                  boxShadow: isHover ? "0 10px 22px rgba(17,24,39,0.10)" : "none",
                  transition: "background 120ms ease, border 120ms ease, box-shadow 120ms ease",
                  cursor: "default",
                }}
                title={`${s.label}: ${fmtNum(s.value)}`}
                onMouseEnter={() => onLegendEnter(s, idx)}
                onMouseLeave={onLegendLeave}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: s.color,
                  }}
                />
                <div style={{ fontSize: 13, lineHeight: 1.2 }}>{s.label}</div>
                <div style={{ fontSize: 13, opacity: 0.95 }}>{fmtPct(s.pct)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tip && (
        <div style={tooltipStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: tip.color,
                display: "inline-block",
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.85 }}>
              {tip.label}
            </div>
          </div>

          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, fontWeight: 900 }}>
              <span>Orgs</span>
              <span>{fmtNum(tip.value)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 12, opacity: 0.75 }}>
              <span>Share</span>
              <span>{fmtPct(tip.pct)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
