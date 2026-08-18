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
 * recebem uma nova leva por cima).
 */
export async function planAutoScavenge(
  villageId: number,
  troopsConfig: ScavengeConfig['troops'],
): Promise<AutoScavengePlan> {
  const { levels, unitCountsHome, unitCarryFactor } = await fetchScavengeVillageState(villageId)

  const idleLevelIds = new Set(levels.filter((level) => level.unlocked && !level.active).map((level) => level.level))
  const idleLevelConfigs = DEFAULT_SCAVENGE_LEVEL_CONFIGS.filter((config) => idleLevelIds.has(config.level))

  const pool = computeAvailableUnitPool(unitCountsHome, troopsConfig)
  const plan = planScavengeSquads(idleLevelConfigs, pool)

  return { plan, unitCarryFactor }
}
