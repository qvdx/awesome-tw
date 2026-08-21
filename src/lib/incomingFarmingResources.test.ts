import { beforeEach, describe, expect, it } from 'vitest'
import { getReturningFarmCommandIds, sumBooty } from './incomingFarmingResources'

// Recorte real de #commands_outgoings (screen=overview) — capturado numa
// conversa que introduziu essa feature. Inclui: dois comandos "retornando"
// de saque (o caso que interessa), um "retornando" de apoio (sem ícone de
// saque, deve ser ignorado) e um ataque ainda indo (não é "return", ignorado).
const REAL_COMMANDS_HTML = `
<div id="commands_outgoings" data-type="outgoing" data-village="88653">
 <table><tbody>
  <tr class="command-row">
    <td>
      <span class="quickedit-out" data-id="1414271079">
        <span class="icon-container">
          <span class="command_hover_details" data-command-id="1414271079" data-command-type="return">
            <img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/command/return_farm.webp" alt="">
          </span>
          <span class="command_hover_details" data-command-id="1414271079" data-command-type="return">
            <img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/command/return_spy.webp" alt="">
          </span>
        </span>
      </span>
    </td>
  </tr>
  <tr class="command-row">
    <td>
      <span class="quickedit-out" data-id="259394408">
        <span class="icon-container">
          <span class="command_hover_details" data-command-id="259394408" data-command-type="return">
            <img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/command/return_farm.webp" alt="">
          </span>
        </span>
      </span>
    </td>
  </tr>
  <tr class="command-row">
    <td>
      <span class="quickedit-out" data-id="999000111">
        <span class="icon-container">
          <span class="command_hover_details" data-command-id="999000111" data-command-type="return">
            <img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/command/return_support.webp" alt="">
          </span>
        </span>
      </span>
    </td>
  </tr>
  <tr class="command-row">
    <td>
      <span class="quickedit-out" data-id="202286061">
        <span class="icon-container">
          <span class="command_hover_details" data-command-id="202286061" data-command-type="attack">
            <img src="https://dsbr.innogamescdn.com/asset/d4119ec5/graphic/command/farm.webp" alt="">
          </span>
        </span>
      </span>
    </td>
  </tr>
 </tbody></table>
</div>
`

function buildContainer(): Element {
  document.body.innerHTML = REAL_COMMANDS_HTML
  return document.querySelector('#commands_outgoings') as Element
}

describe('getReturningFarmCommandIds', () => {
  beforeEach(() => {
    buildContainer()
  })

  it('pega só os comandos "retornando" com ícone de saque (ignora apoio retornando e ataques ainda indo)', () => {
    const container = buildContainer()
    expect(getReturningFarmCommandIds(container)).toEqual(['1414271079', '259394408'])
  })

  it('não duplica id quando o comando tem mais de um ícone de saque na mesma linha', () => {
    document.body.innerHTML = `
      <div id="commands_outgoings">
        <table><tbody>
        <tr class="command-row">
          <td>
            <span class="quickedit-out" data-id="1">
              <span class="command_hover_details" data-command-type="return">
                <img src="graphic/command/return_farm.webp">
              </span>
              <span class="command_hover_details" data-command-type="return">
                <img src="graphic/command/return_farm.webp">
              </span>
            </span>
          </td>
        </tr>
        </tbody></table>
      </div>
    `
    const container = document.querySelector('#commands_outgoings') as Element
    expect(getReturningFarmCommandIds(container)).toEqual(['1'])
  })
})

describe('sumBooty', () => {
  it('soma o booty cacheado dos ids informados', () => {
    const cache = {
      '1': { wood: 240, stone: 240, iron: 240 },
      '2': { wood: 100, stone: 0, iron: 50 },
    }
    expect(sumBooty(['1', '2'], cache)).toEqual({ wood: 340, stone: 240, iron: 290 })
  })

  it('ignora ids ainda não cacheados (aguardando a busca)', () => {
    const cache = { '1': { wood: 240, stone: 240, iron: 240 } }
    expect(sumBooty(['1', '2'], cache)).toEqual({ wood: 240, stone: 240, iron: 240 })
  })

  it('devolve zero pra lista vazia', () => {
    expect(sumBooty([], {})).toEqual({ wood: 0, stone: 0, iron: 0 })
  })
})
