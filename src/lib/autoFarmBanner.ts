import styles from './autoFarmBanner.module.css'
import type { AutoFarmProgress } from './runAutoFarmOnce'

const BANNER_ID = 'awesometw-auto-farm-banner'

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Injeta uma barra fixa logo abaixo de `#header_info` avisando que o
 * autofarm está ativo — visível em qualquer tela do jogo, não só no
 * assistente de saque, já que o ciclo roda em background. Mostra a contagem
 * regressiva pra próxima execução e, quando há envios em andamento, troca
 * pra uma barra de progresso. Enquanto busca o assistente de saque de cada
 * aldeia (antes de saber quantos envios vai ter), mostra "verificando..."
 * com um spinner — sem isso, esse intervalo fica com a barra vazia, dando
 * impressão de travado. A bolinha ao lado do rótulo (mesmo padrão da tela de
 * tropas) resume o estado num piscar de olhos: amarela piscando =
 * verificando, verde piscando = enviando comandos, azul parada = em pausa
 * até a próxima execução.
 */
export function showAutoFarmBanner() {
  document.getElementById(BANNER_ID)?.remove()

  const banner = document.createElement('div')
  banner.id = BANNER_ID
  banner.className = styles.banner

  const statusDot = document.createElement('span')
  statusDot.className = `${styles.statusDot} ${styles.statusDotIdle}`
  statusDot.setAttribute('aria-hidden', 'true')

  const label = document.createElement('span')
  label.className = styles.label
  label.append(statusDot, 'Autofarm ativo:')

  const status = document.createElement('span')
  status.className = styles.status
  status.textContent = 'verificando assistente de saque...'

  const spinner = document.createElement('span')
  spinner.className = `${styles.spinner} ${styles.visible}`
  spinner.setAttribute('aria-hidden', 'true')

  const track = document.createElement('div')
  track.className = styles.track
  track.hidden = true
  const fill = document.createElement('div')
  fill.className = styles.fill
  track.append(fill)

  banner.append(label, status, spinner, track)

  const header = document.querySelector('#header_info')
  if (header) {
    header.after(banner)
  } else {
    document.body.prepend(banner)
  }

  let countdownIntervalId: number | undefined
  let nextRunAt: number | null = null

  function tickCountdown() {
    if (nextRunAt === null) return
    status.textContent = `próxima execução em ${formatCountdown(nextRunAt - Date.now())}`
  }

  function setStatusDot(state: 'checking' | 'sending' | 'idle') {
    statusDot.className = `${styles.statusDot} ${
      state === 'checking' ? styles.statusDotChecking : state === 'sending' ? styles.statusDotSending : styles.statusDotIdle
    }`
  }

  return {
    setChecking() {
      setStatusDot('checking')
      spinner.classList.add(styles.visible)
      track.hidden = true
      status.textContent = 'verificando assistente de saque...'
    },
    setNextRunAt(timestamp: number) {
      nextRunAt = timestamp
      setStatusDot('idle')
      spinner.classList.remove(styles.visible)
      track.hidden = true
      tickCountdown()
      if (countdownIntervalId === undefined) {
        countdownIntervalId = window.setInterval(tickCountdown, 1000)
      }
    },
    setProgress(progress: AutoFarmProgress | null) {
      spinner.classList.remove(styles.visible)

      if (!progress || progress.total === 0) {
        track.hidden = true
        return
      }

      setStatusDot('sending')

      track.hidden = false
      const counter = `${progress.completed} de ${progress.total}`
      status.textContent = progress.current
        ? `enviando modelo ${progress.current.action.model} pra ${progress.current.action.targetLabel} — ${counter}`
        : `enviando ${counter}`
      fill.style.width = `${Math.round((progress.completed / progress.total) * 100)}%`
    },
    remove() {
      if (countdownIntervalId !== undefined) window.clearInterval(countdownIntervalId)
      banner.remove()
    },
  }
}
