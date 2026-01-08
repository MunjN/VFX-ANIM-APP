// import React from "react";
// import { HashRouter, Routes, Route, Outlet, useNavigate } from "react-router-dom";

// import ProtectedRoute from "./auth/ProtectedRoute.jsx";
// import { useAuth } from "./auth/AuthContext.jsx";
// import AuthPage from "./pages/Auth.jsx";

// import HomeRelationships from "./pages/HomeRelationships";
// import ParticipantsHub from "./pages/ParticipantsHub";
// import OrganizationsSearch from "./pages/OrganizationsSearch";
// import OrganizationProfile from "./pages/OrganizationProfile";
// import OrganizationSchema from "./pages/OrganizationSchema";

// import FunctionalTypes from "./pages/FunctionalTypes";
// import ContentTypes from "./pages/ContentTypes";
// import Services from "./pages/Services";
// import ProductionLocations from "./pages/ProductionLocations";
// import SalesRegionDetails from "./pages/SalesRegionDetails";
// import CountryDetails from "./pages/CountryDetails";
// import Infrastructure from "./pages/Infrastructure";
// import InfrastructureDetails from "./pages/InfrastructureDetails";

// import OrgInsights from "./pages/OrgInsights";
// import InfraInsights from "./pages/InfraInsights";
// import LocationInsights from "./pages/LocationInsights";
// import ContentTypeInsights from "./pages/ContentTypeInsights";
// import ServiceInsights from "./pages/ServiceInsights";
// import CustomMedmzDataInsights from "./pages/CustomMedmzDataInsights";

// import BookmarksModal from "./bookmarks/BookmarksModal.jsx";

// const BRAND_PURPLE = "#1d186d";

// function AppShell() {
//   const navigate = useNavigate();
//   const { logout } = useAuth();
//   const [isBookmarksOpen, setIsBookmarksOpen] = React.useState(false);

//   return (
//     <div className="min-h-screen bg-white">
//       <div
//         className="w-full flex items-center justify-between px-6 py-4 text-white sticky top-0 z-50"
//         style={{ backgroundColor: BRAND_PURPLE }}
//       >
//         <button
//           type="button"
//           onClick={() => navigate("/")}
//           className="flex items-center"
//           style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
//           title="Go to home"
//         >
//           <div className="text-xl font-bold tracking-wide">ME-DMZ</div>
//         </button>

//         <div className="flex items-center gap-3">
//           {/* AI Infra Deployment (filled + accent, first from the left) */}
//           <a
//             href="https://ai-aws.me-dmz.com"
//             target="_blank"
//             rel="noreferrer"
//             className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white"
//             style={{
//               backgroundColor: "#CFEFF7", // accent fill (matches your ME-NEXUS brand fill)
//               color: BRAND_PURPLE,        // readable on the light fill
//               borderColor: "rgba(255,255,255,0.65)",
//               boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
//             }}
//             title="Open AI Infra Deployment"
//           >
//             AI Infra Deployment
//           </a>

//           <button
//             type="button"
//             onClick={() => setIsBookmarksOpen(true)}
//             className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
//             style={{ backgroundColor: "transparent" }}
//           >
//             Bookmarks
//           </button>

//           <button
//             type="button"
//             onClick={() => logout({ redirect: true })}
//             className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
//             style={{ backgroundColor: "transparent" }}
//           >
//             Sign out
//           </button>
//         </div>
//       </div>

//       <BookmarksModal
//         isOpen={isBookmarksOpen}
//         onClose={() => setIsBookmarksOpen(false)}
//       />

//       <div className="min-h-[calc(100vh-64px)]">
//         <Outlet />
//       </div>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <HashRouter>
//       <Routes>
//         {/* Public */}
//         <Route path="/auth" element={<AuthPage />} />

//         {/* Protected + Shell */}
//         <Route
//           element={
//             <ProtectedRoute>
//               <AppShell />
//             </ProtectedRoute>
//           }
//         >
//           {/* ✅ ONE canonical "/" route */}
//           <Route path="/" element={<HomeRelationships />} />

//           {/* PARTICIPANTS */}
//           <Route path="/participants" element={<ParticipantsHub />} />

//           {/* PARTICIPANTS → ORGANIZATIONS */}
//           <Route path="/participants/organizations" element={<OrganizationsSearch />} />

