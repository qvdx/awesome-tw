import { sendSpyAttack, type SpyAttackTarget } from './spyAttack'

export type MassSpyProgress = {
  completed: number
  total: number
}

export type MassSpyResult = {
  villageId: number
  success: boolean
  error?: string
}

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
 * Manda um ataque de exploradores pra cada aldeia da lista, uma de cada vez,
 * com um intervalo aleatório entre os envios (evita rajada de requisições
 * idênticas). Uma falha numa aldeia não interrompe as demais — cada
 * resultado é reportado individualmente.
 *
 * `signal` permite interromper o processo: a aldeia em andamento termina
 * normalmente (não dá pra cancelar uma requisição já em voo), mas nenhuma
 * aldeia nova começa depois disso — por isso o resultado pode vir menor que
 * `targets.length`.
 */
export async function sendMassSpyAttacks(
  targets: SpyAttackTarget[],
  options: { spyCount: number; minDelayMs: number; maxDelayMs: number; signal?: AbortSignal },
  onProgress: (progress: MassSpyProgress) => void,
): Promise<MassSpyResult[]> {
  const results: MassSpyResult[] = []

  for (let i = 0; i < targets.length; i++) {
    if (options.signal?.aborted) break

    onProgress({ completed: i, total: targets.length })

    try {
      await sendSpyAttack(targets[i], options.spyCount)
      results.push({ villageId: targets[i].villageId, success: true })
    } catch (err) {
      results.push({
        villageId: targets[i].villageId,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (i < targets.length - 1) {
      await wait(randomDelayMs(options.minDelayMs, options.maxDelayMs), options.signal)
    }
  }

  onProgress({ completed: results.length, total: targets.length })
  return results
}
