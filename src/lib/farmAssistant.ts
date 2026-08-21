import { getCsrfToken } from './gameData'

export type FarmTemplateA = {
  id: number
  /** quantidade exigida de cada unidade (ex: { spy: 1, light: 10 }) */
  units: Record<string, number>
}

export type FarmReport = {
  targetVillageId: number
  /** texto da coordenada do alvo, ex: "(609|742) K76" — só pra exibição (banner/log) */
  targetLabel: string
  reportId: number
  /** true = "Saque completo" (max_loot/1.webp) — relatório não representa mais o saque disponível agora */
  fullLoot: boolean
  /** tropas calculadas pelo jogo pra esvaziar exatamente o que o relatório viu (modelo C); null se o jogo não calculou */
  forecast: Record<string, number> | null
  /** nível de muralha descoberto no relatório (coluna "Nível da muralha descoberto") */
  wallLevel: number
  /** distância em campos até o alvo (coluna de distância) */
  distance: number
  /** recursos previstos pelo último relatório de exploradores */
  resources: { wood: number; stone: number; iron: number }
}

export type FarmAssistantState = {
  templateA: FarmTemplateA | null
  currentUnits: Record<string, number>
  reports: FarmReport[]
}

/**
 * O bloco "Modelos" tem duas linhas por template: a primeira só tem o ícone
 * (`farm_icon_a`/`farm_icon_b`, com rowspan=2), a segunda tem os `<input>`
 * com as quantidades — daí ler a linha seguinte à do ícone.
 *
 * A busca fica escopada a `.loot_assistant_templates`: cada linha da lista
 * de saques também tem um link `.farm_icon_a` (o de reenvio rápido), e sem
 * esse escopo o primeiro do documento inteiro dependeria da ordem em que as
 * seções aparecem na página.
 */
export function parseTemplateA(doc: ParentNode): FarmTemplateA | null {
  const anchor = doc.querySelector<HTMLAnchorElement>('.loot_assistant_templates .farm_icon_a')
  const anchorRow = anchor?.closest('tr')
  const inputsRow = anchorRow?.nextElementSibling
  if (!inputsRow) return null

  const units: Record<string, number> = {}
  let id: number | null = null

  inputsRow.querySelectorAll<HTMLInputElement>('input[type="text"]').forEach((input) => {
    const match = input.name.match(/^(\w+)\[(\d+)\]$/)
    if (!match) return
    id = Number(match[2])
    units[match[1]] = Number(input.value) || 0
  })

  return id === null ? null : { id, units }
}

/** Tropas paradas na aldeia agora, lidas da tabela "Disponibilidade" (`#units_home`). */
export function parseCurrentUnits(doc: ParentNode): Record<string, number> {
  const units: Record<string, number> = {}

  doc.querySelectorAll<HTMLElement>('#units_home [data-unit-count]').forEach((cell) => {
    if (!cell.id) return
    units[cell.id] = Number(cell.dataset.unitCount) || 0
  })

  return units
}

export function parseFarmReports(doc: ParentNode): FarmReport[] {
  const reports: FarmReport[] = []

  doc.querySelectorAll<HTMLTableRowElement>('#plunder_list tr[id^="village_"]').forEach((row) => {
    const targetVillageId = Number(row.id.replace('village_', ''))
    if (!Number.isInteger(targetVillageId)) return

    const reportLink = row.querySelector<HTMLAnchorElement>('a[href*="screen=report"]')
    const reportIdMatch = reportLink?.href.match(/[?&]view=(\d+)/)
    if (!reportIdMatch) return
    const reportId = Number(reportIdMatch[1])
    const targetLabel = reportLink?.textContent?.trim() || `#${targetVillageId}`

    const maxLootSrc = row.querySelector<HTMLImageElement>('img[src*="max_loot/"]')?.src ?? ''
    const fullLoot = /max_loot\/1\.webp/.test(maxLootSrc)

    const forecastRaw = row.querySelector<HTMLElement>('.farm_icon_c')?.dataset.unitsForecast
    let forecast: Record<string, number> | null = null
    if (forecastRaw) {
      try {
        const parsed = JSON.parse(forecastRaw) as Record<string, unknown>
        forecast = Object.fromEntries(Object.entries(parsed).map(([unit, value]) => [unit, Number(value) || 0]))
      } catch {
        forecast = null
      }
    }

    // recursos previstos (madeira/argila/ferro, nessa ordem): cada um vem num
    // <span class="nowrap"> com um <span class="icon ..."> (ícone) e um outro
    // span com o valor — a classe do valor varia (res/warn/warn_90 conforme
    // o quão perto da capacidade máxima está), então filtra pelo que NÃO é o
    // ícone em vez de fixar um nome de classe
    const resourceCell = row.querySelector('td[colspan="3"]')
    const resourceValues = [...(resourceCell?.querySelectorAll('span.nowrap') ?? [])].map((span) => {
      const valueEl = [...span.querySelectorAll('span')].find((el) => !el.classList.contains('icon'))
      return Number(valueEl?.textContent?.replace(/\./g, '')) || 0
    })
    const resources = { wood: resourceValues[0] ?? 0, stone: resourceValues[1] ?? 0, iron: resourceValues[2] ?? 0 }

    // colunas depois do de recursos (colspan=3): muralha, depois distância
    const wallCell = resourceCell?.nextElementSibling
    const wallLevel = Number(wallCell?.textContent) || 0
    const distance = Number(wallCell?.nextElementSibling?.textContent) || 0

    reports.push({ targetVillageId, targetLabel, reportId, fullLoot, forecast, wallLevel, distance, resources })
  })

  return reports
}

