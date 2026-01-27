// src/pages/ModifyOrganizations.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { searchOrgs, getOrgById, createOrg, patchOrg, deleteOrg } from "../api/adminOrgsApi";

const BRAND = {
  purple: "#1d186d",
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  line: "rgba(30,42,120,0.16)",
};

const base = import.meta.env.VITE_API_BASE || "https://c78ehaqlfg.execute-api.us-east-1.amazonaws.com";

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function getEmailFromIdToken() {
  try {
    const t = window.sessionStorage.getItem("id_token") || "";
    const p = decodeJwtPayload(t);
    return String(p?.email || p?.["cognito:username"] || "").toLowerCase();
  } catch {
    return "";
  }
}

function asList(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean);
  return String(x)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function clampNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

function Card({ title, subtitle, children, right }) {
  return (
    <div
      style={{
        border: `1px solid ${BRAND.line}`,
        borderRadius: 18,
        background: "white",
        boxShadow: "0 18px 45px rgba(17,24,39,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${BRAND.line}`,
          background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,1))",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 3 }}>
          <div style={{ fontWeight: 1000, color: BRAND.ink, fontSize: 14 }}>{title}</div>
          {subtitle ? <div style={{ fontWeight: 800, opacity: 0.75, fontSize: 12 }}>{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontWeight: 1000, fontSize: 12, color: BRAND.ink, marginBottom: 6 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${BRAND.line}`,
        padding: "10px 12px",
        outline: "none",
        fontWeight: 800,
        background: "#FFFFFF",
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select…" }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${BRAND.line}`,
        padding: "10px 12px",
        outline: "none",
        fontWeight: 900,
        background: "#FFFFFF",
      }}
    >
      <option value="">{placeholder}</option>
      {(options || []).map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
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
        border: `1px solid rgba(30,42,120,0.25)`,
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

function BrandButton({ children, onClick, variant = "solid", disabled, title }) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        fontWeight: 1000,
        border: `1px solid ${solid ? "transparent" : "rgba(255,255,255,0.7)"}`,
        background: solid ? BRAND.purple : "transparent",
        color: solid ? "white" : BRAND.purple,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: solid ? "0 12px 26px rgba(29,24,109,0.18)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick, tone = "neutral", disabled }) {
  const tones = {
    neutral: { bg: "rgba(17,24,39,0.03)", bd: BRAND.line, fg: BRAND.ink },
    danger: { bg: "rgba(239,68,68,0.08)", bd: "rgba(239,68,68,0.35)", fg: "#B91C1C" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 10px",
        borderRadius: 12,
        fontWeight: 1000,
        border: `1px solid ${t.bd}`,
        background: t.bg,
        color: t.fg,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function MultiSelect({ value, onChange, options, placeholder = "Search…", maxHeight = 180 }) {
  const [q, setQ] = useState("");
  const picked = useMemo(() => new Set(asList(value)), [value]);
  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase();
    const arr = options || [];
    if (!nq) return arr;
    return arr.filter((x) => String(x).toLowerCase().includes(nq));
  }, [q, options]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Input value={q} onChange={setQ} placeholder={placeholder} />
      <div
        style={{
          border: `1px solid ${BRAND.line}`,
          borderRadius: 14,
          overflow: "hidden",
          background: "white",
        }}
      >
        <div style={{ maxHeight, overflow: "auto" }}>
          {filtered.slice(0, 250).map((opt) => {
            const on = picked.has(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = new Set(picked);
                  if (next.has(opt)) next.delete(opt);
                  else next.add(opt);
                  onChange(Array.from(next));
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: `1px solid ${BRAND.line}`,
                  background: on ? "rgba(207,239,247,0.65)" : "white",
                  color: BRAND.ink,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <span style={{ opacity: on ? 1 : 0.75 }}>{opt}</span>
                {on ? <span style={{ float: "right" }}>✓</span> : null}
              </button>
            );
          })}
          {!filtered.length ? <div style={{ padding: 12, opacity: 0.7, fontWeight: 800 }}>No matches</div> : null}
        </div>
      </div>

      {picked.size ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from(picked).slice(0, 20).map((x) => (
            <Pill key={x}>{x}</Pill>
          ))}
          {picked.size > 20 ? <Pill>+{picked.size - 20}</Pill> : null}
        </div>
      ) : null}
    </div>
  );
}

function buildInitialDraft() {
  return {
    org: {
      ORG_NAME: "",
      ORG_SIZING_CALCULATED: "",
      ADJUSTED_EMPLOYEE_COUNT: "",
      ORG_FUNCTIONAL_TYPE: [],
      SERVICES: [],
      CONTENT_TYPES: [],
      INFRASTRUCTURE_TOOLS: [],
      ORG_IS_ACTIVE: true,
      ORG_IS_ULTIMATE_PARENT: false,
      ORG_ACTIVE_AS_OF_YEAR: "",
      PERSONA_SCORING: "",
    },
    locations: [
      {
        HEADQUARTERS: true,
        CITY: "",
        SALES_REGION: "",
        GEONAME_COUNTRY_NAME: "",
        LATITUDE: "",
        LONGITUDE: "",
      },
    ],
    identifiers: [],
    forceCreate: false,
  };
}

function normalizeOrgPayload(draft) {
  const org = { ...(draft.org || {}) };
  delete org.ORG_ID;

  for (const k of [
    "ORG_FUNCTIONAL_TYPE",
    "SERVICES",
    "CONTENT_TYPES",
    "INFRASTRUCTURE_TOOLS",
    "SALES_REGION",
    "GEONAME_COUNTRY_NAME",
  ]) {
    if (org[k] != null) org[k] = uniq(asList(org[k]));
  }

  if (org.ADJUSTED_EMPLOYEE_COUNT !== "" && org.ADJUSTED_EMPLOYEE_COUNT != null) {
    org.ADJUSTED_EMPLOYEE_COUNT = Math.trunc(Number(org.ADJUSTED_EMPLOYEE_COUNT));
  }
  if (org.ORG_ACTIVE_AS_OF_YEAR !== "" && org.ORG_ACTIVE_AS_OF_YEAR != null) {
    org.ORG_ACTIVE_AS_OF_YEAR = Math.trunc(Number(org.ORG_ACTIVE_AS_OF_YEAR));
  }
  if (org.PERSONA_SCORING !== "" && org.PERSONA_SCORING != null) {
    org.PERSONA_SCORING = Math.trunc(Number(org.PERSONA_SCORING));
  }

  const locations = (draft.locations || []).map((l) => ({
    ...l,
    HEADQUARTERS: !!l.HEADQUARTERS,
    LATITUDE: l.LATITUDE === "" ? "" : Number(l.LATITUDE),
    LONGITUDE: l.LONGITUDE === "" ? "" : Number(l.LONGITUDE),
  }));

  const identifiers = (draft.identifiers || []).map((i) => ({ ...i }));

  return { org, locations, identifiers, forceCreate: !!draft.forceCreate };
}

export default function ModifyOrganizations() {
  const email = useMemo(() => getEmailFromIdToken(), []);
  const isAdmin = email.endsWith("@me-dmz.com");

  const [filtersMeta, setFiltersMeta] = useState(null);

  // search pane
  const [q, setQ] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);

  // editor
  const [mode, setMode] = useState("create"); // "create" | "edit"
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [draft, setDraft] = useState(buildInitialDraft());

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ type: "", msg: "" });

  const debounceRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${base}/api/orgs/filters`, { cache: "no-store" });
        const json = await res.json();
        setFiltersMeta(json || {});
      } catch {
        setFiltersMeta({});
      }
    })();
  }, []);

  useEffect(() => setToast({ type: "", msg: "" }), [mode, selectedOrgId]);

  function showToast(type, msg) {
    setToast({ type, msg });
    window.setTimeout(() => setToast((t) => (t.msg === msg ? { type: "", msg: "" } : t)), 5000);
  }

  async function runSearch(nextQ) {
    const text = String(nextQ || "").trim();
    if (text.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }
    setSearchLoading(true);
    try {
      const out = await searchOrgs({ q: text, page: 1, pageSize: 12 });
      setResults(out?.data || []);
      setTotal(Number(out?.total || 0));
    } catch (e) {
      setResults([]);
      setTotal(0);
      showToast("error", e?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  function onQueryChange(v) {
    setQ(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v), 220);
  }

  async function loadOrgIntoEditor(orgId) {
    setBusy(true);
    try {
      const json = await getOrgById(orgId);

      const org = json || {};
      const locations = Array.isArray(json?.locations) ? json.locations : [];
      const identifiers = Array.isArray(json?.identifiers) ? json.identifiers : [];

      setDraft({
        org: {
          ORG_NAME: org.ORG_NAME || "",
          ORG_SIZING_CALCULATED: org.ORG_SIZING_CALCULATED || "",
          ADJUSTED_EMPLOYEE_COUNT: org.ADJUSTED_EMPLOYEE_COUNT ?? "",
          ORG_FUNCTIONAL_TYPE: asList(org.ORG_FUNCTIONAL_TYPE),
          SERVICES: asList(org.SERVICES),
          CONTENT_TYPES: asList(org.CONTENT_TYPES),
          INFRASTRUCTURE_TOOLS: asList(org.INFRASTRUCTURE_TOOLS),
          ORG_IS_ACTIVE: org.ORG_IS_ACTIVE ?? true,
          ORG_IS_ULTIMATE_PARENT: org.ORG_IS_ULTIMATE_PARENT ?? false,
          ORG_ACTIVE_AS_OF_YEAR: org.ORG_ACTIVE_AS_OF_YEAR ?? "",
          PERSONA_SCORING: org.PERSONA_SCORING ?? "",
        },
        locations:
          locations.length
            ? locations.map((l) => ({
                HEADQUARTERS: !!l.HEADQUARTERS,
                CITY: l.CITY || "",
                SALES_REGION: l.SALES_REGION || "",
                GEONAME_COUNTRY_NAME: l.GEONAME_COUNTRY_NAME || "",
                LATITUDE: l.LATITUDE ?? "",
                LONGITUDE: l.LONGITUDE ?? "",
              }))
            : buildInitialDraft().locations,
        identifiers: identifiers.map((i) => ({
          ORG_DOMAIN: i.ORG_DOMAIN || "",
          ORG_IDENTIFIER_EXTERNAL_URL: i.ORG_IDENTIFIER_EXTERNAL_URL || "",
        })),
        forceCreate: false,
      });

      setMode("edit");
      setSelectedOrgId(orgId);
      showToast("ok", "Loaded org into editor");
    } catch (e) {
      showToast("error", e?.message || "Load failed");
    } finally {
      setBusy(false);
    }
  }

  function setHQ(idx) {
    setDraft((prev) => {
      const locs = prev.locations.map((l, i) => ({ ...l, HEADQUARTERS: i === idx }));
      return { ...prev, locations: locs };
    });
  }

  function validateDraftLocally() {
    const org = draft.org || {};
    const locs = draft.locations || [];

    const errs = [];
    if (!String(org.ORG_NAME || "").trim()) errs.push("ORG_NAME is required.");
    if (!String(org.ORG_SIZING_CALCULATED || "").trim()) errs.push("ORG_SIZING_CALCULATED is required.");
    if (org.ADJUSTED_EMPLOYEE_COUNT === "" || org.ADJUSTED_EMPLOYEE_COUNT == null) errs.push("ADJUSTED_EMPLOYEE_COUNT is required.");

    if (!locs.length) errs.push("At least one location is required.");
    if (locs.length && !locs.some((l) => !!l.HEADQUARTERS)) errs.push("At least one location must be HEADQUARTERS.");

    for (let i = 0; i < locs.length; i++) {
      const l = locs[i];
      if (!String(l.CITY || "").trim()) errs.push(`locations[${i}].CITY is required.`);
      if (!String(l.SALES_REGION || "").trim()) errs.push(`locations[${i}].SALES_REGION is required.`);
      if (!String(l.GEONAME_COUNTRY_NAME || "").trim()) errs.push(`locations[${i}].GEONAME_COUNTRY_NAME is required.`);
      if (l.LATITUDE === "" || l.LATITUDE == null) errs.push(`locations[${i}].LATITUDE is required.`);
      if (l.LONGITUDE === "" || l.LONGITUDE == null) errs.push(`locations[${i}].LONGITUDE is required.`);
    }

    return errs;
  }

  async function onCreate() {
    const errs = validateDraftLocally();
    if (errs.length) return showToast("error", errs[0]);

    setBusy(true);
    try {
      const payload = normalizeOrgPayload(draft);
      const out = await createOrg(payload);
      showToast("ok", `Created: ${out?.orgName || "org"} (${out?.orgId || "?"})`);
      if (out?.orgId) await loadOrgIntoEditor(out.orgId);
      else setMode("create");
    } catch (e) {
      if (e?.status === 409) {
        // If backend returns similarity matches, surface them in the results list
        const m = e?.data?.matches || [];
        if (m?.length) {
          // map into org-ish cards so user can click to edit
          const pseudo = m.map((x) => ({ ORG_ID: x.orgId, ORG_NAME: x.name, _score: x.score }));
          setResults(pseudo);
          setTotal(pseudo.length);
        }
        showToast("error", "Duplicate detected. Select existing org to edit, or enable Force Create and retry.");
      } else {
        showToast("error", e?.message || "Create failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!selectedOrgId) return showToast("error", "No org selected.");
    const errs = validateDraftLocally();
    if (errs.length) return showToast("error", errs[0]);

    setBusy(true);
    try {
      const payload = normalizeOrgPayload(draft);
      const { org, locations, identifiers } = payload;
      await patchOrg(selectedOrgId, { org, locations, identifiers });
      showToast("ok", "Saved changes");
      await loadOrgIntoEditor(selectedOrgId);
    } catch (e) {
      showToast("error", e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!selectedOrgId) return;
    const ok = window.confirm("Hard delete this org? This will also delete its locations + identifiers.");
    if (!ok) return;

    setBusy(true);
    try {
      await deleteOrg(selectedOrgId);
      showToast("ok", "Deleted org");
      setMode("create");
      setSelectedOrgId("");
      setDraft(buildInitialDraft());
      setResults([]);
      setTotal(0);
      setQ("");
    } catch (e) {
      showToast("error", e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const sizingOptions = useMemo(() => filtersMeta?.ORG_SIZING_CALCULATED || [], [filtersMeta]);
  const functionalTypeOptions = useMemo(() => filtersMeta?.ORG_FUNCTIONAL_TYPE || [], [filtersMeta]);
  const servicesOptions = useMemo(() => filtersMeta?.SERVICES || [], [filtersMeta]);
  const contentOptions = useMemo(() => filtersMeta?.CONTENT_TYPES || [], [filtersMeta]);
  const infraOptions = useMemo(() => filtersMeta?.INFRASTRUCTURE_TOOLS || [], [filtersMeta]);
  const salesRegionOptions = useMemo(() => filtersMeta?.SALES_REGION || [], [filtersMeta]);
  const countryOptions = useMemo(() => filtersMeta?.GEONAME_COUNTRY_NAME || [], [filtersMeta]);

  if (!isAdmin) {
    return (
      <div style={{ padding: 28, background: BRAND.bg, minHeight: "calc(100vh - 64px)" }}>
        <Card title="Forbidden" subtitle="This area is only available to @me-dmz.com admins.">
          <div style={{ fontWeight: 900, opacity: 0.8 }}>Signed in as: {email || "unknown"}</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 18, background: BRAND.bg, minHeight: "calc(100vh - 64px)" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 20, fontWeight: 1100, color: BRAND.purple }}>Modify Organizations</div>
          <div style={{ fontWeight: 900, opacity: 0.75 }}>
            Admin-only create/edit/delete. Search uses <code style={{ fontWeight: 900 }}>/api/orgs?q=</code>.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {mode === "edit" && selectedOrgId ? <Pill>Editing: {selectedOrgId}</Pill> : <Pill>Create mode</Pill>}
          {toast?.msg ? <Pill>{toast.type === "error" ? "⚠️" : "✅"} {toast.msg}</Pill> : null}
        </div>
      </div>

      {/* layout */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 14 }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 14 }}>
          <Card
            title="Search & Select"
            subtitle="Type a name — results come from /api/orgs?q=… (ranked server-side)."
            right={<Pill>{searchLoading ? "Searching…" : `${results.length} shown · ${total} total`}</Pill>}
          >
            <FieldLabel>Org name</FieldLabel>
            <Input value={q} onChange={onQueryChange} placeholder="Type at least 2 characters…" />

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SmallButton
                  onClick={() => {
                    setMode("create");
                    setSelectedOrgId("");
                    setDraft(buildInitialDraft());
                  }}
                >
                  New org
                </SmallButton>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 1000, color: BRAND.ink }}>
                <input
                  type="checkbox"
                  checked={!!draft.forceCreate}
                  onChange={(e) => setDraft((p) => ({ ...p, forceCreate: e.target.checked }))}
                />
                Force create
              </label>
            </div>

            <div style={{ marginTop: 12, borderTop: `1px solid ${BRAND.line}`, paddingTop: 12 }}>
              <div style={{ fontWeight: 1000, color: BRAND.ink, marginBottom: 10 }}>Results</div>

              <div style={{ display: "grid", gap: 8 }}>
                {(results || []).slice(0, 12).map((r) => (
                  <button
                    key={r.ORG_ID || r._id || `${r.ORG_NAME}-${Math.random()}`}
                    type="button"
                    onClick={() => r.ORG_ID && loadOrgIntoEditor(r.ORG_ID)}
                    style={{
                      textAlign: "left",
                      borderRadius: 16,
                      border: `1px solid ${BRAND.line}`,
                      padding: 12,
                      background: "white",
                      cursor: r.ORG_ID ? "pointer" : "not-allowed",
                      opacity: r.ORG_ID ? 1 : 0.7,
                    }}
                    title={r.ORG_ID ? "Load into editor" : "Missing ORG_ID"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 1100, color: BRAND.purple }}>{r.ORG_NAME || "—"}</div>
                      {typeof r._score === "number" ? <Pill>{r._score.toFixed(3)}</Pill> : null}
                    </div>
                    <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 900, fontSize: 12 }}>
                      <div>Org ID: {r.ORG_ID || "—"}</div>
                      <div style={{ marginTop: 2 }}>
                        {(r.GEONAME_COUNTRY_NAME ? `Country: ${r.GEONAME_COUNTRY_NAME}` : "")}
                        {r.ORG_SIZING_CALCULATED ? ` · Size: ${r.ORG_SIZING_CALCULATED}` : ""}
                      </div>
                    </div>
                  </button>
                ))}

                {!results?.length ? (
                  <div style={{ opacity: 0.7, fontWeight: 900, padding: 10 }}>
                    No results yet. Type a name above.
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <Card title="Actions" subtitle="Create in create mode; Save/Delete in edit mode.">
            <div style={{ display: "grid", gap: 10 }}>
              <BrandButton
                variant="solid"
                onClick={mode === "edit" ? onSave : onCreate}
                disabled={busy}
                title={mode === "edit" ? "Save changes to selected org" : "Create new org"}
              >
                {busy ? "Working…" : mode === "edit" ? "Save Changes" : "Create Organization"}
              </BrandButton>

              {mode === "edit" ? (
                <SmallButton tone="danger" onClick={onDelete} disabled={busy}>
                  Hard Delete
                </SmallButton>
              ) : null}
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: "grid", gap: 14 }}>
          <Card title="Organization Core" subtitle="Strict validation: name, sizing, and adjusted employee count are required.">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr", gap: 12 }}>
              <div>
                <FieldLabel>ORG_NAME *</FieldLabel>
                <Input
                  value={draft.org.ORG_NAME}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, ORG_NAME: v } }))}
                  placeholder="e.g., Framestore"
                />
              </div>

              <div>
                <FieldLabel>ORG_SIZING_CALCULATED *</FieldLabel>
                <Select
                  value={draft.org.ORG_SIZING_CALCULATED}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, ORG_SIZING_CALCULATED: v } }))}
                  options={sizingOptions}
                />
              </div>

              <div>
                <FieldLabel>ADJUSTED_EMPLOYEE_COUNT *</FieldLabel>
                <Input
                  type="number"
                  value={draft.org.ADJUSTED_EMPLOYEE_COUNT}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, ADJUSTED_EMPLOYEE_COUNT: clampNum(v) } }))}
                  placeholder="e.g., 120"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <FieldLabel>ORG_FUNCTIONAL_TYPE</FieldLabel>
                <MultiSelect
                  value={draft.org.ORG_FUNCTIONAL_TYPE}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, ORG_FUNCTIONAL_TYPE: v } }))}
                  options={functionalTypeOptions}
                />
              </div>

              <div>
                <FieldLabel>PERSONA_SCORING (1–9)</FieldLabel>
                <Input
                  type="number"
                  value={draft.org.PERSONA_SCORING}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, PERSONA_SCORING: clampNum(v) } }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <FieldLabel>ORG_ACTIVE_AS_OF_YEAR</FieldLabel>
                <Input
                  type="number"
                  value={draft.org.ORG_ACTIVE_AS_OF_YEAR}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, ORG_ACTIVE_AS_OF_YEAR: clampNum(v) } }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 1000, color: BRAND.ink }}>
                <input
                  type="checkbox"
                  checked={!!draft.org.ORG_IS_ACTIVE}
                  onChange={(e) => setDraft((p) => ({ ...p, org: { ...p.org, ORG_IS_ACTIVE: e.target.checked } }))}
                />
                Active
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 1000, color: BRAND.ink }}>
                <input
                  type="checkbox"
                  checked={!!draft.org.ORG_IS_ULTIMATE_PARENT}
                  onChange={(e) => setDraft((p) => ({ ...p, org: { ...p.org, ORG_IS_ULTIMATE_PARENT: e.target.checked } }))}
                />
                Ultimate parent
              </label>
            </div>
          </Card>

          <Card title="Tags" subtitle="Use DB-derived options (from /api/orgs/filters) to avoid strict enum rejection.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>SERVICES</FieldLabel>
                <MultiSelect
                  value={draft.org.SERVICES}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, SERVICES: v } }))}
                  options={servicesOptions}
                />
              </div>

              <div>
                <FieldLabel>CONTENT_TYPES</FieldLabel>
                <MultiSelect
                  value={draft.org.CONTENT_TYPES}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, CONTENT_TYPES: v } }))}
                  options={contentOptions}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>INFRASTRUCTURE_TOOLS</FieldLabel>
                <MultiSelect
                  value={draft.org.INFRASTRUCTURE_TOOLS}
                  onChange={(v) => setDraft((p) => ({ ...p, org: { ...p.org, INFRASTRUCTURE_TOOLS: v } }))}
                  options={infraOptions}
                  maxHeight={220}
                />
              </div>
            </div>
          </Card>

          <Card
            title="Locations"
            subtitle="At least one location is required, and at least one must be HEADQUARTERS."
            right={
              <SmallButton
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    locations: [
                      ...(p.locations || []),
                      { HEADQUARTERS: false, CITY: "", SALES_REGION: "", GEONAME_COUNTRY_NAME: "", LATITUDE: "", LONGITUDE: "" },
                    ],
                  }))
                }
              >
                + Add location
              </SmallButton>
            }
          >
            <div style={{ display: "grid", gap: 12 }}>
              {(draft.locations || []).map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${BRAND.line}`,
                    borderRadius: 18,
                    padding: 12,
                    background: "rgba(247,251,254,0.65)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Pill>Location #{idx + 1}</Pill>
                      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 1000, color: BRAND.ink }}>
                        <input type="radio" checked={!!l.HEADQUARTERS} onChange={() => setHQ(idx)} />
                        Headquarters
                      </label>
                    </div>

                    <SmallButton
                      tone="danger"
                      disabled={(draft.locations || []).length <= 1}
                      onClick={() =>
                        setDraft((p) => {
                          const next = (p.locations || []).slice();
                          next.splice(idx, 1);
                          if (next.length && !next.some((x) => x.HEADQUARTERS)) next[0].HEADQUARTERS = true;
                          return { ...p, locations: next };
                        })
                      }
                    >
                      Remove
                    </SmallButton>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div>
                      <FieldLabel>CITY *</FieldLabel>
                      <Input
                        value={l.CITY}
                        onChange={(v) =>
                          setDraft((p) => {
                            const next = p.locations.slice();
                            next[idx] = { ...next[idx], CITY: v };
                            return { ...p, locations: next };
                          })
                        }
                        placeholder="e.g., Vancouver"
                      />
                    </div>

                    <div>
                      <FieldLabel>SALES_REGION *</FieldLabel>
                      <Select
                        value={l.SALES_REGION}
                        onChange={(v) =>
                          setDraft((p) => {
                            const next = p.locations.slice();
                            next[idx] = { ...next[idx], SALES_REGION: v };
                            return { ...p, locations: next };
                          })
                        }
                        options={salesRegionOptions}
                      />
                    </div>

                    <div>
                      <FieldLabel>GEONAME_COUNTRY_NAME *</FieldLabel>
                      <Select
                        value={l.GEONAME_COUNTRY_NAME}
                        onChange={(v) =>
                          setDraft((p) => {
                            const next = p.locations.slice();
                            next[idx] = { ...next[idx], GEONAME_COUNTRY_NAME: v };
                            return { ...p, locations: next };
                          })
                        }
                        options={countryOptions}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <FieldLabel>LATITUDE *</FieldLabel>
                        <Input
                          type="number"
                          value={l.LATITUDE}
                          onChange={(v) =>
                            setDraft((p) => {
                              const next = p.locations.slice();
                              next[idx] = { ...next[idx], LATITUDE: clampNum(v) };
                              return { ...p, locations: next };
                            })
                          }
                          placeholder="45.5017"
                        />
                      </div>
                      <div>
                        <FieldLabel>LONGITUDE *</FieldLabel>
                        <Input
                          type="number"
                          value={l.LONGITUDE}
                          onChange={(v) =>
                            setDraft((p) => {
                              const next = p.locations.slice();
                              next[idx] = { ...next[idx], LONGITUDE: clampNum(v) };
                              return { ...p, locations: next };
                            })
                          }
                          placeholder="-73.5673"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Identifiers"
            subtitle="Optional. Domain must be a domain (no http, no path). External URL must be http(s)."
            right={
              <SmallButton
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    identifiers: [...(p.identifiers || []), { ORG_DOMAIN: "", ORG_IDENTIFIER_EXTERNAL_URL: "" }],
                  }))
                }
              >
                + Add identifier
              </SmallButton>
            }
          >
            <div style={{ display: "grid", gap: 12 }}>
              {(draft.identifiers || []).map((i, idx) => (
                <div
                  key={idx}
                  style={{
                    border: `1px solid ${BRAND.line}`,
                    borderRadius: 18,
                    padding: 12,
                    background: "rgba(247,251,254,0.65)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Pill>Identifier #{idx + 1}</Pill>
                    <SmallButton
                      tone="danger"
                      onClick={() =>
                        setDraft((p) => {
                          const next = (p.identifiers || []).slice();
                          next.splice(idx, 1);
                          return { ...p, identifiers: next };
                        })
                      }
                    >
                      Remove
                    </SmallButton>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12, marginTop: 12 }}>
                    <div>
                      <FieldLabel>ORG_DOMAIN</FieldLabel>
                      <Input
                        value={i.ORG_DOMAIN}
                        onChange={(v) =>
                          setDraft((p) => {
                            const next = (p.identifiers || []).slice();
                            next[idx] = { ...next[idx], ORG_DOMAIN: v };
                            return { ...p, identifiers: next };
                          })
                        }
                        placeholder="example.com"
                      />
                    </div>
                    <div>
                      <FieldLabel>ORG_IDENTIFIER_EXTERNAL_URL</FieldLabel>
                      <Input
                        value={i.ORG_IDENTIFIER_EXTERNAL_URL}
                        onChange={(v) =>
                          setDraft((p) => {
                            const next = (p.identifiers || []).slice();
                            next[idx] = { ...next[idx], ORG_IDENTIFIER_EXTERNAL_URL: v };
                            return { ...p, identifiers: next };
                          })
                        }
                        placeholder="https://www.linkedin.com/company/…"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {!draft.identifiers?.length ? (
                <div style={{ opacity: 0.7, fontWeight: 900 }}>No identifiers yet — add domains or external links if useful.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
