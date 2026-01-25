// // src/pages/LocationsVisualizePage.jsx
// import React, { useMemo } from "react";
// import { Link } from "react-router-dom";

// import LocationsMap from "../components/LocationsMap";
// import LocationsFilters from "../components/LocationFilters";
// import OrgSuggestSearch from "../components/OrgSuggestSearch";
// import ViewInfoModal from "../components/ViewInfoModal";
// import {
//   useVisualizeFilters,
//   buildMainOrgsUrlFromFilters,
//   setVisualizeFilters,
//   setViewMode as setStoreViewMode,
//   closeViewItemModal,
// } from "../state/visualizeFiltersStore";

// const BRAND = {
//   primaryLightBlue: "#CEECF2",
//   primaryDarkBlue: "#232073",
//   secondaryGreen: "#3AA608",
//   secondaryOrange: "#D97218",
//   secondaryYellow: "#F2C53D",
//   grey: "#747474",
//   lightGrey: "#D9D9D9",
//   bg: "#F7F7F8",
//   card: "#FFFFFF",
//   border: "#E5E7EB",
//   ink: "#111827",
// };

// const VIEW_MODES = [
//   { key: "orgs", label: "Orgs View" },
//   { key: "tax", label: "Tax Regions" },
//   { key: "geodata", label: "Geodata" },
//   { key: "cloud", label: "Cloud Regions" },
// ];

// const styles = {
//   page: {
//     minHeight: "100vh",
//     background: BRAND.bg,
//     fontFamily:
//       "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
//     color: BRAND.ink,
//   },
//   header: {
//     background: BRAND.card,
//     borderBottom: `1px solid ${BRAND.border}`,
//     padding: "14px 20px",
//   },
//   headerRow: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: 16,
//     flexWrap: "wrap",
//   },
//   leftHeader: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 10,
//     minWidth: 280,
//     flex: "1 1 560px",
//   },
//   breadcrumbs: {
//     display: "flex",
//     alignItems: "center",
//     flexWrap: "wrap",
//     gap: 6,
//     fontSize: 13,
//     color: BRAND.grey,
//   },
//   crumbLink: {
//     color: BRAND.grey,
//     textDecoration: "none",
//     fontWeight: 800,
//   },
//   crumbCurrent: {
//     fontWeight: 900,
//     color: BRAND.primaryDarkBlue,
//   },
//   crumbSep: { opacity: 0.6 },

//   headerTools: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     flexWrap: "wrap",
//     justifyContent: "flex-end",
//     flex: "1 1 520px",
//   },

//   pillButton: {
//     display: "inline-flex",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: "10px 14px",
//     borderRadius: 999,
//     border: `2px solid ${BRAND.primaryDarkBlue}`,
//     color: BRAND.primaryDarkBlue,
//     background: BRAND.card,
//     fontWeight: 900,
//     fontSize: 13,
//     textDecoration: "none",
//     cursor: "pointer",
//     userSelect: "none",
//     transition: "background 120ms ease",
//     whiteSpace: "nowrap",
//   },

//   // View toggle
//   viewToggleWrap: {
//     display: "inline-flex",
//     alignItems: "center",
//     borderRadius: 999,
//     border: `2px solid rgba(35,32,115,0.18)`,
//     background: "rgba(255,255,255,0.85)",
//     boxShadow: "0 10px 20px rgba(17,24,39,0.06)",
//     padding: 4,
//     gap: 4,
//   },
//   viewToggleBtn: {
//     border: "none",
//     cursor: "pointer",
//     padding: "9px 12px",
//     borderRadius: 999,
//     fontWeight: 950,
//     fontSize: 12,
//     color: BRAND.primaryDarkBlue,
//     background: "transparent",
//     transition: "background 120ms ease, transform 120ms ease",
//     whiteSpace: "nowrap",
//   },
//   viewToggleBtnActive: {
//     background: BRAND.primaryLightBlue,
//     transform: "translateY(-0.5px)",
//   },

//   // Top search bar area
//   searchWrap: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     flexWrap: "wrap",
//   },
//   searchHint: {
//     fontSize: 11,
//     fontWeight: 800,
//     color: BRAND.grey,
//   },

//   body: {
//     padding: 20,
//   },
//   grid: {
//     display: "grid",
//     gridTemplateColumns: "360px 1fr",
//     gap: 16,
//     alignItems: "start",
//   },
//   gridMobile: {
//     gridTemplateColumns: "1fr",
//   },
// };

// function useIsNarrow(breakpointPx = 980) {
//   const [narrow, setNarrow] = React.useState(() => {
//     if (typeof window === "undefined") return false;
//     return window.innerWidth < breakpointPx;
//   });

//   React.useEffect(() => {
//     const onResize = () => setNarrow(window.innerWidth < breakpointPx);
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, [breakpointPx]);

//   return narrow;
// }

