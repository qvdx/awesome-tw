import { beforeEach, describe, expect, it } from 'vitest'
import { cacheKey, countActiveFeatures, featureConfigKey, featureStorageKey } from './features'

describe('chaves de storage', () => {
  it('namespaces diferentes pro mesmo id', () => {
    expect(featureStorageKey('auto-scavenge')).toBe('awesometw:feature:auto-scavenge')
    expect(featureConfigKey('auto-scavenge')).toBe('awesometw:config:auto-scavenge')
    expect(cacheKey('villages')).toBe('awesometw:cache:villages')

    const keys = [featureStorageKey('auto-scavenge'), featureConfigKey('auto-scavenge'), cacheKey('auto-scavenge')]
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('countActiveFeatures', () => {
  beforeEach(() => localStorage.clear())

  it('sem nenhuma feature ligada, conta zero', () => {
    expect(countActiveFeatures()).toBe(0)
  })

  it('só conta chaves de feature com valor "true"', () => {
    localStorage.setItem(featureStorageKey('auto-scavenge'), 'true')
    localStorage.setItem(featureStorageKey('outra-feature'), 'false')
    localStorage.setItem(featureConfigKey('auto-scavenge'), 'true') // não é uma chave de feature, não deve contar
    localStorage.setItem('chave-qualquer', 'true')

    expect(countActiveFeatures()).toBe(1)
  })
})
