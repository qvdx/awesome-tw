import { cacheKey } from './features'

const TRAINING_QUEUE_CACHE_KEY = cacheKey('training-queue')
const CACHE_TTL_MS = 30 * 60 * 1000

type TrainingQueueByVillage = Record<number, Record<string, number>>

type CachedTrainingQueue = {
  fetchedAt: number
  byVillage: TrainingQueueByVillage
}

function loadCached(): CachedTrainingQueue | null {
  try {
    const raw = localStorage.getItem(TRAINING_QUEUE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCached(cached: CachedTrainingQueue): void {
  localStorage.setItem(TRAINING_QUEUE_CACHE_KEY, JSON.stringify(cached))
}

/**
 * Soma as unidades já em treinamento (linha em destaque `tr.lit`) com as que
 * ainda aguardam na fila (`tr.sortable_row`), dentro de qualquer bloco de
 * fila (`[id^="trainqueue_wrap_"]`) — cobre quartel, estábulo, oficina etc.
 * sem precisar saber o id de cada prédio, que varia entre mundos/edições.
 */
export function parseTrainingQueueHtml(html: string): Record<string, number> {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const totals: Record<string, number> = {}

  doc.querySelectorAll<HTMLElement>('[id^="trainqueue_wrap_"]').forEach((wrap) => {
    wrap.querySelectorAll<HTMLTableRowElement>('tr.lit, tr.sortable_row').forEach((row) => {
      const sprite = row.querySelector<HTMLElement>('.unit_sprite')
      if (!sprite) return

      const unitId = [...sprite.classList].find((c) => c !== 'unit_sprite' && !c.startsWith('unit_sprite_'))
      if (!unitId) return

      const quantityMatch = row.querySelector('td')?.textContent?.match(/(\d+)/)
      if (!quantityMatch) return

      totals[unitId] = (totals[unitId] ?? 0) + Number(quantityMatch[1])
    })
  })

  return totals
}

async function fetchVillageTrainingQueue(villageId: number): Promise<Record<string, number>> {
  const response = await fetch(`/game.php?village=${villageId}&screen=train&mode=train`, {
    credentials: 'same-origin',
  })
  const html = await response.text()
  return parseTrainingQueueHtml(html)
}

/** Timestamp (ms) da última busca com sucesso, ou null se ainda não buscou nada. */
export function getTrainingQueueFetchedAt(): number | null {
  return loadCached()?.fetchedAt ?? null
}

/**
 * Busca a fila de recrutamento (unidades em confecção) de cada aldeia. Não
 * existe um endpoint agregado pra isso — cada aldeia exige seu próprio
 * fetch em `screen=train` — então o resultado fica em cache por 30min, tempo
 * suficiente pra não martelar o servidor toda vez que a tela é aberta.
 */
export async function getTrainingQueueForVillages(
  villageIds: number[],
  options: { forceRefresh?: boolean } = {},
): Promise<TrainingQueueByVillage> {
  const cached = loadCached()
  const isFresh = cached !== null && Date.now() - cached.fetchedAt < CACHE_TTL_MS
  const hasAllVillages = cached !== null && villageIds.every((id) => id in cached.byVillage)

  if (!options.forceRefresh && isFresh && hasAllVillages) {
    return cached.byVillage
  }

  const results = await Promise.allSettled(
    villageIds.map(async (id) => [id, await fetchVillageTrainingQueue(id)] as const),
  )

  const byVillage: TrainingQueueByVillage = {}
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      byVillage[result.value[0]] = result.value[1]
    } else {
      console.error(`[awesometw] falha ao buscar fila de recrutamento da aldeia ${villageIds[index]}`, result.reason)
    }
  })

  saveCached({ fetchedAt: Date.now(), byVillage })
  return byVillage
}
