import { describe, expect, it, vi } from 'vitest'
import { buildSquadRequests } from './sendScavengeSquads'
import { UNIT_CARRY } from './scavengeUnits'

vi.mock('./gameData', () => ({
  getUnitIds: () => ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram'],
}))

describe('buildSquadRequests', () => {
  it('ignora níveis com esquadrão vazio', () => {
    const requests = buildSquadRequests(85096, { 1: { heavy: 10 }, 2: {} }, 1)
    expect(requests).toHaveLength(1)
    expect(requests[0].option_id).toBe(1)
  })

  it('zera as unidades que não entram na coleta (ex: espião, aríete)', () => {
    const [request] = buildSquadRequests(85096, { 1: { heavy: 10 } }, 1)
    expect(request.candidate_squad.unit_counts).toEqual({
      spear: 0,
      sword: 0,
      axe: 0,
      spy: 0,
      light: 0,
      heavy: 10,
      ram: 0,
    })
  })

  it('calcula carry_max a partir das unidades enviadas e do fator da aldeia', () => {
    const [request] = buildSquadRequests(85096, { 1: { heavy: 10, light: 5 } }, 1.2)
    const expectedCarry = Math.round((10 * UNIT_CARRY.heavy + 5 * UNIT_CARRY.light) * 1.2)
    expect(request.candidate_squad.carry_max).toBe(expectedCarry)
  })

  it('preenche village_id, option_id e use_premium corretamente', () => {
    const [request] = buildSquadRequests(85096, { 3: { spear: 1 } }, 1, true)
    expect(request.village_id).toBe(85096)
    expect(request.option_id).toBe(3)
    expect(request.use_premium).toBe(true)
  })

  it('sem nenhum esquadrão com tropa, não gera nenhuma requisição', () => {
    expect(buildSquadRequests(85096, { 1: {}, 2: { heavy: 0 } }, 1)).toEqual([])
  })
})