// export default function LocationsVisualizePage() {
//   const filters = useVisualizeFilters();
//   const isNarrow = useIsNarrow(980);

//   // ✅ Single source of truth: store viewMode
//   const viewMode = filters.viewMode || "orgs";
//   const isOrgsView = viewMode === "orgs";

//   const orgsUrl = useMemo(() => {
//     return buildMainOrgsUrlFromFilters("/participants/organizations", filters, {
//       includeOrgIds: (filters.orgIds?.size || 0) > 0,
//     });
//   }, [filters]);

//   const hasOrgSelection = (filters.orgIds?.size || 0) > 0;

//   const viewSubtitle = useMemo(() => {
//     if (viewMode === "orgs") return "Explore organizations and production locations";
//     if (viewMode === "tax") return "Explore tax incentive regions and programs";
//     if (viewMode === "geodata") return "Explore country-level geo + population metrics";
//     if (viewMode === "cloud") return "Explore cloud provider regions and zones";
//     return "";
//   }, [viewMode]);

//   const onSwitchView = (nextKey) => {
//     // switching views should close any active modal + clear highlight (store handles it too, but this is safe)
//     closeViewItemModal();
//     setStoreViewMode(nextKey);
//   };

//   return (
//     <div style={styles.page}>
//       {/* Modal (non-org views) */}
//       <ViewInfoModal
//         isOpen={!!filters.selectedViewItem && viewMode !== "orgs"}
//         viewType={filters.selectedViewType}
//         item={filters.selectedViewItem}
//         onClose={() => closeViewItemModal()}
//       />

//       {/* Header */}
//       <header style={styles.header}>
//         <div style={styles.headerRow}>
//           {/* Left: Breadcrumbs + Search */}
//           <div style={styles.leftHeader}>
//             {/* Clickable breadcrumbs (exact trail) */}
//             <div style={styles.breadcrumbs}>
//               <Link to="/" style={styles.crumbLink}>
//                 ME-NEXUS
//               </Link>
//               <span style={styles.crumbSep}>›</span>

//               <Link to="/participants" style={styles.crumbLink}>
//                 Participants
//               </Link>
//               <span style={styles.crumbSep}>›</span>

//               <Link to="/participants/organizations" style={styles.crumbLink}>
//                 Organizations
//               </Link>
//               <span style={styles.crumbSep}>›</span>

//               <Link
//                 to="/participants/organizations/production-locations"
//                 style={styles.crumbLink}
//               >
//                 Locations
//               </Link>
//               <span style={styles.crumbSep}>›</span>
//               <span style={styles.crumbCurrent}>Visualize</span>

//               <span style={{ opacity: 0.6, marginLeft: 8 }}>•</span>
//               <span style={{ fontWeight: 900, color: BRAND.primaryDarkBlue }}>
//                 {viewSubtitle}
//               </span>
//             </div>

//             {/* Org search bar (ONLY in Orgs view) */}
//             {isOrgsView ? (
//               <div style={styles.searchWrap}>
//                 <OrgSuggestSearch viewMode={viewMode} />

//                 {hasOrgSelection ? (
//                   <button
//                     type="button"
//                     style={styles.pillButton}
//                     onMouseEnter={(e) =>
//                       (e.currentTarget.style.background = BRAND.primaryLightBlue)
//                     }
//                     onMouseLeave={(e) =>
//                       (e.currentTarget.style.background = BRAND.card)
//                     }
//                     onClick={() => setVisualizeFilters({ orgIds: [] })}
//                     title="Clear selected organizations"
//                   >
//                     Clear orgs
//                   </button>
//                 ) : (
//                   <span style={styles.searchHint}>
//                     Tip: search an org to jump into org-level map mode
//                   </span>
//                 )}
//               </div>
//             ) : (
//               <div style={styles.searchWrap}>
//                 <span style={styles.searchHint}>
//                   Orgs + city drilldown are disabled in this view.
//                   <span style={{ marginLeft: 10, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
//                     Click a pin to open details.
//                   </span>
//                 </span>
//               </div>
//             )}
//           </div>

//           {/* Right actions */}
//           <div style={styles.headerTools}>
//             {/* View toggle (no routes) */}
//             <div style={styles.viewToggleWrap} aria-label="Select visualization view">
//               {VIEW_MODES.map((m) => {
//                 const active = viewMode === m.key;
//                 return (
//                   <button
//                     key={m.key}
//                     type="button"
//                     style={{
//                       ...styles.viewToggleBtn,
//                       ...(active ? styles.viewToggleBtnActive : null),
//                     }}
//                     onClick={() => onSwitchView(m.key)}
//                     title={`Switch to ${m.label}`}
//                   >
//                     {m.label}
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Orgs-table deep link ONLY makes sense in Orgs view */}
//             {isOrgsView ? (
//               <a
//                 href={orgsUrl}
//                 style={styles.pillButton}
//                 onMouseEnter={(e) =>
//                   (e.currentTarget.style.background = BRAND.primaryLightBlue)
//                 }
//                 onMouseLeave={(e) =>
//                   (e.currentTarget.style.background = BRAND.card)
//                 }
//                 title="Open the main Organizations table with these filters applied"
//               >
//                 View in Orgs Table
//               </a>
//             ) : null}

