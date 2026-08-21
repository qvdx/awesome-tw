import { loadAutoFarmConfig } from './autoFarmConfig'
import { cacheKey } from './features'
import { runAutoFarmOnce, type AutoFarmProgress } from './runAutoFarmOnce'

const MIN_INTERVAL_MS = 60_000
const NEXT_RUN_KEY = cacheKey('auto-farm-next-run-at')

export type AutoFarmSchedulerCallbacks = {
  onProgress?: (progress: AutoFarmProgress) => void
  /** timestamp (ms) da próxima execução agendada — pra alimentar o contador regressivo do banner */
  onNextRunAt?: (nextRunAt: number) => void
  /** ciclo começou e ainda está buscando o assistente de saque das aldeias — antes de saber quantos envios vai ter */
  onChecking?: () => void
}

function loadNextRunAt(): number | null {
  const raw = localStorage.getItem(NEXT_RUN_KEY)
  const value = raw ? Number(raw) : NaN
  return Number.isFinite(value) ? value : null
}

function saveNextRunAt(timestamp: number): void {
  localStorage.setItem(NEXT_RUN_KEY, String(timestamp))
}

/**
 * Limpa o horário de próxima execução salvo — chame antes de ligar o toggle
 * de novo pra forçar um ciclo do zero em vez de retomar a agenda antiga.
 *
 * De propósito, isso NÃO acontece sozinho no `stop()` devolvido por
 * `startAutoFarmLoop`: esse cleanup também dispara no double-invoke de
 * efeitos do StrictMode (dev) e em qualquer remontagem do componente — não
 * só quando o usuário desliga o toggle de verdade. Chamar isso ali de novo
 * apagava o agendamento a cada troca de tela, cancelando a contagem
 * regressiva que o resto deste arquivo existe pra preservar.
 */
export function resetAutoFarmSchedule(): void {
  localStorage.removeItem(NEXT_RUN_KEY)
}

/**
 * Dispara um ciclo e se reagenda sozinho a cada `intervalMinutes` (relido do
 * localStorage a cada ciclo, então mudanças na config valem a partir do
 * próximo ciclo sem precisar desligar/religar). Retorna uma função pra parar
 * o loop.
 *
 * O jogo não é uma SPA — cada navegação recarrega a página inteira e reseta
 * todo o contexto JS, o que destruiria esse loop e recriaria um novo do zero
 * a cada troca de tela. Pra não perder a contagem regressiva (nem disparar
 * um ciclo novo a cada navegação), o horário da próxima execução fica salvo
 * no localStorage: ao (re)montar, se ainda não venceu, retoma o tempo que
 * falta em vez de rodar na hora. Pra forçar um ciclo do zero (ex: religando
 * o toggle manualmente), use `resetAutoFarmSchedule()` antes de chamar essa
 * função de novo.
 */
export function startAutoFarmLoop(villageIds: number[], callbacks?: AutoFarmSchedulerCallbacks): () => void {
  let stopped = false
  let timeoutId: number | undefined
  const controller = new AbortController()

  function scheduleNext(delayMs: number) {
    const nextRunAt = Date.now() + delayMs
    saveNextRunAt(nextRunAt)
    callbacks?.onNextRunAt?.(nextRunAt)
    if (!stopped) timeoutId = window.setTimeout(runCycle, delayMs)
  }

  async function runCycle() {
    if (stopped) return

    const config = loadAutoFarmConfig()
    callbacks?.onChecking?.()

    try {
      await runAutoFarmOnce(
        villageIds,
        {
          minDelayMs: config.minDelaySeconds * 1000,
          maxDelayMs: config.maxDelaySeconds * 1000,
          maxWallLevel: config.maxWallLevel,
          maxDistance: config.maxDistance,
          signal: controller.signal,
        },
        callbacks?.onProgress,
      )
    } catch (error) {
      console.error('[awesometw] falha no ciclo de autofarm, tentando de novo no próximo ciclo', error)
    }

    if (!stopped) {
      const intervalMs = Math.max(MIN_INTERVAL_MS, loadAutoFarmConfig().intervalMinutes * 60 * 1000)
      scheduleNext(intervalMs)
    }
  }

  const savedNextRunAt = loadNextRunAt()
  const remainingMs = savedNextRunAt !== null ? savedNextRunAt - Date.now() : 0

  if (remainingMs > 0) {
    callbacks?.onNextRunAt?.(savedNextRunAt as number)
    timeoutId = window.setTimeout(runCycle, remainingMs)
  } else {
    runCycle()
  }

  return () => {
    stopped = true
    controller.abort()
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}
