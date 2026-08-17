import { useEffect, useState } from 'react'
import styles from './Report.module.css'

const EMAIL = 'qualvalordex@gmail.com'
const REDDIT_URL = 'https://www.reddit.com/user/qvdx'
const REDDIT_HANDLE = 'u/qvdx'

type ReportProps = {
  onBack: () => void
}

export function Report({ onBack }: ReportProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onBack()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onBack])

  async function handleCopyEmail() {
    await navigator.clipboard.writeText(EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>REPORTAR UM PROBLEMA</h3>
      <p className={styles.subtitle}>Achou um bug ou tem uma sugestão? Me chama por aqui:</p>

      <div className={styles.row}>
        <span className={styles.label}>E-mail</span>
        <div className={styles.controls}>
          <a className={styles.link} href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
          <button type="button" className={styles.copyButton} onClick={handleCopyEmail}>
            {copied ? 'copiado!' : 'copiar'}
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Reddit</span>
        <a className={styles.link} href={REDDIT_URL} target="_blank" rel="noopener noreferrer">
          {REDDIT_HANDLE}
        </a>
      </div>
    </div>
  )
}
