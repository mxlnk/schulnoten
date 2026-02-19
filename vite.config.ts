import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import license from 'rollup-plugin-license'

// https://vite.dev/config/
export default defineConfig({
  base: '/schulnoten/',
  plugins: [react(), tailwindcss()],
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
