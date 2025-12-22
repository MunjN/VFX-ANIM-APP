import React from "react";

export default function SelectionBar({
  selectedCount,
  chips,
  orgMode,
  onChangeMode,
  onView,
  onClear,
}) {
  if (selectedCount <= 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 18,
        width: "min(1100px, calc(100vw - 24px))",
        zIndex: 80,
        borderRadius: 18,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 16px 60px rgba(0,0,0,0.16)",
        padding: 14,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 8, minWidth: 280 }}>
          <div style={{ fontWeight: 1000, color: "#111827" }}>
            View Participant Organizations ({selectedCount} selected)
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {chips}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900, color: "#1E2A78", fontSize: 12, letterSpacing: 0.25 }}>Mode</div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
              <input
                type="radio"
                name="orgMode"
                checked={orgMode === "all"}
                onChange={() => onChangeMode("all")}
              />
              All
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
              <input
                type="radio"
                name="orgMode"
                checked={orgMode === "hq"}
                onChange={() => onChangeMode("hq")}
              />
              Headquartered
            </label>
          </div>

          <button
            type="button"
            onClick={onView}
            style={{
              border: `1px solid rgba(30,42,120,0.25)`,
              background: "#1E2A78",
              color: "#FFFFFF",
              fontWeight: 1000,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 14px 30px rgba(30,42,120,0.18)",
            }}
          >
            View Participant Organizations →
          </button>

          <button
            type="button"
            onClick={onClear}
            style={{
              border: `1px solid rgba(30,42,120,0.22)`,
              background: "#FFFFFF",
              color: "#1E2A78",
              fontWeight: 950,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
