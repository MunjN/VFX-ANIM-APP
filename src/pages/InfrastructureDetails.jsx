import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  bg: "#F7FBFE",
  text: "#111827",
};
const base = import.meta.env.VITE_API_BASE;

function PillButton({ active, children, onClick, title, right }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: `1px solid rgba(30,42,120,${active ? 0.35 : 0.18})`,
        background: active ? "rgba(30,42,120,0.10)" : "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontSize: 12,
        fontWeight: 1000,
        padding: "7px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{children}</span>
      {right ? (
        <span style={{ opacity: 0.75, fontWeight: 900, fontSize: 11 }}>{right}</span>
      ) : null}
    </button>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
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
          padding: "12px 14px",
          borderBottom: "1px solid rgba(30,42,120,0.12)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          background:
            "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 1000, color: BRAND.ink, letterSpacing: 0.3 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.8 }}>{subtitle}</div>
          ) : null}
        </div>
        {right ? <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{right}</div> : null}
      </div>

      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(30,42,120,0.08)",
      }}
    >
      <div style={{ fontWeight: 1000, color: "rgba(30,42,120,0.85)", fontSize: 13 }}>{k}</div>
      <div style={{ fontWeight: 800, color: "rgba(17,24,39,0.92)", fontSize: 13 }}>
        {v !== undefined && v !== null && String(v).trim() !== "" ? (
          String(v)
        ) : (
          <span style={{ opacity: 0.55 }}>—</span>
        )}
      </div>
    </div>
  );
}

