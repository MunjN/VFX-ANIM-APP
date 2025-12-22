import { useMemo } from "react";

/**
 * SelectionTray
 * Premium bottom tray for GeoIntelligenceMap selection.
 *
 * Props:
 *  - selectedIds: Set<string>
 *  - points: Array of location points (must include locationId + country/city fields)
 *  - onClear: () => void
 *  - onViewOrgs: (ids: Set<string>) => void
 */
export default function SelectionTray({ selectedIds, points, onClear, onViewOrgs }) {
  const selectedCount = selectedIds?.size || 0;

  const summary = useMemo(() => {
    if (!selectedCount) return null;

    const ids = selectedIds;
    const byCountry = new Map();
    const byCity = new Map();
    let unknownCity = 0;

    for (const p of points || []) {
      const id = String(p?.locationId ?? p?.LOCATION_ID ?? p?.location_id ?? "");
      if (!id || !ids.has(id)) continue;

      const country =
        (p?.countryName ?? p?.GEONAME_COUNTRY_NAME ?? p?.country ?? "").trim() || "Unknown country";
      const cityRaw = (p?.city ?? p?.CITY ?? "").trim();
      const city = cityRaw || "Unknown city";

      if (!cityRaw) unknownCity += 1;

      byCountry.set(country, (byCountry.get(country) || 0) + 1);
      byCity.set(`${city} • ${country}`, (byCity.get(`${city} • ${country}`) || 0) + 1);
    }

    const topCountries = Array.from(byCountry.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const topCities = Array.from(byCity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { topCountries, topCities, unknownCity };
  }, [points, selectedCount, selectedIds]);

  if (!selectedCount) return null;

  return (
    <div style={wrap}>
      <div style={inner}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Pill solid label="Selected locations" value={selectedCount.toLocaleString()} />
          {summary?.unknownCity ? (
            <Pill label="Unknown city" value={summary.unknownCity.toLocaleString()} title="Selected points missing city label" />
          ) : null}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {summary?.topCountries?.map(([k, v]) => (
              <Pill key={k} label={k} value={v.toLocaleString()} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {summary?.topCities?.map(([k, v]) => (
              <Pill key={k} label={k} value={v.toLocaleString()} kind="soft2" />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onClear} style={btnSecondary} title="Clear selection">
            Clear
          </button>

          <button
            type="button"
            onClick={() => onViewOrgs?.(selectedIds)}
            style={btnPrimary}
            title="Open Organizations page filtered by these selected locations"
          >
            View Participant Organizations →
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value, solid, kind = "soft", title }) {
  const style =
    solid
      ? { background: "rgba(30,42,120,0.92)", color: "#fff", border: "1px solid rgba(30,42,120,0.12)" }
      : kind === "soft2"
      ? { background: "rgba(30,42,120,0.06)", color: "rgba(30,42,120,0.92)", border: "1px solid rgba(30,42,120,0.12)" }
      : { background: "rgba(207,239,247,0.60)", color: "rgba(30,42,120,0.92)", border: "1px solid rgba(30,42,120,0.12)" };

  return (
    <span title={title} style={{ ...pillBase, ...style }}>
      <span style={{ opacity: 0.85, fontWeight: 950 }}>{label}</span>
      <span style={{ fontWeight: 1000 }}>{value}</span>
    </span>
  );
}

const wrap = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 80,
  padding: 12,
  background: "rgba(247,251,254,0.86)",
  backdropFilter: "blur(10px)",
  borderTop: "1px solid rgba(30,42,120,0.14)",
};

const inner = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const pillBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 12,
  whiteSpace: "nowrap",
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
};

const btnPrimary = {
  border: "1px solid rgba(30,42,120,0.18)",
  borderRadius: 999,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 1000,
  background: "rgba(30,42,120,0.92)",
  color: "#fff",
  boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
};

const btnSecondary = {
  border: "1px solid rgba(30,42,120,0.18)",
  borderRadius: 999,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 1000,
  background: "rgba(255,255,255,0.9)",
  color: "rgba(30,42,120,0.92)",
};
