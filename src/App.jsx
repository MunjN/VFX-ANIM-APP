import { HashRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute.jsx";
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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRelationships />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants"
          element={
            <ProtectedRoute>
              <ParticipantsHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations"
          element={
            <ProtectedRoute>
              <OrganizationsSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/functional-types"
          element={
            <ProtectedRoute>
              <FunctionalTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/content-types"
          element={
            <ProtectedRoute>
              <ContentTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/production-locations"
          element={
            <ProtectedRoute>
              <ProductionLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/production-locations/regions/:region"
          element={
            <ProtectedRoute>
              <SalesRegionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/production-locations/countries/:country"
          element={
            <ProtectedRoute>
              <CountryDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/infrastructure"
          element={
            <ProtectedRoute>
              <Infrastructure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/infrastructure/:infraName"
          element={
            <ProtectedRoute>
              <InfrastructureDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/schema"
          element={
            <ProtectedRoute>
              <OrganizationSchema />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/organizations/:orgId"
          element={
            <ProtectedRoute>
              <OrganizationProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/participants/people"
          element={
            <ProtectedRoute>
              <div style={{ padding: 40 }}>People (coming soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <div style={{ padding: 40 }}>Tasks (coming soon)</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/infrastructure"
          element={
            <ProtectedRoute>
              <Infrastructure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/creative-works"
          element={
            <ProtectedRoute>
              <div style={{ padding: 40 }}>Creative Works (coming soon)</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
