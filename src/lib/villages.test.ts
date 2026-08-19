import { describe, expect, it } from 'vitest'
import { parseVillages } from './villages'

// resposta real de screen=groups&ajax=load_villages_from_group (group_id=0),
// capturada com um mapper de rede — ver conversa que introduziu essa feature.
const REAL_LOAD_VILLAGES_HTML = `
	<table id="group_table" class="vis" width="100%" cellpadding="5" cellspacing="0">
		<tbody>
			<tr>
				<th class="group_label" colspan="2"></th>
			</tr>
		</tbody>
	</table>

	<div id="group_popup_content_container">
		<table id="group_table" class="vis" width="100%" cellpadding="5" cellspacing="0">
			<tbody>
					<tr>
					<td id="selected_popup_village" class="selected">
						<a href="#" data-village-id="85096" data-group-id="0" class="select-village">001 | Rio de Janeiro</a>
					</td>
					<td style="font-weight:bold; width:100px; text-align:right" class="selected">
						615|743
					</td>
				</tr>
					<tr>
					<td>
						<a href="#" data-village-id="88653" data-group-id="0" class="select-village">002 | São Paulo</a>
					</td>
					<td style="font-weight:bold; width:100px; text-align:right">
						613|749
					</td>
				</tr>
					</tbody>
		</table>
	</div>

	<script>
		$(function () {
			$('.select-village').on("auxclick click ", function (e) {
				e.preventDefault();
			});
		});
	</script>
`

describe('parseVillages', () => {
  it('extrai id, nome e coordenada de cada aldeia da resposta real do jogo', () => {
    expect(parseVillages(REAL_LOAD_VILLAGES_HTML)).toEqual([
      { id: 85096, name: '001 | Rio de Janeiro', coord: '615|743' },
      { id: 88653, name: '002 | São Paulo', coord: '613|749' },
    ])
  })

  it('html vazio ou sem aldeias, retorna lista vazia', () => {
    expect(parseVillages('')).toEqual([])
    expect(parseVillages('<p>nada aqui</p>')).toEqual([])
  })

  it('ignora link com data-village-id inválido (não numérico ou zero)', () => {
    const html = `
      <table><tbody>
        <tr><td><a class="select-village" data-village-id="abc">Inválida</a></td><td>1|1</td></tr>
        <tr><td><a class="select-village" data-village-id="0">Zero</a></td><td>2|2</td></tr>
        <tr><td><a class="select-village" data-village-id="123">Válida</a></td><td>3|3</td></tr>
      </tbody></table>
    `
    expect(parseVillages(html)).toEqual([{ id: 123, name: 'Válida', coord: '3|3' }])
  })

  it('sem <tr> ao redor do link, coordenada vira string vazia em vez de quebrar', () => {
    const html = `<a class="select-village" data-village-id="123">Solta</a>`
    expect(parseVillages(html)).toEqual([{ id: 123, name: 'Solta', coord: '' }])
  })
})
