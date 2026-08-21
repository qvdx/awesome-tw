import { beforeEach, describe, expect, it } from 'vitest'
import { getInstallId, isTelemetryEnabled, parseDsn, setTelemetryEnabled, shouldReportCycle } from './telemetry'

describe('isTelemetryEnabled / setTelemetryEnabled', () => {
  beforeEach(() => localStorage.clear())

  it('desligada por padrão', () => {
    expect(isTelemetryEnabled()).toBe(false)
  })

  it('reflete o que foi setado', () => {
    setTelemetryEnabled(true)
    expect(isTelemetryEnabled()).toBe(true)

    setTelemetryEnabled(false)
    expect(isTelemetryEnabled()).toBe(false)
  })
})

describe('getInstallId', () => {
  beforeEach(() => localStorage.clear())

  it('gera um ID na primeira chamada e reaproveita nas seguintes', () => {
    const first = getInstallId()
    const second = getInstallId()
    expect(first).toBe(second)
    expect(first.length).toBeGreaterThan(0)
  })
})

describe('parseDsn', () => {
  it('extrai host e project id de um DSN válido', () => {
    expect(parseDsn('https://publickey@o123.ingest.us.sentry.io/456')).toEqual({
      host: 'o123.ingest.us.sentry.io',
      projectId: '456',
    })
  })

  it('retorna null pra DSN vazio ou inválido', () => {
    expect(parseDsn('')).toBeNull()
    expect(parseDsn('not a url')).toBeNull()
  })

  it('retorna null se faltar public key ou project id', () => {
    expect(parseDsn('https://o123.ingest.us.sentry.io/456')).toBeNull()
    expect(parseDsn('https://publickey@o123.ingest.us.sentry.io/')).toBeNull()
  })
})

describe('shouldReportCycle', () => {
  beforeEach(() => localStorage.clear())

  // timestamp-base "de verdade" (não perto de zero) — o heartbeat inicial de qualquer
  // feature nova sempre dispara porque o último heartbeat salvo (default 0) já está a
  // mais de 24h de qualquer instante real; usar deltas pequenos a partir daqui evita
  // cruzar esse limiar sem querer entre um teste e outro.
  const NOW = 10_000_000_000
  const DAY_MS = 24 * 60 * 60 * 1000

  it('primeiro ciclo de uma feature dispara (heartbeat inicial)', () => {
    expect(shouldReportCycle('autofarm', true, NOW)).toBe(true)
  })

  it('ciclos repetidos com o mesmo status não disparam de novo antes do heartbeat vencer', () => {
    shouldReportCycle('autofarm', true, NOW)
    expect(shouldReportCycle('autofarm', true, NOW + 1_000)).toBe(false)
  })

  it('transição de sucesso pra falha dispara mesmo sem o heartbeat vencer', () => {
    shouldReportCycle('autofarm', true, NOW)
    expect(shouldReportCycle('autofarm', false, NOW + 1_000)).toBe(true)
  })

  it('transição de falha pra sucesso dispara mesmo sem o heartbeat vencer', () => {
    shouldReportCycle('autofarm', false, NOW)
    expect(shouldReportCycle('autofarm', true, NOW + 1_000)).toBe(true)
  })

  it('dispara de novo depois de 24h mesmo sem transição', () => {
    shouldReportCycle('autofarm', true, NOW)
    expect(shouldReportCycle('autofarm', true, NOW + DAY_MS)).toBe(true)
  })

  it('features diferentes têm estado independente', () => {
    shouldReportCycle('autofarm', true, NOW)
    expect(shouldReportCycle('scavenge', true, NOW)).toBe(true)
  })
})
