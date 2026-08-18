import { Settings as GearIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './Automations.module.css'
import { ScavengeSettings } from './ScavengeSettings'
import { Toggle } from './Toggle'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { featureStorageKey } from '../lib/features'

type AutomationsProps = {
  onBack: () => void
}

export function Automations({ onBack }: AutomationsProps) {
  const [autoScavengeEnabled, setAutoScavengeEnabled] = useLocalStorage(
    featureStorageKey('auto-scavenge'),
    false,
  )
  const [configuringScavenge, setConfiguringScavenge] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // enquanto a config aninhada estiver aberta, o Esc dela é quem manda (evita pular direto pro menu principal)
      if (configuringScavenge) return

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onBack()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onBack, configuringScavenge])

  if (configuringScavenge) {
    return <ScavengeSettings onBack={() => setConfiguringScavenge(false)} />
  }

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>AUTOMAÇÕES</h3>

      <h4 className={styles.sectionTitle}>COLETA</h4>
      <div className={styles.row}>
        <div className={styles.labelGroup}>
          <span className={autoScavengeEnabled ? styles.labelActive : undefined}>Coleta automática</span>
          {autoScavengeEnabled && (
            <button
              type="button"
              className={styles.gearIcon}
              onClick={() => setConfiguringScavenge(true)}
              aria-label="Configurar coleta automática"
            >
              <GearIcon size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
        <Toggle checked={autoScavengeEnabled} onChange={setAutoScavengeEnabled} />
      </div>
    </div>
  )
}
