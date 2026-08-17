import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'Awesome TW Scripts',
        namespace: 'https://github.com/qvdx/awesome-tw-scripts',
        version: '0.1.0',
        description: 'Utilitários para o Tribalwars (tribalwars.com.br)',
        author: 'qvdx',
        match: ['*://*.tribalwars.com.br/*'],
        grant: [],
      },
      build: {
        fileName: 'awesome-tw-scripts.user.js',
      },
    }),
  ],
})