//             <a
//               href="https://me-dmz.com"
//               target="_blank"
//               rel="noreferrer"
//               style={{
//                 color: BRAND.ink,
//                 fontWeight: 1100,
//                 textDecoration: "none",
//                 border: "1px solid rgba(30,42,120,0.18)",
//                 padding: "8px 10px",
//                 borderRadius: 12,
//                 background: "rgba(255,255,255,0.85)",
//                 boxShadow: "0 10px 20px rgba(17,24,39,0.06)",
//               }}
//               title="Open ME-NEXUS"
//             >
//               ME-NEXUS ↗
//             </a>
//           </div>
//         </div>
//       </header>

//       {/* Body */}
//       <main style={styles.body}>
//         <div style={{ ...styles.grid, ...(isNarrow ? styles.gridMobile : null) }}>
//           <section>
//             <LocationsFilters viewMode={viewMode} />
//           </section>

//           <section>
//             <LocationsMap viewMode={viewMode} />
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }


// src/pages/LocationsVisualizePage.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

import LocationsMap from "../components/LocationsMap";
import LocationsFilters from "../components/LocationFilters";
import OrgSuggestSearch from "../components/OrgSuggestSearch";
import ViewInfoModal from "../components/ViewInfoModal";
import {
  useVisualizeFilters,
  buildMainOrgsUrlFromFilters,
  setVisualizeFilters,
  setViewMode as setStoreViewMode,
  closeViewItemModal,
} from "../state/visualizeFiltersStore";

const BRAND = {
  primaryLightBlue: "#CEECF2",
  primaryDarkBlue: "#232073",
  secondaryGreen: "#3AA608",
  secondaryOrange: "#D97218",
  secondaryYellow: "#F2C53D",
  grey: "#747474",
  lightGrey: "#D9D9D9",
  bg: "#F7F7F8",
  card: "#FFFFFF",
  border: "#E5E7EB",
  ink: "#111827",
};

const VIEW_MODES = [
  { key: "orgs", label: "Orgs View" },
  { key: "tax", label: "Tax Regions" },
  { key: "geodata", label: "Geodata" },
  { key: "cloud", label: "Cloud Regions" },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: BRAND.bg,
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    color: BRAND.ink,
  },
  header: {
    background: BRAND.card,
    borderBottom: `1px solid ${BRAND.border}`,
    padding: "14px 20px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  leftHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 280,
    flex: "1 1 560px",
  },
  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    fontSize: 13,
    color: BRAND.grey,
  },
  crumbLink: {
    color: BRAND.grey,
    textDecoration: "none",
    fontWeight: 800,
  },
  crumbCurrent: {
    fontWeight: 900,
    color: BRAND.primaryDarkBlue,
  },
  crumbSep: { opacity: 0.6 },

  headerTools: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: "1 1 520px",
  },

  pillButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 999,
    border: `2px solid ${BRAND.primaryDarkBlue}`,
    color: BRAND.primaryDarkBlue,
    background: BRAND.card,
    fontWeight: 900,
    fontSize: 13,
    textDecoration: "none",
    cursor: "pointer",
    userSelect: "none",
    transition: "background 120ms ease",
    whiteSpace: "nowrap",
  },

  // View toggle
  viewToggleWrap: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: `2px solid rgba(35,32,115,0.18)`,
    background: "rgba(255,255,255,0.85)",
    boxShadow: "0 10px 20px rgba(17,24,39,0.06)",
    padding: 4,
    gap: 4,
  },
  viewToggleBtn: {
    border: "none",
    cursor: "pointer",
    padding: "9px 12px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 12,
    color: BRAND.primaryDarkBlue,
    background: "transparent",
    transition: "background 120ms ease, transform 120ms ease",
    whiteSpace: "nowrap",
  },
  viewToggleBtnActive: {
    background: BRAND.primaryLightBlue,
    transform: "translateY(-0.5px)",
  },

  // Top search bar area
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  searchHint: {
    fontSize: 11,
    fontWeight: 800,
    color: BRAND.grey,
  },

  body: {
    padding: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: 16,
    alignItems: "start",
  },
  gridMobile: {
    gridTemplateColumns: "1fr",
  },
};

