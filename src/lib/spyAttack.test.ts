import { describe, expect, it } from 'vitest'
import { extractConfirmHash, extractDynamicFormField } from './spyAttack'

// Recorte real de screen=place&ajax=command (formulário de distribuir ordens)
// — capturado numa conversa que introduziu essa feature.
const REAL_COMMAND_DIALOG_HTML = `
<form id="command-data-form" name="units" action="/game.php?village=85096&amp;screen=place&amp;try=confirm" method="post" class="float_left">
    <input type="hidden" name="cf68c7fe7da83f50de1741" value="3af7498ecf68c7" />
    <input type="hidden" id="template_id" name="template_id" value="" />
    <input type="hidden" name="source_village" value="85096">
    <input type="text" name="x" id="inputx" value="" style="display: none" />
    <input type="text" name="y" id="inputy" value="" style="display: none" />
</form>
`

// Recorte real de screen=place&ajax=confirm (tela de confirmação do ataque).
const REAL_CONFIRM_DIALOG_HTML = `
<form id="command-data-form" action="/game.php?village=85096&amp;screen=place&amp;action=command&amp;h=ff9695a2" method="post">
    <input type="hidden" name="attack" value="true" />
    <input type="hidden" name="ch" value="1567eb64588c597189d1af8f3c837017:2ce1168a9f33fbac2988c8e8203a77433109d4949988bc50cf16dbbe396c27ee" />
    <input type="hidden" name="cb" />
    <input type="hidden" name="x" value="609" />
    <input type="hidden" name="y" value="738" />
</form>
`

describe('extractDynamicFormField', () => {
  it('acha o campo escondido de nome dinâmico, ignorando os de nome fixo', () => {
    expect(extractDynamicFormField(REAL_COMMAND_DIALOG_HTML)).toEqual({
      name: 'cf68c7fe7da83f50de1741',
      value: '3af7498ecf68c7',
    })
  })

  it('sem o formulário #command-data-form, retorna null em vez de quebrar', () => {
    expect(extractDynamicFormField('<html></html>')).toBeNull()
  })

  it('só com campos de nome fixo (jogo mudou o formulário), retorna null', () => {
    const html = `
      <form id="command-data-form">
        <input type="hidden" name="template_id" value="" />
        <input type="hidden" name="source_village" value="85096" />
      </form>
    `
    expect(extractDynamicFormField(html)).toBeNull()
  })
})

describe('extractConfirmHash', () => {
  it('extrai o valor do input "ch"', () => {
    expect(extractConfirmHash(REAL_CONFIRM_DIALOG_HTML)).toBe(
      '1567eb64588c597189d1af8f3c837017:2ce1168a9f33fbac2988c8e8203a77433109d4949988bc50cf16dbbe396c27ee',
    )
  })

  it('sem o input "ch", retorna null em vez de quebrar', () => {
    expect(extractConfirmHash('<html></html>')).toBeNull()
  })
})
