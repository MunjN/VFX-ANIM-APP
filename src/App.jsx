import { HashRouter, Routes, Route } from "react-router-dom";

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
      </Routes>
    </HashRouter>
  );
}
