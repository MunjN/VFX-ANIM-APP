// src/components/LocationFilters.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  useVisualizeFilters,
  toggleFilterValue,
  setVisualizeFilters,
  buildMainOrgsUrlFromFilters,
  closeViewItemModal,
} from "../state/visualizeFiltersStore";

import { getLocationPoints } from "../services/locationsApi";
import { useViewFilterOptions } from "../hooks/useViewData";

const BRAND = {
  primaryLightBlue: "#CEECF2",
  primaryDarkBlue: "#232073",
  secondaryGreen: "#3AA608",
  secondaryOrange: "#D97218",
  secondaryYellow: "#F2C53D",
  grey: "#747474",
  lightGrey: "#D9D9D9",
  card: "#FFFFFF",
  border: "#E5E7EB",
  danger: "#b91c1c",
};

const SALES_REGION_ORDER = ["NA", "EMEA", "APAC", "LATAM", "Unknown"];

function isUnknownish(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return !v || v === "unknown" || v === "n/a" || v === "na" || v === "-";
}

/**
 * From "North America (NA)" -> "NA"
 * From "Europe - Middle East - Africa (EMEA)" -> "EMEA"
 */
function codeFromSalesRegionLabel(label) {
  const s = String(label ?? "").trim();
  if (!s) return "Unknown";
  const m = s.match(/\((NA|EMEA|APAC|LATAM)\)/i);
  if (m?.[1]) return m[1].toUpperCase();

  const u = s.toUpperCase();
  if (u.includes("NORTH AMERICA")) return "NA";
  if (u.includes("EUROPE") || u.includes("MIDDLE EAST") || u.includes("AFRICA")) return "EMEA";
  if (u.includes("ASIA") || u.includes("PACIFIC")) return "APAC";
  if (u.includes("LATIN")) return "LATAM";

  return "Unknown";
}

function dotColorForCode(code) {
  const k = String(code ?? "").toUpperCase();
  if (k === "NA") return BRAND.secondaryGreen;
  if (k === "EMEA") return BRAND.primaryDarkBlue;
  if (k === "APAC") return BRAND.secondaryOrange;
  if (k === "LATAM") return BRAND.secondaryYellow;
  return BRAND.lightGrey;
}

/**
 * Lightweight searchable single-select.
 * - No libs
 * - Fast (filters in-memory options)
 * - Doesn’t break if options are huge (caps display list)
 */
function SearchSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  allowAll = true,
  allLabel = "All",
  maxShown = 120,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedLabel = value || (allowAll ? allLabel : "");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = options || [];
    if (query) list = list.filter((x) => String(x).toLowerCase().includes(query));
    return list.slice(0, maxShown);
  }, [options, q, maxShown]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef}>
      <div style={{ fontSize: 13, fontWeight: 900, color: BRAND.primaryDarkBlue, marginBottom: 8 }}>
        {label}
      </div>

      <div
        style={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 12,
          overflow: "hidden",
          background: "white",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          style={{
            width: "100%",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            cursor: "pointer",
            background: "white",
            border: "none",
            fontWeight: 800,
            color: "#111827",
          }}
          title={selectedLabel}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {selectedLabel}
          </span>
          <span style={{ color: BRAND.grey, fontWeight: 900 }}>{open ? "▴" : "▾"}</span>
        </button>

        {open ? (
          <div style={{ borderTop: `1px solid ${BRAND.border}` }}>
            <div style={{ padding: 10, borderBottom: `1px solid ${BRAND.border}` }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  borderRadius: 10,
                  border: `1px solid ${BRAND.border}`,
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  outline: "none",
                }}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: BRAND.grey, fontWeight: 700 }}>
                Type to search • click to select
              </div>
            </div>

            <div style={{ maxHeight: 280, overflow: "auto" }}>
              {allowAll ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                    setQ("");
                  }}
                  onKeyDown={() => {}}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontWeight: 900,
                    color: BRAND.primaryDarkBlue,
                    borderBottom: `1px solid ${BRAND.border}`,
                    background: value ? "white" : BRAND.primaryLightBlue,
                  }}
                >
                  {allLabel}
                </div>
              ) : null}

              {filtered.length ? (
                filtered.map((opt) => {
                  const isSelected = String(opt) === String(value || "");
                  return (
                    <div
                      key={String(opt)}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onChange(opt);
                        setOpen(false);
                        setQ("");
                      }}
                      onKeyDown={() => {}}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        fontWeight: 800,
                        color: "#111827",
                        background: isSelected ? BRAND.primaryLightBlue : "white",
                        borderBottom: `1px solid ${BRAND.border}`,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={String(opt)}
                    >
                      {String(opt)}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "12px", color: BRAND.grey, fontSize: 12, fontWeight: 800 }}>
                  No matches.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: BRAND.card,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: `1px solid ${BRAND.border}`,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: BRAND.primaryDarkBlue,
    letterSpacing: 0.2,
  },
  pill: {
    fontSize: 11,
    fontWeight: 900,
    padding: "4px 10px",
    borderRadius: 999,
    background: BRAND.primaryDarkBlue,
    color: "white",
  },
  kpiBig: {
    fontSize: 40,
    fontWeight: 900,
    color: BRAND.primaryDarkBlue,
    lineHeight: 1.05,
  },
  kpiLabel: {
    fontSize: 12,
    color: BRAND.grey,
    marginTop: 4,
    fontWeight: 700,
  },
  kpiRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 10,
  },
  kpiSub: {
    fontSize: 14,
    fontWeight: 900,
    color: BRAND.secondaryGreen,
  },
  kpiSubMuted: {
    fontSize: 12,
    fontWeight: 800,
    color: BRAND.grey,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    border: `2px solid ${BRAND.primaryDarkBlue}`,
    color: BRAND.primaryDarkBlue,
    background: BRAND.card,
    padding: "12px 14px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    userSelect: "none",
    transition: "background 120ms ease",
  },
  linkButton: {
    display: "inline-flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    border: `2px solid ${BRAND.primaryDarkBlue}`,
    color: BRAND.primaryDarkBlue,
    background: BRAND.card,
    padding: "11px 14px",
    fontWeight: 900,
    fontSize: 13,
    textDecoration: "none",
    cursor: "pointer",
    transition: "background 120ms ease",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 2px",
  },
  leftRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: "pointer",
    accentColor: BRAND.primaryDarkBlue,
  },
  error: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 900,
    color: BRAND.danger,
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: 800,
    color: BRAND.grey,
  },
  mapboxInfo: {
    borderRadius: 12,
    border: `1px solid ${BRAND.primaryDarkBlue}`,
    background: BRAND.primaryLightBlue,
    padding: 12,
  },
  mapboxTitle: {
    fontSize: 11,
    fontWeight: 900,
    color: BRAND.primaryDarkBlue,
    marginBottom: 4,
  },
  mapboxText: {
    fontSize: 11,
    fontWeight: 800,
    color: BRAND.primaryDarkBlue,
    opacity: 0.95,
  },
};

