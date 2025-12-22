// App.jsx
import React from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";

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

import BookmarksModal from "./bookmarks/BookmarksModal.jsx";

const BRAND_PURPLE = "#1d186d";

function AppShell() {
  const { logout } = useAuth();
  const [isBookmarksOpen, setIsBookmarksOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div
        className="w-full flex items-center justify-between px-6 py-4 text-white sticky top-0 z-50"
        style={{ backgroundColor: BRAND_PURPLE }}
      >
        <button onClick={() => navigate("/")}">
          <div className="text-xl font-bold tracking-wide">ME-DMZ</div>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBookmarksOpen(true)}
            className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
            style={{ backgroundColor: "transparent" }}
          >
            Bookmarks
          </button>

          <button
            onClick={() => logout({ redirect: true })}
            className="px-4 py-2 rounded-lg font-semibold hover:opacity-95 border border-white text-white"
            style={{ backgroundColor: "transparent" }}
          >
            Sign out
          </button>
        </div>
      </div>

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
      />

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
          {/* ✅ Choose ONE canonical "/" route to avoid conflicts */}
          <Route path="/" element={<HomeRelationships />} />

          {/* PARTICIPANTS */}
          <Route path="/participants" element={<ParticipantsHub />} />

          {/* PARTICIPANTS → ORGANIZATIONS */}
          <Route
            path="/participants/organizations"
            element={<OrganizationsSearch />}
          />

          {/* ORG DEFINITIONS */}
          <Route
            path="/participants/organizations/functional-types"
            element={<FunctionalTypes />}
          />
          <Route
            path="/participants/organizations/content-types"
            element={<ContentTypes />}
          />
          <Route
            path="/participants/organizations/services"
            element={<Services />}
          />

          {/* PRODUCTION LOCATIONS */}
          <Route
            path="/participants/organizations/production-locations"
            element={<ProductionLocations />}
          />
          <Route
            path="/participants/organizations/production-locations/regions/:region"
            element={<SalesRegionDetails />}
          />
          <Route
            path="/participants/organizations/production-locations/countries/:country"
            element={<CountryDetails />}
          />

          {/* INFRA */}
          <Route
            path="/participants/organizations/infrastructure"
            element={<Infrastructure />}
          />
          <Route
            path="/participants/organizations/infrastructure/:infraName"
            element={<InfrastructureDetails />}
          />

          {/* ✅ IMPORTANT: schema must come BEFORE :orgId */}
          <Route
            path="/participants/organizations/schema"
            element={<OrganizationSchema />}
          />
          <Route
            path="/participants/organizations/:orgId"
            element={<OrganizationProfile />}
          />

          {/* PLACEHOLDERS */}
          <Route
            path="/participants/people"
            element={<div style={{ padding: 40 }}>People (coming soon)</div>}
          />
          <Route
            path="/tasks"
            element={<div style={{ padding: 40 }}>Tasks (coming soon)</div>}
          />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route
            path="/creative-works"
            element={<div style={{ padding: 40 }}>Creative Works (coming soon)</div>}
          />

          {/* Legacy/alias routes (keep old URLs working) */}
          <Route path="/participants/organizations/:id" element={<OrganizationProfile />} />
          <Route path="/participants/organizations/:id/schema" element={<OrganizationSchema />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

