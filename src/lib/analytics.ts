import { getInstallId, isTelemetryEnabled } from './telemetry'

const FEATURE_ENABLED_AT_PREFIX = 'awesometw:analytics:enabled-at:'

type GMXhrResponse = { status: number; statusText: string; responseText: string }

type GMXhrDetails = {
  method: 'POST'
  url: string
  headers?: Record<string, string>
  data?: string
  onload?: (response: GMXhrResponse) => void
  onerror?: (response: unknown) => void
}

declare global {
  function GM_xmlhttpRequest(details: GMXhrDetails): void
}

// Mesmo padrão do telemetry.ts: injetados em build-time via `define` (vite.config.ts e
// vitest.config.ts). Chave vazia em builds locais/dev = analytics sempre desligado, mesmo
// com o opt-in ligado — só o build oficial de release sai com a chave de verdade.
declare const __POSTHOG_KEY__: string
declare const __POSTHOG_HOST__: string

function capture(event: string, properties: Record<string, unknown>): void {
  if (!isTelemetryEnabled()) return
  if (!__POSTHOG_KEY__) return

  const body = JSON.stringify({
    api_key: __POSTHOG_KEY__,
    event,
    distinct_id: getInstallId(),
    properties,
    timestamp: new Date().toISOString(),
  })

  GM_xmlhttpRequest({
    method: 'POST',
    url: `${__POSTHOG_HOST__}/i/v0/e/`,
    headers: { 'Content-Type': 'application/json' },
    data: body,
    // analytics nunca pode derrubar a automação principal — só loga, nunca lança.
    onload: (response) => {
      if (response.status < 200 || response.status >= 300) {
        console.error(`[awesometw] PostHog recusou o evento de analytics (status ${response.status})`, response.responseText)
      }
    },
    onerror: (response) => {
      console.error('[awesometw] falha ao enviar evento de analytics', response)
    },
  })
}

/**
 * Reporta todo ciclo de autofarm/coleta, sem throttle — diferente do reportError (Sentry),
 * a cota do PostHog (1M eventos/mês) é folgada o bastante pra dar média/tendência de verdade
 * sem precisar agregar nada aqui. É a nova casa dessa responsabilidade, que saiu do Sentry.
 */
export function trackCycle(params: {
  feature: string
  durationMs: number
  success: boolean
  itemsTotal?: number
  itemsFailed?: number
  villagesFailed?: number
}): void {
  const { feature, durationMs, success, itemsTotal, itemsFailed, villagesFailed } = params
  capture('cycle_completed', { feature, success, durationMs, itemsTotal, itemsFailed, villagesFailed })
}

/**
 * Reporta quando uma automação/modificador é ligado ou desligado. No desligar, calcula
 * quanto tempo a feature ficou ativa nessa janela (a partir do timestamp salvo no ligar) —
 * é o que responde "por quanto tempo essa feature fica ativa" sem precisar de heartbeat.
 * Com telemetria desligada, não grava nenhum estado (mesma postura de privacidade do resto).
 */
export function trackFeatureToggled(feature: string, enabled: boolean): void {
  if (!isTelemetryEnabled()) return

  const key = `${FEATURE_ENABLED_AT_PREFIX}${feature}`

  if (enabled) {
    localStorage.setItem(key, String(Date.now()))
    capture('feature_toggled', { feature, enabled: true })
    return
  }

  const enabledAt = Number(localStorage.getItem(key) ?? 0)
  const durationMs = enabledAt > 0 ? Date.now() - enabledAt : undefined
  localStorage.removeItem(key)
  capture('feature_toggled', { feature, enabled: false, durationMs })
}
