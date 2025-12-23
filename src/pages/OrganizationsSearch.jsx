import { useEffect, useMemo, useRef, useState } from "react";
import { useBookmarkSync } from "../bookmarks/useBookmarkSync";
import { useLocation, useNavigate } from "react-router-dom";
import GoToDropdown from "../components/GoToDropdown";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const base = import.meta.env.VITE_API_BASE;
// fields whose cell values are comma-separated lists
const TOKEN_FIELDS = new Set([
  "SERVICES",
  "INFRASTRUCTURE_TOOLS",
  "CONTENT_TYPES",
  "GEONAME_COUNTRY_NAME",
  // locations-derived token fields
  "ORG_LOCATION_CITIES",
  "ORG_LOCATION_COUNTRIES",
  "ORG_LOCATION_SALES_REGIONS",
]);

// localStorage keys
const LS_COL_ORDER = "me-nexus:orgs:columnOrder:v1";
const LS_COL_VISIBLE = "me-nexus:orgs:columnVisible:v1";

function useDebounced(value, delay = 220) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
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
        fontWeight: 700,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ModalShell({ open, title, onClose, children }) {
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
        background: "rgba(17,24,39,0.35)",
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(1100px, 96vw)",
          height: "min(760px, 92vh)",
          borderRadius: 18,
          border: `1px solid rgba(30,42,120,0.25)`,
          background: "#FFFFFF",
          boxShadow: "0 22px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "72px 1fr",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: "1px solid rgba(30,42,120,0.12)",
            background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.ink, letterSpacing: 0.3 }}>
              ME-NEXUS
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: BRAND.text }}>{title}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid rgba(30,42,120,0.25)`,
              background: "#FFFFFF",
              color: BRAND.ink,
              fontWeight: 900,
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            Close ✕
          </button>
        </div>

        <div style={{ padding: 18, overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function normalizeToken(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function splitTokens(cell) {
  if (!cell) return [];
  return String(cell)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatCellValue(key, raw) {
  if (raw === null || raw === undefined) return "";
  const s = String(raw);
  if (s === "true") return "True";
  if (s === "false") return "False";
  return s;
}

function buildComparableValue(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s === "true") return "True";
  if (s === "false") return "False";
  return s;
}

function tokenPills(val) {
  const toks = splitTokens(val);
  if (toks.length === 0) return <span style={{ opacity: 0.55 }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {toks.map((t) => (
        <span
          key={t}
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: BRAND.ink,
            background: "rgba(207,239,247,0.55)",
            border: `1px solid rgba(30,42,120,0.18)`,
            padding: "6px 10px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function OrganizationsSearch() {
  const navigate = useNavigate();

  const location = useLocation();
  const didHydrateFromUrl = useRef(false);

  useEffect(() => {
    if (didHydrateFromUrl.current) return;
    didHydrateFromUrl.current = true;

    const sp = new URLSearchParams(location.search);

    // basic paging/search
    const qFromUrl = sp.get("q") || "";
    const pFromUrl = Number(sp.get("page") || "1");
    const psFromUrl = Number(sp.get("pageSize") || "25");

    setQuery(qFromUrl);
    setPage(Number.isFinite(pFromUrl) && pFromUrl > 0 ? pFromUrl : 1);
    setPageSize([10, 25, 50, 100].includes(psFromUrl) ? psFromUrl : 25);

    // year range
    setYearMin(sp.get("ORG_ACTIVE_AS_OF_YEAR_MIN") || "");
    setYearMax(sp.get("ORG_ACTIVE_AS_OF_YEAR_MAX") || "");

    // content types match mode (any|all) - keep OUT of `selected`
    const ct = (sp.get("CT_MATCH") || "any").toLowerCase();
    setCtMatch(ct === "all" ? "all" : "any");

    // geo selection (from Production Locations Pro map)
    const locationIdsFromUrl = (sp.get("locationIds") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setGeoLocationIds(locationIdsFromUrl);

    // everything else becomes FIELD -> Set(values)
    const nextSelected = {};
    for (const [key, value] of sp.entries()) {
      if (
        key === "q" ||
        key === "page" ||
        key === "pageSize" ||
        key === "ORG_ACTIVE_AS_OF_YEAR_MIN" ||
        key === "ORG_ACTIVE_AS_OF_YEAR_MAX" ||
        key === "CT_MATCH" ||
        key === "locationIds"
      )
        continue;

      const parts = String(value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      if (parts.length) nextSelected[key] = new Set(parts);
    }
    setSelected(nextSelected);
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // global org-name search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 220);

  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const sugRef = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersMeta, setFiltersMeta] = useState(null); // { FIELD: [values...] }
  const [filterSearch, setFilterSearch] = useState("");
  const [valueSearchByField, setValueSearchByField] = useState({}); // { FIELD: "search" }

  // selected discrete filters: { FIELD: Set(values) }
  const [selected, setSelected] = useState({});

  // year range filter for ORG_ACTIVE_AS_OF_YEAR
  const [yearMin, setYearMin] = useState(""); // string input
  const [yearMax, setYearMax] = useState(""); // string input

  const [ctMatch, setCtMatch] = useState("any"); // any|all for CONTENT_TYPES token matching

  // NEW: Pro-map selection carries stable locationIds (so city=null never breaks).
  const [geoLocationIds, setGeoLocationIds] = useState([]); // array of string ids

  // Column power move
  const [columnsOpen, setColumnsOpen] = useState(false);

  // Compare (inline diff between two orgs)
  const [compareOpen, setCompareOpen] = useState(false);

  // URL bookmarks (Option A) for this page:
  // - Encodes view-state into ?b=...
  // - Restores view-state from ?b=... on load (only when routeKey matches)
  useBookmarkSync({
    routeKey: "organizations",
    getState: () => ({
      query,
      page,
      pageSize,
      selected,
      yearMin,
      yearMax,
      ctMatch,
      geoLocationIds,
    }),
    applyState: (s) => {
      if (typeof s?.query === "string") setQuery(s.query);
      if (Number.isFinite(Number(s?.page))) setPage(Math.max(1, Number(s.page)));
      if (Number.isFinite(Number(s?.pageSize))) setPageSize(Math.max(1, Number(s.pageSize)));
      if (s?.selected && typeof s.selected === "object") setSelected(s.selected);
      if (typeof s?.yearMin === "string") setYearMin(s.yearMin);
      if (typeof s?.yearMax === "string") setYearMax(s.yearMax);
      if (typeof s?.ctMatch === "string") setCtMatch(s.ctMatch);
      if (Array.isArray(s?.geoLocationIds)) setGeoLocationIds(s.geoLocationIds);
    },
    debounceMs: 300,
  });

  const [selectedCompareIds, setSelectedCompareIds] = useState([]); // [orgId1, orgId2]
  const selectedCompare = useMemo(() => {
    const byId = new Map(orgs.map((o) => [String(o?.ORG_ID ?? ""), o]));
    return selectedCompareIds.map((id) => byId.get(id)).filter(Boolean);
  }, [orgs, selectedCompareIds]);

  const selectedCount = useMemo(() => {
    const base = Object.values(selected).reduce((acc, set) => acc + (set?.size || 0), 0);
    const yr = yearMin || yearMax ? 1 : 0;
    const name = query?.trim() ? 1 : 0;
    const geo = geoLocationIds?.length ? 1 : 0;
    return base + yr + name + geo;
  }, [selected, yearMin, yearMax, query, geoLocationIds]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const defaultColumns = useMemo(() => {
    return [
      "ORG_ID",
      "ORG_NAME",
      "GEONAME_COUNTRY_NAME",
      "SALES_REGION",
      "ORG_HQ_CITY",
      "ORG_LOCATION_CITIES",
      "ORG_FUNCTIONAL_TYPE",
      "ORG_SIZING_CALCULATED",
      "ADJUSTED_EMPLOYEE_COUNT",
      "SERVICES",
      "INFRASTRUCTURE_TOOLS",
      "CONTENT_TYPES",
      "PERSONA_SCORING",
      "ORG_ACTIVE_AS_OF_YEAR",
      "ORG_IS_ACTIVE",
      "ORG_LEGAL_FORM",
      "ORG_IS_ULTIMATE_PARENT",
    ];
  }, []);

  const columnLabels = useMemo(
    () => ({
      ORG_ID: "ME-NEXUS ID",
      ORG_NAME: "Organization Name",
      GEONAME_COUNTRY_NAME: "Organization Country",
      SALES_REGION: "Organization Sales Region",
      ORG_HQ_CITY: "Organization HQ City",
      ORG_LOCATION_CITIES: "Production Cities",
      ORG_FUNCTIONAL_TYPE: "Organization Functional Type",
      ORG_SIZING_CALCULATED: "Organization Sizing",
      ADJUSTED_EMPLOYEE_COUNT: "Organization Employee Count",
      SERVICES: "Services",
      INFRASTRUCTURE_TOOLS: "Infrastructure",
      CONTENT_TYPES: "Content Types",
      PERSONA_SCORING: "Persona Scoring",
      ORG_ACTIVE_AS_OF_YEAR: "Active As Of Year",
      ORG_IS_ACTIVE: "Is Active",
      ORG_LEGAL_FORM: "Legal Form",
      ORG_IS_ULTIMATE_PARENT: "Ultimate Parent",
    }),
    []
  );

  // Column state (order + visibility) with localStorage persistence
  const [columnOrder, setColumnOrder] = useState(defaultColumns);
  const [columnVisible, setColumnVisible] = useState(() => {
    // default visible = all
    const obj = {};
    defaultColumns.forEach((c) => (obj[c] = true));
    return obj;
  });

  useEffect(() => {
    // hydrate order
    try {
      const raw = localStorage.getItem(LS_COL_ORDER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // keep only known columns, append missing known columns
          const filtered = parsed.filter((c) => defaultColumns.includes(c));
          const missing = defaultColumns.filter((c) => !filtered.includes(c));
          setColumnOrder([...filtered, ...missing]);
        }
      }
    } catch {
      // ignore
    }

    // hydrate visible
    try {
      const raw = localStorage.getItem(LS_COL_VISIBLE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const next = {};
          defaultColumns.forEach((c) => {
            next[c] = parsed[c] !== undefined ? Boolean(parsed[c]) : true;
          });
          setColumnVisible(next);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_COL_ORDER, JSON.stringify(columnOrder));
    } catch {
      // ignore
    }
  }, [columnOrder]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_COL_VISIBLE, JSON.stringify(columnVisible));
    } catch {
      // ignore
    }
  }, [columnVisible]);

  const displayedColumns = useMemo(() => {
    const order = columnOrder?.length ? columnOrder : defaultColumns;
    return order.filter((c) => columnVisible?.[c] !== false);
  }, [columnOrder, columnVisible, defaultColumns]);

  function buildQueryParams() {
    const params = new URLSearchParams();
    params.set("q", debouncedQuery || "");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("CT_MATCH", ctMatch);

    // geo selection (stable locationIds from map)
    if (Array.isArray(geoLocationIds) && geoLocationIds.length) {
      params.set("locationIds", geoLocationIds.join(","));
    }

    // multi-select filters (comma-separated)
    Object.entries(selected).forEach(([field, set]) => {
      if (!set || set.size === 0) return;
      params.set(field, Array.from(set).join(","));
    });

    // year range
    const minNum = yearMin ? Number(yearMin) : null;
    const maxNum = yearMax ? Number(yearMax) : null;

    if (Number.isFinite(minNum)) params.set("ORG_ACTIVE_AS_OF_YEAR_MIN", String(minNum));
    if (Number.isFinite(maxNum)) params.set("ORG_ACTIVE_AS_OF_YEAR_MAX", String(maxNum));

    return params;
  }

  async function fetchOrgs() {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const res = await fetch(`${base}/api/orgs?${params.toString()}`,{cache: 'no-store'});
      const json = await res.json();
      setOrgs(json.data || []);
      setTotal(json.total || 0);


    } catch (e) {
      console.error(e);
      setOrgs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFiltersMeta() {
    try {
      const res = await fetch(base+"/api/orgs/filters",{cache: 'no-store'});
      const json = await res.json();
      setFiltersMeta(json || {});
    } catch (e) {
      console.error(e);
      setFiltersMeta({});
    }
  }

  // initial
  useEffect(() => {
    fetchFiltersMeta();
  }, []);

  // search + filters + paging
  useEffect(() => {
    fetchOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, page, pageSize, selected, yearMin, yearMax, ctMatch, geoLocationIds]);

  // suggestions
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`${base}/api/orgs?q=${encodeURIComponent(debouncedQuery)}&page=1&pageSize=8`,{cache: 'no-store'});
        const json = await res.json();
        if (cancelled) return;
        const names = (json.data || [])
          .map((o) => o.ORG_NAME)
          .filter(Boolean)
          .slice(0, 8);
        setSuggestions(names);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // click outside suggestions
  useEffect(() => {
    function onDocClick(e) {
      if (!sugRef.current) return;
      if (!sugRef.current.contains(e.target)) setShowSug(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function toggleValue(field, value) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[field] ? Array.from(next[field]) : []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      next[field] = set;
      return next;
    });
    setPage(1);
  }

  function clearAll() {
    setSelected({});
    setValueSearchByField({});
    setFilterSearch("");
    setYearMin("");
    setYearMax("");
    setQuery("");
    setSuggestions([]);
    setGeoLocationIds([]);
    setPage(1);
  }

  function removeChip(field, value) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[field] ? Array.from(next[field]) : []);
      set.delete(value);
      next[field] = set;
      return next;
    });
    setPage(1);
  }

  // modal filter fields: everything except ORG_ID, ORG_NAME (handled separately), ADJUSTED_EMPLOYEE_COUNT (removed),
  // and ORG_ACTIVE_AS_OF_YEAR (handled as range).
  const filterFields = useMemo(() => {
    if (!filtersMeta) return [];
    const raw = Object.keys(filtersMeta).filter((f) => f !== "id");

    const excluded = new Set(["ORG_ID", "ORG_NAME", "ADJUSTED_EMPLOYEE_COUNT", "ORG_ACTIVE_AS_OF_YEAR"]);
    const keep = raw.filter((f) => !excluded.has(f));

    // prefer table order for stable UX
    const ordered = defaultColumns.filter((c) => keep.includes(c));
    const extras = keep.filter((r) => !ordered.includes(r));
    return [...ordered, ...extras];
  }, [filtersMeta, defaultColumns]);

  const filteredFieldsForModal = useMemo(() => {
    const q = normalizeToken(filterSearch);
    if (!q) return filterFields;
    return filterFields.filter(
      (f) => normalizeToken(f).includes(q) || normalizeToken(columnLabels[f] || f).includes(q)
    );
  }, [filterFields, filterSearch, columnLabels]);

  const activeChips = useMemo(() => {
    const chips = [];
    Object.entries(selected).forEach(([field, set]) => {
      if (!set || set.size === 0) return;
      for (const v of set.values()) chips.push({ field, value: v });
    });
    return chips;
  }, [selected]);

  // Applied filters for modal left panel (includes org name + year range)
  const appliedSummary = useMemo(() => {
    const items = [];

    if (query?.trim()) {
      items.push({ kind: "name", label: "Organization Name", value: query.trim() });
    }

    if (yearMin || yearMax) {
      const min = yearMin ? Math.max(1900, Number(yearMin) || 1900) : 1900;
      const max = yearMax ? Number(yearMax) : "";
      items.push({
        kind: "year",
        label: "Active As Of Year",
        value: `${min}${max ? ` → ${max}` : " → …"}`,
      });
    }

    for (const c of activeChips) {
      items.push({
        kind: "chip",
        label: columnLabels[c.field] || c.field,
        field: c.field,
        value: c.value,
      });
    }

    return items;
  }, [activeChips, query, yearMin, yearMax, columnLabels]);

  function moveColumn(colKey, dir) {
    setColumnOrder((prev) => {
      const arr = [...prev];
      const idx = arr.indexOf(colKey);
      if (idx === -1) return prev;
      const nextIdx = dir === "up" ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= arr.length) return prev;
      const tmp = arr[idx];
      arr[idx] = arr[nextIdx];
      arr[nextIdx] = tmp;
      return arr;
    });
  }

  function setAllVisible(nextVisible) {
    const obj = {};
    defaultColumns.forEach((c) => (obj[c] = nextVisible));
    setColumnVisible(obj);
  }

  function resetColumns() {
    setColumnOrder(defaultColumns);
    const obj = {};
    defaultColumns.forEach((c) => (obj[c] = true));
    setColumnVisible(obj);
  }

  function toggleCompare(orgId) {
    const id = String(orgId || "").trim();
    if (!id) return;

    setSelectedCompareIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // keep last + new (nice UX)
      return [...prev, id];
    });
  }

  function clearCompare() {
    setSelectedCompareIds([]);
    setCompareOpen(false);
  }

  const compareKeys = useMemo(() => {
    const a = selectedCompare?.[0] || null;
    const b = selectedCompare?.[1] || null;
    const keys = new Set();

    // start with current column order so it feels consistent
    (columnOrder?.length ? columnOrder : defaultColumns).forEach((k) => keys.add(k));

    // include any other fields present in objects
    if (a) Object.keys(a).forEach((k) => keys.add(k));
    if (b) Object.keys(b).forEach((k) => keys.add(k));

    // never diff these helper fields
    keys.delete("id");
    keys.delete("__rowId");

    return Array.from(keys);
  }, [selectedCompare, columnOrder, defaultColumns]);

  async function downloadDataDictPDF() {
    // expects this file to be publicly served (typically put in /public/data/data_dict.pdf)
    const url = "base+/data/data_dict.pdf";
    const fileName = "ME-NEXUS Documentation.pdf";
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 600);
    } catch (e) {
      console.error(e);
      // fallback: open it (still useful)
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 26px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              border: "none",
              background: BRAND.fill,
              color: BRAND.ink,
              fontWeight: 900,
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
              fontWeight: 900,
              cursor: "pointer",
              padding: "8px 10px",
              borderRadius: 10,
            }}
          >
            Participants
          </button>

          <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>
          <span style={{ fontWeight: 900, opacity: 0.95 }}>Organizations</span>

          <div style={{ marginLeft: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedCount > 0 && <Pill>{selectedCount} filter{selectedCount === 1 ? "" : "s"}</Pill>}
            {geoLocationIds.length > 0 && (
              <Pill>
                Geo selection: {geoLocationIds.length.toLocaleString()} location{geoLocationIds.length === 1 ? "" : "s"}
                <button
                  type="button"
                  onClick={() => {
                    setGeoLocationIds([]);
                    // remove locationIds from URL (keep other params as-is)
                    const sp = new URLSearchParams(location.search);
                    sp.delete("locationIds");
                    navigate(`/participants/organizations?${sp.toString()}`);
                  }}
                  style={{
                    marginLeft: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontWeight: 1000,
                    color: "rgba(30,42,120,0.85)",
                  }}
                  title="Clear geo selection"
                >
                  ✕
                </button>
              </Pill>
            )}
            {total > 0 && <Pill>{total.toLocaleString()} results</Pill>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* "Go to" dropdown (was imported but not rendered) */}
          <GoToDropdown />

          <button
            type="button"
            onClick={downloadDataDictPDF}
            style={{
              border: `1px solid rgba(30,42,120,0.18)`,
              background: "#FFFFFF",
              color: BRAND.ink,
              fontWeight: 1000,
              padding: "10px 12px",
              borderRadius: 12,
              cursor: "pointer",
            }}
            title="Download ME-NEXUS data dictionary PDF"
          >
            Download Docs
          </button>

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

      {/* Controls */}
      <div
        style={{
          padding: "10px 26px 18px",
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div
          ref={sugRef}
          style={{
            position: "relative",
            background: "#FFFFFF",
            border: `1px solid rgba(30,42,120,0.18)`,
            borderRadius: 16,
            boxShadow: "0 18px 60px rgba(30,42,120,0.09)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: BRAND.fill,
                display: "grid",
                placeItems: "center",
                color: BRAND.ink,
                fontWeight: 900,
              }}
            >
              🔎
            </div>

            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              onFocus={() => setShowSug(true)}
              placeholder="Search Participant Organizations by Name"
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: 14,
                fontWeight: 800,
                color: BRAND.text,
              }}
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setPage(1);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "rgba(30,42,120,0.75)",
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Suggestions */}
          {showSug && suggestions.length > 0 && (
            <div
              style={{
                borderTop: "1px solid rgba(30,42,120,0.12)",
                background: "#FFFFFF",
              }}
            >
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setQuery(name);
                    setShowSug(false);
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 800,
                    color: BRAND.text,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(207,239,247,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columns */}
        <button
          type="button"
          onClick={() => setColumnsOpen(true)}
          style={{
            border: `1px solid rgba(30,42,120,0.22)`,
            background: "#FFFFFF",
            color: BRAND.ink,
            fontWeight: 900,
            padding: "12px 14px",
            borderRadius: 16,
            cursor: "pointer",
            boxShadow: "0 18px 60px rgba(30,42,120,0.07)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
          title="Show/hide columns and reorder"
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: BRAND.fill,
              display: "grid",
              placeItems: "center",
            }}
          >
            🧱
          </span>
          Columns
          <span
            style={{
              marginLeft: 2,
              padding: "4px 10px",
              borderRadius: 999,
              background: BRAND.fill,
              border: `1px solid rgba(30,42,120,0.25)`,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {displayedColumns.length}/{defaultColumns.length}
          </span>
        </button>

        {/* Filters */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          style={{
            border: `1px solid rgba(30,42,120,0.22)`,
            background: "#FFFFFF",
            color: BRAND.ink,
            fontWeight: 900,
            padding: "12px 14px",
            borderRadius: 16,
            cursor: "pointer",
            boxShadow: "0 18px 60px rgba(30,42,120,0.07)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: BRAND.fill,
              display: "grid",
              placeItems: "center",
            }}
          >
            ⚙️
          </span>
          Filters
          {selectedCount > 0 && (
            <span
              style={{
                marginLeft: 2,
                padding: "4px 10px",
                borderRadius: 999,
                background: BRAND.fill,
                border: `1px solid rgba(30,42,120,0.25)`,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {selectedCount}
            </span>
          )}
        </button>

        {/* Page size */}
        <div
          style={{
            border: `1px solid rgba(30,42,120,0.18)`,
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "10px 12px",
            boxShadow: "0 18px 60px rgba(30,42,120,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(30,42,120,0.75)" }}>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              border: `1px solid rgba(30,42,120,0.18)`,
              borderRadius: 12,
              padding: "8px 10px",
              fontWeight: 900,
              color: BRAND.ink,
              background: "rgba(207,239,247,0.35)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compare Bar */}
      {selectedCompareIds.length > 0 && (
        <div style={{ padding: "0 26px 14px" }}>
          <div
            style={{
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.16)`,
              background: "#FFFFFF",
              boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Pill>Selected: {selectedCompareIds.length}/2</Pill>
              {selectedCompareIds.map((id) => (
                <span
                  key={id}
                  style={{
                    border: `1px solid rgba(30,42,120,0.22)`,
                    background: "rgba(207,239,247,0.55)",
                    color: BRAND.ink,
                    fontWeight: 900,
                    fontSize: 12,
                    padding: "8px 10px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    maxWidth: 360,
                  }}
                  title={id}
                >
                  <span style={{ opacity: 0.85 }}>ME-NEXUS ID</span>
                  <span style={{ color: BRAND.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {id}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 1000,
                      color: "rgba(30,42,120,0.75)",
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={selectedCompareIds.length !== 2}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: selectedCompareIds.length === 2 ? BRAND.fill : "rgba(243,244,246,0.7)",
                  color: selectedCompareIds.length === 2 ? BRAND.ink : "rgba(30,42,120,0.45)",
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: selectedCompareIds.length === 2 ? "pointer" : "not-allowed",
                }}
              >
                Compare
              </button>

              <button
                type="button"
                onClick={clearCompare}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

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
              padding: "12px 14px",
              borderBottom: "1px solid rgba(30,42,120,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {loading ? <Pill>Loading…</Pill> : <Pill>Systems Operational</Pill>}
              <Pill>Tip: select 2 orgs to compare</Pill>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => fetchOrgs()}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          <div
            style={{
              height: "calc(100vh - 330px)",
              minHeight: 420,
              overflow: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {/* compare checkbox column */}
                  <th
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 3,
                      textAlign: "left",
                      padding: "12px 12px",
                      fontSize: 12,
                      letterSpacing: 0.3,
                      fontWeight: 900,
                      color: BRAND.ink,
                      background: "#FFFFFF",
                      borderBottom: "1px solid rgba(30,42,120,0.14)",
                      whiteSpace: "nowrap",
                      width: 70,
                    }}
                    title="Select up to 2 organizations to compare"
                  >
                    Compare
                  </th>

                  {displayedColumns.map((c) => (
                    <th
                      key={c}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        textAlign: "left",
                        padding: "12px 12px",
                        fontSize: 12,
                        letterSpacing: 0.3,
                        fontWeight: 900,
                        color: BRAND.ink,
                        background: "#FFFFFF",
                        borderBottom: "1px solid rgba(30,42,120,0.14)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {columnLabels[c] || c}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {orgs.map((o, idx) => {
                  const orgId = String(o?.ORG_ID ?? "").trim();
                  const isPicked = selectedCompareIds.includes(orgId);
                  const disabledPick = !isPicked && selectedCompareIds.length >= 2;

                  return (
                    <tr
                      key={`${o.ORG_ID || o.id || idx}`}
                      style={{
                        background: isPicked
                          ? "rgba(207,239,247,0.35)"
                          : idx % 2 === 0
                          ? "rgba(247,251,254,0.7)"
                          : "#FFFFFF",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 12px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          verticalAlign: "top",
                          width: 70,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isPicked}
                          disabled={!orgId || disabledPick}
                          onChange={() => toggleCompare(orgId)}
                          style={{ width: 16, height: 16, cursor: disabledPick ? "not-allowed" : "pointer" }}
                          title={disabledPick ? "Only 2 organizations can be selected at once" : "Select for compare"}
                        />
                      </td>

                      {displayedColumns.map((c) => {
                        const raw = o?.[c] ?? "";
                        const val = formatCellValue(c, raw);

                        const isTokens = TOKEN_FIELDS.has(c);
                        const tokens = isTokens ? splitTokens(val).slice(0, 4) : [];

                        // ✅ CLICKABLE ORG NAME → profile route
                        if (c === "ORG_NAME") {
                          return (
                            <td
                              key={c}
                              style={{
                                padding: "12px 12px",
                                borderBottom: "1px solid rgba(30,42,120,0.08)",
                                verticalAlign: "top",
                                fontSize: 13,
                                fontWeight: 900,
                                color: BRAND.text,
                                whiteSpace: "nowrap",
                                maxWidth: 420,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={String(val)}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/participants/organizations/${encodeURIComponent(orgId)}`)
                                }
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  padding: 0,
                                  margin: 0,
                                  cursor: "pointer",
                                  color: BRAND.ink,
                                  fontWeight: 1000,
                                  textDecoration: "underline",
                                  textUnderlineOffset: 3,
                                }}
                              >
                                {String(val)}
                              </button>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={c}
                            style={{
                              padding: "12px 12px",
                              borderBottom: "1px solid rgba(30,42,120,0.08)",
                              verticalAlign: "top",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "rgba(17,24,39,0.9)",
                              whiteSpace: "normal",
                              maxWidth: isTokens ? 520 : 360,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={String(val)}
                          >
                            {isTokens ? (
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {tokens.map((t) =>
                                  c === "ORG_FUNCTIONAL_TYPE" ? (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => navigate("/participants/organizations/functional-types")}
                                      style={{
                                        border: `1px solid rgba(30,42,120,0.18)`,
                                        background: "rgba(207,239,247,0.55)",
                                        color: BRAND.ink,
                                        fontSize: 12,
                                        fontWeight: 900,
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        whiteSpace: "nowrap",
                                        cursor: "pointer",
                                      }}
                                      title="Open Functional Types reference"
                                    >
                                      {t}
                                    </button>
                                  ) : (
                                    <span
                                      key={t}
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 900,
                                        color: BRAND.ink,
                                        background: "rgba(207,239,247,0.55)",
                                        border: `1px solid rgba(30,42,120,0.18)`,
                                        padding: "6px 10px",
                                        borderRadius: 999,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {t}
                                    </span>
                                  )
                                )}
                                {splitTokens(val).length > 4 && (
                                  <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.7 }}>
                                    +{splitTokens(val).length - 4} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {!loading && orgs.length === 0 && (
                  <tr>
                    <td colSpan={displayedColumns.length + 1} style={{ padding: 22 }}>
                      <div
                        style={{
                          border: `1px dashed rgba(30,42,120,0.25)`,
                          borderRadius: 16,
                          padding: 18,
                          background: "rgba(207,239,247,0.25)",
                          color: BRAND.ink,
                          fontWeight: 900,
                        }}
                      >
                        No results. Try a different name query or relax some filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderTop: "1px solid rgba(30,42,120,0.12)",
              background: "#FFFFFF",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Pill>
                Page {page} / {totalPages}
              </Pill>
              <Pill>Total: {total.toLocaleString()}</Pill>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: page <= 1 ? "rgba(243,244,246,0.7)" : "#FFFFFF",
                  color: page <= 1 ? "rgba(30,42,120,0.45)" : BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ⟪ First
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: page <= 1 ? "rgba(243,244,246,0.7)" : "#FFFFFF",
                  color: page <= 1 ? "rgba(30,42,120,0.45)" : BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Prev
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: page >= totalPages ? "rgba(243,244,246,0.7)" : "#FFFFFF",
                  color: page >= totalPages ? "rgba(30,42,120,0.45)" : BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next →
              </button>

              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: page >= totalPages ? "rgba(243,244,246,0.7)" : "#FFFFFF",
                  color: page >= totalPages ? "rgba(30,42,120,0.45)" : BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Last ⟫
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Columns Modal */}
      <ModalShell open={columnsOpen} title="Columns" onClose={() => setColumnsOpen(false)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div
            style={{
              borderRadius: 16,
              border: `1px solid rgba(30,42,120,0.14)`,
              background: "rgba(247,251,254,0.7)",
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill>Show/Hide</Pill>
              <Pill>Reorder</Pill>
              <Pill>Saved to this browser</Pill>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setAllVisible(true)}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                Show all
              </button>
              <button
                type="button"
                onClick={() => setAllVisible(false)}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                Hide all
              </button>
              <button
                type="button"
                onClick={resetColumns}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: BRAND.fill,
                  color: BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              border: `1px solid rgba(30,42,120,0.14)`,
              background: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid rgba(30,42,120,0.12)",
                background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontWeight: 1000, color: BRAND.ink }}>Customize table columns</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Pill>Visible: {displayedColumns.length}</Pill>
                <Pill>Total: {defaultColumns.length}</Pill>
              </div>
            </div>

            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              {(columnOrder?.length ? columnOrder : defaultColumns).map((c, idx) => {
                const visible = columnVisible?.[c] !== false;
                return (
                  <div
                    key={c}
                    style={{
                      borderRadius: 14,
                      border: `1px solid rgba(30,42,120,0.12)`,
                      background: visible ? "rgba(247,251,254,0.7)" : "rgba(243,244,246,0.6)",
                      padding: 12,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() =>
                          setColumnVisible((prev) => ({
                            ...prev,
                            [c]: !(prev?.[c] !== false),
                          }))
                        }
                        style={{ width: 16, height: 16 }}
                      />
                      <div style={{ display: "grid", gap: 2 }}>
                        <div style={{ fontWeight: 1000, color: BRAND.text, fontSize: 13 }}>
                          {columnLabels[c] || c}
                        </div>
                        <div style={{ fontWeight: 800, opacity: 0.65, fontSize: 12 }}>{c}</div>
                      </div>
                    </label>

                    <div />

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => moveColumn(c, "up")}
                        disabled={idx === 0}
                        style={{
                          border: `1px solid rgba(30,42,120,0.22)`,
                          background: idx === 0 ? "rgba(243,244,246,0.7)" : "#FFFFFF",
                          color: idx === 0 ? "rgba(30,42,120,0.45)" : BRAND.ink,
                          fontWeight: 1000,
                          padding: "8px 10px",
                          borderRadius: 12,
                          cursor: idx === 0 ? "not-allowed" : "pointer",
                        }}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(c, "down")}
                        disabled={idx === (columnOrder?.length ? columnOrder.length : defaultColumns.length) - 1}
                        style={{
                          border: `1px solid rgba(30,42,120,0.22)`,
                          background:
                            idx === (columnOrder?.length ? columnOrder.length : defaultColumns.length) - 1
                              ? "rgba(243,244,246,0.7)"
                              : "#FFFFFF",
                          color:
                            idx === (columnOrder?.length ? columnOrder.length : defaultColumns.length) - 1
                              ? "rgba(30,42,120,0.45)"
                              : BRAND.ink,
                          fontWeight: 1000,
                          padding: "8px 10px",
                          borderRadius: 12,
                          cursor:
                            idx === (columnOrder?.length ? columnOrder.length : defaultColumns.length) - 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Compare Modal */}
      <ModalShell open={compareOpen} title="Compare Organizations" onClose={() => setCompareOpen(false)}>
        <div style={{ display: "grid", gap: 14 }}>
          {selectedCompare.length !== 2 ? (
            <div
              style={{
                borderRadius: 16,
                border: `1px dashed rgba(30,42,120,0.25)`,
                background: "rgba(207,239,247,0.25)",
                padding: 16,
                color: BRAND.ink,
                fontWeight: 1000,
              }}
            >
              Select exactly 2 organizations from the table to compare.
            </div>
          ) : (
            <>
              <div
                style={{
                  borderRadius: 16,
                  border: `1px solid rgba(30,42,120,0.14)`,
                  background: "rgba(247,251,254,0.7)",
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Pill>Inline Diff</Pill>
                  <Pill>Different values highlighted</Pill>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={clearCompare}
                    style={{
                      border: `1px solid rgba(30,42,120,0.22)`,
                      background: "#FFFFFF",
                      color: BRAND.ink,
                      fontWeight: 1000,
                      padding: "10px 12px",
                      borderRadius: 14,
                      cursor: "pointer",
                    }}
                  >
                    Clear selection
                  </button>
                </div>
              </div>

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
                    background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
                    display: "grid",
                    gridTemplateColumns: "320px 1fr 1fr",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 1000, color: BRAND.ink }}>Field</div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 1000, color: BRAND.text, fontSize: 14 }}>
                      {selectedCompare[0]?.ORG_NAME || "Organization A"}
                    </div>
                    <div style={{ fontWeight: 900, opacity: 0.75, fontSize: 12 }}>
                      ME-NEXUS ID: {String(selectedCompare[0]?.ORG_ID ?? "")}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 1000, color: BRAND.text, fontSize: 14 }}>
                      {selectedCompare[1]?.ORG_NAME || "Organization B"}
                    </div>
                    <div style={{ fontWeight: 900, opacity: 0.75, fontSize: 12 }}>
                      ME-NEXUS ID: {String(selectedCompare[1]?.ORG_ID ?? "")}
                    </div>
                  </div>
                </div>

                <div style={{ maxHeight: "60vh", overflow: "auto" }}>
                  {compareKeys.map((k) => {
                    const aRaw = selectedCompare[0]?.[k];
                    const bRaw = selectedCompare[1]?.[k];
                    const aVal = buildComparableValue(aRaw);
                    const bVal = buildComparableValue(bRaw);

                    // ignore fully empty rows
                    if (!aVal && !bVal) return null;

                    const different = aVal !== bVal;

                    const isTokens = TOKEN_FIELDS.has(k);

                    return (
                      <div
                        key={k}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "320px 1fr 1fr",
                          gap: 12,
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          background: different ? "rgba(207,239,247,0.25)" : "#FFFFFF",
                        }}
                      >
                        <div style={{ fontWeight: 1000, color: "rgba(30,42,120,0.85)", fontSize: 13 }}>
                          {columnLabels[k] || k}
                          <div style={{ fontWeight: 900, opacity: 0.55, fontSize: 12, marginTop: 3 }}>{k}</div>
                        </div>

                        <div style={{ fontWeight: 900, color: "rgba(17,24,39,0.92)", fontSize: 13 }}>
                          {isTokens ? tokenPills(aVal) : aVal || <span style={{ opacity: 0.55 }}>—</span>}
                        </div>

                        <div style={{ fontWeight: 900, color: "rgba(17,24,39,0.92)", fontSize: 13 }}>
                          {isTokens ? tokenPills(bVal) : bVal || <span style={{ opacity: 0.55 }}>—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      {/* Filters Modal */}
      <ModalShell open={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
          {/* Left: filter search + applied filters */}
          <div
            style={{
              border: `1px solid rgba(30,42,120,0.14)`,
              borderRadius: 16,
              overflow: "hidden",
              background: "rgba(247,251,254,0.7)",
              display: "grid",
              gridTemplateRows: "auto auto 1fr",
            }}
          >
            <div style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.12)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(30,42,120,0.75)" }}>Find a filter</div>
              <input
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search filters (e.g. country, services, sizing)…"
                style={{
                  marginTop: 8,
                  width: "100%",
                  borderRadius: 14,
                  border: `1px solid rgba(30,42,120,0.18)`,
                  padding: "10px 12px",
                  outline: "none",
                  fontWeight: 800,
                  background: "#FFFFFF",
                }}
              />
            </div>

            <div style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.12)" }}>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  width: "100%",
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                Clear all filters
              </button>

              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                Showing {filteredFieldsForModal.length} filters
              </div>
            </div>

            <div style={{ padding: 12, overflow: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 1000, color: BRAND.ink, marginBottom: 10 }}>
                Applied Filters
              </div>

              {appliedSummary.length === 0 ? (
                <div style={{ fontWeight: 800, opacity: 0.65, fontSize: 13 }}>No filters applied yet.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {appliedSummary.map((it, idx) => {
                    if (it.kind === "chip") {
                      return (
                        <button
                          key={`${it.field}:${it.value}:${idx}`}
                          type="button"
                          onClick={() => removeChip(it.field, it.value)}
                          style={{
                            border: `1px solid rgba(30,42,120,0.22)`,
                            background: "rgba(207,239,247,0.55)",
                            color: BRAND.ink,
                            fontWeight: 900,
                            fontSize: 12,
                            padding: "8px 10px",
                            borderRadius: 999,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            boxShadow: "0 10px 30px rgba(30,42,120,0.06)",
                            maxWidth: 280,
                          }}
                          title="Remove filter"
                        >
                          <span style={{ opacity: 0.85, whiteSpace: "nowrap" }}>{it.label}</span>
                          <span
                            style={{
                              color: BRAND.text,
                              fontWeight: 900,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 140,
                            }}
                          >
                            {it.value}
                          </span>
                          <span style={{ opacity: 0.7 }}>✕</span>
                        </button>
                      );
                    }

                    // name/year items
                    return (
                      <button
                        key={`${it.kind}:${idx}`}
                        type="button"
                        onClick={() => {
                          if (it.kind === "name") {
                            setQuery("");
                            setSuggestions([]);
                          }
                          if (it.kind === "year") {
                            setYearMin("");
                            setYearMax("");
                          }
                          setPage(1);
                        }}
                        style={{
                          border: `1px solid rgba(30,42,120,0.22)`,
                          background: "rgba(207,239,247,0.55)",
                          color: BRAND.ink,
                          fontWeight: 900,
                          fontSize: 12,
                          padding: "8px 10px",
                          borderRadius: 999,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                          boxShadow: "0 10px 30px rgba(30,42,120,0.06)",
                          maxWidth: 280,
                        }}
                        title="Remove filter"
                      >
                        <span style={{ opacity: 0.85, whiteSpace: "nowrap" }}>{it.label}</span>
                        <span
                          style={{
                            color: BRAND.text,
                            fontWeight: 900,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                          }}
                        >
                          {it.value}
                        </span>
                        <span style={{ opacity: 0.7 }}>✕</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: filter panels */}
          <div
            style={{
              border: `1px solid rgba(30,42,120,0.14)`,
              borderRadius: 16,
              background: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid rgba(30,42,120,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Pill>Pick filters</Pill>
                <Pill>Each list is searchable</Pill>
                <Pill>Scroll shows ~7 values</Pill>
              </div>
            </div>

            <div style={{ padding: 14, overflow: "auto", height: "calc(760px - 72px - 40px)" }}>
              {!filtersMeta && (
                <div style={{ padding: 14, fontWeight: 900, color: BRAND.ink }}>Loading filters…</div>
              )}

              {/* ORG_NAME filter (explicit) */}
              <div
                style={{
                  border: `1px solid rgba(30,42,120,0.14)`,
                  borderRadius: 16,
                  padding: 12,
                  marginBottom: 12,
                  background: "rgba(247,251,254,0.6)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 1000, color: BRAND.ink }}>Organization Name</div>
                    <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                      Search Participant Organizations by name
                    </div>
                  </div>
                  {query?.trim() ? <Pill>Active</Pill> : <Pill>Off</Pill>}
                </div>

                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search Participant Organization...."
                  style={{
                    marginTop: 10,
                    width: "100%",
                    borderRadius: 14,
                    border: `1px solid rgba(30,42,120,0.18)`,
                    padding: "10px 12px",
                    outline: "none",
                    fontWeight: 800,
                    background: "#FFFFFF",
                  }}
                />
              </div>

              {/* ORG_ACTIVE_AS_OF_YEAR range */}
              <div
                style={{
                  border: `1px solid rgba(30,42,120,0.14)`,
                  borderRadius: 16,
                  padding: 12,
                  marginBottom: 12,
                  background: "rgba(247,251,254,0.6)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 1000, color: BRAND.ink }}>Active As Of Year</div>
                    <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                      Range filter (min/max). Minimum starts at 1900.
                    </div>
                  </div>
                  {yearMin || yearMax ? <Pill>Active</Pill> : <Pill>Off</Pill>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <input
                    value={yearMin}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setYearMin(v);
                      setPage(1);
                    }}
                    placeholder="Min (1900)"
                    inputMode="numeric"
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      border: `1px solid rgba(30,42,120,0.18)`,
                      padding: "10px 12px",
                      outline: "none",
                      fontWeight: 800,
                      background: "#FFFFFF",
                    }}
                  />
                  <input
                    value={yearMax}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setYearMax(v);
                      setPage(1);
                    }}
                    placeholder="Max (…) "
                    inputMode="numeric"
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      border: `1px solid rgba(30,42,120,0.18)`,
                      padding: "10px 12px",
                      outline: "none",
                      fontWeight: 800,
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              </div>

              {/* Dynamic attribute filters */}
              {filtersMeta &&
                filteredFieldsForModal.map((field) => {
                  const values = filtersMeta[field] || [];
                  const vq = normalizeToken(valueSearchByField[field] || "");
                  const shownValues = vq ? values.filter((v) => normalizeToken(v).includes(vq)) : values;

                  const picked = selected[field] || new Set();

                  return (
                    <div
                      key={field}
                      style={{
                        border: `1px solid rgba(30,42,120,0.14)`,
                        borderRadius: 16,
                        padding: 12,
                        marginBottom: 12,
                        background: "rgba(247,251,254,0.6)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 1000, color: BRAND.ink }}>
                            {columnLabels[field] || field}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                            {TOKEN_FIELDS.has(field) ? "Matches if an org contains the token" : "Exact match"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {picked.size > 0 && <Pill>{picked.size} selected</Pill>}
                          {picked.size > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelected((prev) => ({ ...prev, [field]: new Set() }));
                                setPage(1);
                              }}
                              style={{
                                border: `1px solid rgba(30,42,120,0.22)`,
                                background: "#FFFFFF",
                                color: BRAND.ink,
                                fontWeight: 900,
                                padding: "8px 10px",
                                borderRadius: 12,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <input
                        value={valueSearchByField[field] || ""}
                        onChange={(e) => setValueSearchByField((prev) => ({ ...prev, [field]: e.target.value }))}
                        placeholder={`Search ${columnLabels[field] || field} values…`}
                        style={{
                          marginTop: 10,
                          width: "100%",
                          borderRadius: 14,
                          border: `1px solid rgba(30,42,120,0.18)`,
                          padding: "10px 12px",
                          outline: "none",
                          fontWeight: 800,
                          background: "#FFFFFF",
                        }}
                      />

                      <div
                        style={{
                          marginTop: 10,
                          maxHeight: 7 * 38,
                          overflow: "auto",
                          borderRadius: 14,
                          border: `1px solid rgba(30,42,120,0.12)`,
                          background: "#FFFFFF",
                        }}
                      >
                        {shownValues.length === 0 && (
                          <div style={{ padding: 12, fontWeight: 800, opacity: 0.7 }}>
                            No values match your search.
                          </div>
                        )}

                        {shownValues.slice(0, 800).map((v) => {
                          const checked = picked.has(v);
                          return (
                            <label
                              key={v}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "10px 12px",
                                borderBottom: "1px solid rgba(30,42,120,0.08)",
                                cursor: "pointer",
                                background: checked ? "rgba(207,239,247,0.35)" : "#FFFFFF",
                                fontWeight: 900,
                                color: checked ? BRAND.ink : "rgba(17,24,39,0.9)",
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{formatCellValue(field, v)}</span>
                              <input type="checkbox" checked={checked} onChange={() => toggleValue(field, v)} style={{ width: 16, height: 16 }} />
                            </label>
                          );
                        })}
                      </div>

                      {shownValues.length > 800 && (
                        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, opacity: 0.65 }}>
                          Showing first 800 values (search to narrow).
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

