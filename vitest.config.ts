import { defineConfig } from 'vitest/config'

// Config separada da de build (vite.config.ts): vite-plugin-monkey espera
// gerar um userscript de verdade e não tem nada a ver com rodar testes.
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
