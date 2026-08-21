import type { FarmAction } from './planAutoFarm'
import { sendTemplateA, sendTemplateC } from './farmAssistant'

export type FarmActionResult = { action: FarmAction; success: boolean; error?: string }

function randomDelayMs(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

/** Espera `ms`, mas resolve na hora se `signal` for abortado — pra "interromper" não ficar preso até o fim do intervalo em curso. */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      resolve()
    })
  })
}

/**
 * Executa as ações já decididas por `planAutoFarm`, uma de cada vez, com um
 * intervalo aleatório entre elas — mesmo esquema de sendMassSpyAttacks.ts,
 * evita disparar tudo em rajada e levar bloqueio antiflood do jogo. Uma
 * falha num envio não interrompe os demais.
 */
export async function sendAutoFarmActions(
  villageId: number,
  actions: FarmAction[],
  options: { minDelayMs: number; maxDelayMs: number; signal?: AbortSignal },
  onProgress?: (completed: number, total: number, current?: FarmAction) => void,
): Promise<FarmActionResult[]> {
  const results: FarmActionResult[] = []

  for (let i = 0; i < actions.length; i++) {
    if (options.signal?.aborted) break

    const action = actions[i]
    onProgress?.(i, actions.length, action)

    try {
      if (action.model === 'C') {
        await sendTemplateC(villageId, action.reportId)
      } else {
        await sendTemplateA(villageId, action.targetVillageId, action.templateId)
      }
      results.push({ action, success: true })
    } catch (err) {
      results.push({ action, success: false, error: err instanceof Error ? err.message : String(err) })
    }

    if (i < actions.length - 1) {
      await wait(randomDelayMs(options.minDelayMs, options.maxDelayMs), options.signal)
    }
  }

  onProgress?.(results.length, actions.length)
  return results
}