function splitList(val) {
  if (!val) return [];
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function InfrastructureDetails() {
  const { infraName: infraParam } = useParams();
  const navigate = useNavigate();

  const [payload, setPayload] = useState(null); // { infra, orgCount, topServices, topContentTypes }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${base}/api/infra/${encodeURIComponent(infraParam)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to load infrastructure (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) setPayload(json);
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [infraParam]);

  const infraRow = payload?.infra || null;

  // Prefer canonical name from CSV row
  const infraName = infraRow?.INFRA_NAME || infraParam;
  const infraId = infraRow?.["ME-NEXUS_INFRA_ID"];

  const orgCount = payload?.orgCount ?? 0;

  // If CSV has curated related lists, prefer those; otherwise use derived ones from org tags.
  const curatedServices = splitList(infraRow?.INFRA_RELATED_SERVICES);
  const curatedContent = splitList(infraRow?.INFRA_RELATED_CONTENT_TYPES);

  const derivedServices = payload?.topServices || [];
  const derivedContent = payload?.topContentTypes || [];

  const servicesToShow = useMemo(() => {
    if (curatedServices.length) return curatedServices.map((name) => ({ name, count: null }));
    return derivedServices;
  }, [curatedServices, derivedServices]);

  const contentToShow = useMemo(() => {
    if (curatedContent.length) return curatedContent.map((name) => ({ name, count: null }));
    return derivedContent;
  }, [curatedContent, derivedContent]);

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function goToOrgs(mode) {
    // Org view expects filters via query params; keep additive.
    const params = new URLSearchParams();
    params.set("INFRASTRUCTURE_TOOLS", infraName);

    if ((mode === "services" || mode === "both") && selectedServices.length) {
      params.set("SERVICES", selectedServices.join(","));
    }
    if ((mode === "content" || mode === "both") && selectedContentTypes.length) {
      params.set("CONTENT_TYPES", selectedContentTypes.join(","));
    }

    navigate(`/participants/organizations?${params.toString()}`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.bg, padding: 24, fontFamily: "system-ui" }}>
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.bg, padding: 24, fontFamily: "system-ui" }}>
        <Card title="Infrastructure" subtitle="Could not load details">
          <div style={{ fontWeight: 900, color: "rgba(17,24,39,0.9)" }}>{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
      }}
    >
      <div style={{ padding: "22px 26px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 0.4, color: "rgba(30,42,120,0.75)" }}>
              Infrastructure Details
            </div>
            <div style={{ fontSize: 28, fontWeight: 1100, color: BRAND.ink, lineHeight: 1.08 }}>
              {infraName}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.75 }}>
              Orgs using this infra: <span style={{ color: BRAND.ink, fontWeight: 1100 }}>{orgCount}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                border: "1px solid rgba(30,42,120,0.18)",
                background: "rgba(255,255,255,0.9)",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={() => goToOrgs("infra")}
              style={{
                border: "1px solid rgba(30,42,120,0.18)",
                background: "rgba(207,239,247,0.75)",
                color: BRAND.ink,
                fontWeight: 1100,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              View orgs using this infra ↗
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 26px 26px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18, alignItems: "start" }}>
          {/* Left: Related facets */}
          <div style={{ display: "grid", gap: 18 }}>
            <Card
              title="Related Services"
              subtitle={curatedServices.length ? "" : ""}
              right={
                <button
                  type="button"
                  disabled={!selectedServices.length}
                  onClick={() => goToOrgs("services")}
                  style={{
                    border: "1px solid rgba(30,42,120,0.18)",
                    background: selectedServices.length ? "rgba(30,42,120,0.10)" : "rgba(17,24,39,0.06)",
                    color: selectedServices.length ? BRAND.ink : "rgba(17,24,39,0.35)",
                    fontWeight: 1100,
                    padding: "8px 10px",
                    borderRadius: 12,
                    cursor: selectedServices.length ? "pointer" : "not-allowed",
                  }}
                >
                  View orgs ↗
                </button>
              }
            >
              {servicesToShow.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {servicesToShow.map((s) => (
                    <PillButton
                      key={s.name}
                      active={selectedServices.includes(s.name)}
                      onClick={() => toggle(selectedServices, setSelectedServices, s.name)}
                      right={s.count !== null && s.count !== undefined ? String(s.count) : undefined}
                      title="Toggle service"
                    >
                      {s.name}
                    </PillButton>
                  ))}
                </div>
              ) : (
                <div style={{ opacity: 0.6, fontWeight: 900 }}>No related services found.</div>
              )}
            </Card>

            <Card
              title="Related Content Types"
              subtitle={curatedContent.length ? "" : ""}
              right={
                <button
                  type="button"
                  disabled={!selectedContentTypes.length}
                  onClick={() => goToOrgs("content")}
                  style={{
                    border: "1px solid rgba(30,42,120,0.18)",
                    background: selectedContentTypes.length ? "rgba(30,42,120,0.10)" : "rgba(17,24,39,0.06)",
                    color: selectedContentTypes.length ? BRAND.ink : "rgba(17,24,39,0.35)",
                    fontWeight: 1100,
                    padding: "8px 10px",
                    borderRadius: 12,
                    cursor: selectedContentTypes.length ? "pointer" : "not-allowed",
                  }}
                >
                  View orgs ↗
                </button>
              }
            >
              {contentToShow.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {contentToShow.map((c) => (
                    <PillButton
                      key={c.name}
                      active={selectedContentTypes.includes(c.name)}
                      onClick={() => toggle(selectedContentTypes, setSelectedContentTypes, c.name)}
                      right={c.count !== null && c.count !== undefined ? String(c.count) : undefined}
                      title="Toggle content type"
                    >
                      {c.name}
                    </PillButton>
                  ))}
                </div>
              ) : (
                <div style={{ opacity: 0.6, fontWeight: 900 }}>No related content types found.</div>
              )}
            </Card>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedServices([]);
                  setSelectedContentTypes([]);
                }}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  background: "rgba(255,255,255,0.9)",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Clear selections
              </button>

              <button
                type="button"
                disabled={!(selectedServices.length || selectedContentTypes.length)}
                onClick={() => goToOrgs("both")}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  background: selectedServices.length || selectedContentTypes.length ? "rgba(207,239,247,0.75)" : "rgba(17,24,39,0.06)",
                  color: selectedServices.length || selectedContentTypes.length ? BRAND.ink : "rgba(17,24,39,0.35)",
                  fontWeight: 1100,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: selectedServices.length || selectedContentTypes.length ? "pointer" : "not-allowed",
                }}
              >
                View orgs for infra + selections ↗
              </button>
            </div>
          </div>

          {/* Right: Infra metadata */}
          <Card title="Infrastructure Details" subtitle="">
            <KV k="Infra ID" v={infraId} />
            <KV k="Name" v={infraRow?.INFRA_NAME} />
            <KV k="Active" v={infraRow?.INFRA_IS_ACTIVE} />
            <KV k="Description" v={infraRow?.INFRA_DESCRIPTION} />
            <KV k="Parent Organization" v={infraRow?.INFRA_PARENT_ORGANIZATION} />
            <KV k="Has API" v={infraRow?.INFRA_HAS_API} />
            <KV k="Release Date" v={infraRow?.INFRA_RELEASE_DATE} />
            <KV k="Latest Version" v={infraRow?.INFRA_LATEST_VERSION} />
            <KV k="License" v={infraRow?.INFRA_LICENSE} />
            <KV k="Yearly Corporate Pricing" v={infraRow?.INFRA_YEARLY_CORPORATE_PRICING} />
            <KV k="Functional Type" v={infraRow?.INFRA_FUNCTIONAL_TYPE} />
            <KV k="Structural Type" v={infraRow?.INFRA_STRUCTURAL_TYPE} />
          </Card>
        </div>
      </div>
    </div>
  );
}
