import { defineConfig } from 'vitest/config'

// Config separada da de build (vite.config.ts): vite-plugin-monkey espera
// gerar um userscript de verdade e não tem nada a ver com rodar testes.
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx'],
    },
  },
})
