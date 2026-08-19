import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SCAVENGE_CONFIG, loadScavengeConfig, saveScavengeConfig } from './scavengeConfig'
import { featureConfigKey } from './features'

const STORAGE_KEY = featureConfigKey('auto-scavenge')

describe('loadScavengeConfig / saveScavengeConfig', () => {
  beforeEach(() => localStorage.clear())

  it('sem nada salvo, retorna a config padrão', () => {
    expect(loadScavengeConfig()).toEqual(DEFAULT_SCAVENGE_CONFIG)
  })

  it('com JSON corrompido no localStorage, cai no padrão', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    expect(loadScavengeConfig()).toEqual(DEFAULT_SCAVENGE_CONFIG)
  })

  it('faz round-trip: o que é salvo é o que volta ao carregar', () => {
    const custom = { ...DEFAULT_SCAVENGE_CONFIG, intervalHours: 6, autoUnlock: true, configured: true }
    saveScavengeConfig(custom)
    expect(loadScavengeConfig()).toEqual(custom)
  })

  it('config salva antes do campo villageIds existir ainda carrega com um default seguro', () => {
    // simula uma config salva por uma versão anterior do script, sem o campo novo
    const { villageIds: _villageIds, ...legacyConfig } = DEFAULT_SCAVENGE_CONFIG
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyConfig))

    expect(loadScavengeConfig().villageIds).toEqual([])
  })
})
