import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      includeAssets: ["favicon.png", "icon-192.jpg", "icon-512.png"],

      manifest: {
        name: "Productivity Tracker",
        short_name: "Tracker",
        description: "Modern SaaS Productivity Tracking Platform",

        theme_color: "#5B5CEB",
        background_color: "#111827",

        display: "standalone",
        orientation: "portrait",
        start_url: "/",

        icons: [
          {
            src: "icon-192.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any maskable",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  server: {
    host: true,
    port: 5173,
    allowedHosts: [".loca.lt"],

    proxy: {
      "/api": {
        target:
          "http://ticket-tracker-env.eba-tdt98axn.eu-north-1.elasticbeanstalk.com",
        changeOrigin: true,
        secure: false,
      },

      "/socket.io": {
        target:
          "http://ticket-tracker-env.eba-tdt98axn.eu-north-1.elasticbeanstalk.com",
        ws: true,
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
      },
    },
  },
});
