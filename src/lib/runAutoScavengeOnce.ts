import { planAutoScavenge } from './planAutoScavenge'
import type { ScavengeConfig } from './scavengeConfig'
import { buildSquadRequests, sendScavengeSquads, type SendSquadsResponse } from './sendScavengeSquads'

/** Roda um ciclo de coleta automática: planeja e já dispara o envio das tropas. */
export async function runAutoScavengeOnce(
  villageId: number,
  troopsConfig: ScavengeConfig['troops'],
): Promise<SendSquadsResponse> {
  const { plan, unitCarryFactor } = await planAutoScavenge(villageId, troopsConfig)
  const requests = buildSquadRequests(villageId, plan, unitCarryFactor)
  return sendScavengeSquads(requests)
}
