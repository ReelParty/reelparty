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
    // ngrok terminates TLS on 443; without this, HMR tries wss://…:5173 → ERR_SSL_PROTOCOL_ERROR
    hmr: process.env.TUNNEL ? { clientPort: 443 } : undefined,
  },
});
