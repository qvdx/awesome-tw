type GameData = {
  player?: {
    name?: string
  }
  village?: {
    id?: number
    x?: number
    y?: number
  }
  units?: string[]
}

declare global {
  interface Window {
    game_data?: GameData
  }
  // eslint-disable-next-line no-var -- ambiente do Tampermonkey, precisa ser `var` pra mesclar com a declaração em tribalWarsApi.ts
  var unsafeWindow: Window
}

// O build final injeta `@grant GM_addStyle` (por causa do CSS Modules), o que faz o
// Tampermonkey rodar o script num sandbox — `window` aí não é mais o window de verdade
// da página, então `game_data` (setado pelo próprio jogo) fica invisível. `unsafeWindow`
// é a ponte oficial do Tampermonkey pra esse caso.
export function getPlayerName(): string {
  return unsafeWindow.game_data?.player?.name ?? 'jogador desconhecido'
}

/** Lista completa de unidades do mundo (inclui as que a coleta não usa, tipo espião/aríete). */
export function getUnitIds(): string[] {
  return unsafeWindow.game_data?.units ?? []
}

export function getVillageId(): number | null {
  return unsafeWindow.game_data?.village?.id ?? null
}

export function getVillageCoord(): { x: number; y: number } | null {
  const village = unsafeWindow.game_data?.village
  if (village?.x === undefined || village?.y === undefined) return null
  return { x: village.x, y: village.y }
}
