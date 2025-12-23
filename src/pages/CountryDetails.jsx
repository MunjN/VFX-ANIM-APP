import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
};
const base = import.meta.env.VITE_API_BASE;

function Pill({ children, onClick, title, kind = "soft" }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(30,42,120,0.22)",
    fontWeight: 900,
    fontSize: 12,
    cursor: onClick ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
  const styles =
    kind === "solid"
      ? { background: "rgba(30,42,120,0.92)", color: "#fff" }
      : { background: "rgba(207,239,247,0.55)", color: BRAND.ink };

  return (
    <span style={{ ...base, ...styles }} onClick={onClick} title={title}>
      {children}
    </span>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(30,42,120,0.14)",
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 14px 42px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(30,42,120,0.10)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 950, fontSize: 14, color: BRAND.text }}>{title}</div>
          {subtitle ? (
            <div style={{ marginTop: 6, fontWeight: 750, fontSize: 12, color: "rgba(0,0,0,0.62)" }}>
              {subtitle}
            </div>
          ) : null}
        </div>
        {right}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(30,42,120,0.12)",
        background: "rgba(247,251,254,0.9)",
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.55)" }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 950, color: BRAND.text }}>{value}</div>
    </div>
  );
}

function buildOrgsUrl(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    sp.set(k, String(v));
  }
  return `/participants/organizations?${sp.toString()}`;
}

