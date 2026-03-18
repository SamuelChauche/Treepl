import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["images/icon-192.png", "images/icon-512.png"],
      manifest: {
        name: "Sofia EthCC Manager",
        short_name: "Sofia",
        description: "EthCC[9] conference companion — browse agenda, vote on topics, publish on-chain via Intuition Protocol",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/Treepl/",
        scope: "/Treepl/",
        icons: [
          {
            src: "images/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "images/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        globPatterns: ["**/*.{js,css,html,ico,png,webp,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: "/Treepl/",
  server: {
    proxy: {
      "/api/graphql": {
        target: "https://mainnet.intuition.sh",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/graphql/, "/v1/graphql"),
      },
    },
  },
});
