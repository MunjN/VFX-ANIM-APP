import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const DEFINITION =
  "Functional Types describe the role an organization plays in the Media & Entertainment ecosystem—how it creates, enables, distributes, regulates, or supports content and production infrastructure.";

const ROWS = [
  {
    functionalType: "Conglomerate Organization",
    l1: "Conglomerate",
    l2: "",
    validFor: "Participant",
    description:
      "A large parent corporation owning diverse entertainment, media, or technology businesses.",
    example: "Disney",
  },
  {
    functionalType: "Content Organization",
    l1: "Content",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations directly involved in the creation and distribution of entertainment content.",
    example: "EA Games",
  },
  {
    functionalType: "Content Delivery",
    l1: "Content Delivery",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that provide platforms or networks to transmit digital entertainment to end users.",
    example: "Netflix",
  },
  {
    functionalType: "Content Distributor",
    l1: "Content Distributor",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that license, package, and sell entertainment content to theaters, broadcasters, or digital platforms.",
    example: "Discovery",
  },
  {
    functionalType: "Content Producer",
    l1: "Content Producer",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that originate and finance entertainment projects, overseeing development, production, and post-production to deliver market-ready media.",
    example: "A24",
  },
  {
    functionalType: "Content Vendor",
    l1: "Content Vendor",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that provide specialized services to help others create entertainment content.",
    example: "Cinesite",
  },
  {
    functionalType: "Educational Organization",
    l1: "Educational",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations delivering learning experiences in media, technology, or arts.",
    example: "USC",
  },
  {
    functionalType: "School District",
    l1: "School District",
    l2: "",
    validFor: "Participant",
    description:
      "Local education authorities managing K–12 institutions, curricula, and community partnerships.",
    example: "Los Angeles Unified School District",
  },
  {
    functionalType: "Government",
    l1: "Government",
    l2: "",
    validFor: "Participant",
    description:
      "Public organizations that regulate, fund, or promote entertainment sectors through policy, grants, incentives, and cultural programs.",
    example: "National Film Board of Canada",
  },
  {
    functionalType: "Infrastructure Provider",
    l1: "Infrastructure Provider",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations providing the foundational hardware, software, cloud services, and network systems to support content creation and global distribution.",
    example: "Adobe",
  },
  {
    functionalType: "Industry Organization",
    l1: "Industry Advocate",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that represents and advances the shared interests of a specific sector or creative field.",
    example: "Film Academy",
  },
  {
    functionalType: "Trade Association/Commission",
    l1: "Trade Association/Commission",
    l2: "Trade Association/Commission",
    validFor: "Participant",
    description:
      "Member-driven organizations representing a sector, advocating policy, setting standards, and offering research, education, and networking.",
    example: "VES",
  },
  {
    functionalType: "Enterprise Creative",
    l1: "Enterprise Creative",
    l2: "",
    validFor: "Participant",
    description:
      "Non-entertainment organizations adopting advanced media tools to enhance communication, visualization, and customer experiences.",
    example: "Pfizer",
  },
  {
    functionalType: "AEC Organization",
    l1: "AEC",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that design, engineer, and construct physical structures and systems across any industry.",
    example: "Zaha Hadid",
  },
  {
    functionalType: "Manufacturing Organization",
    l1: "Manufacturing",
    l2: "",
    validFor: "Participant",
    description:
      "Organizations that produce physical goods across all industries, converting raw materials into finished products.",
    example: "Ford",
  },
];

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

