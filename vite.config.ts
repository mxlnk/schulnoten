import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import license from 'rollup-plugin-license'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/schulnoten/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Schulnoten',
        short_name: 'Schulnoten',
        description:
          'Noten erfassen, gewichten und berechnen – alle Daten bleiben auf dem eigenen Gerät.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Registers the installed app as a handler for .noten files, so
        // double-clicking one in the OS opens it here (see useFileIntegration).
        file_handlers: [
          { action: base, accept: { 'application/x-noten': ['.noten'] } },
        ],
        launch_handler: { client_mode: 'focus-existing' },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      plugins: [
        license({
          thirdParty: {
            output: {
              file: path.resolve(__dirname, 'dist', 'licenses.txt'),
              template(dependencies) {
                return dependencies
                  .map(dep =>
                    `${dep.name} ${dep.version}\n` +
                    `License: ${dep.license}\n` +
                    (dep.author ? `Author: ${typeof dep.author === 'string' ? dep.author : dep.author.name}\n` : '') +
                    `\n${dep.licenseText || 'No license text available.'}`
                  )
                  .join('\n\n---\n\n')
              },
            },
          },
        }),
      ],
    },
  },
})
