import { fetchScavengeVillageState } from './fetchScavengeLevels'
import {
  DEFAULT_SCAVENGE_LEVEL_CONFIGS,
  computeAvailableUnitPool,
  planScavengeSquads,
  type ScavengeSquadPlan,
} from './scavengeAllocation'
import type { ScavengeConfig } from './scavengeConfig'

export type AutoScavengePlan = {
  plan: ScavengeSquadPlan
  unitCarryFactor: number
}

/**
 * Busca o estado atual da aldeia e monta o plano de envio: só entram níveis
 * desbloqueados e sem coleta ativa no momento (níveis já em andamento não
 * recebem uma nova leva por cima). A alocação respeita `maxDurationHours`
 * como teto de duração — sobra tropa parada em casa se o estoque disponível
 * daria pra coletar além do prazo configurado.
 */
export async function planAutoScavenge(
  villageId: number,
  troopsConfig: ScavengeConfig['troops'],
  maxDurationHours: number,
): Promise<AutoScavengePlan> {
  const { levels, unitCountsHome, unitCarryFactor } = await fetchScavengeVillageState(villageId)

  const idleLevelIds = new Set(levels.filter((level) => level.unlocked && !level.active).map((level) => level.level))
  const idleLevelConfigs = DEFAULT_SCAVENGE_LEVEL_CONFIGS.filter((config) => idleLevelIds.has(config.level))

  const pool = computeAvailableUnitPool(unitCountsHome, troopsConfig)
  const plan = planScavengeSquads(idleLevelConfigs, pool, { maxDurationSeconds: maxDurationHours * 60 * 60 })

  return { plan, unitCarryFactor }
}
