import { getUnitIds } from './gameData'
import type { ScavengeSquadPlan } from './scavengeAllocation'
import { UNIT_CARRY } from './scavengeUnits'
import { tribalWarsPost } from './tribalWarsApi'

export type ScavengeSquadRequestPayload = {
  village_id: number
  candidate_squad: {
    unit_counts: Record<string, number>
    carry_max: number
  }
  option_id: number
  use_premium: boolean
}

export type SquadResponse = {
  success: boolean
  error?: string
}

export type SendSquadsResponse = {
  squad_responses: SquadResponse[]
  invalid_village_ids: number[]
}

/**
 * Converte o plano (nível → tropas) no formato exato que a scavenge_api espera,
 * igual ao SendSquadRequest.getPayload() do próprio jogo — inclusive zerando as
 * unidades que não entram na coleta (espião, aríete etc.), porque o payload
 * espera unit_counts com todas as unidades do mundo presentes.
 */
export function buildSquadRequests(
  villageId: number,
  plan: ScavengeSquadPlan,
  unitCarryFactor: number,
  usePremium = false,
): ScavengeSquadRequestPayload[] {
  const allUnitIds = getUnitIds()

  return Object.entries(plan)
    .filter(([, squad]) => Object.values(squad).some((count) => (count ?? 0) > 0))
    .map(([level, squad]) => {
      const unitCounts: Record<string, number> = Object.fromEntries(allUnitIds.map((id) => [id, 0]))
      let carryMax = 0

      for (const [unitId, count] of Object.entries(squad)) {
        if (!count) continue
        unitCounts[unitId] = count
        carryMax += count * (UNIT_CARRY[unitId as keyof typeof UNIT_CARRY] ?? 0)
      }

      return {
        village_id: villageId,
        candidate_squad: {
          unit_counts: unitCounts,
          carry_max: Math.round(carryMax * unitCarryFactor),
        },
        option_id: Number(level),
        use_premium: usePremium,
      }
    })
}

/** Chama a scavenge_api de verdade — mesmo endpoint do ScavengingService.sendSquads do jogo. */
export function sendScavengeSquads(requests: ScavengeSquadRequestPayload[]): Promise<SendSquadsResponse> {
  if (requests.length === 0) {
    return Promise.resolve({ squad_responses: [], invalid_village_ids: [] })
  }

  return tribalWarsPost<SendSquadsResponse>('scavenge_api', { ajaxaction: 'send_squads' }, { squad_requests: requests })
}
