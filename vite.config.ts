import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'

// única fonte de verdade pra versão — o workflow de release detecta uma
// release nova comparando esse valor com a última tag do git
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Vazio em builds locais/dev (sem a env var) — a telemetria fica sempre desligada
    // nesses builds, mesmo que o usuário ligue o opt-in. Só o build oficial de release
    // (GitHub Actions, com o secret SENTRY_DSN) sai com um DSN de verdade embutido.
    __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN ?? ''),
    // Mesma lógica do Sentry: chave vazia em builds locais/dev = analytics sempre desligado.
    __POSTHOG_KEY__: JSON.stringify(process.env.POSTHOG_API_KEY ?? ''),
    __POSTHOG_HOST__: JSON.stringify(process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com'),
  },
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
        // `unsafeWindow` é explícito de propósito: o build ganha `@grant GM_addStyle`
        // (por causa do CSS Modules), o que já tira o script do modo "sem sandbox" —
        // sem declarar unsafeWindow aqui, `game_data`/`TribalWars` do jogo ficam
        // inacessíveis pro script. `GM_xmlhttpRequest` é usado pela telemetria opt-in
        // (src/lib/telemetry.ts) — roda fora do contexto da página, então ignora o CSP
        // do jogo que bloquearia um fetch() puro pro Sentry.
        grant: ['unsafeWindow', 'GM_xmlhttpRequest'],
        // Declara os hosts de telemetria/analytics de antemão — sem isso, o Tampermonkey
        // pede confirmação em runtime na primeira vez que o script chama GM_xmlhttpRequest
        // pra um domínio desconhecido (pop-up no meio da execução). Um domínio aqui já
        // cobre os subdomínios (ex: o<id>.ingest.us.sentry.io, us.i.posthog.com), por
        // documentação do próprio Tampermonkey.
        connect: ['sentry.io', 'posthog.com'],
        updateURL: 'https://github.com/qvdx/awesome-tw/releases/latest/download/awesometw.user.js',
        downloadURL: 'https://github.com/qvdx/awesome-tw/releases/latest/download/awesometw.user.js',
      },
      server: {
        // sem isso, `unsafeWindow` não existe em modo dev — o script roda direto
        // na página (não sandboxado), então precisa desse shim pra ganhar o alias
        mountGmApi: true,
      },
      build: {
        fileName: 'awesometw.user.js',
      },
    }),
  ],
})
