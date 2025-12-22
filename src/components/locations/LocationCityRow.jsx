import React from "react";
import CountPill from "./CountPill";

export default function LocationCityRow({
  city,
  totalOrgs,
  hqOrgs,
  selected,
  onToggleSelect,
}) {
  return (
    <tr style={{ background: selected ? "rgba(207,239,247,0.45)" : "transparent" }}>
      <td
        onClick={onToggleSelect}
        title="Click to select city"
        style={{
          padding: "10px 16px 10px 54px",
          borderBottom: "1px solid rgba(30,42,120,0.08)",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "rgba(30,42,120,0.75)", fontWeight: 1000 }}>•</span>
          <div style={{ fontWeight: 950, color: "#111827" }}>{city}</div>
          {selected ? (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                fontWeight: 1000,
                color: "#1E2A78",
                background: "rgba(207,239,247,0.65)",
                border: "1px solid rgba(30,42,120,0.18)",
                padding: "4px 8px",
                borderRadius: 999,
              }}
            >
              Selected
            </span>
          ) : null}
        </div>
      </td>

      <td
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid rgba(30,42,120,0.08)",
          textAlign: "right",
        }}
      >
        <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <CountPill label="Total" value={totalOrgs} />
          <CountPill label="HQ" value={hqOrgs} />
        </div>
      </td>
    </tr>
  );
}
