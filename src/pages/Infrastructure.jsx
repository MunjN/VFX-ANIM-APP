import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookmarkSync } from "../bookmarks/useBookmarkSync";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
};

const TOKEN_FIELDS = new Set(["INFRA_RELATED_SERVICES", "INFRA_RELATED_CONTENT_TYPES"]);

// Human-friendly labels for filters + table headers
const FIELD_LABELS = {
  INFRA_NAME: "Infrastructure",
  INFRA_IS_ACTIVE: "Active",
  INFRA_DESCRIPTION: "Description",
  INFRA_PARENT_ORGANIZATION: "Parent Organization",
  INFRA_HAS_API: "Has API",
  INFRA_RELEASE_DATE: "Release Date",
  INFRA_LATEST_VERSION: "Latest Version",
  INFRA_LICENSE: "License",
  INFRA_YEARLY_CORPORATE_PRICING: "Yearly Corporate Pricing",
  INFRA_FUNCTIONAL_TYPE: "Functional Type",
  INFRA_STRUCTURAL_TYPE: "Structural Type",
  INFRA_RELATED_SERVICES: "Related Services",
  INFRA_RELATED_CONTENT_TYPES: "Related Content Types",
  ME_NEXUS_INFRA_ID: "Infra ID",
  "ME-NEXUS_INFRA_ID": "Infra ID",
};

// Exclude ID columns in infra table
const EXCLUDED_TABLE_FIELDS = new Set(["ME_NEXUS_INFRA_ID", "ME-NEXUS_INFRA_ID", "Id", "ID", "id"]);

