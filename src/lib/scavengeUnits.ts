import type { UnitId } from './scavengeConfig'

/** Capacidade de carga por unidade — constante do jogo, igual em qualquer mundo. */
export const UNIT_CARRY: Record<UnitId, number> = {
  spear: 25,
  sword: 15,
  axe: 10,
  light: 80,
  heavy: 50,
}
