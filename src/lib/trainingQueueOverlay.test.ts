import { beforeEach, describe, expect, it } from 'vitest'
import { buildQueueRow, getColumnUnitIds, injectQueueRows, isUnitsOverviewScreen } from './trainingQueueOverlay'

// Recorte real de screen=overview_villages&mode=units (thead + duas aldeias) —
// capturado numa conversa que introduziu essa feature.
const REAL_UNITS_TABLE_HTML = `
<table id="units_table">
  <thead>
    <tr>
      <th>Aldeia (2)</th>
      <th></th>
      <th><img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/unit/unit_spear.webp"></th>
      <th><img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/unit/unit_axe.webp"></th>
      <th><img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/unit/unit_light.webp"></th>
      <th>Ação</th>
    </tr>
  </thead>
  <tbody class="row_marker row_a">
    <tr>
      <td rowspan="5">
        <span class="quickedit-vn" data-id="85096"></span>
      </td>
      <td>suas próprias</td>
      <td class="unit-item">1296</td><td class="unit-item">1227</td><td class="unit-item hidden">0</td>
      <td>Comandos</td>
    </tr>
    <tr style="font-weight: bold">
      <td>total</td>
      <td class="unit-item">1696</td><td class="unit-item">1627</td><td class="unit-item hidden">0</td>
      <td>Tropas</td>
    </tr>
  </tbody>
  <tbody class="row_marker row_b">
    <tr>
      <td rowspan="5">
        <span class="quickedit-vn" data-id="88653"></span>
      </td>
      <td>suas próprias</td>
      <td class="unit-item hidden">0</td><td class="unit-item">533</td><td class="unit-item">35</td>
      <td>Comandos</td>
    </tr>
    <tr style="font-weight: bold">
      <td>total</td>
      <td class="unit-item hidden">0</td><td class="unit-item">533</td><td class="unit-item">268</td>
      <td>Tropas</td>
    </tr>
  </tbody>
</table>
`

function buildTable(): HTMLTableElement {
  document.body.innerHTML = REAL_UNITS_TABLE_HTML
  return document.querySelector('#units_table') as HTMLTableElement
}

describe('isUnitsOverviewScreen', () => {
  it('reconhece a tela de tropas da Visão Geral', () => {
    window.history.pushState({}, '', '/game.php?village=1&screen=overview_villages&mode=units')
    expect(isUnitsOverviewScreen()).toBe(true)
  })

  it('rejeita outras telas ou outros modos', () => {
    window.history.pushState({}, '', '/game.php?village=1&screen=overview_villages&mode=incomings')
    expect(isUnitsOverviewScreen()).toBe(false)

    window.history.pushState({}, '', '/game.php?village=1&screen=train&mode=train')
    expect(isUnitsOverviewScreen()).toBe(false)
  })
})

describe('getColumnUnitIds', () => {
  it('lê a ordem das unidades a partir dos ícones do cabeçalho', () => {
    const table = buildTable()
    expect(getColumnUnitIds(table)).toEqual(['spear', 'axe', 'light'])
  })
})

describe('buildQueueRow', () => {
  it('monta uma célula por unidade, na ordem recebida, marcando zero como "hidden"', () => {
    const row = buildQueueRow(['spear', 'axe', 'light'], { axe: 333 })
    const cells = [...row.querySelectorAll('td')]

    expect(cells).toHaveLength(5) // rótulo + 3 unidades + coluna de ação — sem filler, essa linha entra dentro do rowspan
    expect(cells[0].textContent).toBe('recrutando')
    expect(cells[1].textContent).toBe('0')
    expect(cells[1].className).toContain('hidden')
    expect(cells[2].textContent).toBe('333')
    expect(cells[2].className).not.toContain('hidden')
  })

  it('bolinha de status fica "ativa" quando há algo na fila, "inativa" quando não há nada', () => {
    const withQueue = buildQueueRow(['spear', 'axe', 'light'], { axe: 333 })
    const withoutQueue = buildQueueRow(['spear', 'axe', 'light'], {})

    expect(withQueue.querySelector('[aria-hidden]')?.className).toMatch(/statusDotActive/)
    expect(withoutQueue.querySelector('[aria-hidden]')?.className).toMatch(/statusDotInactive/)
  })
})

describe('injectQueueRows', () => {
  beforeEach(() => {
    buildTable()
  })

  it('adiciona uma linha por aldeia, casando pelo id da própria aldeia', () => {
    const table = document.querySelector('#units_table') as HTMLTableElement
    injectQueueRows(table, ['spear', 'axe', 'light'], { 85096: { axe: 333 }, 88653: { light: 66 } })

    const rows = table.querySelectorAll('[data-awesometw-queue-row]')
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('333')
    expect(rows[1].textContent).toContain('66')
  })

  it('insere a linha antes da linha de "total" nativa, não depois', () => {
    const table = document.querySelector('#units_table') as HTMLTableElement
    injectQueueRows(table, ['spear', 'axe', 'light'], { 85096: { axe: 333 } })

    const firstTbody = table.querySelector('tbody') as HTMLTableSectionElement
    const rows = [...firstTbody.querySelectorAll('tr')]
    expect(rows).toHaveLength(3)
    expect(rows[0].textContent).toContain('suas próprias')
    expect(rows[1].textContent).toContain('recrutando')
    expect(rows[2].textContent).toContain('total')
  })

  it('adiciona uma célula vazia na linha "total", que deixa de estar coberta pelo rowspan ao virar a 6ª linha', () => {
    const table = document.querySelector('#units_table') as HTMLTableElement
    injectQueueRows(table, ['spear', 'axe', 'light'], { 85096: { axe: 333 } })

    const firstTbody = table.querySelector('tbody') as HTMLTableSectionElement
    const totalRow = [...firstTbody.querySelectorAll('tr')].find((row) => row.textContent?.includes('total'))
    const totalCells = [...(totalRow?.querySelectorAll('td') ?? [])]

    expect(totalCells[0].hasAttribute('data-awesometw-total-filler')).toBe(true)
    expect(totalCells[1].textContent).toBe('total')
  })

  it('não duplica a linha se já tiver sido injetada', () => {
    const table = document.querySelector('#units_table') as HTMLTableElement
    injectQueueRows(table, ['spear', 'axe', 'light'], { 85096: { axe: 333 } })
    injectQueueRows(table, ['spear', 'axe', 'light'], { 85096: { axe: 333 } })

    expect(table.querySelectorAll('[data-awesometw-queue-row]')).toHaveLength(2)
  })
})
