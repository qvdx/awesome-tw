/** Minutos por campo já ajustados pela velocidade do mundo, por id de unidade. */
export type UnitSpeeds = Record<string, number>

let cachedPromise: Promise<UnitSpeeds> | null = null

function xmlNumber(doc: Document, selector: string): number {
  return Number(doc.querySelector(selector)?.textContent ?? '0')
}

export function parseUnitSpeeds(configXml: string, unitInfoXml: string): UnitSpeeds {
  const configDoc = new DOMParser().parseFromString(configXml, 'text/xml')
  const unitDoc = new DOMParser().parseFromString(unitInfoXml, 'text/xml')

  // `speed` no mundo faz tudo ser mais rápido (inclusive marcha); `unit_speed`
  // é um multiplicador só pra velocidade de marcha, separado do resto do
  // mundo — os dois dividem o tempo-base (maior valor = mais rápido).
  const worldSpeed = xmlNumber(configDoc, 'config > speed') || 1
  const unitSpeed = xmlNumber(configDoc, 'config > unit_speed') || 1

  const speeds: UnitSpeeds = {}
  unitDoc.querySelectorAll('config > *').forEach((unitNode) => {
    const baseSpeed = Number(unitNode.querySelector('speed')?.textContent ?? '0')
    if (baseSpeed > 0) speeds[unitNode.tagName] = baseSpeed / (worldSpeed * unitSpeed)
  })

  return speeds
}

/**
 * Busca a velocidade de marcha (minutos por campo) de cada unidade, já
 * ajustada pela config do mundo atual — `/interface.php?func=get_config` e
 * `func=get_unit_info` são endpoints públicos do próprio jogo (URL relativa,
 * então pega o mundo certo não importa em qual esteja rodando). Guarda em
 * memória só pela duração da sessão — não é dado que muda em runtime.
 */
export function getUnitSpeeds(): Promise<UnitSpeeds> {
  if (!cachedPromise) {
    cachedPromise = Promise.all([
      fetch('/interface.php?func=get_config', { credentials: 'same-origin' }).then((r) => r.text()),
      fetch('/interface.php?func=get_unit_info', { credentials: 'same-origin' }).then((r) => r.text()),
    ]).then(([configXml, unitInfoXml]) => parseUnitSpeeds(configXml, unitInfoXml))
  }
  return cachedPromise
}

/** Formata minutos totais como HH:MM:SS, igual ao padrão que o próprio jogo usa. */
export function formatTravelTime(fields: number, minutesPerField: number): string {
  const totalSeconds = Math.round(fields * minutesPerField * 60)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}
