import { beforeEach, describe, expect, it } from 'vitest'
import { getInstallId, isTelemetryEnabled, parseDsn, setTelemetryEnabled } from './telemetry'

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
