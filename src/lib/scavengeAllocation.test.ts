import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCAVENGE_LEVEL_CONFIGS,
  calcDurationSeconds,
  computeAvailableUnitPool,
  planScavengeSquads,
  type ScavengeLevelConfig,
} from './scavengeAllocation'
import { UNIT_CARRY } from './scavengeUnits'
import type { ScavengeConfig } from './scavengeConfig'

const [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4] = DEFAULT_SCAVENGE_LEVEL_CONFIGS

function troopsConfig(overrides: Partial<ScavengeConfig['troops']>): ScavengeConfig['troops'] {
  const base: ScavengeConfig['troops'] = {
    spear: { enabled: false, reserve: 0 },
    sword: { enabled: false, reserve: 0 },
    axe: { enabled: false, reserve: 0 },
    light: { enabled: false, reserve: 0 },
    heavy: { enabled: false, reserve: 0 },
  }
  return { ...base, ...overrides }
}

describe('computeAvailableUnitPool', () => {
  it('só inclui unidades habilitadas', () => {
    const pool = computeAvailableUnitPool(
      { spear: 50, sword: 100, axe: 5 },
      troopsConfig({ spear: { enabled: true, reserve: 0 }, sword: { enabled: false, reserve: 0 } }),
    )
    expect(pool).toEqual({ spear: 50 })
  })

  it('subtrai a reserva configurada', () => {
    const pool = computeAvailableUnitPool({ spear: 50 }, troopsConfig({ spear: { enabled: true, reserve: 10 } }))
    expect(pool.spear).toBe(40)
  })

  it('nunca fica negativo quando a reserva é maior que o estoque', () => {
    const pool = computeAvailableUnitPool({ axe: 5 }, troopsConfig({ axe: { enabled: true, reserve: 10 } }))
    expect(pool.axe).toBe(0)
  })

  it('trata unidade ausente em unitCountsHome como zero', () => {
    const pool = computeAvailableUnitPool({}, troopsConfig({ heavy: { enabled: true, reserve: 0 } }))
    expect(pool.heavy).toBe(0)
  })
})

describe('calcDurationSeconds', () => {
  it('sem carga disponível, cai no tempo inicial * fator', () => {
    expect(calcDurationSeconds(0, LEVEL_1)).toBe(LEVEL_1.durationInitialSeconds * LEVEL_1.durationFactor)
    expect(calcDurationSeconds(-5, LEVEL_1)).toBe(LEVEL_1.durationInitialSeconds * LEVEL_1.durationFactor)
  })

  it('duração cresce com a carga disponível', () => {
    const small = calcDurationSeconds(100, LEVEL_1)
    const big = calcDurationSeconds(1000, LEVEL_1)
    expect(big).toBeGreaterThan(small)
  })
})

describe('planScavengeSquads', () => {
  it('sem níveis desbloqueados, retorna plano vazio', () => {
    expect(planScavengeSquads([], { heavy: 100 })).toEqual({})
  })

  it('sem tropa disponível, cada nível fica com um esquadrão vazio', () => {
    const plan = planScavengeSquads([LEVEL_1, LEVEL_2], {})
    expect(plan).toEqual({ [LEVEL_1.level]: {}, [LEVEL_2.level]: {} })
  })

  it('não aloca mais tropa do que a disponível', () => {
    const available = { heavy: 100, light: 50 }
    const plan = planScavengeSquads([LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4], available)

    const totalHeavyUsed = Object.values(plan).reduce((sum, squad) => sum + (squad.heavy ?? 0), 0)
    const totalLightUsed = Object.values(plan).reduce((sum, squad) => sum + (squad.light ?? 0), 0)

    expect(totalHeavyUsed).toBeLessThanOrEqual(available.heavy)
    expect(totalLightUsed).toBeLessThanOrEqual(available.light)
  })

  it('esgota (quase) toda a carga disponível quando só tem um nível', () => {
    // heavy carrega 50 cada; 100 heavy = 5000 de carga, valor redondo o bastante
    // pra não sobrar tropa por causa de arredondamento de unidade inteira.
    const plan = planScavengeSquads([LEVEL_1], { heavy: 100 })
    const heavyUsed = plan[LEVEL_1.level]?.heavy ?? 0
    const carryUsed = heavyUsed * UNIT_CARRY.heavy
    const carryAvailable = 100 * UNIT_CARRY.heavy

    // no máximo uma unidade de heavy sobra sem ser usada (arredondamento pra baixo)
    expect(carryAvailable - carryUsed).toBeLessThan(UNIT_CARRY.heavy)
  })

  it('nível com loot_factor maior recebe MENOS capacidade de carga, pra bater o mesmo horário', () => {
    // LEVEL_4 (Extrema) demora muito mais por unidade de carga que LEVEL_1
    // (Pequena) — pra ainda assim chegar junto, precisa de menos tropa, não mais.
    const plan = planScavengeSquads([LEVEL_1, LEVEL_4], { heavy: 1000 })

    const carryOf = (level: ScavengeLevelConfig) => (plan[level.level]?.heavy ?? 0) * UNIT_CARRY.heavy

    expect(carryOf(LEVEL_4)).toBeLessThan(carryOf(LEVEL_1))
  })

  it('esgota a unidade de maior prioridade antes de sacar da próxima', () => {
    // com só um nível, o alvo de carga acaba cobrindo tudo que tem disponível
    // (heavy + light) — mas heavy, primeiro na prioridade, é preenchido até o
    // limite disponível antes de qualquer light entrar no esquadrão.
    const plan = planScavengeSquads([LEVEL_1], { heavy: 10, light: 10 }, ['heavy', 'light'])
    expect(plan[LEVEL_1.level]?.heavy).toBe(10)
  })
})