export default function CountryDetails() {
  const navigate = useNavigate();
  const { country } = useParams();
  const decodedCountry = useMemo(() => decodeURIComponent(country || ""), [country]);

  const [scope, setScope] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selectedFacets, setSelectedFacets] = useState({
    SERVICES: new Set(),
    CONTENT_TYPES: new Set(),
    INFRASTRUCTURE_TOOLS: new Set(),
    ORG_FUNCTIONAL_TYPE: new Set(),
  }); // multi-select

  const toggleFacet = (type, name) => {
    if (!type || !name) return;
    setSelectedFacets((prev) => {
      const next = {
        SERVICES: new Set(prev.SERVICES),
        CONTENT_TYPES: new Set(prev.CONTENT_TYPES),
        INFRASTRUCTURE_TOOLS: new Set(prev.INFRASTRUCTURE_TOOLS),
        ORG_FUNCTIONAL_TYPE: new Set(prev.ORG_FUNCTIONAL_TYPE),
      };
      const bucket = next[type] || new Set();
      if (bucket.has(name)) bucket.delete(name);
      else bucket.add(name);
      next[type] = bucket;
      return next;
    });
  };

  const clearSelections = () => {
    setSelectedFacets({
      SERVICES: new Set(),
      CONTENT_TYPES: new Set(),
      INFRASTRUCTURE_TOOLS: new Set(),
      ORG_FUNCTIONAL_TYPE: new Set(),
    });
  };

  const hasSelections =
    selectedFacets.SERVICES.size +
      selectedFacets.CONTENT_TYPES.size +
      selectedFacets.INFRASTRUCTURE_TOOLS.size +
      selectedFacets.ORG_FUNCTIONAL_TYPE.size >
    0;

  const buildFacetParams = () => {
    const extra = {};
    if (selectedFacets.SERVICES.size) extra.SERVICES = Array.from(selectedFacets.SERVICES).join(",");
    if (selectedFacets.CONTENT_TYPES.size) extra.CONTENT_TYPES = Array.from(selectedFacets.CONTENT_TYPES).join(",");
    if (selectedFacets.INFRASTRUCTURE_TOOLS.size)
      extra.INFRASTRUCTURE_TOOLS = Array.from(selectedFacets.INFRASTRUCTURE_TOOLS).join(",");
    if (selectedFacets.ORG_FUNCTIONAL_TYPE.size)
      extra.ORG_FUNCTIONAL_TYPE = Array.from(selectedFacets.ORG_FUNCTIONAL_TYPE).join(",");
    return extra;
  };


  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      setErr("");
      try {
        const url = `${base}/api/locations/countries/${encodeURIComponent(decodedCountry)}/summary?locationScope=${scope}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (!ignore) setData(json);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Failed to load country summary");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (decodedCountry) run();
    return () => {
      ignore = true;
    };
  }, [decodedCountry, scope]);

  const goBack = () => navigate("/participants/organizations/production-locations");

  const sticky = null;

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", padding: 18, paddingBottom: sticky ? 92 : 18 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={goBack}
              style={{
                border: "1px solid rgba(30,42,120,0.18)",
                borderRadius: 999,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.9)",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              ← Back
            </button>

            <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: "-0.02em", color: BRAND.text }}>
              {decodedCountry}
            </div>

            {data?.geonameCountryId ? (
              <Pill title="Geoname Country ID">Geoname ID: {data.geonameCountryId}</Pill>
            ) : null}

            <Pill title="Scope controls whether we match across any production location or only HQ">
              Scope:
              <button
                type="button"
                onClick={() => setScope("all")}
                style={{
                  border: "none",
                  background: scope === "all" ? "rgba(30,42,120,0.92)" : "transparent",
                  color: scope === "all" ? "#fff" : BRAND.ink,
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setScope("hq")}
                style={{
                  border: "none",
                  background: scope === "hq" ? "rgba(30,42,120,0.92)" : "transparent",
                  color: scope === "hq" ? "#fff" : BRAND.ink,
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                HQ
              </button>
            </Pill>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Pill kind="solid" onClick={() => navigate(buildOrgsUrl({ GEONAME_COUNTRY_NAME: decodedCountry, locationScope: scope }))}>
              View participant organizations →
            </Pill>
          </div>
        </div>

        {err ? (
          <div style={{ marginTop: 14, color: "#b00020", fontWeight: 900 }}>{err}</div>
        ) : null}

        {loading && !data ? (
          <div style={{ marginTop: 14, color: "rgba(0,0,0,0.62)", fontWeight: 800 }}>Loading…</div>
        ) : null}

        {data ? (
          <>
            {/* Metrics */}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <Metric label="Total orgs" value={data?.totals?.totalOrgs ?? 0} />
              <Metric label="HQ orgs" value={data?.totals?.hqOrgs ?? 0} />
              <Metric label="Cities" value={data?.totals?.cities ?? 0} />
            </div>

            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 12 }}>
              {/* Cities table */}
              <Card title="Cities" subtitle="City presence and org counts. Click View to open orgs filtered to this city.">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
                        <th style={{ padding: "8px 6px" }}>City</th>
                        <th style={{ padding: "8px 6px" }}>Total</th>
                        <th style={{ padding: "8px 6px" }}>HQ</th>
                        <th style={{ padding: "8px 6px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.cities || []).slice(0, 80).map((c) => (
                        <tr key={c.name} style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                          <td style={{ padding: "10px 6px", fontWeight: 900, color: BRAND.text }}>{c.name}</td>
                          <td style={{ padding: "10px 6px" }}>
                            <Pill>{c.totalOrgs}</Pill>
                          </td>
                          <td style={{ padding: "10px 6px" }}>
                            <Pill>{c.hqOrgs}</Pill>
                          </td>
                          <td style={{ padding: "10px 6px", display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <Pill
                              onClick={() =>
                                navigate(
                                  buildOrgsUrl({
                                    GEONAME_COUNTRY_NAME: decodedCountry,
                                    CITY: c.name,
                                    locationScope: scope,
                                  })
                                )
                              }
                            >
                              View →
                            </Pill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Top facets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Card title="Top Services" subtitle="Click a service to get a quick 'View orgs' action.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(data.topServices || []).map((s) => (
                      <Pill
                        key={s.name}
                        kind={selectedFacets.SERVICES.has(s.name) ? "solid" : "soft"}
                        onClick={() => toggleFacet("SERVICES", s.name)}
                        title="Click for actions"
                      >
                        {s.name}
                        <span style={{ opacity: 0.75 }}>·</span>
                        {s.count}
                      </Pill>
                    ))}
                  </div>
                </Card>

                <Card title="Top Content Types" subtitle="Click a content type to view orgs.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(data.topContentTypes || []).map((s) => (
                      <Pill
                        key={s.name}
                        kind={selectedFacets.CONTENT_TYPES.has(s.name) ? "solid" : "soft"}
                        onClick={() => toggleFacet("CONTENT_TYPES", s.name)}
                        title="Click for actions"
                      >
                        {s.name}
                        <span style={{ opacity: 0.75 }}>·</span>
                        {s.count}
                      </Pill>
                    ))}
                  </div>
                </Card>

                <Card title="Top Infrastructure" subtitle="Click an infrastructure tool to view orgs.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(data.topInfras || []).map((s) => (
                      <Pill
                        key={s.name}
                        kind={selectedFacets.INFRASTRUCTURE_TOOLS.has(s.name) ? "solid" : "soft"}
                        onClick={() => toggleFacet("INFRASTRUCTURE_TOOLS", s.name)}
                        title="Click for actions"
                      >
                        {s.name}
                        <span style={{ opacity: 0.75 }}>·</span>
                        {s.count}
                      </Pill>
                    ))}
                  </div>
                </Card>



                <Card title="Functional Types" subtitle="Click a functional type to view orgs.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(data.topFunctionalTypes || []).map((s) => (
                      <Pill
                        key={s.name}
                        kind={selectedFacets.ORG_FUNCTIONAL_TYPE.has(s.name) ? "solid" : "soft"}
                        onClick={() => toggleFacet("ORG_FUNCTIONAL_TYPE", s.name)}
                        title="Click for actions"
                      >
                        {s.name}
                        <span style={{ opacity: 0.75 }}>·</span>
                        {s.count}
                      </Pill>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Sticky action bar when a facet is selected */}
      {
      hasSelections ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 60,
            padding: 12,
            background: "rgba(247,251,254,0.82)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(30,42,120,0.14)",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Pill kind="solid">{decodedCountry}</Pill>

                {selectedFacets.SERVICES.size ? (
                  <>
                    <span style={{ fontWeight: 950, color: BRAND.text }}>Services:</span>
                    {Array.from(selectedFacets.SERVICES).slice(0, 4).map((v) => (
                      <Pill key={`svc-${v}`}>{v}</Pill>
                    ))}
                    {selectedFacets.SERVICES.size > 4 ? <Pill>{`+${selectedFacets.SERVICES.size - 4}`}</Pill> : null}
                  </>
                ) : null}

                {selectedFacets.CONTENT_TYPES.size ? (
                  <>
                    <span style={{ fontWeight: 950, color: BRAND.text }}>Content Types:</span>
                    {Array.from(selectedFacets.CONTENT_TYPES).slice(0, 4).map((v) => (
                      <Pill key={`ct-${v}`}>{v}</Pill>
                    ))}
                    {selectedFacets.CONTENT_TYPES.size > 4 ? <Pill>{`+${selectedFacets.CONTENT_TYPES.size - 4}`}</Pill> : null}
                  </>
                ) : null}

                {selectedFacets.INFRASTRUCTURE_TOOLS.size ? (
                  <>
                    <span style={{ fontWeight: 950, color: BRAND.text }}>Infra:</span>
                    {Array.from(selectedFacets.INFRASTRUCTURE_TOOLS).slice(0, 4).map((v) => (
                      <Pill key={`inf-${v}`}>{v}</Pill>
                    ))}
                    {selectedFacets.INFRASTRUCTURE_TOOLS.size > 4 ? (
                      <Pill>{`+${selectedFacets.INFRASTRUCTURE_TOOLS.size - 4}`}</Pill>
                    ) : null}
                  </>
                ) : null}

                {selectedFacets.ORG_FUNCTIONAL_TYPE.size ? (
                  <>
                    <span style={{ fontWeight: 950, color: BRAND.text }}>Functional Types:</span>
                    {Array.from(selectedFacets.ORG_FUNCTIONAL_TYPE).slice(0, 4).map((v) => (
                      <Pill key={`ft-${v}`}>{v}</Pill>
                    ))}
                    {selectedFacets.ORG_FUNCTIONAL_TYPE.size > 4 ? (
                      <Pill>{`+${selectedFacets.ORG_FUNCTIONAL_TYPE.size - 4}`}</Pill>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Pill kind="soft" onClick={clearSelections} title="Clear selections">
                  Clear
                </Pill>

                <Pill
                  kind="solid"
                  onClick={() => {
                    const extra = buildFacetParams();
                    navigate(buildOrgsUrl({ GEONAME_COUNTRY_NAME: decodedCountry, ...extra, locationScope: "all" }));
                  }}
                  title="View orgs (All locations)"
                >
                  View orgs (All) →
                </Pill>

                <Pill
                  kind="solid"
                  onClick={() => {
                    const extra = buildFacetParams();
                    navigate(buildOrgsUrl({ GEONAME_COUNTRY_NAME: decodedCountry, ...extra, locationScope: "hq" }));
                  }}
                  title="View orgs (HQ only)"
                >
                  View orgs (HQ) →
                </Pill>
              </div>
            </div>
          </div>
        </div>
      ) : null
    }
    </div>
  );
}
