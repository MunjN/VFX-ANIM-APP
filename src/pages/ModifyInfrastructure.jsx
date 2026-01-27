// src/pages/ModifyInfrastructure.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  searchInfra,
  getInfraById,
  getInfraFilters,
  createInfra,
  patchInfra,
  deleteInfra,
} from "../api/adminInfraApi";

const BRAND = {
  purple: "#1d186d",
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  line: "rgba(30,42,120,0.16)",
};

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

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${BRAND.line}`,
        padding: "10px 12px",
        outline: "none",
        fontWeight: 800,
        background: "#FFFFFF",
        resize: "vertical",
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

function SearchableSingleSelect({ value, onChange, options, placeholder = "Search…" }) {
  return (
    <MultiSelect
      value={value ? [value] : []}
      onChange={(arr) => onChange((arr || [])[0] || "")} // keep only first selection
      options={options}
      placeholder={placeholder}
      maxHeight={180}
    />
  );
}


/* ---------------- Draft helpers ---------------- */

function buildInitialDraft() {
  return {
    infra: {
      INFRA_NAME: "",
      INFRA_DESCRIPTION: "",
      INFRA_PARENT_ORGANIZATION: "",
      INFRA_HAS_API: true,
      INFRA_IS_ACTIVE: true,
      INFRA_RELEASE_DATE: "",
      INFRA_LATEST_VERSION: "",
      INFRA_LICENSE: [],
      INFRA_FUNCTIONAL_TYPE: [],
      INFRA_STRUCTURAL_TYPE: [],
      INFRA_YEARLY_CORPORATE_PRICING: [],
      INFRA_RELATED_SERVICES: [],
      INFRA_RELATED_CONTENT_TYPES: [],
    },
    forceCreate: false,
  };
}

function normalizeInfraPayload(draft) {
  const infra = { ...(draft.infra || {}) };

  // NOTE: backend is using ME-NEXUS_INFRA_ID as your canonical id in Mongo
  delete infra._id;

  for (const k of [
    "INFRA_LICENSE",
    "INFRA_FUNCTIONAL_TYPE",
    "INFRA_STRUCTURAL_TYPE",
    "INFRA_YEARLY_CORPORATE_PRICING",
    "INFRA_RELATED_SERVICES",
    "INFRA_RELATED_CONTENT_TYPES",
  ]) {
    if (infra[k] != null) infra[k] = uniq(asList(infra[k]));
  }

  // keep release date + latest version permissive (string is OK)
  if (infra.INFRA_RELEASE_DATE !== "" && infra.INFRA_RELEASE_DATE != null) {
    // allow numeric year, but do not force it
    const n = Number(infra.INFRA_RELEASE_DATE);
    infra.INFRA_RELEASE_DATE = Number.isFinite(n) ? Math.trunc(n) : String(infra.INFRA_RELEASE_DATE);
  }

  infra.INFRA_HAS_API = infra.INFRA_HAS_API === true || String(infra.INFRA_HAS_API) === "true";
  infra.INFRA_IS_ACTIVE = infra.INFRA_IS_ACTIVE === true || String(infra.INFRA_IS_ACTIVE) === "true";

  return { infra, forceCreate: !!draft.forceCreate };
}

function validateDraftLocally(draft) {
  const i = draft.infra || {};
  const errs = [];

  if (!String(i.INFRA_NAME || "").trim()) errs.push("INFRA_NAME is required.");
  if (!String(i.INFRA_DESCRIPTION || "").trim()) errs.push("INFRA_DESCRIPTION is required.");
  if (!String(i.INFRA_PARENT_ORGANIZATION || "").trim()) errs.push("INFRA_PARENT_ORGANIZATION is required.");

  // required except related services/content types (per your spec)
  if (i.INFRA_HAS_API == null) errs.push("INFRA_HAS_API is required.");
  if (i.INFRA_IS_ACTIVE == null) errs.push("INFRA_IS_ACTIVE is required.");
  if (!String(i.INFRA_RELEASE_DATE ?? "").toString().trim()) errs.push("INFRA_RELEASE_DATE is required.");
  if (!String(i.INFRA_LATEST_VERSION ?? "").toString().trim()) errs.push("INFRA_LATEST_VERSION is required.");

  if (!asList(i.INFRA_LICENSE).length) errs.push("INFRA_LICENSE is required.");
  if (!asList(i.INFRA_FUNCTIONAL_TYPE).length) errs.push("INFRA_FUNCTIONAL_TYPE is required.");
  if (!asList(i.INFRA_STRUCTURAL_TYPE).length) errs.push("INFRA_STRUCTURAL_TYPE is required.");
  if (!asList(i.INFRA_YEARLY_CORPORATE_PRICING).length) errs.push("INFRA_YEARLY_CORPORATE_PRICING is required.");

  return errs;
}

/* ---------------- Page ---------------- */

export default function ModifyInfrastructure() {
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
  const [selectedInfraId, setSelectedInfraId] = useState("");
  const [draft, setDraft] = useState(buildInitialDraft());

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ type: "", msg: "" });

  const debounceRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const json = await getInfraFilters();
        setFiltersMeta(json || {});
      } catch {
        setFiltersMeta({});
      }
    })();
  }, []);

  useEffect(() => setToast({ type: "", msg: "" }), [mode, selectedInfraId]);

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
      const out = await searchInfra({ q: text, page: 1, pageSize: 12 });
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

  async function loadInfraIntoEditor(infraId) {
    setBusy(true);
    try {
      const json = await getInfraById(infraId);

      // Important: map fields defensively; Mongo may return arrays/strings inconsistently
      const infra = json || {};

      setDraft({
        infra: {
          INFRA_NAME: infra.INFRA_NAME || "",
          INFRA_DESCRIPTION: infra.INFRA_DESCRIPTION || "",
          INFRA_PARENT_ORGANIZATION: infra.INFRA_PARENT_ORGANIZATION || "",
          INFRA_HAS_API: infra.INFRA_HAS_API ?? true,
          INFRA_IS_ACTIVE: infra.INFRA_IS_ACTIVE ?? true,
          INFRA_RELEASE_DATE: infra.INFRA_RELEASE_DATE ?? "",
          INFRA_LATEST_VERSION: infra.INFRA_LATEST_VERSION ?? "",
          INFRA_LICENSE: asList(infra.INFRA_LICENSE),
          INFRA_FUNCTIONAL_TYPE: asList(infra.INFRA_FUNCTIONAL_TYPE),
          INFRA_STRUCTURAL_TYPE: asList(infra.INFRA_STRUCTURAL_TYPE),
          INFRA_YEARLY_CORPORATE_PRICING: asList(infra.INFRA_YEARLY_CORPORATE_PRICING),
          INFRA_RELATED_SERVICES: asList(infra.INFRA_RELATED_SERVICES),
          INFRA_RELATED_CONTENT_TYPES: asList(infra.INFRA_RELATED_CONTENT_TYPES),
        },
        forceCreate: false,
      });

      setMode("edit");
      setSelectedInfraId(infraId);
      showToast("ok", "Loaded infra into editor");
    } catch (e) {
      showToast("error", e?.message || "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function onCreate() {
    const errs = validateDraftLocally(draft);
    if (errs.length) return showToast("error", errs[0]);

    setBusy(true);
    try {
      const payload = normalizeInfraPayload(draft);
      const out = await createInfra(payload);
      showToast("ok", `Created: ${out?.infraName || "infra"} (${out?.infraId || "?"})`);
      if (out?.infraId) await loadInfraIntoEditor(out.infraId);
      else setMode("create");
    } catch (e) {
      if (e?.status === 409) {
        const m = e?.data?.matches || [];
        if (m?.length) {
          // map into infra-ish cards so user can click to edit
          const pseudo = m.map((x) => ({ "ME-NEXUS_INFRA_ID": x.infraId, INFRA_NAME: x.name, _score: x.score }));
          setResults(pseudo);
          setTotal(pseudo.length);
        }
        showToast("error", "Duplicate detected. Select existing infra to edit, or enable Force Create and retry.");
      } else {
        showToast("error", e?.message || "Create failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!selectedInfraId) return showToast("error", "No infra selected.");
    const errs = validateDraftLocally(draft);
    if (errs.length) return showToast("error", errs[0]);

    setBusy(true);
    try {
      const payload = normalizeInfraPayload(draft);
      await patchInfra(selectedInfraId, { infra: payload.infra });
      showToast("ok", "Saved changes");
      await loadInfraIntoEditor(selectedInfraId);
    } catch (e) {
      showToast("error", e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!selectedInfraId) return;
    const ok = window.confirm("Hard delete this infra? This will also remove it from org INFRASTRUCTURE_TOOLS.");
    if (!ok) return;

    setBusy(true);
    try {
      await deleteInfra(selectedInfraId);
      showToast("ok", "Deleted infra");
      setMode("create");
      setSelectedInfraId("");
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

  const parentOrgOptions = useMemo(() => filtersMeta?.INFRA_PARENT_ORGANIZATION || [], [filtersMeta]);
  const licenseOptions = useMemo(() => filtersMeta?.INFRA_LICENSE || [], [filtersMeta]);
  const functionalTypeOptions = useMemo(() => filtersMeta?.INFRA_FUNCTIONAL_TYPE || [], [filtersMeta]);
  const structuralTypeOptions = useMemo(() => filtersMeta?.INFRA_STRUCTURAL_TYPE || [], [filtersMeta]);
  const pricingOptions = useMemo(() => filtersMeta?.INFRA_YEARLY_CORPORATE_PRICING || [], [filtersMeta]);
  const relatedServicesOptions = useMemo(() => filtersMeta?.INFRA_RELATED_SERVICES || [], [filtersMeta]);
  const relatedContentTypesOptions = useMemo(() => filtersMeta?.INFRA_RELATED_CONTENT_TYPES || [], [filtersMeta]);

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
          <div style={{ fontSize: 20, fontWeight: 1100, color: BRAND.purple }}>Modify Infrastructure</div>
          <div style={{ fontWeight: 900, opacity: 0.75 }}>
            Admin-only create/edit/delete. Search uses <code style={{ fontWeight: 900 }}>/api/infra?q=</code>.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {mode === "edit" && selectedInfraId ? <Pill>Editing: {selectedInfraId}</Pill> : <Pill>Create mode</Pill>}
          {toast?.msg ? <Pill>{toast.type === "error" ? "⚠️" : "✅"} {toast.msg}</Pill> : null}
        </div>
      </div>

      {/* layout */}
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 14 }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 14 }}>
          <Card
            title="Search & Select"
            subtitle=""
            right={<Pill>{searchLoading ? "Searching…" : `${results.length} shown · ${total} total`}</Pill>}
          >
            <FieldLabel>Infrastructure Tool Name</FieldLabel>
            <Input value={q} onChange={onQueryChange} placeholder="Type at least 2 characters…" />

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SmallButton
                  onClick={() => {
                    setMode("create");
                    setSelectedInfraId("");
                    setDraft(buildInitialDraft());
                  }}
                >
                  New Infra ISV
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
                {(results || []).slice(0, 12).map((r) => {
                  const id = r["ME-NEXUS_INFRA_ID"] || r.INFRA_ID || r._id || null;
                  return (
                    <button
                      key={id || `${r.INFRA_NAME}-${Math.random()}`}
                      type="button"
                      onClick={() => id && loadInfraIntoEditor(id)}
                      style={{
                        textAlign: "left",
                        borderRadius: 16,
                        border: `1px solid ${BRAND.line}`,
                        padding: 12,
                        background: "white",
                        cursor: id ? "pointer" : "not-allowed",
                        opacity: id ? 1 : 0.7,
                      }}
                      title={id ? "Load into editor" : "Missing infra id"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontWeight: 1100, color: BRAND.purple }}>{r.INFRA_NAME || "—"}</div>
                        {typeof r._score === "number" ? <Pill>{r._score.toFixed(3)}</Pill> : null}
                      </div>
                      <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 900, fontSize: 12 }}>
                        <div>Infra ID: {id || "—"}</div>
                        <div style={{ marginTop: 2 }}>
                          {(r.INFRA_PARENT_ORGANIZATION ? `Parent: ${r.INFRA_PARENT_ORGANIZATION}` : "")}
                          {r.INFRA_STRUCTURAL_TYPE ? ` · Type: ${asList(r.INFRA_STRUCTURAL_TYPE)[0]}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}

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
                title={mode === "edit" ? "Save changes to selected infra" : "Create new infra"}
              >
                {busy ? "Working…" : mode === "edit" ? "Save Changes" : "Create Infrastructure"}
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
          <Card title="Infrastructure Core" subtitle="">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr", gap: 12 }}>
              <div>
                <FieldLabel>Infrastructure ISV Name *</FieldLabel>
                <Input
                  value={draft.infra.INFRA_NAME}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_NAME: v } }))}
                  placeholder="e.g., Autodesk Maya"
                />
              </div>

              <div>
                <FieldLabel>Infrastructure Release Date *</FieldLabel>
                <Input
                  type="number"
                  value={draft.infra.INFRA_RELEASE_DATE}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_RELEASE_DATE: clampNum(v) } }))}
                  placeholder="e.g., 1998"
                />
              </div>

              <div>
                <FieldLabel>Infrastructure Release Version *</FieldLabel>
                <Input
                  value={draft.infra.INFRA_LATEST_VERSION}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_LATEST_VERSION: v } }))}
                  placeholder="e.g., 2026 / SaaS Tool"
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <FieldLabel>Infrastructure ISV Description *</FieldLabel>
              <TextArea
                value={draft.infra.INFRA_DESCRIPTION}
                onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_DESCRIPTION: v } }))}
                placeholder="One-liner + what it’s used for."
                rows={4}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <FieldLabel>Infrastructure Parent Organization *</FieldLabel>
                <SearchableSingleSelect
                  value={draft.infra.INFRA_PARENT_ORGANIZATION}
                  onChange={(v) =>
                    setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_PARENT_ORGANIZATION: v } }))
                  }
                  options={parentOrgOptions}
                  placeholder="Search Parent Organization…"
                />
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginTop: 22 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 1000, color: BRAND.ink }}>
                  <input
                    type="checkbox"
                    checked={!!draft.infra.INFRA_IS_ACTIVE}
                    onChange={(e) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_IS_ACTIVE: e.target.checked } }))}
                  />
                  Infrastructure Is Active
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 1000, color: BRAND.ink }}>
                  <input
                    type="checkbox"
                    checked={!!draft.infra.INFRA_HAS_API}
                    onChange={(e) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_HAS_API: e.target.checked } }))}
                  />
                  Infrastructure Has API
                </label>
              </div>
            </div>
          </Card>

          <Card title="Infrastructure Attributes" subtitle="">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>Infrastructure License *</FieldLabel>
                <MultiSelect
                  value={draft.infra.INFRA_LICENSE}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_LICENSE: v } }))}
                  options={licenseOptions}
                  maxHeight={220}
                />
              </div>

              <div>
                <FieldLabel>Infrastructure Yearly Corporate Pricing *</FieldLabel>
                <MultiSelect
                  value={draft.infra.INFRA_YEARLY_CORPORATE_PRICING}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_YEARLY_CORPORATE_PRICING: v } }))}
                  options={pricingOptions}
                  maxHeight={220}
                />
              </div>

              <div>
                <FieldLabel>Infrastructure Functional Types *</FieldLabel>
                <MultiSelect
                  value={draft.infra.INFRA_FUNCTIONAL_TYPE}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_FUNCTIONAL_TYPE: v } }))}
                  options={functionalTypeOptions}
                  maxHeight={220}
                />
              </div>

              <div>
                <FieldLabel>Infrastructure Structural Types *</FieldLabel>
                <MultiSelect
                  value={draft.infra.INFRA_STRUCTURAL_TYPE}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_STRUCTURAL_TYPE: v } }))}
                  options={structuralTypeOptions}
                  maxHeight={220}
                />
              </div>
            </div>
          </Card>

          <Card title="Related Services & Content Types">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>Infrastructure Related Services</FieldLabel>
                <MultiSelect
                  value={draft.infra.INFRA_RELATED_SERVICES}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_RELATED_SERVICES: v } }))}
                  options={relatedServicesOptions}
                  maxHeight={220}
                />
              </div>

              <div>
                <FieldLabel>Infrastructure Related Content Types</FieldLabel>
                <MultiSelect
                  value={draft.infra.INFRA_RELATED_CONTENT_TYPES}
                  onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_RELATED_CONTENT_TYPES: v } }))}
                  options={relatedContentTypesOptions}
                  maxHeight={220}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