//           {/* ORG DEFINITIONS */}
//           <Route
//             path="/participants/organizations/functional-types"
//             element={<FunctionalTypes />}
//           />
//           <Route
//           path="/participants/organizations/insights/orgs"
//           element={<OrgInsights />}
//         />
//         <Route
//           path="/participants/organizations/insights/custom-medmz-data"
//           element={<CustomMedmzDataInsights />}
//         />
//         <Route
//           path="/participants/organizations/insights/infras"
//           element={<InfraInsights />}
//         />
//         <Route
//           path="/participants/organizations/insights/locations"
//           element={<LocationInsights />}
//         />
//         <Route
//           path="/participants/organizations/insights/content-types"
//           element={<ContentTypeInsights />}
//         />
//         <Route
//           path="/participants/organizations/insights/services"
//           element={<ServiceInsights />}
//         />

//           <Route
//             path="/participants/organizations/content-types"
//             element={<ContentTypes />}
//           />
//           <Route
//             path="/participants/organizations/services"
//             element={<Services />}
//           />

//           {/* PRODUCTION LOCATIONS */}
//           <Route
//             path="/participants/organizations/production-locations"
//             element={<ProductionLocations />}
//           />
//           <Route
//             path="/participants/organizations/production-locations/regions/:region"
//             element={<SalesRegionDetails />}
//           />
//           <Route
//             path="/participants/organizations/production-locations/countries/:country"
//             element={<CountryDetails />}
//           />

//           {/* INFRA */}
//           <Route
//             path="/participants/organizations/infrastructure"
//             element={<Infrastructure />}
//           />
//           <Route
//             path="/participants/organizations/infrastructure/:infraName"
//             element={<InfrastructureDetails />}
//           />

//           {/* ✅ IMPORTANT: schema must come BEFORE :orgId */}
//           <Route
//             path="/participants/organizations/schema"
//             element={<OrganizationSchema />}
//           />
//           <Route
//             path="/participants/organizations/:orgId"
//             element={<OrganizationProfile />}
//           />

//           {/* PLACEHOLDERS */}
//           <Route
//             path="/participants/people"
//             element={<div style={{ padding: 40 }}>People (coming soon)</div>}
//           />
//           <Route
//             path="/tasks"
//             element={<div style={{ padding: 40 }}>Tasks (coming soon)</div>}
//           />
//           <Route path="/infrastructure" element={<Infrastructure />} />
//           <Route
//             path="/creative-works"
//             element={<div style={{ padding: 40 }}>Creative Works (coming soon)</div>}
//           />

//           {/* Legacy/alias routes (keep old URLs working) */}
//           <Route
//             path="/participants/organizations/:id"
//             element={<OrganizationProfile />}
//           />
//           <Route
//             path="/participants/organizations/:id/schema"
//             element={<OrganizationSchema />}
//           />
//         </Route>
//       </Routes>
//     </HashRouter>
//   );
// }



import React from "react";
import { HashRouter, Routes, Route, Outlet, useNavigate } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import AuthPage from "./pages/Auth.jsx";

import HomeRelationships from "./pages/HomeRelationships";
import ParticipantsHub from "./pages/ParticipantsHub";
import OrganizationsSearch from "./pages/OrganizationsSearch";
import OrganizationProfile from "./pages/OrganizationProfile";
import OrganizationSchema from "./pages/OrganizationSchema";

import FunctionalTypes from "./pages/FunctionalTypes";
import ContentTypes from "./pages/ContentTypes";
import Services from "./pages/Services";
import ProductionLocations from "./pages/ProductionLocations";
import SalesRegionDetails from "./pages/SalesRegionDetails";
import CountryDetails from "./pages/CountryDetails";
import Infrastructure from "./pages/Infrastructure";
import InfrastructureDetails from "./pages/InfrastructureDetails";

import OrgInsights from "./pages/OrgInsights";
import InfraInsights from "./pages/InfraInsights";
import LocationInsights from "./pages/LocationInsights";
import ContentTypeInsights from "./pages/ContentTypeInsights";
import ServiceInsights from "./pages/ServiceInsights";
import CustomMedmzDataInsights from "./pages/CustomMedmzDataInsights";
import InfraVisualize from "./pages/infraVisualize";

import BookmarksModal from "./bookmarks/BookmarksModal.jsx";

const BRAND_PURPLE = "#1d186d";

