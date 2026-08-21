import { trackCycle } from './analytics'
import { fetchScavengeVillageState } from './fetchScavengeLevels'
import { loadScavengeConfig } from './scavengeConfig'
import { runAutoScavengeOnce } from './runAutoScavengeOnce'
import { reportError } from './telemetry'

/** Folga depois do horário de retorno da leva mais demorada, pra dar tempo do servidor processar o "chegou". */
const RETURN_BUFFER_MS = 60_000

/** Quando não tem nenhuma coleta ativa pra ancorar o próximo ciclo (ex: sem tropa disponível ainda). */
const MIN_FALLBACK_MS = 60_000

/**
 * "Coleta infinita": dispara um ciclo imediatamente e, a partir do horário de
 * retorno da leva mais demorada (usando o relógio do servidor, não o do
 * navegador), já se reagenda pro próximo ciclo sozinho. Se não tem nada ativo
 * pra ancorar (ex: nenhuma tropa disponível ainda), cai no intervalo de
 * Configurações como fallback.
 *
 * Retorna uma função pra parar o loop.
 */
export function startAutoScavengeLoop(villageId: number): () => void {
  let stopped = false
  let timeoutId: number | undefined

  async function runCycle() {
    if (stopped) return

    let delayMs = MIN_FALLBACK_MS
    const startedAt = performance.now()

    try {
      const config = loadScavengeConfig()
      const sendResult = await runAutoScavengeOnce(villageId, config)
      const itemsFailed = sendResult.squad_responses.filter((response) => !response.success).length

      const state = await fetchScavengeVillageState(villageId)
      const activeReturnTimes = state.levels
        .filter((level) => level.active && level.returnTime !== null)
        .map((level) => level.returnTime as number)

      if (activeReturnTimes.length > 0) {
        const maxReturnMs = Math.max(...activeReturnTimes) * 1000
        delayMs = Math.max(0, maxReturnMs - state.timeGeneratedMs) + RETURN_BUFFER_MS
      } else {
        delayMs = Math.max(MIN_FALLBACK_MS, config.intervalHours * 60 * 60 * 1000)
      }

      trackCycle({
        feature: 'scavenge',
        durationMs: performance.now() - startedAt,
        success: true,
        itemsTotal: sendResult.squad_responses.length,
        itemsFailed,
      })
    } catch (error) {
      console.error('[awesometw] falha no ciclo de coleta automática, tentando de novo em breve', error)
      reportError({ feature: 'scavenge', phase: 'cycle', error })
      trackCycle({ feature: 'scavenge', durationMs: performance.now() - startedAt, success: false })
    }

    if (!stopped) {
      timeoutId = window.setTimeout(runCycle, delayMs)
    }
  }

  runCycle()

  return () => {
    stopped = true
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

/** Roda um loop de coleta independente por aldeia (horários de retorno diferem entre elas). */
export function startAutoScavengeLoops(villageIds: number[]): () => void {
  const stopFns = villageIds.map(startAutoScavengeLoop)
  return () => stopFns.forEach((stop) => stop())
}
