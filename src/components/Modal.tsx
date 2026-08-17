import { useEffect, type ReactNode } from 'react'
import styles from './Modal.module.css'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <span className={`${styles.corner} ${styles.cornerTl}`} />
        <span className={`${styles.corner} ${styles.cornerTr}`} />
        <span className={`${styles.corner} ${styles.cornerBl}`} />
        <span className={`${styles.corner} ${styles.cornerBr}`} />

        <div className={styles.header}>
          <div className={styles.lights}>
            <span className={styles.lightRed} />
            <span className={styles.lightAmber} />
            <span className={styles.lightGreen} />
          </div>
          <div className={styles.title}>
            root@tribalwars<span className={styles.prompt}>:~$</span> awesome-tw-scripts
            <span className={styles.cursor}>▋</span>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button" aria-label="Fechar">
            [X]
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
