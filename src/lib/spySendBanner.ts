import styles from './spySendBanner.module.css'
import type { MassSpyProgress } from './sendMassSpyAttacks'

const BANNER_ID = 'awesometw-spy-banner'

/**
 * Injeta uma barra de progresso logo abaixo de `#header_info` (a tabela de
 * recursos/nome da aldeia no topo do jogo) — assim o jogador vê o andamento
 * da espionagem em massa mesmo se fechar o modal do AwesomeTW. Remove
 * qualquer banner anterior antes de criar um novo (evita duplicar se o
 * usuário disparar duas levas em sequência).
 */
export function showSpySendBanner(onStop: () => void) {
  document.getElementById(BANNER_ID)?.remove()

  const banner = document.createElement('div')
  banner.id = BANNER_ID
  banner.className = styles.banner

  const label = document.createElement('span')
  label.className = styles.label
  label.textContent = 'Espionagem em massa: iniciando...'

  const track = document.createElement('div')
  track.className = styles.track
  const fill = document.createElement('div')
  fill.className = styles.fill
  track.append(fill)

  const stopButton = document.createElement('button')
  stopButton.type = 'button'
  stopButton.className = styles.stopButton
  stopButton.textContent = 'Interromper'
  stopButton.addEventListener('click', onStop)

  banner.append(label, track, stopButton)

  const header = document.querySelector('#header_info')
  if (header) {
    header.after(banner)
  } else {
    document.body.prepend(banner)
  }

  return {
    update(progress: MassSpyProgress) {
      label.textContent = `Espionagem em massa: ${progress.completed} de ${progress.total}`
      const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
      fill.style.width = `${pct}%`
    },
    remove() {
      banner.remove()
    },
  }
}
