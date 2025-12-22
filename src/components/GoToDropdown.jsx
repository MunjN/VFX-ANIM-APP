import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * "Go to" dropdown for Organizations page.
 * Pure navigation (doesn't touch filters/state).
 */
export default function GoToDropdown({ label = "Go to" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const items = useMemo(
    () => [
      { label: "Services", to: "/participants/organizations/services", icon: "🧰" },
      { label: "Content Types", to: "/participants/organizations/content-types", icon: "🎬" },
      { label: "Functional Types", to: "/participants/organizations/functional-types", icon: "🧩" },
      { label: "Production Locations", to: "/participants/organizations/production-locations", icon: "📍" },
      { label: "Infrastructure", to: "/participants/organizations/infrastructure", icon: "🧱" }, // coming soon
      { label: "Organization Schema", to: "/participants/organizations/schema", icon: "📚" },
    ],
    []
  );

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 14,
          border: "1px solid rgba(30,42,120,0.18)",
          background:
            "linear-gradient(135deg, rgba(60,130,255,0.16), rgba(122,92,255,0.12))",
          boxShadow: "0 10px 22px rgba(0,0,0,0.08)",
          cursor: "pointer",
          fontWeight: 900,
          letterSpacing: "-0.01em",
          color: "#111827",
          userSelect: "none",
        }}
        title="Jump to related pages"
      >
        <span aria-hidden style={{ filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.12))" }}>
          ✨
        </span>
        <span style={{ fontSize: 14 }}>{label}</span>
        <span aria-hidden style={{ opacity: 0.7 }}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Go to"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 270,
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 18px 44px rgba(0,0,0,0.16)",
            backdropFilter: "blur(10px)",
            padding: 8,
            zIndex: 50,
          }}
        >
          {items.map((it) => (
            <button
              key={it.to}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(it.to);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 10px",
                borderRadius: 12,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(60,130,255,0.12), rgba(122,92,255,0.10))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span aria-hidden style={{ width: 24 }}>{it.icon}</span>
              <span style={{ flex: 1, fontWeight: 800, color: "#111827" }}>{it.label}</span>
              <span aria-hidden style={{ opacity: 0.65 }}>
                →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
