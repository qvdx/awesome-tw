import { fetchScavengeVillageState, findNextUnlockTarget, startUnlockLevel } from './fetchScavengeLevels'
import { planAutoScavenge } from './planAutoScavenge'
import type { ScavengeConfig } from './scavengeConfig'
import { buildSquadRequests, sendScavengeSquads, type SendSquadsResponse } from './sendScavengeSquads'

/**
 * Roda um ciclo de coleta automática: se configurado, pede o desbloqueio do
 * próximo nível disponível, depois planeja e já dispara o envio das tropas
 * pros níveis já desbloqueados e ociosos.
 */
export async function runAutoScavengeOnce(
  villageId: number,
  config: Pick<ScavengeConfig, 'troops' | 'autoUnlock' | 'maxDurationHours'>,
): Promise<SendSquadsResponse> {
  if (config.autoUnlock) {
    const state = await fetchScavengeVillageState(villageId)
    const target = findNextUnlockTarget(state.levels)
    if (target) await startUnlockLevel(villageId, target.level)
  }

  const { plan, unitCarryFactor } = await planAutoScavenge(villageId, config.troops, config.maxDurationHours)
  const requests = buildSquadRequests(villageId, plan, unitCarryFactor)
  return sendScavengeSquads(requests)
}
