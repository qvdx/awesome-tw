import { describe, expect, it } from 'vitest'
import { parseTrainingQueueHtml } from './trainingQueue'

// Recorte real de screen=train&mode=train (aldeia com fila no quartel e uma
// unidade em treinamento no estábulo) — capturado numa conversa que introduziu
// essa feature.
const REAL_TRAIN_SCREEN_HTML = `
<div class="current_prod_wrapper">
  <div id="replace_barracks">
    <div class="trainqueue_wrap" id="trainqueue_wrap_barracks">
      <table class="vis" style="width: 100%">
        <tbody>
          <tr class="lit">
            <td class="lit-item">
              <div class="unit_sprite unit_sprite_smaller axe"></div>
              10 Bárbaros
            </td>
            <td class="lit-item"><span class="">0:49:30</span></td>
          </tr>
        </tbody>
        <tbody id="trainqueue_barracks" class="ui-sortable">
          <tr class="sortable_row" id="trainorder_0">
            <td class="">
              <div class="unit_sprite unit_sprite_smaller axe"></div>
              30 Bárbaros
            </td>
            <td>2:34:17</td>
          </tr>
          <tr class="sortable_row" id="trainorder_1">
            <td class="">
              <div class="unit_sprite unit_sprite_smaller axe"></div>
              35 Bárbaros
            </td>
            <td>3:00:00</td>
          </tr>
          <tr class="sortable_row" id="trainorder_2">
            <td class="">
              <div class="unit_sprite unit_sprite_smaller axe"></div>
              80 Bárbaros
            </td>
            <td>6:51:26</td>
          </tr>
          <tr class="sortable_row" id="trainorder_3">
            <td class="">
              <div class="unit_sprite unit_sprite_smaller axe"></div>
              128 Bárbaros
            </td>
            <td>10:58:17</td>
          </tr>
          <tr class="sortable_row" id="trainorder_4">
            <td class="">
              <div class="unit_sprite unit_sprite_smaller axe"></div>
              50 Bárbaros
            </td>
            <td>4:17:09</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
<div class="current_prod_wrapper">
  <div id="replace_stable">
    <div class="trainqueue_wrap" id="trainqueue_wrap_stable">
      <table class="vis" style="width: 100%">
        <tbody>
          <tr class="lit">
            <td class="lit-item">
              <div class="unit_sprite unit_sprite_smaller light"></div>
              66 Cavalaria leve
            </td>
            <td class="lit-item"><span class="">13:24:56</span></td>
          </tr>
        </tbody>
        <tbody id="trainqueue_stable" class="ui-sortable"></tbody>
      </table>
    </div>
  </div>
</div>
`

describe('parseTrainingQueueHtml', () => {
  it('soma a unidade em treino (tr.lit) com as que aguardam na fila (tr.sortable_row)', () => {
    expect(parseTrainingQueueHtml(REAL_TRAIN_SCREEN_HTML)).toEqual({ axe: 333, light: 66 })
  })

  it('sem fila nenhuma, retorna objeto vazio em vez de quebrar', () => {
    expect(parseTrainingQueueHtml('<html></html>')).toEqual({})
  })

  it('ignora bloco de fila sem linhas em treino ou aguardando', () => {
    const html = `
      <div class="trainqueue_wrap" id="trainqueue_wrap_garage">
        <table><tbody id="trainqueue_garage"></tbody></table>
      </div>
    `
    expect(parseTrainingQueueHtml(html)).toEqual({})
  })
})
