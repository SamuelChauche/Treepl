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
      includeAssets: ["images/sofia-splash.png", "images/icon-512.png"],
      manifest: {
        name: "Sofia EthCC Manager",
        short_name: "Sofia",
        description: "EthCC[9] conference companion — browse agenda, vote on topics, publish on-chain via Intuition Protocol",
        theme_color: "#060a10",
        background_color: "#060a10",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "images/sofia-splash.png",
            sizes: "512x512",
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
        importScripts: ["push-sw.js"],
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-ethers": ["ethers"],
          "vendor-appkit": ["@reown/appkit", "@reown/appkit-adapter-ethers", "@reown/appkit/react"],
          "vendor-three": ["three", "postprocessing"],
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-qr": ["qrcode.react", "html5-qrcode"],
        },
      },
    },
  },
  base: "/",
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
