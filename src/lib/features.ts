const FEATURE_PREFIX = 'awesometw:feature:'
const CONFIG_PREFIX = 'awesometw:config:'

export function featureStorageKey(id: string): string {
  return `${FEATURE_PREFIX}${id}`
}

/** Namespace separado do de features: guarda objetos de configuração, não são contados por countActiveFeatures. */
export function featureConfigKey(id: string): string {
  return `${CONFIG_PREFIX}${id}`
}

export function countActiveFeatures(): number {
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(FEATURE_PREFIX)) continue
    if (localStorage.getItem(key) === 'true') count++
  }
  return count
}
