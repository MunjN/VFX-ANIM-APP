import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { INSIGHTS_BRAND as BRAND } from "./theme";
import DataTable from "./DataTable";

/**
 * PaginatedOrgTable
 * - Pulls data from the same API as the main Orgs page (/api/orgs)
 * - Uses the same default columns/labels (from OrganizationsSearch.jsx)
 * - Adds search + paging + "View in Main Page"
 *
 * Props:
 * - baseFilters: object -> merged into /api/orgs query string
 * - title: string
 * - subtitle: string
 */
export default function PaginatedOrgTable({ baseFilters = {}, title = "Organizations", subtitle }) {
  const nav = useNavigate();
  const location = useLocation();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [resp, setResp] = useState({ data: [], total: 0 });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((resp.total || 0) / pageSize)), [resp.total, pageSize]);

  const defaultColumns = useMemo(
    () => [
      "ORG_ID",
      "ORG_NAME",
      "GEONAME_COUNTRY_NAME",
      "SALES_REGION",
      "ORG_HQ_CITY",
      "ORG_LOCATION_CITIES",
      "ORG_SIZING_CALCULATED",
      "ADJUSTED_EMPLOYEE_COUNT",
      "ORG_FOUNDED_YEAR",
      "ORG_ACTIVE_AS_OF_YEAR",
      "ORG_IS_ACTIVE",
    ],
    []
  );

  const columnLabels = useMemo(
    () => ({
      ORG_ID: "ME-NEXUS ID",
      ORG_NAME: "Organization Name",
      GEONAME_COUNTRY_NAME: "Organization Country",
      SALES_REGION: "Organization Sales Region",
      ORG_HQ_CITY: "Organization HQ City",
      ORG_LOCATION_CITIES: "Production Cities",
      ORG_SIZING_CALCULATED: "Org Sizing",
      ADJUSTED_EMPLOYEE_COUNT: "Adjusted Employee Count",
      ORG_FOUNDED_YEAR: "Founded Year",
      ORG_ACTIVE_AS_OF_YEAR: "Active as of Year",
      ORG_IS_ACTIVE: "Active?",
    }),
    []
  );

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (q.trim()) params.set("q", q.trim());

    Object.entries(baseFilters || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      params.set(k, String(v));
    });

    fetch(`/api/orgs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setResp(d))
      .catch(() => setResp({ data: [], total: 0 }));
  }, [q, page, pageSize, baseFilters]);

  const columns = useMemo(() => {
    return defaultColumns.map((key) => {
      const label = columnLabels[key] || key;

      const format = (val) => {
        if (Array.isArray(val)) return val.join(", ");
        if (val === null || val === undefined) return "";
        if (typeof val === "boolean") return val ? "Yes" : "No";
        return String(val);
      };

      return {
        key,
        label,
        sortable: true,
        linkTo:
          key === "ORG_NAME"
            ? (row) => `/participants/organizations/${row.ORG_ID || row.id}`
            : null,
        format,
      };
    });
  }, [defaultColumns, columnLabels]);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, resp.total || 0);

  function goMain() {
    const sp = new URLSearchParams(location.search);
    // Map the cohort filters into the main page URL params
    const main = new URLSearchParams();
    if (q.trim()) main.set("q", q.trim());
    main.set("page", "1");
    main.set("pageSize", String(pageSize));
    Object.entries(baseFilters || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      main.set(k, String(v));
    });
    nav(`/participants/organizations?${main.toString()}`);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 950, color: BRAND.ink }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.75 }}>{subtitle}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={goMain}
            style={{
              border: `1px solid ${BRAND.border}`,
              background: "rgba(255,255,255,0.75)",
              padding: "10px 12px",
              borderRadius: 999,
              fontWeight: 950,
              cursor: "pointer",
              color: BRAND.ink,
            }}
            title="Open this cohort in the main Orgs page (with filters applied)"
          >
            View in Main Page →
          </button>
        </div>
      </div>

      {/* Search + page size */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", paddingRight: 6, paddingLeft: 10 }}>
        <div style={{ flex: "1 1 320px" }}>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search organizations…"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              background: "rgba(255,255,255,0.85)",
              fontWeight: 850,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 25 }}>
          <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              padding: "10px 12px",
              minWidth: 90,
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              background: "rgba(255,255,255,0.85)",
              fontWeight: 900,
            }}
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table with sleek scroll */}
      <div style={{ maxHeight: 560, overflow: "auto", borderRadius: 18 }}>
        <DataTable columns={columns} rows={resp.data || []} />
      </div>

      {/* Pagination footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 850, opacity: 0.8 }}>
          Showing <strong>{resp.total ? from : 0}</strong>–<strong>{resp.total ? to : 0}</strong> of{" "}
          <strong>{(resp.total || 0).toLocaleString()}</strong>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 6 }}>
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            style={pagerBtn(page <= 1)}
          >
            ⟪
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={pagerBtn(page <= 1)}
          >
            ←
          </button>

          <div style={{ fontSize: 12, fontWeight: 950, color: BRAND.ink }}>
            Page {page} / {totalPages}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={pagerBtn(page >= totalPages)}
          >
            →
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            style={pagerBtn(page >= totalPages)}
          >
            ⟫
          </button>
        </div>
      </div>
    </div>
  );
}

function pagerBtn(disabled) {
  return {
    border: "1px solid rgba(30,42,120,0.14)",
    background: disabled ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)",
    opacity: disabled ? 0.5 : 1,
    borderRadius: 12,
    padding: "8px 10px",
    fontWeight: 950,
    cursor: disabled ? "not-allowed" : "pointer",
    color: "#1E2A78",
  };
}
