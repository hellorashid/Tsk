import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import { basicPdsProxyTarget, stripBasicPdsProxyPrefix } from "./src/basicDevProxy";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/__basic-pds": {
        target: "https://pds.basic.id",
        changeOrigin: true,
        secure: true,
        ws: true,
        router(req) {
          return basicPdsProxyTarget(req.url ?? "");
        },
        rewrite: stripBasicPdsProxyPrefix,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'tsk',
        short_name: 'tsk',
        description: 'tsk - cozy task manager',
        theme_color: '#1F1B2F',
        background_color: '#1F1B2F',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          {
            src: 'tsk-logo-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'tsk-logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'tsk-logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2,webmanifest}'],
        runtimeCaching: []
      }
    })
  ],
});
