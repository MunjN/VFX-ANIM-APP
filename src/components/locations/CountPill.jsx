import React from "react";

export default function CountPill({ label, value, tone = "default" }) {
  const stylesByTone = {
    default: {
      bg: "rgba(207,239,247,0.60)",
      border: "rgba(30,42,120,0.22)",
      text: "#1E2A78",
    },
    solid: {
      bg: "#1E2A78",
      border: "#1E2A78",
      text: "#FFFFFF",
    },
    subtle: {
      bg: "rgba(17,24,39,0.04)",
      border: "rgba(17,24,39,0.10)",
      text: "#111827",
    },
  };

  const s = stylesByTone[tone] || stylesByTone.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.text,
        fontWeight: 950,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.82 }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{(value ?? 0).toLocaleString?.() ?? String(value ?? 0)}</span>
    </span>
  );
}
