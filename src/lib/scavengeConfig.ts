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
  intervalHours: number
  autoUnlock: boolean
  troops: Record<UnitId, TroopRule>
}

export const DEFAULT_SCAVENGE_CONFIG: ScavengeConfig = {
  intervalHours: 3,
  autoUnlock: false,
  troops: {
    spear: { enabled: false, reserve: 0 },
    sword: { enabled: false, reserve: 0 },
    axe: { enabled: false, reserve: 0 },
    light: { enabled: false, reserve: 0 },
    heavy: { enabled: false, reserve: 0 },
  },
}