/** Maior número de página referenciado na navegação (`Farm_page=N`); 0 se a lista cabe numa página só. */
export function parseMaxFarmPage(doc: ParentNode): number {
  let max = 0
  doc.querySelectorAll<HTMLAnchorElement>('#plunder_list_nav a[href*="Farm_page="]').forEach((a) => {
    const match = a.href.match(/Farm_page=(\d+)/)
    if (match) max = Math.max(max, Number(match[1]))
  })
  return max
}

async function fetchAmFarmDoc(villageId: number, farmPage: number): Promise<Document> {
  const page = farmPage > 0 ? `&Farm_page=${farmPage}` : ''
  const response = await fetch(`/game.php?village=${villageId}&screen=am_farm${page}`, {
    credentials: 'same-origin',
  })
  const html = await response.text()
  return new DOMParser().parseFromString(html, 'text/html')
}

/**
 * Busca o estado do assistente de saque de uma aldeia: modelo A, tropas
 * disponíveis e todos os relatórios da lista "Últimos saques" — varrendo
 * todas as páginas, não só a primeira (a tela pagina em ~15 por página).
 *
 * Sempre via `fetch()` direto (com `village=` explícito na URL), nunca
 * `TribalWars.get` — esse usa a aldeia da aba aberta, e o autofarm precisa
 * buscar aldeias que não são necessariamente a que está na tela.
 */
export async function fetchFarmAssistant(villageId: number): Promise<FarmAssistantState> {
  const firstDoc = await fetchAmFarmDoc(villageId, 0)

  const templateA = parseTemplateA(firstDoc)
  const currentUnits = parseCurrentUnits(firstDoc)
  const reports = parseFarmReports(firstDoc)

  const maxPage = parseMaxFarmPage(firstDoc)
  for (let page = 1; page <= maxPage; page++) {
    const doc = await fetchAmFarmDoc(villageId, page)
    reports.push(...parseFarmReports(doc))
  }

  return { templateA, currentUnits, reports }
}

async function postFarmAction(villageId: number, ajaxaction: string, data: Record<string, string>): Promise<void> {
  const url = `/game.php?village=${villageId}&screen=am_farm&mode=farm&ajaxaction=${ajaxaction}&json=1`
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'TribalWars-Ajax': '1',
    },
    body: new URLSearchParams({ ...data, h: getCsrfToken() }),
  })

  if (!response.ok) {
    throw new Error(`Falha ao enviar (${ajaxaction}) da aldeia ${villageId}: HTTP ${response.status}`)
  }
}

/** Envia o modelo A (template salvo) — mesmo `ajaxaction=farm` que o botão do jogo usa. */
export function sendTemplateA(villageId: number, targetVillageId: number, templateId: number): Promise<void> {
  return postFarmAction(villageId, 'farm', {
    target: String(targetVillageId),
    template_id: String(templateId),
    source: String(villageId),
  })
}

/** Envia o modelo C (calculado a partir do relatório) — o próprio jogo recalcula as tropas a partir do `report_id`. */
export function sendTemplateC(villageId: number, reportId: number): Promise<void> {
  return postFarmAction(villageId, 'farm_from_report', {
    report_id: String(reportId),
  })
}
