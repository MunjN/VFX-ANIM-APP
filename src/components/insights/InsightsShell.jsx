import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { INSIGHTS_BRAND as BRAND } from "./theme";

/**
 * InsightsShell
 * Wrapper for all Insights pages.
 *
 * Adds:
 * - Global breadcrumbs (ME-NEXUS › Participants › Organizations › Insights › {title})
 * - Global "ME-DMZ ↗" link
 * - Keeps your existing tabs + layout
 */

function CrumbButton({ onClick, children, subtle = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: "none",
        background: subtle ? "transparent" : "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 1000,
        cursor: "pointer",
        padding: subtle ? "8px 10px" : "10px 14px",
        borderRadius: subtle ? 10 : 14,
        letterSpacing: 0.2,
        boxShadow: subtle ? "none" : "0 8px 28px rgba(30,42,120,0.12)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function InsightsShell({ title, subtitle, active, children }) {
  const navigate = useNavigate();

  // IMPORTANT:
  // - Use absolute app paths (start with "/") so they work anywhere.
  // - Use <NavLink> (React Router) instead of <a href> to keep HashRouter happy
  //   and avoid hard reloads / server 404s on deep links.
  const tabs = [
    { key: "orgs", label: "Orgs", to: "/participants/organizations/insights/orgs" },
    { key: "infras", label: "Infras", to: "/participants/organizations/insights/infras" },
    { key: "locations", label: "Locations", to: "/participants/organizations/insights/locations" },
    { key: "content", label: "Content Types", to: "/participants/organizations/insights/content-types" },
    { key: "services", label: "Services", to: "/participants/organizations/insights/services" },
    { key: "custom_data", label: "Custom ME-DMZ Data", to: "/participants/organizations/insights/custom-medmz-data" },
  ];

  return (
    <div
      style={{
        background: BRAND.bg,
        minHeight: "100vh",
        padding: "28px 28px 60px",
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Breadcrumbs + Global actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <CrumbButton onClick={() => navigate("/")} title="Go to home">
              ME-NEXUS
            </CrumbButton>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <CrumbButton subtle onClick={() => navigate("/participants")} title="Participants">
              Participants
            </CrumbButton>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <CrumbButton
              subtle
              onClick={() => navigate("/participants/organizations")}
              title="Organizations"
            >
              Organizations
            </CrumbButton>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <span style={{ fontWeight: 1000, opacity: 0.95, whiteSpace: "nowrap" }}>
              Insights
            </span>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <span style={{ fontWeight: 1000, opacity: 0.95, whiteSpace: "nowrap" }}>
              {title}
            </span>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 10 }}>
              {active ? <Pill>{String(active).replace(/_/g, " ")}</Pill> : null}
            </div>
          </div>

          {/* Global link */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href="https://me-dmz.com"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: BRAND.ink,
                fontWeight: 1000,
                opacity: 0.9,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                whiteSpace: "nowrap",
              }}
              title="Open ME-DMZ"
            >
              ME-DMZ ↗
            </a>
          </div>
        </div>

        {/* Title + subtitle */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 950,
              letterSpacing: "-0.02em",
              color: BRAND.text,
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: 800,
                color: BRAND.text,
                opacity: 0.8,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <NavLink
                key={t.key}
                to={t.to}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  fontWeight: 950,
                  fontSize: 13,
                  textDecoration: "none",
                  color: isActive ? BRAND.ink : BRAND.text,
                  background: isActive ? "rgba(60,130,255,0.16)" : "rgba(255,255,255,0.7)",
                  border: `1px solid ${isActive ? "rgba(60,130,255,0.30)" : BRAND.border}`,
                }}
              >
                {t.label}
              </NavLink>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ display: "grid", gap: 18 }}>{children}</div>
      </div>
    </div>
  );
}
