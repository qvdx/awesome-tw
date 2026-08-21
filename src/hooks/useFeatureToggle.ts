import { trackFeatureToggled } from '../lib/analytics'
import { featureStorageKey } from '../lib/features'
import { useLocalStorage } from './useLocalStorage'

/**
 * Mesmo formato de `useLocalStorage(featureStorageKey(id), ...)` já usado pelos toggles de
 * feature em App.tsx, só que também reporta a mudança via `trackFeatureToggled` — ponto único
 * pra instrumentar adoção sem repetir a chamada em cada call site.
 */
export function useFeatureToggle(id: string, defaultValue: boolean) {
  const [enabled, setEnabled] = useLocalStorage(featureStorageKey(id), defaultValue)

  function setEnabledAndTrack(next: boolean) {
    trackFeatureToggled(id, next)
    setEnabled(next)
  }

  return [enabled, setEnabledAndTrack] as const
}
