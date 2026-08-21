import { beforeEach, describe, expect, it } from 'vitest'
import { parseCurrentUnits, parseFarmReports, parseMaxFarmPage, parseTemplateA } from './farmAssistant'

// Recorte real de screen=am_farm (Modelos + Disponibilidade + Últimos saques)
// — capturado numa conversa que introduziu essa feature.
const REAL_AM_FARM_HTML = `
<div class="vis">
  <h4>Modelos</h4>
  <table class="vis loot_assistant_templates" width="100%">
    <tbody>
      <tr>
        <td class="template_farm_icon" rowspan="2"><a class="farm_icon farm_icon_a decoration" href="#"></a></td>
        <th>spear</th><th>sword</th><th>axe</th><th>spy</th><th>light</th>
      </tr>
      <tr>
        <input type="hidden" name="template[3609][id]" value="3609">
        <td><input type="text" name="spear[3609]" value="0"/></td>
        <td><input type="text" name="sword[3609]" value="0"/></td>
        <td><input type="text" name="axe[3609]" value="0"/></td>
        <td><input type="text" name="spy[3609]" value="1"/></td>
        <td><input type="text" name="light[3609]" value="10"/></td>
      </tr>
      <tr>
        <td class="template_farm_icon" rowspan="2"><a class="farm_icon farm_icon_b decoration" href="#"></a></td>
        <th>spear</th><th>sword</th><th>axe</th><th>spy</th><th>light</th>
      </tr>
      <tr>
        <input type="hidden" name="template[3895][id]" value="3895">
        <td><input type="text" name="spear[3895]" value="0"/></td>
        <td><input type="text" name="sword[3895]" value="0"/></td>
        <td><input type="text" name="axe[3895]" value="0"/></td>
        <td><input type="text" name="spy[3895]" value="5"/></td>
        <td><input type="text" name="light[3895]" value="0"/></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="vis">
  <table id="units_home">
    <tr>
      <td>Desta aldeia</td>
      <td data-unit-count="0" class="unit-item unit-item-spear hidden" id="spear">0</td>
      <td data-unit-count="0" class="unit-item unit-item-sword hidden" id="sword">0</td>
      <td data-unit-count="753" class="unit-item unit-item-axe" id="axe">753</td>
      <td data-unit-count="31" class="unit-item unit-item-spy" id="spy">31</td>
      <td data-unit-count="76" class="unit-item unit-item-light" id="light">76</td>
    </tr>
  </table>
</div>

<table id="plunder_list">
  <tr id="village_87883" class="report_87883 row_a">
    <td><img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/max_loot/1.webp" title="Saque completo" alt=""></td>
    <td><a href="/game.php?village=88653&amp;screen=report&amp;mode=all&amp;view=85098234">(609|742) K76</a></td>
    <td style="text-align: center;" colspan="3">
      <span class="nowrap"><span class="icon header wood" title="Madeira"> </span><span class="warn">1<span class="grey">.</span>079</span></span>
      <span class="nowrap"><span class="icon header stone" title="Argila"> </span><span class="warn">1<span class="grey">.</span>079</span></span>
      <span class="nowrap"><span class="icon header iron" title="Ferro"> </span><span class="warn">1<span class="grey">.</span>079</span></span>
    </td>
    <td style="text-align: center;">0</td>
    <td>8.1</td>
    <td>
      <a href="#" class="farm_icon_a" onclick="return Accountmanager.farm.sendUnits(this, 87883, 3609)"></a>
      <a href="#" class="farm_icon_c" data-units-forecast="{&quot;spear&quot;:0,&quot;sword&quot;:0,&quot;axe&quot;:0,&quot;spy&quot;:1,&quot;light&quot;:41,&quot;heavy&quot;:0}" onclick="return Accountmanager.farm.sendUnitsFromReport(this, 87883, 85098234, {})"></a>
    </td>
  </tr>
  <tr id="village_88512" class="report_88512 row_b">
    <td><img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/max_loot/0.webp" title="Saque parcial" alt=""></td>
    <td><a href="/game.php?village=88653&amp;screen=report&amp;mode=all&amp;view=85300484">(617|750) K76</a></td>
    <td style="text-align: center;" colspan="3">
      <span class="nowrap"><span class="icon header wood" title="Madeira"> </span><span class="res">120</span></span>
      <span class="nowrap"><span class="icon header stone" title="Argila"> </span><span class="res">140</span></span>
      <span class="nowrap"><span class="icon header iron" title="Ferro"> </span><span class="res">10</span></span>
    </td>
    <td style="text-align: center;">1</td>
    <td>4.1</td>
    <td>
      <a href="#" class="farm_icon_a" onclick="return Accountmanager.farm.sendUnits(this, 88512, 3609)"></a>
      <a href="#" class="farm_icon_c" data-units-forecast="{&quot;spear&quot;:0,&quot;sword&quot;:0,&quot;axe&quot;:0,&quot;spy&quot;:1,&quot;light&quot;:5,&quot;heavy&quot;:0}" onclick="return Accountmanager.farm.sendUnitsFromReport(this, 88512, 85300484, {})"></a>
    </td>
  </tr>
</table>

<div id="plunder_list_nav">
  <strong class="paged-nav-item">&gt;1&lt;</strong>
  <a class="paged-nav-item" href="/game.php?village=88653&amp;screen=am_farm&amp;order=distance&amp;dir=asc&amp;Farm_page=1">[2]</a>
  <a class="paged-nav-item" href="/game.php?village=88653&amp;screen=am_farm&amp;order=distance&amp;dir=asc&amp;Farm_page=2">[3]</a>
  <a class="paged-nav-item" href="/game.php?village=88653&amp;screen=am_farm&amp;order=distance&amp;dir=asc&amp;Farm_page=4">[5]</a>
</div>
`

