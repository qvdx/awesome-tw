const TELEMETRY_ENABLED_KEY = 'awesometw:telemetry:enabled'
const INSTALL_ID_KEY = 'awesometw:telemetry:install-id'

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
  // API do Tampermonkey, injetada por causa do `@grant GM_xmlhttpRequest` — roda fora do
  // contexto da página, então ignora o CSP do tribalwars.com.br que bloquearia um fetch() puro.
  function GM_xmlhttpRequest(details: GMXhrDetails): void
}

// Injetados em build-time via `define` no vite.config.ts (e no vitest.config.ts, pros testes).
// `__SENTRY_DSN__` vem vazio em builds locais/dev — nesse caso a telemetria não manda nada,
// mesmo que o usuário tenha ligado o opt-in (ver `sendEvent`).
declare const __SENTRY_DSN__: string
declare const __APP_VERSION__: string

export function isTelemetryEnabled(): boolean {
  return localStorage.getItem(TELEMETRY_ENABLED_KEY) === 'true'
}

export function setTelemetryEnabled(enabled: boolean): void {
  localStorage.setItem(TELEMETRY_ENABLED_KEY, String(enabled))
}

/** ID aleatório, sem qualquer relação com jogador/aldeia/mundo — só pra agrupar eventos da mesma instalação. */
export function getInstallId(): string {
  const existing = localStorage.getItem(INSTALL_ID_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(INSTALL_ID_KEY, id)
  return id
}

type ParsedDsn = { host: string; projectId: string }

/** Extrai host + project id de um DSN do Sentry (`https://<public_key>@<host>/<project_id>`). Exportado só pra teste direto. */
export function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace(/^\//, '')
    if (!url.username || !projectId) return null
    return { host: url.host, projectId }
  } catch {
    return null
  }
}

type TelemetryEvent = {
  level: 'error' | 'warning' | 'info'
  message: string
  tags: Record<string, string>
  extra?: Record<string, unknown>
}

function sendEvent(event: TelemetryEvent): void {
  if (!isTelemetryEnabled()) return

  const parsed = parseDsn(__SENTRY_DSN__)
  if (!parsed) return

  const body = JSON.stringify({
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    release: __APP_VERSION__,
    level: event.level,
    message: event.message,
    tags: { installId: getInstallId(), ...event.tags },
    extra: event.extra,
  })

  const envelope = [
    JSON.stringify({ dsn: __SENTRY_DSN__, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event', length: new TextEncoder().encode(body).length, content_type: 'application/json' }),
    body,
  ].join('\n')

  GM_xmlhttpRequest({
    method: 'POST',
    url: `https://${parsed.host}/api/${parsed.projectId}/envelope/`,
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    data: envelope,
    // telemetria nunca pode derrubar a automação principal — por isso só loga, nunca lança.
    // Sem isso, uma falha de envio (DSN errado, envelope rejeitado, rede) ficava invisível.
    onload: (response) => {
      if (response.status < 200 || response.status >= 300) {
        console.error(`[awesometw] Sentry recusou o evento de telemetria (status ${response.status})`, response.responseText)
      }
    },
    onerror: (response) => {
      console.error('[awesometw] falha ao enviar evento de telemetria', response)
    },
  })
}

export function reportError(params: { feature: string; phase: string; error: unknown }): void {
  const { feature, phase, error } = params
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  sendEvent({
    level: 'error',
    message: `[${feature}] ${message}`,
    tags: { feature, phase },
    extra: stack ? { stack } : undefined,
  })
}
