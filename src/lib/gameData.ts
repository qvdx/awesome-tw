type GameData = {
  player?: {
    name?: string
  }
}

declare global {
  interface Window {
    game_data?: GameData
  }
}

export function getPlayerName(): string {
  return window.game_data?.player?.name ?? 'jogador desconhecido'
}
