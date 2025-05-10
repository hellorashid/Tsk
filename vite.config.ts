import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'tsk',
        short_name: 'tsk',
        description: 'tsk - cozy task manager',
        theme_color: '#ffffff',
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
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        runtimeCaching: []
      }
    })
  ],
});
