// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'TravelMate Maps',
        short_name: 'TravelMate',
        description: 'Interactive travel maps and planner',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'img-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'img-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
    })
  ]
});