export default function FunctionalTypes() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ROWS;
    return ROWS.filter((r) => {
      const hay = [
        r.functionalType,
        r.l1,
        r.l2,
        r.validFor,
        r.description,
        r.example,
      ]
        .join(" | ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 26px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                border: "none",
                background: BRAND.fill,
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 14px",
                borderRadius: 14,
                cursor: "pointer",
                letterSpacing: 0.2,
                boxShadow: "0 8px 28px rgba(30,42,120,0.12)",
              }}
            >
              ME-NEXUS
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Participants
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants/organizations")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Organizations
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Functional Types</span>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 10 }}>
              <Pill>{filtered.length} types</Pill>
              <Pill>Valid for: Participant</Pill>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => navigate("/participants/organizations/schema")}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
              title="Open schema reference"
            >
              Schema Information
            </button>

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
              }}
            >
              ME-DMZ ↗
            </a>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -0.4, color: "#0B0F1A" }}>
            Functional Types
          </div>

          <div
            style={{
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.16)`,
              background: "#FFFFFF",
              boxShadow: "0 18px 60px rgba(30,42,120,0.08)",
              padding: 16,
              maxWidth: 1700,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 1000, color: BRAND.ink, letterSpacing: 0.35 }}>
              DEFINITION
            </div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 850, opacity: 0.9, lineHeight: 1.45 }}>
              {DEFINITION}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Functional Types..."
                style={{
                  width: "min(560px, 92vw)",
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  borderRadius: 14,
                  padding: "10px 12px",
                  fontWeight: 900,
                  outline: "none",
                }}
              />

              <button
                type="button"
                onClick={() => setQ("")}
                disabled={!q}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: q ? BRAND.fill : "rgba(243,244,246,0.7)",
                  color: q ? BRAND.ink : "rgba(30,42,120,0.45)",
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: q ? "pointer" : "not-allowed",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "0 26px 26px" }}>
        <div
          style={{
            borderRadius: 18,
            border: `1px solid rgba(30,42,120,0.16)`,
            background: "#FFFFFF",
            boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(30,42,120,0.12)",
              background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 1000, color: BRAND.ink, letterSpacing: 0.3 }}>
                REFERENCE
              </div>
              <div style={{ fontSize: 18, fontWeight: 1000, color: BRAND.text }}>
                Functional Types Tracked by ME-NEXUS
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Pill>Rows: {filtered.length}</Pill>
              <Pill>Source: ME-DMZ</Pill>
            </div>
          </div>

          <div style={{ overflow: "auto", maxHeight: "calc(100vh - 340px)" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {[
                    "Functional Type",
                    "L1 Functional Type",
                    "L2 Functional Type",
                    "Valid For",
                    "Description",
                    "Example",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        letterSpacing: 0.35,
                        fontWeight: 1000,
                        color: BRAND.ink,
                        background: "#FFFFFF",
                        borderBottom: "1px solid rgba(30,42,120,0.14)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={`${r.functionalType}:${idx}`}
                    style={{
                      background: idx % 2 === 0 ? "rgba(247,251,254,0.75)" : "#FFFFFF",
                    }}
                  >
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 1000, color: "#0B0F1A", whiteSpace: "nowrap" }}>
                      {r.functionalType}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 900, color: "rgba(17,24,39,0.92)", whiteSpace: "nowrap" }}>
                      {r.l1 || <span style={{ opacity: 0.55 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 900, color: "rgba(17,24,39,0.92)", whiteSpace: "nowrap" }}>
                      {r.l2 || <span style={{ opacity: 0.55 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(30,42,120,0.08)", whiteSpace: "nowrap" }}>
                      <Pill>{r.validFor}</Pill>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 850, color: "rgba(17,24,39,0.9)", minWidth: 520, lineHeight: 1.35 }}>
                      {r.description}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 900, color: "rgba(17,24,39,0.92)", whiteSpace: "nowrap" }}>
                      {r.example}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 18 }}>
                      <div
                        style={{
                          border: `1px dashed rgba(30,42,120,0.25)`,
                          borderRadius: 16,
                          padding: 16,
                          background: "rgba(207,239,247,0.25)",
                          color: BRAND.ink,
                          fontWeight: 1000,
                        }}
                      >
                        No matches. Try a different search.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => navigate("/participants/organizations")}
            style={{
              border: `1px solid rgba(30,42,120,0.22)`,
              background: "#FFFFFF",
              color: BRAND.ink,
              fontWeight: 1000,
              padding: "12px 14px",
              borderRadius: 16,
              cursor: "pointer",
            }}
          >
            ← Back to Organizations
          </button>
        </div>
      </div>
    </div>
  );
}
