import { beforeEach, describe, expect, it } from 'vitest'
import { setTelemetryEnabled } from './telemetry'
import { trackFeatureToggled } from './analytics'

const ENABLED_AT_KEY = 'awesometw:analytics:enabled-at:autofarm'

describe('trackFeatureToggled', () => {
  beforeEach(() => localStorage.clear())

  it('com telemetria desligada, não grava nenhum estado', () => {
    trackFeatureToggled('autofarm', true)
    expect(localStorage.getItem(ENABLED_AT_KEY)).toBeNull()
  })

  it('ao ligar, grava o timestamp atual', () => {
    setTelemetryEnabled(true)
    trackFeatureToggled('autofarm', true)
    expect(Number(localStorage.getItem(ENABLED_AT_KEY))).toBeGreaterThan(0)
  })

  it('ao desligar, limpa o timestamp salvo', () => {
    setTelemetryEnabled(true)
    trackFeatureToggled('autofarm', true)
    trackFeatureToggled('autofarm', false)
    expect(localStorage.getItem(ENABLED_AT_KEY)).toBeNull()
  })

  it('features diferentes têm estado independente', () => {
    setTelemetryEnabled(true)
    trackFeatureToggled('autofarm', true)
    trackFeatureToggled('scavenge', true)
    expect(localStorage.getItem('awesometw:analytics:enabled-at:autofarm')).not.toBeNull()
    expect(localStorage.getItem('awesometw:analytics:enabled-at:scavenge')).not.toBeNull()
  })

  it('desligar sem nunca ter ligado não quebra (sem timestamp salvo)', () => {
    setTelemetryEnabled(true)
    expect(() => trackFeatureToggled('autofarm', false)).not.toThrow()
  })
})
