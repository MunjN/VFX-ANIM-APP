import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages deploy base.
export default defineConfig(({
  mode
}) => ({
  base: mode === "production" ? "/" : "/",
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

