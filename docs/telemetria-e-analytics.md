# Telemetria e analytics

Opt-in, **desligado por padrão**, um único toggle em **Configurações** (`isTelemetryEnabled`/`setTelemetryEnabled`, `src/lib/telemetry.ts`) controla o envio pras duas ferramentas usadas: Sentry (erro) e PostHog (uso). Nenhuma das duas usa o SDK oficial — são clientes escritos na mão (`GM_xmlhttpRequest`), pra manter o bundle pequeno e o controle total sobre o que é enviado.

## Identidade anônima

`getInstallId()` gera um `crypto.randomUUID()` na primeira vez que é chamado e guarda em `localStorage` (`awesometw:telemetry:install-id`) — reaproveitado como identificador em ambas as ferramentas. **Nunca** carrega nome de jogador, aldeia ou mundo; é só um ID aleatório por instalação do navegador.

## Sentry — só erro de verdade (`telemetry.ts`)

- `reportError({ feature, phase, error })`: chamado nos pontos críticos de autofarm/coleta quando uma exceção não tratada escapa do ciclo — não há handler global (`window.onerror`), só esses pontos específicos.
- Formato: envelope do Sentry (`{dsn, event_id, sent_at}\n{type:"event",...}\n{payload}`), `Content-Type: application/x-sentry-envelope`, `level: 'error'`.
- **Já teve** um reporte de "ciclo concluído" com heartbeat/transição de estado (pra não estourar a cota de 5k eventos/mês do free tier) — isso foi removido na 0.1.0-alpha.10 e virou o `cycle_completed` do PostHog abaixo, que não precisa desse throttle.

## PostHog — uso e adoção (`src/lib/analytics.ts`)

- `trackCycle({ feature, durationMs, success, itemsTotal?, itemsFailed?, villagesFailed? })`: chamado em **todo** ciclo de autofarm/coleta, sem amostragem — a cota do PostHog (1M eventos/mês) é folgada o bastante pra isso, diferente do Sentry.
- `trackFeatureToggled(feature, enabled)`: chamado sempre que um toggle de feature muda (via o hook `useFeatureToggle`, que substitui `useLocalStorage` direto em `App.tsx` pros 4 toggles de feature — autofarm, coleta, e os dois modificadores de tela). No `enabled: false`, calcula `durationMs` a partir do timestamp salvo quando a feature foi ligada (`awesometw:analytics:enabled-at:<feature>`); se a feature já estava ligada antes de existir esse rastreamento, o primeiro "desligar" não tem `durationMs` (sem baseline).
- Formato: `POST` pra `${host}/i/v0/e/`, body `{ api_key, event, distinct_id, properties, timestamp }`, `Content-Type: application/json`.

## Build

Chave/DSN injetados em build-time via `define` (`vite.config.ts`): `__SENTRY_DSN__` e `__POSTHOG_KEY__`/`__POSTHOG_HOST__`. **Vazios em builds locais/dev** — a telemetria fica sempre desligada nesses builds, mesmo com o opt-in ligado; só o build oficial de release (GitHub Actions, secrets `SENTRY_DSN`/`POSTHOG_API_KEY`/`POSTHOG_HOST`) sai com valores de verdade.

`@connect sentry.io` e `@connect posthog.com` são declarados no metadata do userscript — sem isso, o Tampermonkey interrompe a execução pedindo confirmação em runtime na primeira chamada de `GM_xmlhttpRequest` pra um host desconhecido.

## Falha de envio

Nunca lança — só loga no console (`falha ao enviar evento de telemetria`/`de analytics`, ou o status HTTP se o servidor recusar). Telemetria não pode, em nenhuma hipótese, derrubar a automação principal.
