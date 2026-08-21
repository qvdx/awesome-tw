import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

// Config separada da de build (vite.config.ts): vite-plugin-monkey espera
// gerar um userscript de verdade e não tem nada a ver com rodar testes.
export default defineConfig({
  // Mesmos `define` do vite.config.ts, só que sem depender de env var — os testes de
  // src/lib/telemetry.ts e src/lib/analytics.ts não mandam evento de verdade (chave vazia
  // = sempre no-op).
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __SENTRY_DSN__: JSON.stringify(''),
    __POSTHOG_KEY__: JSON.stringify(''),
    __POSTHOG_HOST__: JSON.stringify(''),
  },
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
