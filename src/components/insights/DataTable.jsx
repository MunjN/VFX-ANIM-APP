import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { INSIGHTS_BRAND as BRAND } from "./theme";

/**
 * DataTable (premium)
 * - Comma-separated strings and arrays render as tags for configured "tag fields"
 * - Prevents endless long lines / overflow
 */

function splitToTags(val) {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val !== "string") return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function TagList({ items = [], max = 8 }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, max);
  const hidden = items.length - shown.length;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {shown.map((t, i) => (
        <span
          key={`${t}__${i}`}
          title={t}
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            border: `1px solid ${BRAND.border}`,
            background: "rgba(255,255,255,0.78)",
            fontSize: 12,
            fontWeight: 850,
            whiteSpace: "nowrap",
          }}
        >
          {t.length > 34 ? t.slice(0, 33) + "…" : t}
        </span>
      ))}
      {hidden > 0 ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            border: `1px solid ${BRAND.border}`,
            background: "rgba(255,255,255,0.78)",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 950,
            cursor: "pointer",
            color: BRAND.ink,
          }}
          title="Show all"
        >
          +{hidden} more
        </button>
      ) : null}
    </div>
  );
}

export default function DataTable({ columns = [], rows = [] }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const cols = useMemo(() => columns || [], [columns]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(rows) ? [...rows] : [];
    if (!sortKey) return arr;

    const dir = sortDir === "asc" ? 1 : -1;

    return arr.sort((a, b) => {
      const av = a?.[sortKey];
      const bv = b?.[sortKey];

      const na = Number(av);
      const nb = Number(bv);

      if (Number.isFinite(na) && Number.isFinite(nb)) return (na - nb) * dir;

      const sa = String(av ?? "").toLowerCase();
      const sb = String(bv ?? "").toLowerCase();
      return sa.localeCompare(sb) * dir;
    });
  }, [rows, sortKey, sortDir]);

  function clickSort(key, sortable) {
    if (!sortable) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const TAG_FIELDS = new Set([
    "GEONAME_COUNTRY_NAME",
    "SALES_REGION",
    "SALES_REGION_PRIMARY",
    "ORG_LOCATION_CITIES",
    "ORG_LOCATION_COUNTRIES",
    "ORG_LOCATION_STATES",
  ]);

  function renderCell(col, row) {
    const raw = row?.[col.key];
    const val = col.format ? col.format(raw, row) : raw;

    if (col.linkTo) {
      const to = col.linkTo(row);
      return (
        <Link to={to} style={{ fontWeight: 950, color: BRAND.ink, textDecoration: "none" }}>
          {String(val ?? "") || "—"}
        </Link>
      );
    }

    // Always render configured fields as tags (even single value)
    if (TAG_FIELDS.has(col.key)) {
      const tags = splitToTags(val);
      return tags.length ? <TagList items={tags} /> : "—";
    }

    // For other cells: if it's a long comma-list, render as tags too
    if (typeof val === "string" && val.includes(",") && val.length > 40) {
      const tags = splitToTags(val);
      if (tags.length >= 2) return <TagList items={tags} />;
    }

    if (Array.isArray(val)) return <TagList items={val.map(String)} />;
    if (val === null || val === undefined || val === "") return "—";
    return String(val);
  }

  return (
    <div
      style={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 18,
        overflow: "hidden",
        background: "rgba(255,255,255,0.70)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 980 }}>
          <thead>
            <tr>
              {cols.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    onClick={() => clickSort(c.key, c.sortable)}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      textAlign: "left",
                      padding: "12px 14px",
                      fontSize: 12,
                      fontWeight: 950,
                      letterSpacing: "0.02em",
                      color: BRAND.text,
                      background: "rgba(240,245,255,0.95)",
                      borderBottom: "1px solid rgba(30,42,120,0.12)",
                      cursor: c.sortable ? "pointer" : "default",
                      whiteSpace: "nowrap",
                    }}
                    title={c.sortable ? "Sort" : ""}
                  >
                    {c.label}
                    {active ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row?.ORG_ID ?? row?.id ?? i} style={{ background: i % 2 ? "rgba(255,255,255,0.55)" : "transparent" }}>
                {cols.map((c) => (
                  <td
                    key={`${c.key}__${i}`}
                    style={{
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: 850,
                      color: BRAND.text,
                      borderBottom: "1px solid rgba(17,24,39,0.06)",
                      verticalAlign: "top",
                      maxWidth: 560,
                    }}
                  >
                    {renderCell(c, row)}
                  </td>
                ))}
              </tr>
            ))}
            {!sorted.length ? (
              <tr>
                <td colSpan={cols.length} style={{ padding: 18, fontWeight: 900, opacity: 0.75 }}>
                  No rows
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
