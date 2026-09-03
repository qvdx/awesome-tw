import { featureConfigKey } from './features'

export type UnitId = 'spear' | 'sword' | 'axe' | 'light' | 'heavy'

/** Unidades utilizáveis em coleta em qualquer mundo. Arqueiro/arqueiro a cavalo só existem em mundos com arqueiros. */
export const SCAVENGE_UNITS: { id: UnitId; label: string }[] = [
  { id: 'spear', label: 'Lanceiro' },
  { id: 'sword', label: 'Espadachim' },
  { id: 'axe', label: 'Bárbaro' },
  { id: 'light', label: 'Cavalaria Leve' },
  { id: 'heavy', label: 'Cavalaria Pesada' },
]

export function getUnitIconUrl(unitId: UnitId): string {
  return `/graphic/unit/unit_${unitId}.png`
}

export type TroopRule = {
  enabled: boolean
  reserve: number
}

export type ScavengeConfig = {
  /** Teto de duração do ciclo de coleta, em horas — não manda tropa a mais que isso faria voltar depois do prazo. */
  maxDurationHours: number
  autoUnlock: boolean
  troops: Record<UnitId, TroopRule>
  /** vazio = comportamento antigo (só a aldeia da aba aberta); não-vazio = roda só nessas aldeias */
  villageIds: number[]
  /** true assim que o usuário salvar a configuração pela primeira vez — controla se dá pra ativar o toggle */
  configured: boolean
}

export const DEFAULT_SCAVENGE_CONFIG: ScavengeConfig = {
  maxDurationHours: 6,
  autoUnlock: false,
  troops: {
    spear: { enabled: false, reserve: 0 },
    sword: { enabled: false, reserve: 0 },
    axe: { enabled: false, reserve: 0 },
    light: { enabled: false, reserve: 0 },
    heavy: { enabled: false, reserve: 0 },
  },
  villageIds: [],
  configured: false,
}

/**
 * Leitura direta do localStorage (sem passar pelo hook do React) — usada pelo
 * loop de coleta automática, que roda fora de qualquer componente e sempre
 * precisa da config mais recente a cada ciclo, não de um valor "congelado".
 */
export function loadScavengeConfig(): ScavengeConfig {
  try {
    const raw = localStorage.getItem(featureConfigKey('auto-scavenge'))
    if (!raw) return DEFAULT_SCAVENGE_CONFIG
    return { ...DEFAULT_SCAVENGE_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SCAVENGE_CONFIG
  }
}

export function saveScavengeConfig(config: ScavengeConfig): void {
  localStorage.setItem(featureConfigKey('auto-scavenge'), JSON.stringify(config))
}
