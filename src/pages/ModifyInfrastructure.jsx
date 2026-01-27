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

/* ---------------- UI primitives (same vibe as orgs) ---------------- */

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
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontWeight: 1000, color: BRAND.ink }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>{subtitle}</div>
          )}
        </div>
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontWeight: 1000, fontSize: 12, color: BRAND.ink, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${BRAND.line}`,
        padding: "10px 12px",
        fontWeight: 800,
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${BRAND.line}`,
        padding: "10px 12px",
        fontWeight: 900,
      }}
    >
      <option value="">Select…</option>
      {(options || []).map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function MultiSelect({ value, onChange, options }) {
  const picked = useMemo(() => new Set(asList(value)), [value]);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {(options || []).map((opt) => {
        const on = picked.has(opt);
        return (
          <label key={opt} style={{ display: "flex", gap: 8, fontWeight: 800 }}>
            <input
              type="checkbox"
              checked={on}
              onChange={() => {
                const next = new Set(picked);
                on ? next.delete(opt) : next.add(opt);
                onChange(Array.from(next));
              }}
            />
            {opt}
          </label>
        );
      })}
    </div>
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

function validateDraft(draft) {
  const i = draft.infra;
  if (!i.INFRA_NAME) return "INFRA_NAME is required";
  if (!i.INFRA_DESCRIPTION) return "INFRA_DESCRIPTION is required";
  if (!i.INFRA_PARENT_ORGANIZATION) return "INFRA_PARENT_ORGANIZATION is required";
  if (!i.INFRA_LATEST_VERSION) return "INFRA_LATEST_VERSION is required";
  if (!i.INFRA_RELEASE_DATE) return "INFRA_RELEASE_DATE is required";
  if (!i.INFRA_LICENSE?.length) return "INFRA_LICENSE is required";
  if (!i.INFRA_FUNCTIONAL_TYPE?.length) return "INFRA_FUNCTIONAL_TYPE is required";
  if (!i.INFRA_STRUCTURAL_TYPE?.length) return "INFRA_STRUCTURAL_TYPE is required";
  if (!i.INFRA_YEARLY_CORPORATE_PRICING?.length)
    return "INFRA_YEARLY_CORPORATE_PRICING is required";
  return null;
}

/* ---------------- Page ---------------- */

export default function ModifyInfrastructure() {
  const email = useMemo(() => getEmailFromIdToken(), []);
  const isAdmin = email.endsWith("@me-dmz.com");

  const [filters, setFilters] = useState({});
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState("create");
  const [infraId, setInfraId] = useState(null);
  const [draft, setDraft] = useState(buildInitialDraft());
  const debounce = useRef(null);

  useEffect(() => {
    getInfraFilters().then((r) => setFilters(r || {}));
  }, []);

  async function runSearch(v) {
    if (!v || v.length < 2) return setResults([]);
    const out = await searchInfra({ q: v, pageSize: 10 });
    setResults(out?.data || []);
  }

  function onQueryChange(v) {
    setQ(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(v), 250);
  }

  async function loadInfra(id) {
    const json = await getInfraById(id);
    setDraft({ infra: json, forceCreate: false });
    setInfraId(id);
    setMode("edit");
  }

  async function onSave() {
    const err = validateDraft(draft);
    if (err) return alert(err);

    if (mode === "create") {
      const out = await createInfra(draft);
      loadInfra(out.infraId);
    } else {
      await patchInfra(infraId, { infra: draft.infra });
      alert("Saved");
    }
  }

  async function onDelete() {
    if (!infraId) return;
    if (!window.confirm("Delete infra permanently?")) return;
    await deleteInfra(infraId);
    setDraft(buildInitialDraft());
    setInfraId(null);
    setMode("create");
  }

  if (!isAdmin) {
    return <div style={{ padding: 30 }}>Forbidden</div>;
  }

  return (
    <div style={{ padding: 18, background: BRAND.bg }}>
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
        {/* LEFT */}
        <Card title="Search Infrastructure">
          <Input value={q} onChange={onQueryChange} placeholder="Search infra…" />
          <div style={{ marginTop: 12 }}>
            {results.map((r) => (
              <div
                key={r["ME-NEXUS_INFRA_ID"]}
                style={{ cursor: "pointer", padding: 8 }}
                onClick={() => loadInfra(r["ME-NEXUS_INFRA_ID"])}
              >
                <b>{r.INFRA_NAME}</b>
                <div style={{ fontSize: 12 }}>{r.INFRA_PARENT_ORGANIZATION}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT */}
        <Card
          title={mode === "edit" ? "Edit Infrastructure" : "Create Infrastructure"}
          right={
            mode === "edit" ? (
              <button onClick={onDelete} style={{ color: "red", fontWeight: 900 }}>
                Delete
              </button>
            ) : null
          }
        >
          <FieldLabel>Name</FieldLabel>
          <Input
            value={draft.infra.INFRA_NAME}
            onChange={(v) => setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_NAME: v } }))}
          />

          <FieldLabel>Description</FieldLabel>
          <Input
            value={draft.infra.INFRA_DESCRIPTION}
            onChange={(v) =>
              setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_DESCRIPTION: v } }))
            }
          />

          <FieldLabel>Parent Organization</FieldLabel>
          <Select
            value={draft.infra.INFRA_PARENT_ORGANIZATION}
            options={filters.INFRA_PARENT_ORGANIZATION}
            onChange={(v) =>
              setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_PARENT_ORGANIZATION: v } }))
            }
          />

          <FieldLabel>License</FieldLabel>
          <MultiSelect
            value={draft.infra.INFRA_LICENSE}
            options={filters.INFRA_LICENSE}
            onChange={(v) =>
              setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_LICENSE: v } }))
            }
          />

          <FieldLabel>Functional Type</FieldLabel>
          <MultiSelect
            value={draft.infra.INFRA_FUNCTIONAL_TYPE}
            options={filters.INFRA_FUNCTIONAL_TYPE}
            onChange={(v) =>
              setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_FUNCTIONAL_TYPE: v } }))
            }
          />

          <FieldLabel>Structural Type</FieldLabel>
          <MultiSelect
            value={draft.infra.INFRA_STRUCTURAL_TYPE}
            options={filters.INFRA_STRUCTURAL_TYPE}
            onChange={(v) =>
              setDraft((p) => ({ ...p, infra: { ...p.infra, INFRA_STRUCTURAL_TYPE: v } }))
            }
          />

          <div style={{ marginTop: 16 }}>
            <button onClick={onSave} style={{ fontWeight: 900 }}>
              {mode === "edit" ? "Save Changes" : "Create Infra"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
