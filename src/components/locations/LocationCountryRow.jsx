import React, { Fragment } from "react";
import CountPill from "./CountPill";
import LocationCityRow from "./LocationCityRow";

export default function LocationCountryRow({
  regionName,
  country,
  isOpen,
  onToggleOpen,
  isSelected,
  onToggleSelectCountry,
  isCitySelected,
  onToggleSelectCity,
}) {
  return (
    <Fragment>
      <tr style={{ background: isSelected ? "rgba(207,239,247,0.45)" : "transparent" }}>
        <td
          onClick={onToggleOpen}
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(30,42,120,0.10)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 22, display: "inline-block", color: "#1E2A78", fontWeight: 1000 }}>
              {isOpen ? "▾" : "▸"}
            </span>
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 950, color: "#111827" }}>{country.countryName}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
                Geoname Country ID: {country.geonameCountryId || "—"}
              </div>
            </div>
          </div>
        </td>

        <td
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(30,42,120,0.10)",
            textAlign: "right",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onToggleSelectCountry}
              style={{
                border: `1px solid rgba(30,42,120,0.25)`,
                background: isSelected ? "rgba(207,239,247,0.80)" : "#FFFFFF",
                color: "#1E2A78",
                fontWeight: 950,
                borderRadius: 999,
                padding: "8px 10px",
                cursor: "pointer",
              }}
              title="Select country"
            >
              {isSelected ? "Selected" : "Select"}
            </button>
            <CountPill label="Total" value={country.totalOrgs} />
            <CountPill label="HQ" value={country.hqOrgs} />
          </div>
        </td>
      </tr>

      {isOpen
        ? (country.cities || []).map((ct) => (
            <LocationCityRow
              key={`${country.countryName}::${ct.city}`}
              city={ct.city}
              totalOrgs={ct.totalOrgs}
              hqOrgs={ct.hqOrgs}
              selected={isCitySelected(ct.city)}
              onToggleSelect={() => onToggleSelectCity(ct.city)}
            />
          ))
        : null}
    </Fragment>
  );
}
