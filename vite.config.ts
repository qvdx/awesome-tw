import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'AwesomeTW',
        namespace: 'https://github.com/qvdx/awesome-tw',
        version: '0.1.0-alpha.1',
        description: 'Utilitários para o Tribalwars (tribalwars.com.br)',
        author: 'qvdx',
        match: ['*://*.tribalwars.com.br/*'],
        grant: [],
        updateURL: 'https://github.com/qvdx/awesome-tw/releases/latest/download/awesometw.user.js',
        downloadURL: 'https://github.com/qvdx/awesome-tw/releases/latest/download/awesometw.user.js',
      },
      build: {
        fileName: 'awesometw.user.js',
      },
    }),
  ],
})
