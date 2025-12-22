import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const SECTIONS = [
  {
    title: "Core Identity",
    items: [
      {
        name: "Organization ID",
        type: "String",
        desc:
          "The official unique identifier assigned to a Participant Organization by ME-DMZ. Acts as the primary reference key across the platform.",
      },
      {
        name: "Organization Name",
        type: "String",
        desc: "The official legal name of the organization.",
      },
      {
        name: "Alternate Names",
        type: "Comma-separated list of strings",
        desc:
          "Other names by which the organization is commonly referred to in the industry.",
      },
      {
        name: "Parent Organization",
        type: "String",
        desc:
          "The umbrella or conglomerate organization that owns or controls this organization.",
      },
      {
        name: "Child Organizations",
        type: "Comma-separated list of strings",
        desc: "Subsidiaries or organizations operating under this entity.",
      },
    ],
  },
  {
    title: "Web & Identifiers",
    items: [
      {
        name: "Organization Domain",
        type: "URL",
        desc: "The primary web domain associated with the organization.",
      },
      {
        name: "Organization Website",
        type: "URL",
        desc: "The official website URL of the organization.",
      },
      {
        name: "External Identifiers",
        type: "URL",
        desc:
          "Authoritative external references used to refresh organizational data, such as LinkedIn, Crunchbase, or OpenCorporates.",
      },
    ],
  },
  {
    title: "Operational Status",
    items: [
      {
        name: "Active",
        type: "Boolean",
        desc: "Indicates whether the organization is currently operational.",
      },
      {
        name: "Active As Of / Founded Year",
        type: "Number",
        desc:
          "The year in which the organization became operational or was founded.",
      },
      {
        name: "Inactive As Of",
        type: "Number",
        desc: "The year in which the organization ceased operations, if applicable.",
      },
      {
        name: "Cause of Inactivity",
        type: "String",
        desc: "The reason the organization became inactive or shut down.",
      },
    ],
  },
  {
    title: "Scale & Structure",
    items: [
      {
        name: "Organization Sizing",
        type: "String",
        desc:
          "A headcount range used to classify the size of the organization (e.g. 11–50, 501–1000).",
      },
      {
        name: "Employee Count",
        type: "Number",
        desc: "The internally tracked estimated number of employees.",
      },
      {
        name: "Number of Locations",
        type: "Number",
        desc: "Total number of geographic locations where the organization operates.",
      },
      {
        name: "Legal Form",
        type: "String",
        desc:
          "The legal classification of the organization (e.g. Private, Public, Government).",
      },
    ],
  },
  {
    title: "ME-NEXUS Participant Organization Attributes",
    items: [
      {
        name: "Functional Types",
        type: "Comma-separated list of strings",
        desc:
          "The roles the organization plays within the Media & Entertainment industry.",
      },
      {
        name: "Content Types",
        type: "Comma-separated list of strings",
        desc: "The categories of content the organization works on.",
      },
      {
        name: "Services",
        type: "Comma-separated list of strings",
        desc:
          "Services offered by the organization across the media production lifecycle.",
      },
      {
        name: "Infrastructure",
        type: "Comma-separated list of strings",
        desc:
          "Infrastructure tools and technologies associated with the organization.",
      },
    ],
  },
  {
    title: "Internal Metadata",
    items: [
      {
        name: "Memberships",
        type: "Comma-separated list of strings",
        desc:
          "Industry institutions or associations the organization belongs to.",
      },
      {
        name: "Tags",
        type: "Comma-separated list of strings",
        desc: "Internal metadata used for tracking, sourcing, and analytical workflows.",
      },
      {
        name: "Reference Links",
        type: "URL",
        desc:
          "Secure source links used internally to support data refresh operations.",
      },
    ],
  },
];

function isReferenceLink(name) {
  return (
    name === "Functional Types" ||
    name === "Content Types" ||
    name === "Services" ||
    name === "Infrastructure"
  );
}

function routeForReference(name) {
  if (name === "Functional Types") return "/participants/organizations/functional-types";
  if (name === "Content Types") return "/participants/organizations/content-types";
  if (name === "Services") return "/participants/organizations/services";
  // ✅ New: Infrastructure reference page
  return "/participants/organizations/infrastructure";
}

export default function OrganizationSchema() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        padding: "26px",
        fontFamily: "system-ui",
        color: BRAND.text,
      }}
    >
      <button
        onClick={() => navigate("/participants/organizations")}
        style={{
          border: "1px solid rgba(30,42,120,0.22)",
          background: "#FFFFFF",
          color: BRAND.ink,
          fontWeight: 1000,
          padding: "10px 12px",
          borderRadius: 14,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        ← Back to Organizations
      </button>

      <h1
        style={{
          fontSize: 32,
          fontWeight: 1000,
          marginBottom: 6,
          color: BRAND.ink,
        }}
      >
        Participant Organization Schema
      </h1>
      <p style={{ maxWidth: 900, opacity: 0.85, fontWeight: 800 }}>
        This page describes the attributes used to define Participant Organizations
        within ME-DMZ and ME-NEXUS.
      </p>

      <div style={{ marginTop: 32, display: "grid", gap: 28 }}>
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            style={{
              background: "#FFFFFF",
              borderRadius: 18,
              border: "1px solid rgba(30,42,120,0.16)",
              boxShadow: "0 18px 60px rgba(30,42,120,0.08)",
              padding: 18,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 1000,
                color: BRAND.ink,
                marginBottom: 12,
              }}
            >
              {section.title}
            </h2>

            <div style={{ display: "grid", gap: 14 }}>
              {section.items.map((item) => (
                <div key={item.name}>
                  {isReferenceLink(item.name) ? (
                    <button
                      type="button"
                      onClick={() => navigate(routeForReference(item.name))}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        margin: 0,
                        fontWeight: 1000,
                        color: BRAND.ink,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                      title="Open reference"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <div style={{ fontWeight: 1000 }}>{item.name}</div>
                  )}

                  <div style={{ fontSize: 13, opacity: 0.8 }}>{item.desc}</div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      fontWeight: 900,
                      color: BRAND.ink,
                    }}
                  >
                    Data Type: {item.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