function AppShell() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isBookmarksOpen, setIsBookmarksOpen] = React.useState(false);

  const goToInsights = () => navigate("/participants/organizations/insights/orgs");

  return (
    <div className="min-h-screen bg-white">
      <div
        className="w-full flex items-center justify-between px-6 py-4 text-white sticky top-0 z-50"
        style={{ backgroundColor: BRAND_PURPLE }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center"
          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
          title="Go to home"
        >
          <div className="text-xl font-bold tracking-wide">ME-DMZ</div>
        </button>

        <div className="flex items-center gap-3">
          {/* AI Infra Deployment (filled + accent, first from the left) */}
          <a
            href="https://ai-aws.me-dmz.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white"
            style={{
              backgroundColor: "#CFEFF7",
              color: BRAND_PURPLE,
              borderColor: "rgba(255,255,255,0.65)",
              boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
            }}
            title="Open AI Infra Deployment"
          >
            AI Infra Deployment
          </a>

          <button
            type="button"
            onClick={() => setIsBookmarksOpen(true)}
            className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
            style={{ backgroundColor: "transparent" }}
          >
            Bookmarks
          </button>

          {/* ✅ NEW: ME-DMZ Insights button (between Bookmarks and Sign out) */}
          <button
            type="button"
            onClick={goToInsights}
            className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
            style={{ backgroundColor: "transparent" }}
            title="Open ME-DMZ Insights"
          >
            ME-DMZ Insights
          </button>

          <button
            type="button"
            onClick={() => logout({ redirect: true })}
            className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
            style={{ backgroundColor: "transparent" }}
          >
            Sign out
          </button>
        </div>
      </div>

      <BookmarksModal isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} />

      <div className="min-h-[calc(100vh-64px)]">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected + Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* ✅ ONE canonical "/" route */}
          <Route path="/" element={<HomeRelationships />} />

          {/* PARTICIPANTS */}
          <Route path="/participants" element={<ParticipantsHub />} />

          {/* PARTICIPANTS → ORGANIZATIONS */}
          <Route path="/participants/organizations" element={<OrganizationsSearch />} />

          {/* ORG DEFINITIONS */}
          <Route path="/participants/organizations/functional-types" element={<FunctionalTypes />} />
          <Route path="/participants/organizations/insights/orgs" element={<OrgInsights />} />
          <Route path="/participants/organizations/insights/custom-medmz-data" element={<CustomMedmzDataInsights />} />
          <Route path="/participants/organizations/insights/infras" element={<InfraInsights />} />
          <Route path="/participants/organizations/insights/locations" element={<LocationInsights />} />
          <Route path="/participants/organizations/insights/content-types" element={<ContentTypeInsights />} />
          <Route path="/participants/organizations/insights/services" element={<ServiceInsights />} />

          <Route path="/participants/organizations/content-types" element={<ContentTypes />} />
          <Route path="/participants/organizations/services" element={<Services />} />

          {/* PRODUCTION LOCATIONS */}
          <Route path="/participants/organizations/production-locations" element={<ProductionLocations />} />
          <Route path="/participants/organizations/production-locations/regions/:region" element={<SalesRegionDetails />} />
          <Route path="/participants/organizations/production-locations/countries/:country" element={<CountryDetails />} />

          {/* INFRA */}
          <Route path="/participants/organizations/infrastructure" element={<Infrastructure />} />
          <Route path="/participants/organizations/infrastructure/visualize" element={<InfraVisualize />}/>
          <Route path="/participants/organizations/infrastructure/:infraName" element={<InfrastructureDetails />} />

          {/* ✅ IMPORTANT: schema must come BEFORE :orgId */}
          <Route path="/participants/organizations/schema" element={<OrganizationSchema />} />
          <Route path="/participants/organizations/:orgId" element={<OrganizationProfile />} />

          {/* PLACEHOLDERS */}
          <Route path="/participants/people" element={<div style={{ padding: 40 }}>People (coming soon)</div>} />
          <Route path="/tasks" element={<div style={{ padding: 40 }}>Tasks (coming soon)</div>} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/creative-works" element={<div style={{ padding: 40 }}>Creative Works (coming soon)</div>} />

          {/* Legacy/alias routes (keep old URLs working) */}
          <Route path="/participants/organizations/:id" element={<OrganizationProfile />} />
          <Route path="/participants/organizations/:id/schema" element={<OrganizationSchema />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