function splitTokens(v) {
  if (v == null) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function qsFromSelection(selected) {
  const params = new URLSearchParams();
  for (const [k, set] of Object.entries(selected || {})) {
    if (!set || set.size === 0) continue;
    params.set(k, Array.from(set).join(","));
  }
  return params;
}

function toPrettyLabel(field) {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return String(field)
    .replace(/^INFRA_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

function Pill({ children, onClick, title, active = false }) {
  return (
    <span
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: active ? "1px solid rgba(30,42,120,0.35)" : "1px solid rgba(30,42,120,0.18)",
        background: active ? "rgba(207,239,247,0.9)" : "rgba(207,239,247,0.55)",
        color: BRAND.text,
        fontWeight: 900,
        fontSize: 12,
        lineHeight: 1,
        cursor: onClick ? "pointer" : "default",
        boxShadow: active ? "0 10px 20px rgba(17,24,39,0.06)" : "none",
        userSelect: "none",
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, disabled, variant = "primary", title }) {
  const primary = variant === "primary";
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: 12,
        padding: "10px 12px",
        border: primary ? "1px solid rgba(30,42,120,0.25)" : "1px solid rgba(0,0,0,0.12)",
        background: primary ? BRAND.fill : "rgba(255,255,255,0.9)",
        color: BRAND.text,
        fontWeight: 900,
        boxShadow: "0 10px 20px rgba(17,24,39,0.06)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(17,24,39,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(1000px, 96vw)",
          maxHeight: "92vh",
          overflow: "hidden",
          borderRadius: 18,
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(0,0,0,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 950, color: BRAND.text }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              cursor: "pointer",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.9)",
              padding: "8px 10px",
              fontWeight: 900,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 14, overflow: "auto", flex: 1, paddingBottom: footer ? 96 : 14 }}>{children}</div>

        {footer ? (
          <div
            style={{
              padding: 14,
              borderTop: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(247,251,254,0.92)",
              position: "sticky",
              bottom: 0,
              zIndex: 2,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function clamp2Style() {
  return {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

export default function Infrastructure() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [selected, setSelected] = useState({});
  const [draftSelected, setDraftSelected] = useState({});

  const [selectedInfra, setSelectedInfra] = useState(new Set());

  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");

  const [filterSearch, setFilterSearch] = useState({}); // field->string

  const [hoverKey, setHoverKey] = useState(null);

  // Deep-linkable bookmarks (Option A): sync infra filters/search/pagination to URL (?b=...)
  const getBookmarkState = () => ({
    q,
    page,
    pageSize,
    selected,
    selectedInfra: Array.from(selectedInfra || []),
    yearMin,
    yearMax,
  });

  const applyBookmarkState = (s) => {
    if (!s || typeof s !== "object") return;

    if (typeof s.q === "string") setQ(s.q);
    if (Number.isFinite(Number(s.page))) setPage(Math.max(1, Number(s.page)));
    if (Number.isFinite(Number(s.pageSize))) setPageSize(Math.max(1, Number(s.pageSize)));

    if (s.selected && typeof s.selected === "object") {
      setSelected(s.selected);
      setDraftSelected(s.selected);
    }

    if (Array.isArray(s.selectedInfra)) {
      setSelectedInfra(new Set(s.selectedInfra.filter((v) => typeof v === "string")));
    }

    if (typeof s.yearMin === "string") setYearMin(s.yearMin);
    if (typeof s.yearMax === "string") setYearMax(s.yearMax);
  };

  useBookmarkSync({
    routeKey: "infrastructure",
    getState: getBookmarkState,
    applyState: applyBookmarkState,
    debounceMs: 300,
  });

  const lastQueryRef = useRef("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/infra/filters");
        const json = await res.json();
        if (!cancelled) setFilterOptions(json || {});
      } catch {
        if (!cancelled) setFilterOptions({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = qsFromSelection(selected);
        if (debouncedQ) params.set("q", debouncedQ);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (yearMin) params.set("INFRA_RELEASE_YEAR_MIN", yearMin);
        if (yearMax) params.set("INFRA_RELEASE_YEAR_MAX", yearMax);

        const key = params.toString();
        lastQueryRef.current = key;

        const res = await fetch(`/api/infra?${key}`);
        const json = await res.json();
        if (cancelled) return;
        if (lastQueryRef.current !== key) return;

        setData(Array.isArray(json?.data) ? json.data : []);
        setTotal(Number(json?.total || 0));
      } catch {
        if (!cancelled) {
          setData([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, debouncedQ, page, pageSize, yearMin, yearMax]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const allVisibleInfraNames = useMemo(() => data.map((r) => r.INFRA_NAME).filter(Boolean), [data]);

  const selectedCount = selectedInfra.size;

  const toggleSelectedInfra = (name) => {
    setSelectedInfra((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedInfra((prev) => {
      const next = new Set(prev);
      const visible = allVisibleInfraNames;
      const allSelected = visible.length > 0 && visible.every((n) => next.has(n));
      if (allSelected) visible.forEach((n) => next.delete(n));
      else visible.forEach((n) => next.add(n));
      return next;
    });
  };

  const openFilters = () => {
    setDraftSelected(() => {
      const copy = {};
      for (const [k, v] of Object.entries(selected)) copy[k] = new Set(Array.from(v || []));
      return copy;
    });
    setFiltersOpen(true);
  };

  const clearAllFilters = () => {
    setSelected({});
    setDraftSelected({});
    setFilterSearch({});
    setYearMin("");
    setYearMax("");
    setPage(1);
  };

  const applyFilters = () => {
    setSelected(draftSelected || {});
    setFiltersOpen(false);
    setPage(1);
  };

  const visibleFilterChips = useMemo(() => {
    const chips = [];
    for (const [field, set] of Object.entries(selected || {})) {
      if (!set || set.size === 0) continue;
      chips.push(`${toPrettyLabel(field)}: ${set.size}`);
    }
    if (yearMin || yearMax) chips.push(`Release year: ${yearMin || "…"}–${yearMax || "…"}`);
    return chips;
  }, [selected, yearMin, yearMax]);

  const goToOrgsWithSelectedInfra = () => {
    const infras = Array.from(selectedInfra);
    if (infras.length === 0) return;
    const params = new URLSearchParams();
    params.set("INFRASTRUCTURE_TOOLS", infras.join(","));
    navigate(`/participants/organizations?${params.toString()}`);
  };

  const goToOrgsWithFilteredInfra = () => {
    const infras = allVisibleInfraNames.slice(0, 100);
    if (infras.length === 0) return;

    const params = new URLSearchParams();
    params.set("INFRASTRUCTURE_TOOLS", infras.join(","));
    navigate(`/participants/organizations?${params.toString()}`);
  };

  // Preferred ordering for readability (still includes everything except excluded fields)
  const PREFERRED_ORDER = [
    "INFRA_NAME",
    "INFRA_PARENT_ORGANIZATION",
    "INFRA_LICENSE",
    "INFRA_YEARLY_CORPORATE_PRICING",
    "INFRA_FUNCTIONAL_TYPE",
    "INFRA_STRUCTURAL_TYPE",
    "INFRA_RELEASE_DATE",
    "INFRA_LATEST_VERSION",
    "INFRA_HAS_API",
    "INFRA_IS_ACTIVE",
    "INFRA_RELATED_SERVICES",
    "INFRA_RELATED_CONTENT_TYPES",
    "INFRA_DESCRIPTION",
  ];

  const columns = useMemo(() => {
    const firstRow = data?.[0];
    const keys = firstRow ? Object.keys(firstRow).filter((k) => !EXCLUDED_TABLE_FIELDS.has(k)) : PREFERRED_ORDER.filter((k) => k !== "ME_NEXUS_INFRA_ID");

    const keySet = new Set(keys);

    // Put preferred first, then remaining alpha
    const preferred = PREFERRED_ORDER.filter((k) => keySet.has(k));
    const rest = keys.filter((k) => !preferred.includes(k)).sort((a, b) => a.localeCompare(b));
    const ordered = [...preferred, ...rest].filter(Boolean);

    return ordered.map((k) => ({ key: k, label: toPrettyLabel(k) }));
  }, [data]);

  const filterFieldsOrdered = useMemo(() => {
    const keys = Object.keys(filterOptions || {});
    const priority = [
      "INFRA_LICENSE",
      "INFRA_FUNCTIONAL_TYPE",
      "INFRA_STRUCTURAL_TYPE",
      "INFRA_HAS_API",
      "INFRA_IS_ACTIVE",
      "INFRA_PARENT_ORGANIZATION",
      "INFRA_YEARLY_CORPORATE_PRICING",
      "INFRA_RELATED_SERVICES",
      "INFRA_RELATED_CONTENT_TYPES",
    ];
    keys.sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return a.localeCompare(b);
    });
    return keys;
  }, [filterOptions]);

  const renderTokenPills = (tokens) => {
    const shown = tokens.slice(0, 3);
    const remaining = Math.max(0, tokens.length - shown.length);
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {shown.map((t) => (
          <Pill key={t} title={t}>
            {t}
          </Pill>
        ))}
        {remaining ? (
          <Pill title={tokens.join(", ")}>
            +{remaining} more
          </Pill>
        ) : null}
      </div>
    );
  };

  const isTruthy = (v) => {
    if (v === true) return true;
    const s = String(v ?? "").trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  };

  const renderCell = (field, value) => {
    if (value == null || value === "") return <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 800 }}>—</span>;

    if (field === "INFRA_HAS_API") {
      const on = isTruthy(value);
      return <Pill active={on}>{on ? "API" : "No API"}</Pill>;
    }

    if (field === "INFRA_IS_ACTIVE") {
      const on = isTruthy(value);
      return <Pill active={on}>{on ? "Active" : "Inactive"}</Pill>;
    }

    if (TOKEN_FIELDS.has(field)) {
      const tokens = splitTokens(value);
      if (tokens.length === 0) return <span style={{ color: "rgba(0,0,0,0.35)", fontWeight: 800 }}>—</span>;
      return renderTokenPills(tokens);
    }

    if (field === "INFRA_DESCRIPTION") {
      return (
        <div style={{ ...clamp2Style(), maxWidth: 460, fontWeight: 750, color: "rgba(0,0,0,0.70)" }} title={String(value)}>
          {String(value)}
        </div>
      );
    }

    return (
      <div style={{ ...clamp2Style(), maxWidth: 420, fontWeight: 800, color: "rgba(0,0,0,0.72)" }} title={String(value)}>
        {String(value)}
      </div>
    );
  };

  // Sticky left offsets
  const CHECKBOX_COL_W = 44;
  const NAME_COL_W = 280;

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", padding: 18 }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        {/* Breadcrumb + top-right brand link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontWeight: 900, color: "rgba(30,42,120,0.85)", fontSize: 13 }}>
            <a href="/" target="_blank" rel="noreferrer" style={{ color: BRAND.ink, fontWeight: 1000, textDecoration: "none" }} title="Open ME-NEXUS">
              ME-NEXUS
            </a>
            <span style={{ opacity: 0.55, fontWeight: 900 }}>→</span>
            <span onClick={() => navigate("/participants")} style={{ color: BRAND.ink, fontWeight: 1000, cursor: "pointer" }} title="Participants">
              PARTICIPANTS
            </span>
            <span style={{ opacity: 0.55, fontWeight: 900 }}>→</span>
            <span style={{ color: "rgba(0,0,0,0.72)", fontWeight: 1100 }}>INFRA</span>
          </div>

          <a
            href="https://me-dmz.com"
            target="_blank"
            rel="noreferrer"
            style={{
              color: BRAND.ink,
              fontWeight: 1100,
              textDecoration: "none",
              border: "1px solid rgba(30,42,120,0.18)",
              padding: "8px 10px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.85)",
              boxShadow: "0 10px 20px rgba(17,24,39,0.06)",
            }}
            title="Open ME-NEXUS"
          >
            ME-NEXUS ↗
          </a>
        </div>

        <div style={{ marginTop: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 1000, color: BRAND.text, fontSize: 26, letterSpacing: -0.2 }}>Infrastructure ISV Tools</div>
            <div style={{ marginTop: 6, color: "rgba(0,0,0,0.62)", fontWeight: 700, fontSize: 13 }}>
              Filter and explore our Infrastructure ISV Tools catalog, then jump to Participant Organizations tagged with selected ISV Tools.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => navigate("/participants")}>
              ← Participants Hub
            </Button>
            <Button variant="secondary" onClick={openFilters}>
              Filters
            </Button>
            <Button variant="secondary" onClick={clearAllFilters} disabled={Object.keys(selected).length === 0 && !yearMin && !yearMax}>
              Clear
            </Button>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search Infrastructure ISV…"
              style={{
                width: 420,
                maxWidth: "90vw",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.14)",
                background: "rgba(255,255,255,0.92)",
                fontWeight: 850,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                value={yearMin}
                onChange={(e) => {
                  setYearMin(e.target.value.replace(/[^\d]/g, ""));
                  setPage(1);
                }}
                inputMode="numeric"
                placeholder="Release year min"
                style={{
                  width: 160,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "rgba(255,255,255,0.92)",
                  fontWeight: 850,
                }}
              />
              <input
                value={yearMax}
                onChange={(e) => {
                  setYearMax(e.target.value.replace(/[^\d]/g, ""));
                  setPage(1);
                }}
                inputMode="numeric"
                placeholder="Release year max"
                style={{
                  width: 160,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "rgba(255,255,255,0.92)",
                  fontWeight: 850,
                }}
              />
            </div>

            {visibleFilterChips.length ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {visibleFilterChips.map((c) => (
                  <Pill key={c}>{c}</Pill>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Pill active={selectedCount > 0}>{selectedCount ? `Selected: ${selectedCount}` : "Selected: 0"}</Pill>
            <Button
              onClick={goToOrgsWithSelectedInfra}
              disabled={selectedCount === 0}
              title={selectedCount === 0 ? "Select at least one infrastructure tool" : "View orgs tagged with selected infrastructure"}
            >
              View orgs (selected)
            </Button>
            <Button variant="secondary" onClick={goToOrgsWithFilteredInfra} disabled={allVisibleInfraNames.length === 0} title="View orgs for the currently visible/filtered infra (capped at 100)">
              View orgs (filtered)
            </Button>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            borderRadius: 20,
            border: "1px solid rgba(30,42,120,0.14)",
            background: "rgba(255,255,255,0.92)",
            overflow: "hidden",
            boxShadow: "0 18px 40px rgba(17,24,39,0.06)",
          }}
        >
          <div style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Pill active>{loading ? "Loading…" : `${total.toLocaleString()} tools`}</Pill>
              <Pill>{`Page ${page} / ${totalPages}`}</Pill>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontWeight: 900, color: "rgba(0,0,0,0.65)", fontSize: 12 }}>Rows</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} title="Previous page">
                Prev
              </Button>
              <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} title="Next page">
                Next
              </Button>
            </div>
          </div>

          <div style={{ overflowX: "auto", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      top: 0,
                      zIndex: 3,
                      width: CHECKBOX_COL_W,
                      background: "rgba(247,251,254,0.98)",
                      textAlign: "left",
                      padding: "12px 12px",
                      borderBottom: "1px solid rgba(0,0,0,0.10)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allVisibleInfraNames.length > 0 && allVisibleInfraNames.every((n) => selectedInfra.has(n))}
                      onChange={toggleSelectAllVisible}
                      aria-label="Select all visible"
                    />
                  </th>

                  {columns.map((c) => {
                    const isName = c.key === "INFRA_NAME";
                    return (
                      <th
                        key={c.key}
                        style={{
                          position: isName ? "sticky" : "sticky",
                          left: isName ? CHECKBOX_COL_W : undefined,
                          top: 0,
                          zIndex: isName ? 2 : 1,
                          minWidth: isName ? NAME_COL_W : 160,
                          background: "rgba(247,251,254,0.98)",
                          textAlign: "left",
                          padding: "12px 12px",
                          borderBottom: "1px solid rgba(0,0,0,0.10)",
                          fontWeight: 950,
                          color: "rgba(0,0,0,0.72)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ padding: 16, color: "rgba(0,0,0,0.62)", fontWeight: 800 }}>
                      {loading ? "Loading infrastructure…" : "No infrastructure found with the current filters."}
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => {
                    const name = row.INFRA_NAME || "";
                    const rowKey = name || String(idx);
                    const isSelected = selectedInfra.has(name);
                    const hovered = hoverKey === rowKey;

                    const baseBg = idx % 2 === 0 ? "rgba(255,255,255,0.92)" : "rgba(247,251,254,0.85)";
                    const bg = hovered ? "rgba(207,239,247,0.35)" : baseBg;

                    return (
                      <tr key={rowKey} onMouseEnter={() => setHoverKey(rowKey)} onMouseLeave={() => setHoverKey(null)} style={{ background: bg }}>
                        <td
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 2,
                            width: CHECKBOX_COL_W,
                            padding: "14px 12px",
                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                            background: bg,
                          }}
                        >
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelectedInfra(name)} aria-label={`Select ${name}`} disabled={!name} />
                        </td>

                        {columns.map((c) => {
                          const isName = c.key === "INFRA_NAME";
                          const v = row[c.key];

                          return (
                            <td
                              key={c.key}
                              style={{
                                position: isName ? "sticky" : "static",
                                left: isName ? CHECKBOX_COL_W : undefined,
                                zIndex: isName ? 1 : 0,
                                minWidth: isName ? NAME_COL_W : 160,
                                padding: "14px 12px",
                                borderBottom: "1px solid rgba(0,0,0,0.06)",
                                background: isName ? bg : undefined,
                                cursor: isName ? "pointer" : "default",
                                color: isName ? BRAND.ink : "inherit",
                                fontWeight: isName ? 1000 : 800,
                                verticalAlign: "top",
                              }}
                              onClick={() => {
                                if (isName && name) navigate(`/participants/organizations/infrastructure/${encodeURIComponent(name)}`);
                              }}
                              title={isName ? "Open infrastructure details" : undefined}
                            >
                              {isName ? (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                  <div style={{ ...clamp2Style(), maxWidth: NAME_COL_W - 40 }}>{name}</div>
                                  <span style={{ opacity: 0.45, fontWeight: 900 }}>↗</span>
                                </div>
                              ) : (
                                renderCell(c.key, v)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          open={filtersOpen}
          title="Infrastructure Filters"
          onClose={() => setFiltersOpen(false)}
          footer={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDraftSelected({});
                    setFilterSearch({});
                  }}
                >
                  Clear modal selections
                </Button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button variant="secondary" onClick={() => setFiltersOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={applyFilters}>Apply filters</Button>
              </div>
            </div>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            {filterFieldsOrdered.map((field) => {
              const values = filterOptions?.[field];
              const list = Array.isArray(values) ? values : [];
              const search = (filterSearch[field] || "").toLowerCase();
              const filteredList = search ? list.filter((v) => String(v).toLowerCase().includes(search)) : list;

              const currentSet = draftSelected[field] || new Set();

              return (
                <div
                  key={field}
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(255,255,255,0.92)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: 12, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <div style={{ fontWeight: 950, color: BRAND.text, marginBottom: 8 }}>{toPrettyLabel(field)}</div>
                    <input
                      value={filterSearch[field] || ""}
                      onChange={(e) => setFilterSearch((p) => ({ ...p, [field]: e.target.value }))}
                      placeholder={`Search ${toPrettyLabel(field)}…`}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.12)",
                        fontWeight: 800,
                      }}
                    />
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.6)" }}>{currentSet.size} selected</span>
                      <button
                        onClick={() => {
                          setDraftSelected((prev) => ({ ...prev, [field]: new Set() }));
                        }}
                        style={{
                          cursor: "pointer",
                          border: "1px solid rgba(0,0,0,0.10)",
                          background: "rgba(247,251,254,0.9)",
                          borderRadius: 12,
                          padding: "6px 10px",
                          fontWeight: 900,
                          fontSize: 12,
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: 260, overflow: "auto", padding: 10 }}>
                    {filteredList.length === 0 ? (
                      <div style={{ padding: 8, color: "rgba(0,0,0,0.55)", fontWeight: 800, fontSize: 12 }}>No values</div>
                    ) : (
                      filteredList.map((v) => {
                        const value = String(v);
                        const checked = currentSet.has(value);
                        return (
                          <label
                            key={value}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 6px",
                              borderRadius: 10,
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setDraftSelected((prev) => {
                                  const next = { ...prev };
                                  const s = new Set(Array.from(next[field] || []));
                                  if (s.has(value)) s.delete(value);
                                  else s.add(value);
                                  next[field] = s;
                                  return next;
                                });
                              }}
                            />
                            <span style={{ fontWeight: 800, color: "rgba(0,0,0,0.72)", fontSize: 13 }}>{value}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(filterOptions || {}).length === 0 ? (
            <div style={{ marginTop: 12, color: "rgba(0,0,0,0.6)", fontWeight: 800 }}>
              Filters are unavailable right now. You can still use the table search and year range inputs.
            </div>
          ) : null}
        </Modal>

        <div style={{ marginTop: 18, color: "rgba(0,0,0,0.55)", fontWeight: 700, fontSize: 12 }}>
          Tip: Click an Infrastructure ISV Tool Name to open its Details Page.
        </div>
      </div>
    </div>
  );
}
