// src/pages/ProductionLocations.jsx
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProductionLocationsMapGL from "../components/ProductionLocationsMapGL.jsx";
import GeoIntelligenceMap from "../components/geo/GeoIntelligenceMap.jsx";

import { useBookmarkSync } from "../bookmarks/useBookmarkSync";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const base = import.meta.env.VITE_API_BASE;

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Pill({ label, value, kind = "soft", onClick, title }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(30,42,120,0.22)",
    fontWeight: 900,
    fontSize: 12,
    cursor: onClick ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const style =
    kind === "solid"
      ? { background: "rgba(30,42,120,0.92)", color: "#fff" }
      : { background: "rgba(207,239,247,0.55)", color: BRAND.ink };

  return (
    <span style={{ ...base, ...style }} onClick={onClick} title={title}>
      {label ? <span style={{ opacity: 0.85 }}>{label}</span> : null}
      {value != null ? <span>{value}</span> : null}
      {label == null && value == null ? <span>{/* children unsupported */}</span> : null}
    </span>
  );
}

function SectionCard({ title, subtitle, right, children }) {
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
            <div
              style={{
                marginTop: 6,
                fontWeight: 750,
                fontSize: 12,
                color: "rgba(0,0,0,0.62)",
                maxWidth: 860,
              }}
            >
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

function buildOrgsUrl({ regions, countries, cities, locationScope }) {
  const sp = new URLSearchParams();
  if (regions?.length) sp.set("SALES_REGION", regions.join(","));
  if (countries?.length) sp.set("GEONAME_COUNTRY_NAME", countries.join(","));
  if (cities?.length) sp.set("CITY", cities.join(","));
  sp.set("locationScope", locationScope || "all");
  return `/participants/organizations?${sp.toString()}`;
}

// Normalizers (avoid undefined routes and selection collisions)
function regionLabel(r) {
  return r?.name || r?.salesRegion || "Unknown Region";
}
function regionValue(r) {
  return r?.salesRegion || r?.name || "Unknown Region";
}
function countryLabel(c) {
  return c?.name || c?.countryName || "Unknown Country";
}
function countryValue(c) {
  return c?.countryName || c?.name || "Unknown Country";
}
function cityLabel(city) {
  return city?.name || city?.city || "Unknown City";
}

export default function ProductionLocations() {
  const navigate = useNavigate();

  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // NOTE: search is the page’s “query”
  const [search, setSearch] = useState("");

  const [viewMode, setViewMode] = useState("list"); // list | map
  const [pinMode, setPinMode] = useState("city"); // city | org
  const [mapEngine, setMapEngine] = useState("pro"); // pro | classic

  const [points, setPoints] = useState([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsErr, setPointsErr] = useState("");

  const [collapsedRegions, setCollapsedRegions] = useState(() => new Set());
  const [expandedCountries, setExpandedCountries] = useState(() => new Set()); // key: `${region}||${country}`

  const [selectedRegions, setSelectedRegions] = useState(() => new Set());
  const [selectedCountries, setSelectedCountries] = useState(() => new Set()); // `${region}||${country}`
  const [selectedCities, setSelectedCities] = useState(() => new Set()); // `${region}||${country}||${city}`

  // Pro map: stable IDs
  const [selectedLocationIds, setSelectedLocationIds] = useState(() => new Set());

  const [scope, setScope] = useState("all"); // all | hq

  // ----------------------------
  // BOOKMARK SYNC (added feature)
  // We map the “bookmark file” state keys onto this page’s real state.
  // - q       -> search
  // - country -> selectedCountries (single-select)
  // - region  -> selectedRegions (single-select)
  // plus page/pageSize/sort placeholders for forward-compat.
  // ----------------------------
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState(null);

  const getState = useCallback(() => {
    const region = [...selectedRegions][0] ?? null;
    const countryKey = [...selectedCountries][0] ?? null;
    const country = countryKey ? countryKey.split("||")[1] ?? null : null;

    return {
      q: search,
      region,
      country,
      page,
      pageSize,
      sort,
      // extra: persist these too (harmless if other pages ignore them)
      viewMode,
      pinMode,
      mapEngine,
      scope,
    };
  }, [
    search,
    selectedRegions,
    selectedCountries,
    page,
    pageSize,
    sort,
    viewMode,
    pinMode,
    mapEngine,
    scope,
  ]);

  const applyState = useCallback((s) => {
    // text query
    if (s?.q !== undefined) setSearch(s.q ?? "");

    // region single-select
    if (s?.region !== undefined) {
      setSelectedRegions(new Set(s.region ? [s.region] : []));
      // reset deeper selections when region changes
      setSelectedCountries(new Set());
      setSelectedCities(new Set());
    }

    // country single-select (requires region; best-effort)
    if (s?.country !== undefined) {
      const region = s?.region ?? [...selectedRegions][0] ?? "";
      setSelectedRegions(new Set(region ? [region] : []));
      setSelectedCountries(new Set(s.country ? [`${region}||${s.country}`] : []));
      setSelectedCities(new Set());
    }

    if (s?.page !== undefined) setPage(s.page ?? 1);
    if (s?.pageSize !== undefined) setPageSize(s.pageSize ?? 25);
    if (s?.sort !== undefined) setSort(s.sort ?? null);

    // optional extras
    if (s?.viewMode !== undefined) setViewMode(s.viewMode === "map" ? "map" : "list");
    if (s?.pinMode !== undefined) setPinMode(s.pinMode === "org" ? "org" : "city");
    if (s?.mapEngine !== undefined) setMapEngine(s.mapEngine === "classic" ? "classic" : "pro");
    if (s?.scope !== undefined) setScope(s.scope === "hq" ? "hq" : "all");
  }, [selectedRegions]);

  useBookmarkSync({
    routeKey: "productionLocations",
    getState,
    applyState,
  });

  // If user leaves Map view, clear Pro-map selection to avoid confusion.
  useEffect(() => {
    if (viewMode !== "map" && selectedLocationIds.size) {
      setSelectedLocationIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // ----------------------------
  // DATA LOAD
  // ----------------------------
  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(base+"/api/locations/tree");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (!ignore) setTree(json);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Failed to load production locations");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function run() {
      setPointsLoading(true);
      setPointsErr("");
      try {
        const res = await fetch(base+"/api/locations/points");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        if (!ignore) setPoints(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!ignore) setPointsErr(e?.message || "Failed to load map points");
      } finally {
        if (!ignore) setPointsLoading(false);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  const regions = useMemo(() => {
    const list = tree?.regions || [];
    return list.slice().sort((a, b) => (b.totalOrgs || 0) - (a.totalOrgs || 0));
  }, [tree]);

  const searchLower = search.trim().toLowerCase();

  const filteredRegions = useMemo(() => {
    if (!regions.length) return [];
    if (!searchLower) return regions;

    const out = [];
    for (const r of regions) {
      const regionMatch = String(regionLabel(r) || "").toLowerCase().includes(searchLower);
      const countries = r.countries || [];
      const matchedCountries = [];

      for (const c of countries) {
        const countryMatch =
          String(countryLabel(c) || "").toLowerCase().includes(searchLower) ||
          String(c.geonameCountryId || "").toLowerCase().includes(searchLower);
        const cities = c.cities || [];
        const matchedCities = cities.filter((x) =>
          String(cityLabel(x) || "").toLowerCase().includes(searchLower)
        );
        if (countryMatch || matchedCities.length) {
          matchedCountries.push({
            ...c,
            cities: countryMatch ? cities : matchedCities,
            _autoExpand: matchedCities.length > 0,
          });
        }
      }

      if (regionMatch || matchedCountries.length) {
        out.push({
          ...r,
          countries: regionMatch ? countries : matchedCountries,
          _autoExpand: matchedCountries.some((c) => c._autoExpand),
        });
      }
    }
    return out;
  }, [regions, searchLower]);

  // Auto expand when searching finds cities
  useEffect(() => {
    if (!searchLower) return;
    const nextExpanded = new Set(expandedCountries);
    const nextCollapsed = new Set(collapsedRegions);

    for (const r of filteredRegions) {
      const rKey = regionValue(r);
      if (r._autoExpand) nextCollapsed.delete(rKey);
      for (const c of r.countries || []) {
        if (c._autoExpand) nextExpanded.add(`${rKey}||${countryValue(c)}`);
      }
    }
    setExpandedCountries(nextExpanded);
    setCollapsedRegions(nextCollapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLower]);

  const anySelected = selectedRegions.size > 0 || selectedCountries.size > 0 || selectedCities.size > 0;
  const anyLocationSelected = selectedLocationIds.size > 0;

  const selectionSummary = useMemo(() => {
    const regionsArr = [...selectedRegions];
    const countriesArr = [...selectedCountries].map((k) => k.split("||")[1]);
    const citiesArr = [...selectedCities].map((k) => k.split("||")[2]);
    return { regionsArr, countriesArr, citiesArr };
  }, [selectedRegions, selectedCountries, selectedCities]);

  const toggleRegionCollapsed = (regionName) => {
    setCollapsedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionName)) next.delete(regionName);
      else next.add(regionName);
      return next;
    });
  };

  const toggleCountryExpanded = (regionName, countryName) => {
    const key = `${regionName}||${countryName}`;
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectRegion = (regionName) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionName)) next.delete(regionName);
      else next.add(regionName);
      return next;
    });
  };

  const toggleSelectCountry = (regionName, countryName) => {
    const key = `${regionName}||${countryName}`;
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectCity = (regionName, countryName, cityName) => {
    const key = `${regionName}||${countryName}||${cityName}`;
    setSelectedCities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Sidebar dropdown selection (single-select) — keeps existing list/search behavior intact.
  const handleSelectRegion = (regionName) => {
    setSelectedRegions(new Set(regionName ? [regionName] : []));
    setSelectedCountries(new Set());
    setSelectedCities(new Set());
  };

  const handleSelectCountry = (regionName, countryName) => {
    if (!countryName) return;
    setSelectedRegions(new Set(regionName ? [regionName] : []));
    setSelectedCountries(new Set([`${regionName || ""}||${countryName}`]));
    setSelectedCities(new Set());
  };

  const handleSelectCity = (regionName, countryName, cityName) => {
    if (!cityName) return;
    setSelectedRegions(new Set(regionName ? [regionName] : []));
    setSelectedCountries(new Set(countryName ? [`${regionName || ""}||${countryName}`] : []));
    setSelectedCities(new Set([`${regionName || ""}||${countryName || ""}||${cityName}`]));
  };

  const handleClearSelection = () => {
    setSelectedRegions(new Set());
    setSelectedCountries(new Set());
    setSelectedCities(new Set());
  };

  // Map helpers (ProductionLocationsMapGL contract)
  const makeMapKey = (item) => {
    const r = item?.salesRegion || item?.region || item?.regionName || "";
    const c = item?.countryName || item?.country || "";
    const city = item?.city || item?.cityName || "";
    return `${r}||${c}||${city}`;
  };

  const isSelectedKey = (key) => {
    const [r = "", c = "", city = ""] = String(key || "").split("||");
    if (selectedCities.has(`${r}||${c}||${city}`)) return true;
    if (selectedCountries.has(`${r}||${c}`)) return true;
    if (selectedRegions.has(r)) return true;
    return false;
  };

  const handleToggleSelectFromMap = (key, meta) => {
    const [r0 = "", c0 = "", city0 = ""] = String(key || "").split("||");
    const region = meta?.point?.salesRegion || meta?.city?.salesRegion || r0;
    const country = meta?.point?.countryName || meta?.city?.countryName || c0;
    const city = meta?.point?.city || meta?.city?.city || city0;

    if (region || country || city) toggleSelectCity(region, country, city);
  };

  const handleViewOrgsFromMap = ({ salesRegion, country, city }) => {
    navigate(
      buildOrgsUrl({
        regions: salesRegion ? [salesRegion] : [],
        countries: country ? [country] : [],
        cities: city ? [city] : [],
        locationScope: scope,
      })
    );
  };

  // Pro map: navigate via stable IDs
  const viewOrgsFromLocationIds = (locationIdsSet) => {
    const ids = Array.isArray(locationIdsSet) ? locationIdsSet : Array.from(locationIdsSet || []);
    const sp = new URLSearchParams();
    if (ids.length) sp.set("locationIds", ids.join(","));
    sp.set("locationScope", scope);
    navigate(`/participants/organizations?${sp.toString()}`);
  };

  const clearLocationSelection = () => setSelectedLocationIds(new Set());

  const clearSelection = () => {
    setSelectedRegions(new Set());
    setSelectedCountries(new Set());
    setSelectedCities(new Set());
  };

  const viewOrgs = () => {
    navigate(
      buildOrgsUrl({
        regions: selectionSummary.regionsArr,
        countries: selectionSummary.countriesArr,
        cities: selectionSummary.citiesArr,
        locationScope: scope,
      })
    );
  };

  const Crumb = ({ label, to }) => (
    <button
      type="button"
      onClick={() => navigate(to)}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: 0,
        fontWeight: 950,
        color: BRAND.ink,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        background: BRAND.bg,
        minHeight: "100vh",
        padding: 18,
        paddingBottom: anySelected || anyLocationSelected ? 96 : 18,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Top bar */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Crumb label="Participants" to="/participants" />
              <span style={{ opacity: 0.5, fontWeight: 900 }}>→</span>
              <Crumb label="Organizations" to="/participants/organizations" />
              <span style={{ opacity: 0.5, fontWeight: 900 }}>→</span>
              <span style={{ fontWeight: 950, color: BRAND.text }}>Production Locations</span>
            </div>

            <a
              href="https://me-dmz.com"
              style={{
                marginLeft: 6,
                textDecoration: "none",
                fontWeight: 950,
                color: BRAND.ink,
                border: "1px solid rgba(30,42,120,0.18)",
                borderRadius: 999,
                padding: "7px 10px",
                background: "rgba(255,255,255,0.9)",
              }}
              title="Open ME-NEXUS"
            >
              ME-NEXUS ↗
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px",
                borderRadius: 999,
                border: "1px solid rgba(30,42,120,0.14)",
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
              }}
              aria-label="Toggle view mode"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 950,
                  background: viewMode === "list" ? "rgba(30,42,120,0.92)" : "transparent",
                  color: viewMode === "list" ? "#fff" : BRAND.ink,
                }}
                title="List view"
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 950,
                  background: viewMode === "map" ? "rgba(30,42,120,0.92)" : "transparent",
                  color: viewMode === "map" ? "#fff" : BRAND.ink,
                }}
                title="Map view"
              >
                Map
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(30,42,120,0.14)",
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
              }}
            >
              <span aria-hidden style={{ fontWeight: 950, color: BRAND.ink }}>
                🔎
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search regions, countries, cities…"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: 800,
                  color: BRAND.text,
                  minWidth: 260,
                }}
              />
            </div>
          </div>
        </div>

        {/* Definition */}
        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            border: "1px solid rgba(30,42,120,0.14)",
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 14px 42px rgba(0,0,0,0.05)",
            padding: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 900 }}>
            <div style={{ fontWeight: 950, color: BRAND.text, fontSize: 14 }}>Production Locations</div>
            <div
              style={{
                marginTop: 6,
                color: "rgba(0,0,0,0.66)",
                fontWeight: 750,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              This is the list of countries or regions where an organization is located. Organizations can have multiple
              locations.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 950, color: "rgba(0,0,0,0.55)", fontSize: 12 }}>View orgs scope:</span>
            <button
              type="button"
              onClick={() => setScope("all")}
              style={{
                border: "1px solid rgba(30,42,120,0.18)",
                borderRadius: 999,
                padding: "7px 10px",
                cursor: "pointer",
                fontWeight: 950,
                background: scope === "all" ? "rgba(30,42,120,0.92)" : "rgba(255,255,255,0.9)",
                color: scope === "all" ? "#fff" : BRAND.ink,
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setScope("hq")}
              style={{
                border: "1px solid rgba(30,42,120,0.18)",
                borderRadius: 999,
                padding: "7px 10px",
                cursor: "pointer",
                fontWeight: 950,
                background: scope === "hq" ? "rgba(30,42,120,0.92)" : "rgba(255,255,255,0.9)",
                color: scope === "hq" ? "#fff" : BRAND.ink,
              }}
            >
              Headquartered
            </button>
          </div>
        </div>

        {err ? <div style={{ marginTop: 14, color: "#b00020", fontWeight: 900 }}>{err}</div> : null}
        {loading && !tree ? (
          <div style={{ marginTop: 14, color: "rgba(0,0,0,0.62)", fontWeight: 850 }}>Loading locations…</div>
        ) : null}

        {/* --------- The rest of your JSX is unchanged from your original file --------- */}
        {/* (I’m keeping it exactly as-is below to maintain all functionality.) */}

        {viewMode === "list" ? (
          <div>
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {filteredRegions.map((r) => {
                const rKey = regionValue(r);
                const rLabel = regionLabel(r);
                const regionCollapsed = collapsedRegions.has(rKey);
                const regionSelected = selectedRegions.has(rKey);

                return (
                  <SectionCard
                    key={rKey}
                    title={rLabel}
                    subtitle="Click the row to expand/collapse countries. Use Select to include this region in the orgs view. Use Details to open the region profile."
                    right={
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Pill label="Total" value={r.totalOrgs} title="Total orgs in this sales region (any location)" />
                        <Pill label="HQ" value={r.hqOrgs} title="Orgs headquartered in this sales region" />

                        <Pill
                          kind={regionSelected ? "solid" : "soft"}
                          label={regionSelected ? "Selected" : "Select"}
                          value={regionSelected ? "✓" : null}
                          onClick={(e) => {
                            e.stopPropagation?.();
                            toggleSelectRegion(rKey);
                          }}
                          title="Select this sales region"
                        />

                        <Pill
                          label="Details"
                          value="→"
                          onClick={(e) => {
                            e.stopPropagation?.();
                            navigate(
                              `/participants/organizations/production-locations/regions/${encodeURIComponent(rKey)}`
                            );
                          }}
                          title="Open sales region profile"
                        />

                        <Pill
                          kind="soft"
                          label={regionCollapsed ? "Expand" : "Collapse"}
                          value={regionCollapsed ? "▾" : "▴"}
                          onClick={(e) => {
                            e.stopPropagation?.();
                            toggleRegionCollapsed(rKey);
                          }}
                          title="Collapse/expand this region"
                        />
                      </div>
                    }
                  >
                    {!regionCollapsed ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                          <thead>
                            <tr style={{ textAlign: "left", color: "rgba(0,0,0,0.55)", fontSize: 12 }}>
                              <th style={{ padding: "8px 6px" }}>Country</th>
                              <th style={{ padding: "8px 6px" }}>Geoname ID</th>
                              <th style={{ padding: "8px 6px" }}>Total</th>
                              <th style={{ padding: "8px 6px" }}>HQ</th>
                              <th style={{ padding: "8px 6px" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {(r.countries || []).map((c) => {
                              const cLabel = countryLabel(c);
                              const cValue = countryValue(c);
                              const countryKey = `${rKey}||${cValue}`;
                              const countryExpanded = expandedCountries.has(countryKey);
                              const countrySelected = selectedCountries.has(countryKey);

                              return (
                                <Fragment key={countryKey}>
                                  <tr style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                                    <td style={{ padding: "10px 6px", fontWeight: 900, color: BRAND.text }}>
                                      <button
                                        type="button"
                                        onClick={() => toggleCountryExpanded(rKey, cValue)}
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          cursor: "pointer",
                                          padding: 0,
                                          fontWeight: 950,
                                          color: BRAND.text,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                        title="Expand/collapse cities"
                                      >
                                        <span aria-hidden style={{ opacity: 0.7 }}>
                                          {countryExpanded ? "▾" : "▸"}
                                        </span>
                                        {cLabel}
                                      </button>
                                    </td>
                                    <td style={{ padding: "10px 6px", color: "rgba(0,0,0,0.7)", fontWeight: 800 }}>
                                      {c.geonameCountryId || "—"}
                                    </td>
                                    <td style={{ padding: "10px 6px" }}>
                                      <Pill value={c.totalOrgs} />
                                    </td>
                                    <td style={{ padding: "10px 6px" }}>
                                      <Pill value={c.hqOrgs} />
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 6px",
                                        display: "flex",
                                        gap: 8,
                                        justifyContent: "flex-end",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <Pill
                                        kind={countrySelected ? "solid" : "soft"}
                                        label={countrySelected ? "Selected" : "Select"}
                                        value={countrySelected ? "✓" : null}
                                        onClick={() => toggleSelectCountry(rKey, cValue)}
                                        title="Select this country"
                                      />
                                      <Pill
                                        label="Details"
                                        value="→"
                                        onClick={() =>
                                          navigate(
                                            `/participants/organizations/production-locations/countries/${encodeURIComponent(
                                              cValue
                                            )}`
                                          )
                                        }
                                        title="Open country profile"
                                      />
                                    </td>
                                  </tr>

                                  {countryExpanded ? (
                                    <tr style={{ background: "rgba(247,251,254,0.8)" }}>
                                      <td colSpan={5} style={{ padding: "12px 10px" }}>
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                            gap: 10,
                                          }}
                                        >
                                          {(c.cities || []).map((city) => {
                                            const cityName = cityLabel(city);
                                            const cityKey = `${rKey}||${cValue}||${cityName}`;
                                            const citySelected = selectedCities.has(cityKey);
                                            return (
                                              <div
                                                key={cityKey}
                                                style={{
                                                  borderRadius: 16,
                                                  border: "1px solid rgba(30,42,120,0.12)",
                                                  background: "rgba(255,255,255,0.92)",
                                                  padding: 10,
                                                  display: "flex",
                                                  alignItems: "flex-start",
                                                  justifyContent: "space-between",
                                                  gap: 10,
                                                }}
                                              >
                                                <div>
                                                  <div style={{ fontWeight: 950, color: BRAND.text }}>{cityName}</div>
                                                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                    <Pill label="Total" value={city.totalOrgs} />
                                                    <Pill label="HQ" value={city.hqOrgs} />
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => toggleSelectCity(rKey, cValue, cityName)}
                                                  style={{
                                                    border: "1px solid rgba(30,42,120,0.18)",
                                                    borderRadius: 999,
                                                    padding: "7px 10px",
                                                    cursor: "pointer",
                                                    fontWeight: 950,
                                                    background: citySelected
                                                      ? "rgba(30,42,120,0.92)"
                                                      : "rgba(255,255,255,0.9)",
                                                    color: citySelected ? "#fff" : BRAND.ink,
                                                    height: 34,
                                                  }}
                                                  title="Select this city"
                                                >
                                                  {citySelected ? "Selected ✓" : "Select"}
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </td>
                                    </tr>
                                  ) : null}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: "rgba(0,0,0,0.62)", fontWeight: 750, fontSize: 13 }}>
                        Collapsed — click Expand to view countries and cities.
                      </div>
                    )}
                  </SectionCard>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <SectionCard
              title="Production Locations — Map"
              subtitle="Same filters and selection behavior as List view. Toggle between City pins and Org pins."
              right={
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Pill
                    label="Engine"
                    value={mapEngine === "pro" ? "Pro" : "Classic"}
                    title="Pro = MapLibre + deck.gl (no billing). Classic = existing map."
                  />
                  <button
                    type="button"
                    onClick={() => setMapEngine((v) => (v === "pro" ? "classic" : "pro"))}
                    style={{
                      border: "1px solid rgba(30,42,120,0.18)",
                      borderRadius: 999,
                      padding: "7px 10px",
                      cursor: "pointer",
                      fontWeight: 950,
                      background: "rgba(255,255,255,0.9)",
                      color: BRAND.ink,
                    }}
                    title="Toggle map engine"
                  >
                    Switch
                  </button>
                  <Pill label="Selected (List)" value={selectedRegions.size + selectedCountries.size + selectedCities.size} />
                  <Pill label="Selected (Map)" value={selectedLocationIds.size} title="Selected locations from Pro map (locationId-based)" />
                </div>
              }
            >
              {pointsErr ? (
                <div style={{ color: "#b00020", fontWeight: 900 }}>
                  {pointsErr}
                  <div style={{ marginTop: 6, color: "rgba(0,0,0,0.62)", fontWeight: 800, fontSize: 12 }}>
                    The map expects an API endpoint at <code>/api/locations/points</code> returning rows with lat/lng.
                  </div>
                </div>
              ) : null}

              {pointsLoading ? <div style={{ color: "rgba(0,0,0,0.62)", fontWeight: 850 }}>Loading map points…</div> : null}

              {!pointsLoading && !pointsErr ? (
                mapEngine === "pro" ? (
                  <GeoIntelligenceMap
                    points={points}
                    scope={scope}
                    onSelectionChange={(set) => setSelectedLocationIds(new Set(set))}
                    onViewOrgs={(ids) => viewOrgsFromLocationIds(ids)}
                    onClickPoint={(pt) => {
                      const locId = String(
                        pt?.locationId ?? pt?.LOCATION_ID ?? pt?.location_id ?? pt?.properties?.locationId ?? ""
                      );
                      if (!locId) return;
                      setSelectedLocationIds(new Set([locId]));
                    }}
                  />
                ) : (
                  <ProductionLocationsMapGL
                    points={points}
                    search={search}
                    pinMode={pinMode}
                    onPinModeChange={setPinMode}
                    makeKey={makeMapKey}
                    isSelected={isSelectedKey}
                    onToggleSelect={handleToggleSelectFromMap}
                    onViewOrgs={handleViewOrgsFromMap}
                    onGoToRegion={(region) =>
                      navigate(`/participants/organizations/production-locations/regions/${encodeURIComponent(region)}`)
                    }
                    onGoToCountry={(country) =>
                      navigate(`/participants/organizations/production-locations/countries/${encodeURIComponent(country)}`)
                    }
                    onSelectRegion={handleSelectRegion}
                    onSelectCountry={handleSelectCountry}
                    onSelectCity={handleSelectCity}
                    onClearSelection={handleClearSelection}
                  />
                )
              ) : null}
            </SectionCard>
          </div>
        )}
      </div>

      {/* Floating selection bar (list-based selection; unchanged behavior) */}
      {anySelected ? (
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
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Pill kind="solid" label="Selected" value={`${selectedRegions.size + selectedCountries.size + selectedCities.size}`} />
              {selectionSummary.regionsArr.slice(0, 2).map((x) => <Pill key={x} value={x} />)}
              {selectionSummary.countriesArr.slice(0, 2).map((x) => <Pill key={x} value={x} />)}
              {selectionSummary.citiesArr.slice(0, 2).map((x) => <Pill key={x} value={x} />)}
              {selectionSummary.regionsArr.length + selectionSummary.countriesArr.length + selectionSummary.citiesArr.length > 6 ? (
                <span style={{ color: "rgba(0,0,0,0.58)", fontWeight: 850, fontSize: 12 }}>+ more</span>
              ) : null}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  borderRadius: 999,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 950,
                  background: "rgba(255,255,255,0.9)",
                  color: BRAND.ink,
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={viewOrgs}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  borderRadius: 999,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 950,
                  background: "rgba(30,42,120,0.92)",
                  color: "#fff",
                }}
                title="Open Organizations page with these filters applied"
              >
                View Participant Organizations →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating selection bar (map-based locationId selection) */}
      {anyLocationSelected ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 61,
            padding: 12,
            background: "rgba(247,251,254,0.86)",
            backdropFilter: "blur(10px)",
            borderTop: "1px solid rgba(30,42,120,0.14)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Pill kind="solid" label="Selected Locations" value={`${selectedLocationIds.size}`} />
              <span style={{ color: "rgba(0,0,0,0.62)", fontWeight: 850, fontSize: 12 }}>
                (selection is ID-based — unknown cities are safe)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={clearLocationSelection}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  borderRadius: 999,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 950,
                  background: "rgba(255,255,255,0.9)",
                  color: BRAND.ink,
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => viewOrgsFromLocationIds(selectedLocationIds)}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  borderRadius: 999,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontWeight: 950,
                  background: "rgba(30,42,120,0.92)",
                  color: "#fff",
                }}
                title="Open Organizations page filtered by selected locations"
              >
                View Participant Organizations →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