function useIsNarrow(breakpointPx = 980) {
  const [narrow, setNarrow] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpointPx;
  });

  React.useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpointPx);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpointPx]);

  return narrow;
}
const base = import.meta.env.VITE_API_BASE;
export default function LocationsVisualizePage() {
  const filters = useVisualizeFilters();
  const isNarrow = useIsNarrow(980);

  // ✅ Single source of truth: store viewMode
  const viewMode = filters.viewMode || "orgs";
  const isOrgsView = viewMode === "orgs";

  const orgsUrl = useMemo(() => {
    return buildMainOrgsUrlFromFilters("/participants/organizations", filters, {
      includeOrgIds: (filters.orgIds?.size || 0) > 0,
    });
  }, [filters]);

  const hasOrgSelection = (filters.orgIds?.size || 0) > 0;

  const viewSubtitle = useMemo(() => {
    if (viewMode === "orgs") return "Explore organizations and production locations";
    if (viewMode === "tax") return "Explore tax incentive regions and programs";
    if (viewMode === "geodata") return "Explore country-level geo + population metrics";
    if (viewMode === "cloud") return "Explore cloud provider regions and zones";
    return "";
  }, [viewMode]);

  const onSwitchView = (nextKey) => {
    // switching views should close any active modal + clear highlight (store handles it too, but this is safe)
    closeViewItemModal();
    setStoreViewMode(nextKey);
  };

  return (
    <div style={styles.page}>
      {/* Modal (non-org views) */}
      <ViewInfoModal
        isOpen={!!filters.selectedViewItem && viewMode !== "orgs"}
        // ✅ Use active viewMode as the viewType so modal never mismatches store state.
        viewType={viewMode !== "orgs" ? viewMode : null}
        item={filters.selectedViewItem}
        onClose={() => closeViewItemModal()}
      />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerRow}>
          {/* Left: Breadcrumbs + Search */}
          <div style={styles.leftHeader}>
            {/* Clickable breadcrumbs (exact trail) */}
            <div style={styles.breadcrumbs}>
              <Link to="/" style={styles.crumbLink}>
                ME-NEXUS
              </Link>
              <span style={styles.crumbSep}>›</span>

              <Link to="/participants" style={styles.crumbLink}>
                Participants
              </Link>
              <span style={styles.crumbSep}>›</span>

              <Link to="/participants/organizations" style={styles.crumbLink}>
                Organizations
              </Link>
              <span style={styles.crumbSep}>›</span>

              <Link
                to="/participants/organizations/production-locations"
                style={styles.crumbLink}
              >
                Locations
              </Link>
              <span style={styles.crumbSep}>›</span>
              <span style={styles.crumbCurrent}>Visualize</span>

              <span style={{ opacity: 0.6, marginLeft: 8 }}>•</span>
              <span style={{ fontWeight: 900, color: BRAND.primaryDarkBlue }}>
                {viewSubtitle}
              </span>
            </div>

            {/* Org search bar (ONLY in Orgs view) */}
            {isOrgsView ? (
              <div style={styles.searchWrap}>
                <OrgSuggestSearch viewMode={viewMode} />

                {hasOrgSelection ? (
                  <button
                    type="button"
                    style={styles.pillButton}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = BRAND.primaryLightBlue)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = BRAND.card)
                    }
                    onClick={() => setVisualizeFilters({ orgIds: [] })}
                    title="Clear selected organizations"
                  >
                    Clear orgs
                  </button>
                ) : (
                  <span style={styles.searchHint}>
                    Tip: search an org to jump into org-level map mode
                  </span>
                )}
              </div>
            ) : (
              <div style={styles.searchWrap}>
                <span style={styles.searchHint}>
                  Orgs + city drilldown are disabled in this view.
                  <span style={{ marginLeft: 10, fontWeight: 900, color: BRAND.primaryDarkBlue }}>
                    Click a pin to open details.
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={styles.headerTools}>
            {/* View toggle (no routes) */}
            <div style={styles.viewToggleWrap} aria-label="Select visualization view">
              {VIEW_MODES.map((m) => {
                const active = viewMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    style={{
                      ...styles.viewToggleBtn,
                      ...(active ? styles.viewToggleBtnActive : null),
                    }}
                    onClick={() => onSwitchView(m.key)}
                    title={`Switch to ${m.label}`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Orgs-table deep link ONLY makes sense in Orgs view */}
            {isOrgsView ? (
              <a
                href={orgsUrl}
                style={styles.pillButton}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = BRAND.primaryLightBlue)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = BRAND.card)
                }
                title="Open the main Organizations table with these filters applied"
              >
                View in Orgs Table
              </a>
            ) : null}

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
        </div>
      </header>

      {/* Body */}
      <main style={styles.body}>
        <div style={{ ...styles.grid, ...(isNarrow ? styles.gridMobile : null) }}>
          <section>
            <LocationsFilters viewMode={viewMode} />
          </section>

          <section>
            <LocationsMap viewMode={viewMode} />
          </section>
        </div>
      </main>
    </div>
  );
}

