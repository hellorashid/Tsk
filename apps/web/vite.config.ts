import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
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
