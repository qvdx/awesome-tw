import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SHORTCUT, formatShortcut, loadShortcut, matchesShortcut, saveShortcut } from './shortcut'

function keydown(overrides: Partial<{ ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean; code: string }>) {
  return new KeyboardEvent('keydown', { ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...overrides })
}

describe('matchesShortcut', () => {
  it('bate com o atalho padrão (mod + Space)', () => {
    expect(matchesShortcut(keydown({ ctrlKey: true, code: 'Space' }), DEFAULT_SHORTCUT)).toBe(true)
  })

  it('trata Ctrl e Cmd (metaKey) como o mesmo modificador', () => {
    expect(matchesShortcut(keydown({ metaKey: true, code: 'Space' }), DEFAULT_SHORTCUT)).toBe(true)
  })

  it('não bate se o código da tecla for diferente', () => {
    expect(matchesShortcut(keydown({ ctrlKey: true, code: 'KeyA' }), DEFAULT_SHORTCUT)).toBe(false)
  })

  it('não bate se faltar um modificador exigido', () => {
    const shortcut = { mod: true, shift: true, alt: false, code: 'KeyA' }
    expect(matchesShortcut(keydown({ ctrlKey: true, code: 'KeyA' }), shortcut)).toBe(false)
  })

  it('não bate se tiver um modificador a mais do que o configurado', () => {
    expect(matchesShortcut(keydown({ ctrlKey: true, altKey: true, code: 'Space' }), DEFAULT_SHORTCUT)).toBe(false)
  })
})

describe('formatShortcut', () => {
  it('formata Space como "Espaço"', () => {
    expect(formatShortcut({ mod: true, shift: false, alt: false, code: 'Space' })).toBe('Ctrl+Espaço')
  })

  it('formata KeyX tirando o prefixo "Key"', () => {
    expect(formatShortcut({ mod: false, shift: false, alt: false, code: 'KeyA' })).toBe('A')
  })

  it('formata DigitX tirando o prefixo "Digit"', () => {
    expect(formatShortcut({ mod: false, shift: false, alt: false, code: 'Digit5' })).toBe('5')
  })

  it('inclui todos os modificadores habilitados, na ordem mod/shift/alt', () => {
    expect(formatShortcut({ mod: true, shift: true, alt: true, code: 'KeyA' })).toBe('Ctrl+Shift+Alt+A')
  })

  it('mantém códigos não reconhecidos como estão (ex: F1)', () => {
    expect(formatShortcut({ mod: false, shift: false, alt: false, code: 'F1' })).toBe('F1')
  })
})

describe('loadShortcut / saveShortcut', () => {
  beforeEach(() => localStorage.clear())

  it('sem nada salvo, retorna o padrão', () => {
    expect(loadShortcut()).toEqual(DEFAULT_SHORTCUT)
  })

  it('com JSON corrompido no localStorage, cai no padrão', () => {
    localStorage.setItem('awesometw:launcher-shortcut', '{not valid json')
    expect(loadShortcut()).toEqual(DEFAULT_SHORTCUT)
  })

  it('faz round-trip: o que é salvo é o que volta ao carregar', () => {
    const custom = { mod: false, shift: true, alt: true, code: 'KeyG' }
    saveShortcut(custom)
    expect(loadShortcut()).toEqual(custom)
  })
})
