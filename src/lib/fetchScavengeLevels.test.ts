import { describe, expect, it } from 'vitest'
import { findNextUnlockTarget, type ScavengeLevelStatus } from './fetchScavengeLevels'

function level(overrides: Partial<ScavengeLevelStatus> & { level: number }): ScavengeLevelStatus {
  return { unlocked: false, unlocking: false, active: false, returnTime: null, ...overrides }
}

describe('findNextUnlockTarget', () => {
  it('sem níveis, não tem alvo', () => {
    expect(findNextUnlockTarget([])).toBeNull()
  })

  it('tudo desbloqueado, não tem alvo', () => {
    const levels = [level({ level: 1, unlocked: true }), level({ level: 2, unlocked: true })]
    expect(findNextUnlockTarget(levels)).toBeNull()
  })

  it('primeiro nível bloqueado é o alvo', () => {
    const levels = [level({ level: 1 }), level({ level: 2 })]
    expect(findNextUnlockTarget(levels)?.level).toBe(1)
  })

  it('pula níveis já desbloqueados até achar o primeiro bloqueado', () => {
    const levels = [level({ level: 1, unlocked: true }), level({ level: 2 }), level({ level: 3 })]
    expect(findNextUnlockTarget(levels)?.level).toBe(2)
  })

  it('não pula a fila: não desbloqueia o nível 3 antes do 2', () => {
    const levels = [level({ level: 1, unlocked: true }), level({ level: 2 }), level({ level: 3 })]
    // nível 2 ainda bloqueado — nível 3 não pode ser o alvo mesmo estando na lista
    expect(findNextUnlockTarget(levels)?.level).not.toBe(3)
  })

  it('nível com desbloqueio em andamento não vira alvo de novo, mas também não libera o próximo', () => {
    const levels = [level({ level: 1, unlocked: true }), level({ level: 2, unlocking: true }), level({ level: 3 })]
    expect(findNextUnlockTarget(levels)).toBeNull()
  })

  it('funciona independente da ordem de entrada (ordena por nível)', () => {
    const levels = [level({ level: 3 }), level({ level: 1, unlocked: true }), level({ level: 2 })]
    expect(findNextUnlockTarget(levels)?.level).toBe(2)
  })
})
