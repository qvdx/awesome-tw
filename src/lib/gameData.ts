type GameData = {
  player?: {
    name?: string
  }
  village?: {
    id?: number
  }
  units?: string[]
}

declare global {
  interface Window {
    game_data?: GameData
  }
}

export function getPlayerName(): string {
  return window.game_data?.player?.name ?? 'jogador desconhecido'
}

/** Lista completa de unidades do mundo (inclui as que a coleta não usa, tipo espião/aríete). */
export function getUnitIds(): string[] {
  return window.game_data?.units ?? []
}

export function getVillageId(): number | null {
  return window.game_data?.village?.id ?? null
}
