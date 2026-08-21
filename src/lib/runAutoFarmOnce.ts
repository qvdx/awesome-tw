import { fetchFarmAssistant } from './farmAssistant'
import { planAutoFarmAcrossVillages, type FarmAction, type PlanAutoFarmOptions, type VillageFarmState } from './planAutoFarm'
import { sendAutoFarmActions } from './sendAutoFarmActions'

export type AutoFarmProgress = {
  completed: number
  total: number
  /** ação sendo enviada agora, se houver uma em voo nesse instante */
  current?: { villageId: number; action: FarmAction }
}

/**
 * Roda um ciclo completo: busca o assistente de saque de cada aldeia
 * configurada, monta o plano GLOBAL (planAutoFarmAcrossVillages — evita duas
 * aldeias mirarem o mesmo alvo) e só então envia, aldeia por aldeia. O plano
 * precisa ver todas as aldeias de uma vez antes de decidir qualquer coisa,
 * então a busca acontece toda antes do primeiro envio — diferente da coleta
 * automática, aqui não dá pra decidir aldeia a aldeia sem esse contexto.
 */
export type AutoFarmCycleStats = {
  /** aldeias configuradas cujo assistente de saque não pôde ser buscado nesse ciclo */
  villagesFailed: number
  actionsSent: number
  actionsFailed: number
}

export async function runAutoFarmOnce(
  villageIds: number[],
  options: { minDelayMs: number; maxDelayMs: number; signal?: AbortSignal } & PlanAutoFarmOptions,
  onProgress?: (progress: AutoFarmProgress) => void,
): Promise<AutoFarmCycleStats> {
  const villages: VillageFarmState[] = []
  let villagesFailed = 0

  for (const villageId of villageIds) {
    try {
      const state = await fetchFarmAssistant(villageId)
      villages.push({ villageId, state })
    } catch (err) {
      console.error(`[awesometw] falha ao buscar o assistente de saque da aldeia ${villageId}`, err)
      villagesFailed++
    }
  }

  const plan = planAutoFarmAcrossVillages(villages, { maxWallLevel: options.maxWallLevel, maxDistance: options.maxDistance })

  const total = [...plan.values()].reduce((sum, actions) => sum + actions.length, 0)
  let completed = 0
  let actionsSent = 0
  let actionsFailed = 0
  onProgress?.({ completed, total })

  for (const [villageId, actions] of plan) {
    if (actions.length === 0) continue
    if (options.signal?.aborted) break

    const base = completed
    const results = await sendAutoFarmActions(villageId, actions, options, (done, _actionsTotal, current) => {
      onProgress?.({ completed: base + done, total, current: current ? { villageId, action: current } : undefined })
    })
    completed = base + actions.length
    onProgress?.({ completed, total })

    for (const result of results) {
      if (result.success) actionsSent++
      else actionsFailed++
    }
  }

  return { villagesFailed, actionsSent, actionsFailed }
}
