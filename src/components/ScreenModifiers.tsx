import { useEffect } from 'react'
import styles from './ScreenModifiers.module.css'
import { Toggle } from './Toggle'

type ScreenModifiersProps = {
  trainingQueueOverlayEnabled: boolean
  onChangeTrainingQueueOverlayEnabled: (enabled: boolean) => void
  onBack: () => void
}

export function ScreenModifiers({
  trainingQueueOverlayEnabled,
  onChangeTrainingQueueOverlayEnabled,
  onBack,
}: ScreenModifiersProps) {
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

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>MODIFICADORES DE TELA</h3>
      <p className={styles.subtitle}>
        Liga alterações visuais direto nas telas do próprio jogo — sem esconder que vieram daqui.
      </p>

      <div className={styles.row}>
        <span>Visualizar tropas em produção</span>
        <Toggle checked={trainingQueueOverlayEnabled} onChange={onChangeTrainingQueueOverlayEnabled} />
      </div>
    </div>
  )
}
