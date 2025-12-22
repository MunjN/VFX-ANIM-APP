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

function AppShell() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1d186d] text-white font-black flex items-center justify-center">
            AI
          </div>
          <div className="font-bold tracking-wide text-gray-900">ME-DMZ</div>
        </div>

        <button
          onClick={() => logout({ redirect: true })}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:opacity-95"
        >
          Sign out
        </button>
      </div>

      <div className="min-h-[calc(100vh-56px)]">
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
          
                  {/* HOME */}
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
          
                  {/* PLACEHOLDERS (COMING NEXT) */}
                  <Route
                    path="/participants/people"
                    element={<div style={{ padding: 40 }}>People (coming soon)</div>}
                  />
                  <Route
                    path="/tasks"
                    element={<div style={{ padding: 40 }}>Tasks (coming soon)</div>}
                  />
                  <Route
                    path="/infrastructure"
                    element={<Infrastructure />}
                  />
                  <Route
                    path="/creative-works"
                    element={<div style={{ padding: 40 }}>Creative Works (coming soon)</div>}
                  />
                
        </Route>
      </Routes>
    </HashRouter>
  );
}
