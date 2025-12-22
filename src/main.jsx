import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "maplibre-gl/dist/maplibre-gl.css";

// Placeholder wrapper for upcoming global providers (Auth, Bookmarks, etc.).
// We'll replace the body once we add those modules.
function AppProviders({ children }) {
  return children;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
