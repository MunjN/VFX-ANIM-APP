import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages deploy base.
// For production builds, assets must be served from "/VFX-ANIM-APP/".
export default defineConfig(({
  mode
}) => ({
  base: mode === "production" ? "/VFX-ANIM-APP/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5175",
        changeOrigin: true
      }
    }
  }
}));
