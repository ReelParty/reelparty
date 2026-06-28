import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.io"],
    proxy: {
      "/api": "http://localhost:3001",
      "/join": "http://localhost:3001",
    },
    // ngrok breaks Vite's HMR websocket; after ~30s Vite full-reloads the page.
    // Tunnel mode is for mobile testing, not live file editing — disable HMR there.
    hmr: process.env.TUNNEL ? false : undefined,
  },
});
