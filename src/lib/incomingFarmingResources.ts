import styles from './incomingFarmingResources.module.css'
import { cacheKey } from './features'
import { tribalWarsGet } from './tribalWarsApi'
import { waitForElement } from './waitForElement'

const CACHE_KEY = cacheKey('incoming-farming-resources-booty')

// mesma lógica de sendMassSpyAttacks.ts: um pedido de cada vez, com intervalo
// aleatório — em rajada (ex: 13+ comandos retornando de uma vez) o próprio
// jogo bloqueia por excesso de requisições
const MIN_FETCH_DELAY_MS = 400
const MAX_FETCH_DELAY_MS = 900

function randomDelayMs(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type Booty = { wood: number; stone: number; iron: number }

// TribalWars.get já entrega o payload desembrulhado (o `response` do JSON
// bruto vira o próprio argumento do callback) — ver spyAttack.ts, que usa
// `commandResponse.dialog` direto pelo mesmo motivo.
type CommandDetailsResponse = {
  type: string
  booty?: Partial<Record<'wood' | 'stone' | 'iron', string>>
}

type BootyCache = Record<string, Booty>

function loadCache(): BootyCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCache(cache: BootyCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

/**
 * IDs dos comandos "retornando" que são ataques de saque (ícone
 * `return_farm.webp`, `data-command-type="return"`) — só esses carregam
 * recursos. Espionagens/apoios retornando batem `data-command-type="return"`
 * também, mas não têm esse ícone, então ficam de fora (evita gastar requisição
 * à toa, já que a espoliação deles é sempre zero).
 */
export function getReturningFarmCommandIds(container: Element): string[] {
  const ids = new Set<string>()

  container
    .querySelectorAll<HTMLImageElement>('.command_hover_details[data-command-type="return"] img[src*="farm.webp"]')
    .forEach((img) => {
      const row = img.closest('tr.command-row')
      const id = row?.querySelector<HTMLElement>('.quickedit-out[data-id]')?.dataset.id
      if (id) ids.add(id)
    })

  return [...ids]
}

async function fetchBooty(id: string): Promise<Booty> {
  const response = await tribalWarsGet<CommandDetailsResponse>('info_command', {
    ajax: 'details',
    id,
  })

  return {
    wood: Number(response.booty?.wood ?? 0),
    stone: Number(response.booty?.stone ?? 0),
    iron: Number(response.booty?.iron ?? 0),
  }
}

export function sumBooty(ids: string[], cache: BootyCache): Booty {
  return ids.reduce<Booty>(
    (total, id) => {
      const booty = cache[id]
      if (!booty) return total
      return {
        wood: total.wood + booty.wood,
        stone: total.stone + booty.stone,
        iron: total.iron + booty.iron,
      }
    },
    { wood: 0, stone: 0, iron: 0 },
  )
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

const RESOURCES = ['wood', 'stone', 'iron'] as const

/**
 * O jogo renderiza os ícones de recurso como sprites CSS (`<span class="icon
 * header wood">`, ver #header_info), não `<img src>` — reaproveita a mesma
 * classe nativa, que já existe no CSS da própria página, em vez de apontar
 * pra um caminho de asset que a gente teria que adivinhar/manter.
 */
function buildResourceAmount(resource: (typeof RESOURCES)[number]) {
  const element = document.createElement('span')
  element.className = styles.resource

  const icon = document.createElement('span')
  icon.className = `icon header ${resource} ${styles.resourceIcon}`
  icon.setAttribute('aria-hidden', 'true')

  const value = document.createElement('span')

  element.append(icon, value)

  return { element, setValue: (text: string) => (value.textContent = text) }
}

function buildBanner() {
  const element = document.createElement('div')
  element.className = styles.banner

  const label = document.createElement('span')
  label.className = styles.label
  label.textContent = 'Recursos chegando das aldeias bárbaras:'

  const amounts = RESOURCES.map(buildResourceAmount)

  const count = document.createElement('span')
  count.className = styles.count

  const spinner = document.createElement('span')
  spinner.className = styles.spinner
  spinner.setAttribute('aria-hidden', 'true')

  element.append(label, ...amounts.map((amount) => amount.element), count, spinner)
  // `hidden` não funcionaria aqui: a classe .banner já define `display: flex`,
  // e CSS de autor sempre vence a regra `[hidden] { display: none }` do user
  // agent — por isso o controle é via style.display direto (inline vence a classe).
  element.style.display = 'none'

  return {
    element,
    setLoading(loading: boolean) {
      spinner.classList.toggle(styles.visible, loading)
    },
    update(booty: Booty, commandCount: number) {
      element.style.display = commandCount === 0 ? 'none' : ''
      if (commandCount === 0) return

      amounts[0].setValue(formatNumber(booty.wood))
      amounts[1].setValue(formatNumber(booty.stone))
      amounts[2].setValue(formatNumber(booty.iron))
      count.textContent = `(${commandCount} comando${commandCount === 1 ? '' : 's'})`
    },
  }
}

/**
 * Injeta um resumo dos recursos que vêm voltando com os ataques de saque
 * (soma o `booty` de cada comando "retornando" com ícone de saque), logo
 * acima do widget "Suas tropas" (`#show_outgoing_units`) da Visão Geral.
 *
 * O `booty` de um comando não muda depois de calculado pelo servidor, então
 * cada ID é buscado uma única vez e cacheado indefinidamente; um
 * MutationObserver reage a comandos novos/removidos pra manter o resumo em
 * dia sem re-buscar o que já foi buscado. Devolve uma função de limpeza.
 */
export function initIncomingFarmingResources(): () => void {
  let cancelled = false
  let observer: MutationObserver | null = null

  waitForElement('#show_outgoing_units').then((widget) => {
    if (cancelled) return

    const banner = buildBanner()
    widget.before(banner.element)

    const cache = loadCache()
    let refreshing = false
    let refreshAgain = false

    async function refresh() {
      if (refreshing) {
        refreshAgain = true
        return
      }
      refreshing = true

      const container = document.querySelector('#commands_outgoings')
      if (!container) {
        refreshing = false
        return
      }

      const ids = getReturningFarmCommandIds(container)
      const missingIds = ids.filter((id) => !(id in cache))

      if (missingIds.length > 0) {
        banner.setLoading(true)
        for (let i = 0; i < missingIds.length; i++) {
          try {
            cache[missingIds[i]] = await fetchBooty(missingIds[i])
            saveCache(cache)
            banner.update(sumBooty(ids, cache), ids.length)
          } catch (err) {
            console.error('[awesometw] falha ao buscar recursos do comando', err)
          }

          if (i < missingIds.length - 1) {
            await wait(randomDelayMs(MIN_FETCH_DELAY_MS, MAX_FETCH_DELAY_MS))
          }
        }
        banner.setLoading(false)
      }

      // remove do cache comandos que não estão mais na lista (já chegaram)
      Object.keys(cache).forEach((id) => {
        if (!ids.includes(id)) delete cache[id]
      })
      saveCache(cache)

      banner.update(sumBooty(ids, cache), ids.length)

      refreshing = false
      if (refreshAgain) {
        refreshAgain = false
        await refresh()
      }
    }

    observer = new MutationObserver(() => refresh())
    const container = document.querySelector('#commands_outgoings')
    if (container) observer.observe(container, { childList: true, subtree: true })

    refresh()
  })

  return () => {
    cancelled = true
    observer?.disconnect()
  }
}
