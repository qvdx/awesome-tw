import { fetchScavengeVillageState } from './fetchScavengeLevels'
import { loadScavengeConfig } from './scavengeConfig'
import { runAutoScavengeOnce } from './runAutoScavengeOnce'

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

    try {
      const config = loadScavengeConfig()
      await runAutoScavengeOnce(villageId, config.troops)

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
    } catch (error) {
      console.error('[awesome-tw-scripts] falha no ciclo de coleta automática, tentando de novo em breve', error)
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
