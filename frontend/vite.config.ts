import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MotoQFox POS',
        short_name: 'MotoQFox',
        description: 'Sistema de Punto de Venta para Taller de Motos',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/cashier',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/inventory\/products\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-productos',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /\/api\/branches\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-config',
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\/api\/taller\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-taller',
              expiration: { maxEntries: 300, maxAgeSeconds: 5 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /\/api\/pedidos\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-pedidos',
              expiration: { maxEntries: 100, maxAgeSeconds: 2 * 60 },
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: /\/api\/sales\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-sales',
              expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /\/api\/catalogo-servicios\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-catalogo',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
});