function buildDoc(): Document {
  document.body.innerHTML = REAL_AM_FARM_HTML
  return document
}

beforeEach(() => {
  buildDoc()
})

describe('parseTemplateA', () => {
  it('lê o id e as quantidades do modelo A (primeiro bloco, farm_icon_a)', () => {
    expect(parseTemplateA(document)).toEqual({ id: 3609, units: { spear: 0, sword: 0, axe: 0, spy: 1, light: 10 } })
  })

  it('não confunde com o modelo B', () => {
    const templateA = parseTemplateA(document)
    expect(templateA?.units.spy).toBe(1) // modelo B tem spy=5 — se pegasse o B, isso falharia
  })
})

describe('parseCurrentUnits', () => {
  it('lê as tropas disponíveis da tabela de Disponibilidade', () => {
    expect(parseCurrentUnits(document)).toEqual({ spear: 0, sword: 0, axe: 753, spy: 31, light: 76 })
  })
})

describe('parseFarmReports', () => {
  it('lê alvo, relatório, saque total, forecast, muralha e distância de cada linha', () => {
    const reports = parseFarmReports(document)

    expect(reports).toEqual([
      {
        targetVillageId: 87883,
        targetLabel: '(609|742) K76',
        reportId: 85098234,
        fullLoot: true,
        forecast: { spear: 0, sword: 0, axe: 0, spy: 1, light: 41, heavy: 0 },
        wallLevel: 0,
        distance: 8.1,
        resources: { wood: 1079, stone: 1079, iron: 1079 },
      },
      {
        targetVillageId: 88512,
        targetLabel: '(617|750) K76',
        reportId: 85300484,
        fullLoot: false,
        forecast: { spear: 0, sword: 0, axe: 0, spy: 1, light: 5, heavy: 0 },
        wallLevel: 1,
        distance: 4.1,
        resources: { wood: 120, stone: 140, iron: 10 },
      },
    ])
  })
})

describe('parseMaxFarmPage', () => {
  it('acha a maior página referenciada na navegação', () => {
    expect(parseMaxFarmPage(document)).toBe(4)
  })

  it('devolve 0 quando não tem paginação', () => {
    document.body.innerHTML = '<div id="plunder_list_nav"></div>'
    expect(parseMaxFarmPage(document)).toBe(0)
  })
})
