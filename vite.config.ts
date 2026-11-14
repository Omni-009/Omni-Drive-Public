import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png', 'favicon.png'],
    manifest: {
      name: 'OmniDrive',
      short_name: 'OmniDrive',
      description: 'Google Drive storage gateway for files, folders, sharing, and quota tracking.',
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/all-files',
      scope: '/',
      orientation: 'portrait-primary',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallbackDenylist: [/^\/(auth|connected-accounts|files|folders|invites|provider-configs|public|storage|uploads)(\/|$)/],
      globPatterns: ['**/*.{js,css,html,svg,ico,png,webp,woff2}'],
    },
  }), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
