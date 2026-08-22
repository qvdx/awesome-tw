import { trackCycle } from './analytics'
import { cacheKey } from './features'
import { fetchScavengeVillageState } from './fetchScavengeLevels'
import { loadScavengeConfig } from './scavengeConfig'
import { runAutoScavengeOnce } from './runAutoScavengeOnce'
import { reportError } from './telemetry'

/** Folga depois do horário de retorno da leva mais demorada, pra dar tempo do servidor processar o "chegou". */
const RETURN_BUFFER_MS = 60_000

/** Quando não tem nenhuma coleta ativa pra ancorar o próximo ciclo (ex: sem tropa disponível ainda). */
const MIN_FALLBACK_MS = 60_000

/** Uma chave por aldeia — diferente do autofarm, a coleta roda um loop independente por aldeia. */
function nextRunKey(villageId: number): string {
  return cacheKey(`auto-scavenge-next-run-at-${villageId}`)
}

function loadNextRunAt(villageId: number): number | null {
  const raw = localStorage.getItem(nextRunKey(villageId))
  const value = raw ? Number(raw) : NaN
  return Number.isFinite(value) ? value : null
}

function saveNextRunAt(villageId: number, timestamp: number): void {
  localStorage.setItem(nextRunKey(villageId), String(timestamp))
}

/**
 * Limpa o horário de próxima execução salvo de uma aldeia — chame antes de
 * ligar o toggle de novo pra forçar um ciclo do zero em vez de retomar a
 * agenda antiga. Mesmo motivo do `resetAutoFarmSchedule` em
 * `autoFarmScheduler.ts`: não acontece sozinho no `stop()`, porque esse
 * cleanup também dispara em remontagens que não são "usuário desligou de
 * propósito".
 */
export function resetAutoScavengeSchedule(villageIds: number[]): void {
  villageIds.forEach((villageId) => localStorage.removeItem(nextRunKey(villageId)))
}

/**
 * "Coleta infinita": dispara um ciclo e, a partir do horário de retorno da
 * leva mais demorada (usando o relógio do servidor, não o do navegador), já
 * se reagenda pro próximo ciclo sozinho. Se não tem nada ativo pra ancorar
 * (ex: nenhuma tropa disponível ainda), cai no intervalo de Configurações
 * como fallback.
 *
 * O jogo não é uma SPA — cada navegação recarrega a página inteira e reseta
 * todo o contexto JS. Pra não disparar um ciclo novo (e um evento de
 * telemetria) a cada troca de tela, o horário da próxima execução fica salvo
 * no localStorage, por aldeia: ao (re)montar, se ainda não venceu, retoma o
 * tempo que falta em vez de rodar na hora.
 *
 * Retorna uma função pra parar o loop.
 */
export function startAutoScavengeLoop(villageId: number): () => void {
  let stopped = false
  let timeoutId: number | undefined

  function scheduleNext(delayMs: number) {
    const nextRunAt = Date.now() + delayMs
    saveNextRunAt(villageId, nextRunAt)
    if (!stopped) timeoutId = window.setTimeout(runCycle, delayMs)
  }

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

    if (!stopped) scheduleNext(delayMs)
  }

  const savedNextRunAt = loadNextRunAt(villageId)
  const remainingMs = savedNextRunAt !== null ? savedNextRunAt - Date.now() : 0

  if (remainingMs > 0) {
    timeoutId = window.setTimeout(runCycle, remainingMs)
  } else {
    runCycle()
  }

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
