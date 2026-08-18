type TribalWarsCallback<T> = (response: T) => void
type TribalWarsErrorCallback = (...args: unknown[]) => void

type TribalWarsGlobal = {
  get: <T>(
    screen: string,
    params: Record<string, unknown>,
    callback: TribalWarsCallback<T>,
    errorCallback?: TribalWarsErrorCallback,
  ) => void
  post: <T>(
    screen: string,
    params: Record<string, unknown>,
    data: Record<string, unknown>,
    callback: TribalWarsCallback<T>,
    errorCallback?: TribalWarsErrorCallback,
  ) => void
}

declare global {
  interface Window {
    TribalWars?: TribalWarsGlobal
  }
}

function getTribalWars(): TribalWarsGlobal {
  if (!window.TribalWars) {
    throw new Error('window.TribalWars não está disponível nesta página.')
  }
  return window.TribalWars
}

/** Wrapper em Promise pro TribalWars.get nativo do jogo — mesmo mecanismo, mesmo CSRF, mesma sessão. */
export function tribalWarsGet<T>(screen: string, params: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    getTribalWars().get<T>(screen, params, resolve, (...args) =>
      reject(new Error(`Falha no GET para "${screen}": ${JSON.stringify(args)}`)),
    )
  })
}

/** Wrapper em Promise pro TribalWars.post nativo do jogo. */
export function tribalWarsPost<T>(
  screen: string,
  params: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    getTribalWars().post<T>(screen, params, data, resolve, (...args) =>
      reject(new Error(`Falha no POST para "${screen}": ${JSON.stringify(args)}`)),
    )
  })
}
