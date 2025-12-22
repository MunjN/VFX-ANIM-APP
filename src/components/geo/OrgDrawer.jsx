import { useMemo } from "react";

/**
 * OrgDrawer
 * Premium right-side drawer for quick context + actions.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - feature: GeoJSON feature or point object from map click/hover
 *  - onViewOrgs: () => void
 */
export default function OrgDrawer({ open, onClose, feature, onViewOrgs }) {
  const data = useMemo(() => {
    if (!feature) return null;

    // Support both raw point objects and clustered GeoJSON point features.
    const props = feature?.properties || feature || {};
    const orgName = props?.orgName ?? props?.ORG_NAME ?? "Unknown org";
    const country = props?.countryName ?? props?.GEONAME_COUNTRY_NAME ?? props?.country ?? "Unknown country";
    const city = props?.city ?? props?.CITY ?? "Unknown city";
    const locId = String(props?.locationId ?? props?.LOCATION_ID ?? props?.location_id ?? "");

    const isHQ = !!(props?.isHQ ?? props?.hq ?? props?.HQ ?? props?.headquarters);

    return { orgName, country, city, locId, isHQ };
  }, [feature]);

  if (!open) return null;

  return (
    <div style={wrap} role="dialog" aria-label="Location details">
      <div style={panel}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 1000, fontSize: 14, color: "#111827" }}>
              {data?.orgName || "Location"}
            </div>
            <div style={{ marginTop: 6, fontWeight: 850, fontSize: 12, color: "rgba(0,0,0,0.62)" }}>
              {(data?.city || "Unknown city") + ", " + (data?.country || "Unknown country")}
            </div>
          </div>

          <button type="button" onClick={onClose} style={closeBtn} title="Close">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <Row label="Location ID" value={data?.locId || "—"} />
          <Row label="Type" value={data?.isHQ ? "HQ" : "Location"} />
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onViewOrgs} style={primaryBtn}>
            View orgs from this location →
          </button>
          <button type="button" onClick={onClose} style={secondaryBtn}>
            Close
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>
          Tip: use <b>Shift + drag</b> to select multiple locations.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontWeight: 950, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>{label}</div>
      <div style={{ fontWeight: 950, fontSize: 12, color: "#111827", maxWidth: 230, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}

const wrap = {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 30,
  pointerEvents: "none",
};

const panel = {
  pointerEvents: "auto",
  width: 340,
  borderRadius: 18,
  border: "1px solid rgba(30,42,120,0.14)",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 54px rgba(0,0,0,0.18)",
  padding: 14,
};

const primaryBtn = {
  border: "1px solid rgba(30,42,120,0.18)",
  borderRadius: 999,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 1000,
  background: "rgba(30,42,120,0.92)",
  color: "#fff",
  boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
};

const secondaryBtn = {
  border: "1px solid rgba(30,42,120,0.18)",
  borderRadius: 999,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 1000,
  background: "rgba(255,255,255,0.9)",
  color: "rgba(30,42,120,0.92)",
};

const closeBtn = {
  border: "1px solid rgba(30,42,120,0.18)",
  borderRadius: 999,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 1000,
  background: "rgba(255,255,255,0.9)",
  color: "rgba(30,42,120,0.92)",
};
