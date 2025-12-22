import React from "react";
import { HashRouter, Routes, Route, Outlet } from "react-router-dom";

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

import AuthPage from "./pages/Auth.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

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
        <a href="https://me-dmz.com" target="_blank" rel="noreferrer">
          <div className="text-xl font-bold tracking-wide">ME-DMZ</div>
        </a>

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
        <Route path="/auth" element={<AuthPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<OrganizationsSearch />} />

          <Route path="/hub" element={<ParticipantsHub />} />
          <Route path="/home_relationships" element={<HomeRelationships />} />
          <Route path="/organizations" element={<OrganizationsSearch />} />
          <Route path="/organizations/:id" element={<OrganizationProfile />} />
          <Route path="/organizations/:id/schema" element={<OrganizationSchema />} />

          <Route path="/functional_types" element={<FunctionalTypes />} />
          <Route path="/content_types" element={<ContentTypes />} />
          <Route path="/services" element={<Services />} />
          <Route path="/production_locations" element={<ProductionLocations />} />
          <Route path="/sales_regions/:region" element={<SalesRegionDetails />} />
          <Route path="/countries/:country" element={<CountryDetails />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/infrastructure/:name" element={<InfrastructureDetails />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
