import { useState } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValueState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  function setValue(next: T) {
    setValueState(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  return [value, setValue] as const
}
