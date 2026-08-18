export type ShortcutConfig = {
  mod: boolean
  shift: boolean
  alt: boolean
  code: string
}

export const DEFAULT_SHORTCUT: ShortcutConfig = {
  mod: true,
  shift: false,
  alt: false,
  code: 'Space',
}

const STORAGE_KEY = 'awesometw:launcher-shortcut'

export function loadShortcut(): ShortcutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SHORTCUT
    return { ...DEFAULT_SHORTCUT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SHORTCUT
  }
}

export function saveShortcut(shortcut: ShortcutConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcut))
}

/** Trata Ctrl e Cmd como o mesmo modificador, então a config funciona nos dois SOs sem detectar plataforma. */
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  const mod = event.ctrlKey || event.metaKey
  return (
    mod === shortcut.mod &&
    event.shiftKey === shortcut.shift &&
    event.altKey === shortcut.alt &&
    event.code === shortcut.code
  )
}

export const isMac = navigator.platform.toUpperCase().includes('MAC')

function formatCode(code: string): string {
  if (code === 'Space') return 'Espaço'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}

export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = []
  if (shortcut.mod) parts.push(isMac ? '⌘' : 'Ctrl')
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')
  parts.push(formatCode(shortcut.code))
  return parts.join('+')
}
