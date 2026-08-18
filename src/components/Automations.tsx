import { Info, Settings as GearIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './Automations.module.css'
import { ScavengeSettings } from './ScavengeSettings'
import { Toggle } from './Toggle'
import { loadScavengeConfig } from '../lib/scavengeConfig'

type AutomationsProps = {
  autoScavengeEnabled: boolean
  onChangeAutoScavengeEnabled: (enabled: boolean) => void
  onBack: () => void
}

export function Automations({ autoScavengeEnabled, onChangeAutoScavengeEnabled, onBack }: AutomationsProps) {
  const [configuringScavenge, setConfiguringScavenge] = useState(false)
  // relido a cada render (inclusive ao voltar da tela de config) — leitura direta do localStorage, sem hook
  const scavengeConfigured = loadScavengeConfig().configured

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
          <button
            type="button"
            className={styles.gearIcon}
            onClick={() => setConfiguringScavenge(true)}
            aria-label="Configurar coleta automática"
          >
            <GearIcon size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className={styles.controls}>
          {!scavengeConfigured && (
            <span
              className={styles.infoIcon}
              title="Configure a coleta (engrenagem) antes de ativar"
              aria-label="Configure a coleta antes de ativar"
            >
              <Info size={18} strokeWidth={2.5} />
            </span>
          )}
          <Toggle checked={autoScavengeEnabled} onChange={onChangeAutoScavengeEnabled} disabled={!scavengeConfigured} />
        </div>
      </div>
    </div>
  )
}
