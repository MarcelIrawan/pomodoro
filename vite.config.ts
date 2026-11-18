import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['manifest.webmanifest', 'offline.html', 'favicon.svg'],
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/offline.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
