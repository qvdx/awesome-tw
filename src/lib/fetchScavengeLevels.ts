import { tribalWarsGet } from './tribalWarsApi'

export type ScavengeLevelStatus = {
  level: number
  unlocked: boolean
  /** true quando já tem uma leva de tropas coletando nesse nível agora */
  active: boolean
  /** timestamp unix (segundos) de quando a leva atual volta, se `active` */
  returnTime: number | null
}

export type ScavengeVillageState = {
  levels: ScavengeLevelStatus[]
  /** tropas paradas na aldeia agora (todas as unidades, não só as usáveis em coleta) */
  unitCountsHome: Record<string, number>
  /** multiplicador de carga da aldeia (normalmente 1; pode ser maior com algum bônus ativo) */
  unitCarryFactor: number
  /** horário do servidor (ms) no momento em que essa resposta foi gerada — não usar Date.now() no lugar disso */
  timeGeneratedMs: number
}

type ScavengeOption = {
  base_id: number
  is_locked: boolean
  scavenging_squad: {
    return_time: number
  } | null
}

type ScavengeVillageDTO = {
  unit_counts_home: Record<string, number>
  unit_carry_factor: number
  options: Record<string, ScavengeOption>
}

type ScavengeVillagesResponse = {
  villages: Record<string, ScavengeVillageDTO>
  invalid_village_ids: number[]
  time_generated_ms: number
}

/**
 * Busca o estado da coleta (níveis + tropas paradas na aldeia) usando a API de
 * verdade do jogo (screen=scavenge_api), o mesmo endpoint que o próprio
 * ScavengingService do TW usa — sem precisar navegar nem raspar HTML.
 */
export async function fetchScavengeVillageState(villageId: number): Promise<ScavengeVillageState> {
  const response = await tribalWarsGet<ScavengeVillagesResponse>('scavenge_api', {
    ajax: 'villages',
    village_ids: [villageId],
  })

  const village = response.villages[villageId]
  if (!village) {
    throw new Error(`Aldeia ${villageId} não veio na resposta da API de coleta.`)
  }

  const levels = Object.values(village.options)
    .sort((a, b) => a.base_id - b.base_id)
    .map((option) => ({
      level: option.base_id,
      unlocked: !option.is_locked,
      active: option.scavenging_squad !== null,
      returnTime: option.scavenging_squad?.return_time ?? null,
    }))

  return {
    levels,
    unitCountsHome: village.unit_counts_home,
    unitCarryFactor: village.unit_carry_factor,
    timeGeneratedMs: response.time_generated_ms,
  }
}
