import { getCsrfToken, getVillageId } from './gameData'
import { tribalWarsGet, tribalWarsPost } from './tribalWarsApi'

type CommandDialogResponse = { dialog: string }
type ConfirmResponse = { dialog: string }
type SubmitResponse = { message?: string }

/**
 * O formulário de "distribuir ordens" (`ajax=command`) embute um campo
 * escondido com NOME aleatório a cada carregamento — proteção anti-bot
 * clássica do jogo. Os outros dois hidden inputs têm nome fixo
 * (`template_id`, `source_village`), então o dinâmico é o único que sobra.
 */
export function extractDynamicFormField(html: string): { name: string; value: string } | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const form = doc.querySelector('#command-data-form')
  if (!form) return null

  const knownNames = new Set(['template_id', 'source_village'])
  const input = [...form.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].find(
    (el) => el.name && !knownNames.has(el.name),
  )

  return input ? { name: input.name, value: input.value } : null
}

/** O hash `ch` nasce na tela de confirmação (`ajax=confirm`) e é amarrado ao ataque específico (tropas + alvo) — não dá pra reusar entre envios. */
export function extractConfirmHash(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.querySelector<HTMLInputElement>('input[name="ch"]')?.value ?? null
}

export type SpyAttackTarget = {
  villageId: number
  x: number
  y: number
}

/**
 * Reproduz o fluxo real de 3 passos que o jogo faz ao mandar um ataque pela
 * Praça de Reunião (capturado via inspeção de rede numa conversa que
 * introduziu essa feature):
 *
 * 1. GET `ajax=command` — abre o formulário, de onde extraímos o campo
 *    anti-bot de nome dinâmico.
 * 2. POST `ajax=confirm` — manda tropas + alvo, recebe de volta o hash `ch`
 *    (amarrado a esse ataque específico).
 * 3. POST `ajaxaction=popup_command` — confirma e envia de verdade, usando
 *    o `ch` do passo anterior.
 */
export async function sendSpyAttack(target: SpyAttackTarget, spyCount: number): Promise<void> {
  const sourceVillageId = getVillageId()
  if (sourceVillageId === null) {
    throw new Error('Não achei o ID da aldeia atual pra mandar o ataque.')
  }

  const csrf = getCsrfToken()

  const commandResponse = await tribalWarsGet<CommandDialogResponse>('place', {
    ajax: 'command',
    target: target.villageId,
  })
  const dynamicField = extractDynamicFormField(commandResponse.dialog)
  if (!dynamicField) {
    throw new Error('Não achei o campo de segurança do formulário de ataque — o jogo pode ter mudado.')
  }

  const confirmResponse = await tribalWarsPost<ConfirmResponse>(
    'place',
    { ajax: 'confirm' },
    {
      [dynamicField.name]: dynamicField.value,
      template_id: '',
      source_village: String(sourceVillageId),
      spear: '',
      sword: '',
      axe: '',
      spy: String(spyCount),
      light: '',
      heavy: '',
      ram: '',
      catapult: '',
      knight: '',
      snob: '',
      x: String(target.x),
      y: String(target.y),
      input: '',
      attack: 'l',
      h: csrf,
    },
  )
  const ch = extractConfirmHash(confirmResponse.dialog)
  if (!ch) {
    throw new Error('Não consegui confirmar o ataque — hash de confirmação não encontrado na resposta.')
  }

  await tribalWarsPost<SubmitResponse>(
    'place',
    { ajaxaction: 'popup_command' },
    {
      attack: 'true',
      ch,
      cb: 'troop_confirm_submit',
      x: String(target.x),
      y: String(target.y),
      source_village: String(sourceVillageId),
      village: String(sourceVillageId),
      attack_name: '',
      spear: '0',
      sword: '0',
      axe: '0',
      spy: String(spyCount),
      light: '0',
      heavy: '0',
      ram: '0',
      catapult: '0',
      knight: '0',
      snob: '0',
      building: 'main',
      h: csrf,
    },
  )
}
