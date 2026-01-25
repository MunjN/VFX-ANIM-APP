// src/components/ViewInfoModal.jsx
import React, { useEffect, useMemo } from "react";

const BRAND = {
  primaryLightBlue: "#CEECF2",
  primaryDarkBlue: "#232073",
  secondaryGreen: "#3AA608",
  secondaryOrange: "#D97218",
  secondaryYellow: "#F2C53D",
  grey: "#747474",
  border: "#E5E7EB",
  card: "#FFFFFF",
};

const VIEW_META = {
  tax: {
    title: "Tax Region",
    accent: BRAND.secondaryOrange,
    pill: "Tax Regions",
  },
  geodata: {
    title: "Geodata",
    accent: BRAND.secondaryYellow,
    pill: "Geodata",
  },
  cloud: {
    title: "Cloud Region",
    accent: BRAND.primaryDarkBlue,
    pill: "Cloud Regions",
  },
};

function escapeHtml(str) {
  const s = String(str ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtNum(v, { decimals = 2 } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  // avoid showing 0.00 for missing-ish
  if (Math.abs(n) < 1e-12) return "0";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

function fmtInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return Math.trunc(n).toLocaleString();
}

function isBlank(v) {
  const s = String(v ?? "").trim();
  if (!s) return true;
  const t = s.toLowerCase();
  return t === "unknown" || t === "n/a" || t === "-" || t === "na";
}

function codeFromSalesRegionLabel(label) {
  const s = String(label ?? "").trim();
  if (!s) return "Unknown";
  const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
  if (m?.[1]) return m[1].toUpperCase();

  const u = s.toUpperCase();
  if (u.includes("NORTH AMERICA")) return "NA";
  if (u.includes("EUROPE") || u.includes("MIDDLE EAST") || u.includes("AFRICA")) return "EMEA";
  if (u.includes("ASIA") || u.includes("PACIFIC")) return "APAC";
  if (u.includes("LATIN")) return "LATAM";

  return "Unknown";
}

/**
 * Canonicalize sales region display so APAC/LATAM don’t look inconsistent.
 * This also prevents confusion when different datasets use slightly different wording.
 */
function normalizeSalesRegionLabel(label) {
  const s = String(label ?? "").trim();
  if (!s) return "";

  const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
  if (m?.[1]) {
    const code = m[1].toUpperCase();
    if (code === "NA") return "North America (NA)";
    if (code === "EMEA") return "Europe - Middle East - Africa (EMEA)";
    if (code === "APAC") return "Asia-Pacific (APAC)";
    if (code === "LATAM") return "Latin America (LATAM)";
  }

  const code = codeFromSalesRegionLabel(s);
  if (code === "NA") return "North America (NA)";
  if (code === "EMEA") return "Europe - Middle East - Africa (EMEA)";
  if (code === "APAC") return "Asia-Pacific (APAC)";
  if (code === "LATAM") return "Latin America (LATAM)";
  return s;
}

// Optional: small deterministic provider color dot (visual parity with map “different colors” idea)
const PROVIDER_PALETTE = [
  BRAND.secondaryOrange,
  BRAND.secondaryGreen,
  BRAND.primaryDarkBlue,
  BRAND.secondaryYellow,
  "#6D28D9",
  "#DC2626",
  "#0EA5E9",
  "#F97316",
  "#10B981",
  "#64748B",
];

function hashString(str) {
  const s = String(str || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function colorForProvider(provider) {
  const p = String(provider || "").trim();
  if (!p) return BRAND.border;
  const idx = hashString(p) % PROVIDER_PALETTE.length;
  return PROVIDER_PALETTE[idx];
}

function TitleRow({ viewType, title, subtitle }) {
  const meta = VIEW_META[viewType] || VIEW_META.tax;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: meta.accent,
            boxShadow: "0 0 0 4px rgba(206,236,242,0.9)",
            marginTop: 3,
            flex: "0 0 auto",
          }}
        />
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 1000,
              color: BRAND.primaryDarkBlue,
              lineHeight: 1.15,
            }}
            title={title}
          >
            {title}
          </div>
          {!!subtitle && (
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: BRAND.grey }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: "0 0 auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          background: BRAND.primaryLightBlue,
          color: BRAND.primaryDarkBlue,
          fontWeight: 1000,
          fontSize: 11,
          border: `1px solid ${BRAND.border}`,
          whiteSpace: "nowrap",
        }}
      >
        {meta.pill}
      </div>
    </div>
  );
}

