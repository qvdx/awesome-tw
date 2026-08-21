import { cacheKey } from './features'
import { getVillageCoord, getVillageId } from './gameData'

export type NearbyVillage = {
  id: number
  x: number
  y: number
  points: number
  type: 'barbarian' | 'bonus'
  bonusText: string | null
  distance: number
}

/**
 * Tupla de uma aldeia dentro de um setor do mapa, como o próprio jogo a
 * serializa em `TWMap.sectorPrefech`. Só as posições com significado
 * identificado (id, nome, pontos, dono, bônus, tribo) têm nome — o resto
 * fica como `unknown` em vez de um nome inventado.
 */
type RawVillageTuple = [
  string, // id
  unknown,
  string | 0, // nome (0 = sem nome/sem dono)
  string, // pontos formatados ("6.546")
  string, // id do dono ("0" = sem dono)
  unknown,
  [string, string] | null, // bônus [texto, imagem] ou null
  unknown,
  unknown,
  unknown,
  string, // tipo ("standard")
  string | null, // id da tribo
  unknown,
]

type RawSector = {
  x: number
  y: number
  data: {
    x: number
    y: number
    // o jogo serializa isso como array denso OU objeto esparso, dependendo
    // de quais colunas/linhas têm aldeia — ver normalizeIndexed()
    villages: RawVillageTuple[][] | Record<string, RawVillageTuple[] | Record<string, RawVillageTuple>>
  }
}

type CachedNearbyVillages = {
  fetchedAt: number
  villages: NearbyVillage[]
}

function nearbyVillagesCacheKey(villageId: number): string {
  return cacheKey(`nearby-villages:${villageId}`)
}

function loadCached(villageId: number): CachedNearbyVillages | null {
  try {
    const raw = localStorage.getItem(nearbyVillagesCacheKey(villageId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCached(villageId: number, cached: CachedNearbyVillages): void {
  localStorage.setItem(nearbyVillagesCacheKey(villageId), JSON.stringify(cached))
}

/**
 * Acha o array `TWMap.sectorPrefech = [...]` dentro do HTML da tela do mapa e
 * devolve só o trecho do array, com colchetes balanceados (respeitando
 * strings entre aspas) — um regex não-guloso quebra aqui porque o array tem
 * colchetes aninhados demais.
 */
export function extractSectorPrefech(html: string): string | null {
  const marker = 'TWMap.sectorPrefech = '
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return null

  const arrayStart = markerIndex + marker.length
  if (html[arrayStart] !== '[') return null

  let depth = 0
  let inString = false
  let stringChar = ''
  let escaped = false

  for (let i = arrayStart; i < html.length; i++) {
    const char = html[i]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === stringChar) inString = false
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      stringChar = char
      continue
    }

    if (char === '[') depth++
    else if (char === ']') {
      depth--
      if (depth === 0) return html.slice(arrayStart, i + 1)
    }
  }

  return null
}

export function parseSectorPrefech(html: string): RawSector[] {
  const arrayText = extractSectorPrefech(html)
  if (!arrayText) return []

  try {
    return JSON.parse(arrayText) as RawSector[]
  } catch {
    return []
  }
}

/**
 * O jogo serializa essas coleções indexadas por número como array denso
 * quando os índices começam em 0 sem buracos, ou como objeto (chaves string)
 * quando são esparsas — os dois aparecem no mesmo payload. Normaliza pros
 * dois casos.
 */
function normalizeIndexed<T>(value: T[] | Record<string, T> | undefined): Array<[number, T]> {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item, index): [number, T] => [index, item])
  return Object.entries(value).map(([key, item]): [number, T] => [Number(key), item])
}

function parsePoints(points: string): number {
  return Number(points.replace(/\./g, '')) || 0
}

function euclideanDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function classifyVillages(sectors: RawSector[], base: { x: number; y: number }): NearbyVillage[] {
  const villages: NearbyVillage[] = []

  for (const sector of sectors) {
    for (const [columnOffset, column] of normalizeIndexed(sector.data.villages)) {
      for (const [rowOffset, tuple] of normalizeIndexed(column)) {
        const ownerId = tuple[4]
        const bonus = tuple[6]
        if (ownerId !== '0') continue // aldeia de jogador, fora do escopo por enquanto

        const x = sector.data.x + columnOffset
        const y = sector.data.y + rowOffset

        villages.push({
          id: Number(tuple[0]),
          x,
          y,
          points: parsePoints(tuple[3]),
          type: bonus ? 'bonus' : 'barbarian',
          bonusText: bonus?.[0] ?? null,
          distance: euclideanDistance({ x, y }, base),
        })
      }
    }
  }

  return villages.sort((a, b) => a.distance - b.distance)
}

/** Timestamp (ms) de quando o cache atual foi buscado, ou null se não tem cache pra aldeia atual. */
export function getNearbyVillagesFetchedAt(): number | null {
  const villageId = getVillageId()
  if (villageId === null) return null
  return loadCached(villageId)?.fetchedAt ?? null
}

/**
 * Busca as aldeias bárbaras/bônus ao redor da aldeia base (a atual, por
 * padrão) lendo o HTML da própria tela do mapa do jogo — não existe endpoint
 * AJAX pra isso, o jogo só embute os dados no carregamento da página.
 */
export async function fetchNearbyVillages(options?: { forceRefresh?: boolean }): Promise<NearbyVillage[]> {
  const villageId = getVillageId()
  if (villageId === null) {
    throw new Error('Não achei o ID da aldeia atual pra mapear o entorno.')
  }

  if (!options?.forceRefresh) {
    const cached = loadCached(villageId)
    if (cached) return cached.villages
  }

  const response = await fetch(`/game.php?village=${villageId}&screen=map`, { credentials: 'same-origin' })
  const html = await response.text()

  const base = getVillageCoord() ?? { x: 0, y: 0 }
  const sectors = parseSectorPrefech(html)
  const villages = classifyVillages(sectors, base)

  saveCached(villageId, { fetchedAt: Date.now(), villages })
  return villages
}
