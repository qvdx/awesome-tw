import { cacheKey } from './features'
import { tribalWarsPost } from './tribalWarsApi'

export type Village = { id: number; name: string; coord: string }

type LoadVillagesFromGroupResponse = {
  html: string
}

const VILLAGES_CACHE_KEY = cacheKey('villages')

function loadCachedVillages(): Village[] | null {
  try {
    const raw = localStorage.getItem(VILLAGES_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCachedVillages(villages: Village[]): void {
  localStorage.setItem(VILLAGES_CACHE_KEY, JSON.stringify(villages))
}

function parseVillages(html: string): Village[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const villages: Village[] = []

  doc.querySelectorAll<HTMLAnchorElement>('a.select-village').forEach((link) => {
    const id = Number(link.dataset.villageId)
    if (!Number.isInteger(id) || id <= 0) return

    const coord = link.closest('tr')?.querySelector('td:last-child')?.textContent?.trim() ?? ''
    villages.push({ id, name: link.textContent?.trim() ?? '', coord })
  })

  return villages
}

/**
 * Busca a lista de aldeias do jogador usando o mesmo endpoint que o dock de
 * troca de aldeia do próprio jogo usa (screen=groups, grupo "0" = todas as
 * aldeias, sem precisar de nenhum grupo customizado do usuário).
 *
 * Fica em cache no localStorage (útil pra qualquer feature que precise da
 * lista, não só a coleta) — passe `forceRefresh` pra ignorar o cache.
 */
export async function getOwnedVillages(options: { forceRefresh?: boolean } = {}): Promise<Village[]> {
  if (!options.forceRefresh) {
    const cached = loadCachedVillages()
    if (cached) return cached
  }

  const response = await tribalWarsPost<LoadVillagesFromGroupResponse>(
    'groups',
    { ajax: 'load_villages_from_group' },
    { group_id: 0 },
  )

  const villages = parseVillages(response.html)
  saveCachedVillages(villages)
  return villages
}
