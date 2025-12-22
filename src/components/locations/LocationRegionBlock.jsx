import React from "react";
import CountPill from "./CountPill";
import LocationCountryRow from "./LocationCountryRow";

export default function LocationRegionBlock({
  region,
  regionSelected,
  onToggleSelectRegion,
  collapsed,
  onToggleCollapsed,
  expandedCountries,
  onToggleCountryOpen,
  isCountrySelected,
  onToggleSelectCountry,
  isCitySelected,
  onToggleSelectCity,
}) {
  const regionName = region.salesRegion;

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid rgba(30,42,120,0.16)`,
        overflow: "hidden",
        background: "#FFFFFF",
        boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          background: regionSelected ? "rgba(207,239,247,0.45)" : "rgba(247,251,254,0.95)",
          borderBottom: "1px solid rgba(30,42,120,0.10)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand region" : "Collapse region"}
            style={{
              border: "1px solid rgba(30,42,120,0.20)",
              background: "#FFFFFF",
              color: "#1E2A78",
              fontWeight: 1000,
              borderRadius: 12,
              padding: "8px 10px",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(30,42,120,0.08)",
              flex: "0 0 auto",
            }}
          >
            {collapsed ? "▸" : "▾"}
          </button>

          <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 1000,
                color: "#111827",
                fontSize: 16,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {region.salesRegion}
            </div>
            <div style={{ fontWeight: 800, color: "rgba(17,24,39,0.65)", fontSize: 12 }}>
              Click Select to {regionSelected ? "unselect" : "select"} this sales region
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
          <button
            type="button"
            onClick={onToggleSelectRegion}
            style={{
              border: `1px solid rgba(30,42,120,0.25)`,
              background: regionSelected ? "rgba(207,239,247,0.80)" : "#FFFFFF",
              color: "#1E2A78",
              fontWeight: 1000,
              borderRadius: 999,
              padding: "8px 12px",
              cursor: "pointer",
              boxShadow: regionSelected ? "0 10px 24px rgba(30,42,120,0.10)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {regionSelected ? "Selected" : "Select"}
          </button>
          <CountPill label="Total orgs" value={region.totalOrgs} />
          <CountPill label="HQ orgs" value={region.hqOrgs} />
        </div>
      </div>

      {collapsed ? null : (
        <div style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 16px",
                    fontSize: 12,
                    fontWeight: 1000,
                    color: "#1E2A78",
                    borderBottom: "1px solid rgba(30,42,120,0.12)",
                    background: "rgba(255,255,255,0.92)",
                  }}
                >
                  Country (click to expand cities)
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "10px 16px",
                    fontSize: 12,
                    fontWeight: 1000,
                    color: "#1E2A78",
                    borderBottom: "1px solid rgba(30,42,120,0.12)",
                    background: "rgba(255,255,255,0.92)",
                  }}
                >
                  Orgs
                </th>
              </tr>
            </thead>
            <tbody>
              {(region.countries || []).map((country) => {
                const openKey = `${regionName}|||${country.countryName}`;
                const isOpen = expandedCountries.has(openKey);
                return (
                  <LocationCountryRow
                    key={country.countryName}
                    regionName={regionName}
                    country={country}
                    isOpen={isOpen}
                    onToggleOpen={() => onToggleCountryOpen(regionName, country.countryName)}
                    isSelected={isCountrySelected(regionName, country.countryName, country.geonameCountryId)}
                    onToggleSelectCountry={() =>
                      onToggleSelectCountry(regionName, country.countryName, country.geonameCountryId)
                    }
                    isCitySelected={(city) =>
                      isCitySelected(regionName, country.countryName, city)
                    }
                    onToggleSelectCity={(city) =>
                      onToggleSelectCity(regionName, country.countryName, city)
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
