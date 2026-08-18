import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'

// única fonte de verdade pra versão — o workflow de release detecta uma
// release nova comparando esse valor com a última tag do git
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'AwesomeTW',
        namespace: 'https://github.com/qvdx/awesome-tw',
        version: pkg.version,
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
