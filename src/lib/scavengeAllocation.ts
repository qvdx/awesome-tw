import type { ScavengeConfig, UnitId } from './scavengeConfig'
import { UNIT_CARRY } from './scavengeUnits'

export type ScavengeLevelConfig = {
  level: number
  lootFactor: number
  durationExponent: number
  durationInitialSeconds: number
  durationFactor: number
}

/**
 * Config estática por nível (loot_factor, duration_exponent, duration_initial_seconds,
 * duration_factor) — vem do bundle JS da tela de coleta (Scavenging.js), não da
 * scavenge_api. Os valores abaixo são os observados no mundo br143; se outro
 * mundo tiver curva de duração diferente, ajusta aqui.
 */
export const DEFAULT_SCAVENGE_LEVEL_CONFIGS: ScavengeLevelConfig[] = [
  { level: 1, lootFactor: 0.1, durationExponent: 0.45, durationInitialSeconds: 1800, durationFactor: 1 },
  { level: 2, lootFactor: 0.25, durationExponent: 0.45, durationInitialSeconds: 1800, durationFactor: 1 },
  { level: 3, lootFactor: 0.5, durationExponent: 0.45, durationInitialSeconds: 1800, durationFactor: 1 },
  { level: 4, lootFactor: 0.75, durationExponent: 0.45, durationInitialSeconds: 1800, durationFactor: 1 },
]

/** Portado de ScavengeOption.calcDurationSeconds (Scavenging.js). */
function calcDurationSeconds(carryMax: number, config: ScavengeLevelConfig): number {
  if (carryMax <= 0) return config.durationInitialSeconds * config.durationFactor
  const lootPercent = 100 * config.lootFactor
  const base = carryMax * lootPercent * carryMax * config.lootFactor
  return (Math.pow(base, config.durationExponent) + config.durationInitialSeconds) * config.durationFactor
}

/** Inverso de calcDurationSeconds: dado um tempo-alvo, qual carry_max resulta nele. */
function calcCarryMaxForDuration(targetSeconds: number, config: ScavengeLevelConfig): number {
  const raw = targetSeconds / config.durationFactor - config.durationInitialSeconds
  if (raw <= 0) return 0
  const base = Math.pow(raw, 1 / config.durationExponent)
  const carryMaxSquared = base / (100 * config.lootFactor * config.lootFactor)
  return Math.sqrt(Math.max(0, carryMaxSquared))
}

/** Busca binária pelo tempo-alvo que consome todo o orçamento de carga disponível. */
function findBalancedDuration(levels: ScavengeLevelConfig[], totalCarryBudget: number): number {
  const totalCarryAt = (duration: number) =>
    levels.reduce((sum, level) => sum + calcCarryMaxForDuration(duration, level), 0)

  let low = Math.min(...levels.map((level) => level.durationInitialSeconds * level.durationFactor))
  let high = low + 1

  while (totalCarryAt(high) < totalCarryBudget) {
    high *= 2
  }

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    if (totalCarryAt(mid) < totalCarryBudget) {
      low = mid
    } else {
      high = mid
    }
  }

  return high
}

export type UnitPool = Partial<Record<UnitId, number>>
export type ScavengeSquadPlan = Record<number, Partial<Record<UnitId, number>>>

/**
 * Cruza as tropas paradas na aldeia agora (unit_counts_home, vindo da
 * scavenge_api) com o que o usuário configurou em Automações › Coleta: só
 * entram no pool as unidades habilitadas, e sempre sobrando a reserva mínima.
 */
export function computeAvailableUnitPool(
  unitCountsHome: Record<string, number>,
  troopsConfig: ScavengeConfig['troops'],
): UnitPool {
  const pool: UnitPool = {}

  for (const unitId of Object.keys(troopsConfig) as UnitId[]) {
    const rule = troopsConfig[unitId]
    if (!rule.enabled) continue

    const home = unitCountsHome[unitId] ?? 0
    pool[unitId] = Math.max(0, home - rule.reserve)
  }

  return pool
}

/**
 * Distribui as tropas disponíveis entre os níveis de coleta desbloqueados pra
 * que todos terminem por volta do mesmo horário. Níveis com loot_factor maior
 * (Grande/Extrema Coleta) demoram muito mais por unidade de carga que os
 * menores — pra ainda assim baterem o mesmo horário de chegada, acabam
 * recebendo MENOS capacidade de carga (menos tropa), não mais.
 */
export function planScavengeSquads(
  unlockedLevels: ScavengeLevelConfig[],
  availableUnits: UnitPool,
  unitPriority: UnitId[] = ['heavy', 'light', 'axe', 'spear', 'sword'],
): ScavengeSquadPlan {
  const plan: ScavengeSquadPlan = {}
  unlockedLevels.forEach((level) => {
    plan[level.level] = {}
  })
  if (unlockedLevels.length === 0) return plan

  const remaining: UnitPool = { ...availableUnits }
  const totalCarryBudget = unitPriority.reduce((sum, unit) => sum + (remaining[unit] ?? 0) * UNIT_CARRY[unit], 0)
  if (totalCarryBudget <= 0) return plan

  const targetDuration = findBalancedDuration(unlockedLevels, totalCarryBudget)
  const carryTargets = new Map(
    unlockedLevels.map((level) => [level.level, calcCarryMaxForDuration(targetDuration, level)]),
  )

  // preenche do maior alvo de carga pro menor, pra erros de arredondamento
  // sobrarem nos níveis pequenos em vez de faltar tropa nos grandes
  const orderedLevels = [...unlockedLevels].sort(
    (a, b) => (carryTargets.get(b.level) ?? 0) - (carryTargets.get(a.level) ?? 0),
  )

  orderedLevels.forEach((level) => {
    let carryLeft = carryTargets.get(level.level) ?? 0

    for (const unit of unitPriority) {
      const carryPerUnit = UNIT_CARRY[unit]
      const available = remaining[unit] ?? 0
      if (available <= 0 || carryLeft <= 0) continue

      const unitsNeeded = Math.min(available, Math.floor(carryLeft / carryPerUnit))
      if (unitsNeeded <= 0) continue

      plan[level.level]![unit] = (plan[level.level]![unit] ?? 0) + unitsNeeded
      remaining[unit] = available - unitsNeeded
      carryLeft -= unitsNeeded * carryPerUnit
    }
  })

  return plan
}

export { calcDurationSeconds }