export default function LocationsFilters({ viewMode = "orgs" }) {
  const filters = useVisualizeFilters();
  const isOrgsView = viewMode === "orgs";
  const isCloudView = viewMode === "cloud";

  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Cloud: fetch provider options (cached, SWR)
  const { options: viewOptions, loading: viewOptionsLoading, error: viewOptionsError } =
    useViewFilterOptions(viewMode, filters);

  const cloudProviders = useMemo(() => {
    if (!isCloudView) return [];
    const arr = viewOptions?.cloudProviders;
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }, [isCloudView, viewOptions]);

  // Sales Region + Country are global across ALL views.
  // We derive their option lists from org locations points (fast + cached).
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const pts = await getLocationPoints({ signal: ac.signal });
        setPoints(pts);
      } catch (e) {
        if (ac.signal.aborted) return;
        setErr(e?.message || "Failed to load locations");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // Build options from points (fast, no extra endpoint)
  const options = useMemo(() => {
    const salesRegionLabelsSet = new Set();
    const countriesSet = new Set();
    const citiesSet = new Set();

    for (const p of points || []) {
      if (!isUnknownish(p?.salesRegion)) salesRegionLabelsSet.add(String(p.salesRegion).trim());
      if (!isUnknownish(p?.countryName)) countriesSet.add(String(p.countryName).trim());
      if (!isUnknownish(p?.city)) citiesSet.add(String(p.city).trim());
    }

    const salesRegionLabels = Array.from(salesRegionLabelsSet).filter(Boolean);

    const byCode = new Map();
    for (const label of salesRegionLabels) {
      const code = codeFromSalesRegionLabel(label);
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push(label);
    }
    for (const [code, arr] of byCode.entries()) {
      arr.sort((a, b) => a.localeCompare(b));
      byCode.set(code, arr);
    }

    const orderedSalesRegionLabels = [];
    for (const code of SALES_REGION_ORDER) {
      const arr = byCode.get(code);
      if (arr?.length) orderedSalesRegionLabels.push(...arr);
    }
    const known = new Set(SALES_REGION_ORDER);
    const extraCodes = Array.from(byCode.keys())
      .filter((c) => !known.has(c))
      .sort();
    for (const code of extraCodes) orderedSalesRegionLabels.push(...(byCode.get(code) || []));

    return {
      salesRegions: orderedSalesRegionLabels,
      countries: Array.from(countriesSet).filter(Boolean).sort(),
      cities: Array.from(citiesSet).filter(Boolean).sort(),
    };
  }, [points]);

  const selectedCountry = filters.countries?.size ? Array.from(filters.countries)[0] : null;
  const selectedCity = filters.cities?.size ? Array.from(filters.cities)[0] : null;
  const selectedOrgCount = filters.orgIds?.size || 0;

  const activeFilterCount = useMemo(() => {
    return (
      (filters.salesRegions?.size || 0) +
      (filters.countries?.size || 0) +
      (isCloudView ? (filters.cloudProviders?.size || 0) : 0) +
      (isOrgsView ? (filters.cities?.size || 0) + (filters.orgIds?.size || 0) : 0)
    );
  }, [filters, isOrgsView, isCloudView]);

  // Orgs-table link only in orgs view (and pass the snapshot to avoid any stale URL)
  const orgsUrl = useMemo(() => {
    if (!isOrgsView) return "";
    return buildMainOrgsUrlFromFilters("/participants/organizations", filters, {
      includeOrgIds: (filters.orgIds?.size || 0) > 0,
    });
  }, [filters, isOrgsView]);

  // KPIs only for orgs view
  const filteredPoints = useMemo(() => {
    if (!isOrgsView) return [];
    const sr = filters.salesRegions;
    const co = filters.countries;
    const ci = filters.cities;
    const orgIds = filters.orgIds;

    const hasOrgDrill = (orgIds?.size || 0) > 0;

    return (points || []).filter((p) => {
      if (sr?.size && !sr.has(String(p.salesRegion))) return false;
      if (co?.size && !co.has(p.countryName)) return false;

      // If org drilldown is active, ignore city filter for counts.
      if (!hasOrgDrill) {
        if (ci?.size && !ci.has(p.city)) return false;
      }

      if (hasOrgDrill) {
        if (!orgIds.has(String(p.orgId))) return false;
      }

      return true;
    });
  }, [points, filters, isOrgsView]);

  const totalPoints = isOrgsView ? points.length : 0;
  const shownPoints = isOrgsView ? filteredPoints.length : 0;

  const totalOrgs = useMemo(() => {
    if (!isOrgsView) return 0;
    const s = new Set();
    for (const p of points || []) if (p?.orgId) s.add(p.orgId);
    return s.size;
  }, [points, isOrgsView]);

  const shownOrgs = useMemo(() => {
    if (!isOrgsView) return 0;
    const s = new Set();
    for (const p of filteredPoints || []) if (p?.orgId) s.add(p.orgId);
    return s.size;
  }, [filteredPoints, isOrgsView]);

  const onSelectAllSalesRegions = () => {
    closeViewItemModal();
    setVisualizeFilters({ salesRegions: options.salesRegions });
  };

  const clearCity = () => {
    closeViewItemModal();
    setVisualizeFilters({ cities: [] });
  };
  const clearOrgs = () => {
    closeViewItemModal();
    setVisualizeFilters({ orgIds: [] });
  };

  const clearCloudProviders = () => {
    closeViewItemModal();
    setVisualizeFilters({ cloudProviders: [] });
  };

  const clearGlobalFilters = () => {
    closeViewItemModal();
    setVisualizeFilters({
      salesRegions: [],
      countries: [],
      // If you're in cloud view, "Clear Global Filters" should also clear provider
      ...(isCloudView ? { cloudProviders: [] } : {}),
    });
  };

  const clearAllForOrgsView = () => {
    closeViewItemModal();
    setVisualizeFilters({
      salesRegions: [],
      countries: [],
      cities: [],
      orgIds: [],
      locationIds: [],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI (ORGS VIEW ONLY) */}
      {isOrgsView ? (
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={styles.kpiBig}>{loading ? "…" : totalPoints.toLocaleString()}</div>
          <div style={styles.kpiLabel}>Location Points</div>

          <div style={styles.kpiRow}>
            <div style={styles.kpiSub}>
              {loading ? "…" : shownPoints.toLocaleString()}{" "}
              <span style={styles.kpiSubMuted}>shown</span>
            </div>
            <div style={styles.kpiSubMuted}>•</div>
            <div style={{ ...styles.kpiSub, color: BRAND.primaryDarkBlue }}>
              {loading ? "…" : totalOrgs.toLocaleString()}{" "}
              <span style={styles.kpiSubMuted}>orgs</span>
            </div>
            <div style={styles.kpiSubMuted}>•</div>
            <div style={{ ...styles.kpiSub, color: BRAND.primaryDarkBlue }}>
              {loading ? "…" : shownOrgs.toLocaleString()}{" "}
              <span style={styles.kpiSubMuted}>shown</span>
            </div>
          </div>

          {err ? <div style={styles.error}>{err}</div> : null}
        </div>
      ) : (
        <div style={{ ...styles.card }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
              Global Filters
            </div>
            <div style={styles.pill} title="Active filters">
              {activeFilterCount}
            </div>
          </div>

          <div style={styles.hint}>
            Sales Region + Country stay active across all views. City + Orgs are disabled outside Orgs View.
          </div>

          <button
            type="button"
            onClick={clearGlobalFilters}
            disabled={loading && !points.length}
            style={{ ...styles.button, marginTop: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryLightBlue)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.card)}
          >
            Clear Global Filters
          </button>
        </div>
      )}

      {/* Drilldown status card (ORGS VIEW ONLY) */}
      {isOrgsView && (selectedCity || selectedOrgCount) ? (
        <div style={styles.card}>
          <div style={styles.cardTitleRow}>
            <div style={styles.cardTitle}>🔎 Drilldown</div>
            <div style={styles.pill}>{(selectedCity ? 1 : 0) + (selectedOrgCount ? 1 : 0)}</div>
          </div>

          {selectedCity ? (
            <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
              City:{" "}
              <span style={{ color: BRAND.primaryDarkBlue, fontWeight: 900 }}>{selectedCity}</span>
            </div>
          ) : null}

          {selectedOrgCount ? (
            <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
              Orgs selected:{" "}
              <span style={{ color: BRAND.primaryDarkBlue, fontWeight: 900 }}>
                {selectedOrgCount.toLocaleString()}
              </span>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {selectedCity ? (
              <button
                type="button"
                onClick={clearCity}
                style={{ ...styles.button, width: "auto", padding: "10px 12px" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryLightBlue)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.card)}
              >
                Clear city
              </button>
            ) : null}

            {selectedOrgCount ? (
              <button
                type="button"
                onClick={clearOrgs}
                style={{ ...styles.button, width: "auto", padding: "10px 12px" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryLightBlue)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.card)}
              >
                Clear orgs
              </button>
            ) : null}
          </div>

          <div style={styles.hint}>
            Selecting a city drills into org points for that city. Selecting an org drills into green org points.
          </div>
        </div>
      ) : null}

      {/* Filters header / actions */}
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: BRAND.primaryDarkBlue }}>Filters</div>
          <div style={styles.pill} title="Active filters">
            {activeFilterCount}
          </div>
        </div>

        {isOrgsView ? (
          <>
            <div style={{ marginTop: 12 }}>
              <a
                href={orgsUrl}
                style={styles.linkButton}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryLightBlue)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.card)}
                title="Open the main Organizations table with these filters applied"
              >
                Send Filters to Orgs Table
              </a>
            </div>

            <div style={styles.hint}>
              Sales Region uses labels (e.g. “North America (NA)”) so it matches the org table filters.
            </div>
          </>
        ) : (
          <div style={styles.hint}>This view doesn’t link to the Orgs Table (no org/city drilldown here).</div>
        )}
      </div>

      {/* Sales Regions (LABELS, ordered by code) */}
      <div style={styles.card}>
        <div style={styles.cardTitleRow}>
          <div style={styles.cardTitle}>🌍 Sales Regions</div>
          <button
            type="button"
            onClick={onSelectAllSalesRegions}
            disabled={loading}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: loading ? "not-allowed" : "pointer",
              color: BRAND.primaryDarkBlue,
              fontSize: 12,
              fontWeight: 900,
              textDecoration: "underline",
            }}
          >
            Select all
          </button>
        </div>

        {options.salesRegions.map((label) => {
          const checked = !!filters.salesRegions?.has(label);
          const code = codeFromSalesRegionLabel(label);
          const dotColor = dotColorForCode(code);

          return (
            <div key={label} style={styles.row}>
              <div style={styles.leftRow}>
                <div style={{ ...styles.dot, background: dotColor }} />
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: dotColor,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={label}
                >
                  {label}
                </div>
              </div>

              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  closeViewItemModal();
                  toggleFilterValue("salesRegions", label);
                }}
                disabled={loading}
                style={styles.checkbox}
              />
            </div>
          );
        })}
      </div>

      {/* Country */}
      <div style={styles.card}>
        <SearchSelect
          label="Country"
          placeholder="Search countries…"
          options={options.countries}
          value={selectedCountry}
          onChange={(v) => {
            closeViewItemModal();
            setVisualizeFilters({
              countries: v ? [v] : [],
            });
          }}
          disabled={loading}
          allowAll
          allLabel="All"
        />
      </div>

      {/* Cloud Providers (CLOUD VIEW ONLY) */}
      {isCloudView ? (
        <div style={styles.card}>
          <div style={styles.cardTitleRow}>
            <div style={styles.cardTitle}>☁️ Cloud Providers</div>
            {(filters.cloudProviders?.size || 0) ? (
              <button
                type="button"
                onClick={clearCloudProviders}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  color: BRAND.primaryDarkBlue,
                  fontSize: 12,
                  fontWeight: 900,
                  textDecoration: "underline",
                }}
              >
                Clear
              </button>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 900, color: BRAND.grey }}>
                {(cloudProviders?.length || 0).toLocaleString()} options
              </span>
            )}
          </div>

          {viewOptionsError ? (
            <div style={styles.error}>{viewOptionsError}</div>
          ) : null}

          {viewOptionsLoading && !cloudProviders.length ? (
            <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>Loading providers…</div>
          ) : null}

          {!viewOptionsLoading && !cloudProviders.length ? (
            <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.grey }}>
              No providers found.
            </div>
          ) : null}

          {cloudProviders.map((prov) => {
            const checked = !!filters.cloudProviders?.has(prov);
            return (
              <div key={prov} style={styles.row}>
                <div style={styles.leftRow}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
                    {prov}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    closeViewItemModal();
                    toggleFilterValue("cloudProviders", prov);
                  }}
                  disabled={viewOptionsLoading}
                  style={styles.checkbox}
                />
              </div>
            );
          })}

          <div style={styles.hint}>
            Providers are multi-select. Map colors will match providers.
          </div>
        </div>
      ) : null}

      {/* City (ORGS VIEW ONLY) */}
      {isOrgsView ? (
        <div style={styles.card}>
          <SearchSelect
            label="City"
            placeholder="Search cities…"
            options={options.cities}
            value={selectedCity}
            onChange={(v) => {
              closeViewItemModal();
              setVisualizeFilters({
                cities: v ? [v] : [],
              });
            }}
            disabled={loading}
            allowAll
            allLabel="All"
          />

          <div style={styles.hint}>Unknown / empty cities are removed from the list.</div>
        </div>
      ) : null}

      {/* Clear */}
      <button
        type="button"
        onClick={isOrgsView ? clearAllForOrgsView : clearGlobalFilters}
        disabled={loading && !points.length}
        style={styles.button}
        onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.primaryLightBlue)}
        onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.card)}
      >
        {isOrgsView ? "Clear Page Filters" : "Clear Global Filters"}
      </button>

      {/* Mapbox info */}
      <div style={styles.mapboxInfo}>
        <div style={styles.mapboxTitle}>Powered by Mapbox</div>
        <div style={styles.mapboxText}>Interactive map • fast filtering • click pins for details</div>
      </div>
    </div>
  );
}
