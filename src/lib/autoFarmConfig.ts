import { featureConfigKey } from './features'

export type AutoFarmConfig = {
  /** minutos entre cada checagem do assistente de saque + tropas disponíveis */
  intervalMinutes: number
  /** intervalo aleatório (segundos) entre um envio e outro, evita rajada de requisições */
  minDelaySeconds: number
  maxDelaySeconds: number
  /** vazio = roda só na aldeia da aba aberta; não-vazio = roda só nessas aldeias */
  villageIds: number[]
  /** maior nível de muralha descoberto que ainda pode receber comando; null = sem limite */
  maxWallLevel: number | null
  /** maior distância (em campos) que ainda pode receber comando; null = sem limite */
  maxDistance: number | null
  /** true assim que o usuário salvar a configuração pela primeira vez — controla se dá pra ativar o toggle */
  configured: boolean
}

export const DEFAULT_AUTO_FARM_CONFIG: AutoFarmConfig = {
  intervalMinutes: 5,
  minDelaySeconds: 2,
  maxDelaySeconds: 6,
  villageIds: [],
  maxWallLevel: null,
  maxDistance: null,
  configured: false,
}

/**
 * Leitura direta do localStorage (sem passar pelo hook do React) — usada pelo
 * loop de autofarm, que roda fora de qualquer componente e sempre precisa da
 * config mais recente a cada ciclo, não de um valor "congelado".
 */
export function loadAutoFarmConfig(): AutoFarmConfig {
  try {
    const raw = localStorage.getItem(featureConfigKey('auto-farm'))
    if (!raw) return DEFAULT_AUTO_FARM_CONFIG
    return { ...DEFAULT_AUTO_FARM_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_AUTO_FARM_CONFIG
  }
}

export function saveAutoFarmConfig(config: AutoFarmConfig): void {
  localStorage.setItem(featureConfigKey('auto-farm'), JSON.stringify(config))
}
