import { useState } from 'react'
import { loadShortcut, saveShortcut, type ShortcutConfig } from '../lib/shortcut'

export function useShortcutConfig() {
  const [shortcut, setShortcutState] = useState<ShortcutConfig>(loadShortcut)

  function setShortcut(next: ShortcutConfig) {
    setShortcutState(next)
    saveShortcut(next)
  }

  return [shortcut, setShortcut] as const
}