function StatGrid({ items }) {
  const filtered = items.filter((it) => !isBlank(it.value));
  if (!filtered.length) return null;

  return (
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {filtered.map((it) => (
        <div
          key={it.label}
          style={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 14,
            background: BRAND.card,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, color: BRAND.grey }}>{it.label}</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 1000, color: BRAND.primaryDarkBlue }}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  if (!children) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 1000, color: BRAND.primaryDarkBlue, marginBottom: 8 }}>
        {title}
      </div>
      <div
        style={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 16,
          background: BRAND.card,
          padding: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Paragraph({ text }) {
  const t = String(text ?? "").trim();
  if (!t || isBlank(t)) return <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>—</div>;

  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: BRAND.grey,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
      // keep it safe (no HTML injection)
      dangerouslySetInnerHTML={{ __html: escapeHtml(t) }}
    />
  );
}

/**
 * ViewInfoModal
 *
 * Props:
 * - isOpen: boolean
 * - viewType: "tax" | "geodata" | "cloud"
 * - item: object (row)
 * - onClose: () => void
 */
export default function ViewInfoModal({ isOpen, viewType, item, onClose }) {
  const open = !!isOpen && !!item && !!viewType;

  const meta = VIEW_META[viewType] || VIEW_META.tax;

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const model = useMemo(() => {
    if (!open) return null;

    // Normalize field names to match what server sends (from earlier endpoints)
    if (viewType === "geodata") {
      const country = item.geonameCountryName || item.countryName || "Country";

      const sr = normalizeSalesRegionLabel(item.salesRegion || item.SALES_REGION || "");
      const subtitle = sr ? `Sales Region: ${sr}` : "";

      return {
        title: country,
        subtitle,
        stats: [
          { label: "Population (M)", value: item.populationMillions != null ? fmtNum(item.populationMillions, { decimals: 2 }) : "—" },
          { label: "GDP (T)", value: item.gdpTrillions != null ? fmtNum(item.gdpTrillions, { decimals: 2 }) : "—" },
          { label: "Median age", value: item.medianAge != null ? fmtNum(item.medianAge, { decimals: 1 }) : "—" },
          { label: "Internet users (M)", value: item.internetUsersMillions != null ? fmtNum(item.internetUsersMillions, { decimals: 2 }) : "—" },
          { label: "% Young population", value: item.pctYoungPopulation != null ? `${fmtNum(item.pctYoungPopulation, { decimals: 2 })}%` : "—" },
          { label: "Alpha-2 code", value: item.alpha2Code || "—" },
        ],
        sections: [
          {
            title: "Identifiers",
            content: (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 950, color: BRAND.primaryDarkBlue }}>GeoName Country ID</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: BRAND.grey }}>
                    {item.geonameCountryId || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 950, color: BRAND.primaryDarkBlue }}>Codes</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: BRAND.grey }}>
                    {[
                      item.alpha2Code ? `A2: ${item.alpha2Code}` : null,
                      item.alpha3Code ? `A3: ${item.alpha3Code}` : null,
                      item.numericCode != null ? `NUM: ${fmtInt(item.numericCode)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </div>
                </div>
              </div>
            ),
          },
        ],
      };
    }

    if (viewType === "tax") {
      const title =
        item.locationQuery ||
        item.subRegion ||
        item.country ||
        item.incentiveName ||
        "Tax Region";

      const subtitleParts = [];
      if (item.country) subtitleParts.push(item.country);
      if (item.subRegion) subtitleParts.push(item.subRegion);
      if (item.locationLevel) subtitleParts.push(`Level: ${item.locationLevel}`);
      const subtitle = subtitleParts.join(" • ");

      return {
        title,
        subtitle,
        stats: [
          { label: "Incentive", value: item.incentiveName || "—" },
          { label: "Type", value: item.incentiveType || "—" },
          { label: "Min spend", value: item.minSpend || "—" },
          { label: "Annual cap", value: item.annualCap || "—" },
          { label: "Sales Region", value: normalizeSalesRegionLabel(item.salesRegion || item.SALES_REGION || "") || "—" },
          { label: "GeoName ID", value: item.geonameId || "—" },
        ],
        sections: [
          {
            title: "Notable features",
            content: <Paragraph text={item.notableFeatures || item.details} />,
          },
          {
            title: "Eligibility",
            content: <Paragraph text={item.eligibility} />,
          },
        ],
      };
    }

    // cloud
    const title =
      item.cloudRegionName ||
      item.regionName ||
      item.orgName ||
      "Cloud Region";

    const provider = item.cloudProvider || item.CLOUD_PROVIDER || "";
    const sr = normalizeSalesRegionLabel(item.salesRegion || item.SALES_REGION || "");

    const subtitleParts = [];

    if (provider) {
      // subtle dot + provider name
      subtitleParts.push(provider);
    }
    if (item.countryName) subtitleParts.push(item.countryName);
    if (sr) subtitleParts.push(sr);
    if (item.launchYear != null) subtitleParts.push(`Launched: ${fmtInt(item.launchYear)}`);

    const subtitle = subtitleParts.join(" • ");

    return {
      title,
      subtitle,
      stats: [
        { label: "Provider", value: provider || "—" },
        { label: "Cloud region", value: item.cloudRegionName || "—" },
        { label: "Region name", value: item.regionName || "—" },
        { label: "Zones", value: item.zoneCount != null ? fmtInt(item.zoneCount) : "—" },
        { label: "Launch year", value: item.launchYear != null ? fmtInt(item.launchYear) : "—" },
        { label: "Sales Region", value: sr || "—" },
      ],
      sections: [
        {
          title: "Location",
          content: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 950, color: BRAND.primaryDarkBlue }}>Country</div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: BRAND.grey }}>
                  {item.countryName || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 950, color: BRAND.primaryDarkBlue }}>Codes</div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: BRAND.grey }}>
                  {[
                    item.countryCode ? `Code: ${item.countryCode}` : null,
                    item.region ? `Region: ${item.region}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </div>
              </div>

              {/* Optional: provider color cue */}
              {provider ? (
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: colorForProvider(provider),
                      border: `2px solid ${BRAND.primaryLightBlue}`,
                    }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
                    Provider: <span style={{ color: BRAND.grey, fontWeight: 850 }}>{provider}</span>
                  </div>
                </div>
              ) : null}
            </div>
          ),
        },
      ],
    };
  }, [open, viewType, item]);

  if (!open || !model) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => onClose?.()}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(17,24,39,0.55)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "relative",
          maxWidth: 820,
          width: "calc(100% - 32px)",
          margin: "48px auto",
          borderRadius: 22,
          background: "rgba(255,255,255,0.92)",
          border: `1px solid ${BRAND.border}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: 8,
            background: meta.accent,
          }}
        />

        <div style={{ padding: 18 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <TitleRow viewType={viewType} title={model.title} subtitle={model.subtitle} />
            </div>

            <button
              onClick={() => onClose?.()}
              aria-label="Close"
              style={{
                flex: "0 0 auto",
                width: 36,
                height: 36,
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: BRAND.card,
                cursor: "pointer",
                fontWeight: 1000,
                color: BRAND.primaryDarkBlue,
                boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
              }}
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <StatGrid items={model.stats || []} />

          {/* Sections */}
          {(model.sections || []).map((s) => (
            <Section key={s.title} title={s.title}>
              {s.content}
            </Section>
          ))}

          {/* Footer */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 850, color: BRAND.grey }}>
              Tip: Click another pin to update this panel • Press{" "}
              <span style={{ fontWeight: 1000, color: BRAND.primaryDarkBlue }}>Esc</span> to close
            </div>

            <button
              onClick={() => onClose?.()}
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: `1px solid ${BRAND.border}`,
                background: BRAND.primaryLightBlue,
                color: BRAND.primaryDarkBlue,
                fontWeight: 1000,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
