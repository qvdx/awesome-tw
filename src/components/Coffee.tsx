import { useEffect, useState } from 'react'
import styles from './Coffee.module.css'
import { QrCode } from './QrCode'
import { PIX_COPY_PASTE_CODE } from '../lib/pix'

type CoffeeProps = {
  onBack: () => void
}

export function Coffee({ onBack }: CoffeeProps) {
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

  async function handleCopy() {
    await navigator.clipboard.writeText(PIX_COPY_PASTE_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>PAGUE UM CAFÉ ☕</h3>
      <p className={styles.subtitle}>Se esse script te ajudou, um pix é sempre bem-vindo.</p>

      <div className={styles.qrWrap}>
        <QrCode value={PIX_COPY_PASTE_CODE} size={200} />
      </div>

      <button type="button" className={styles.copyButton} onClick={handleCopy}>
        {copied ? 'copiado!' : 'copiar código pix'}
      </button>
    </div>
  )
}
