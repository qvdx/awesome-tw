import { useEffect, useState } from 'react'
import styles from './ScavengeSettings.module.css'
import { Checkbox } from './Checkbox'
import { SCAVENGE_UNITS, getUnitIconUrl, loadScavengeConfig, saveScavengeConfig, type ScavengeConfig, type UnitId } from '../lib/scavengeConfig'

type ScavengeSettingsProps = {
  onBack: () => void
}

export function ScavengeSettings({ onBack }: ScavengeSettingsProps) {
  const [config, setConfig] = useState<ScavengeConfig>(loadScavengeConfig)
  const [justSaved, setJustSaved] = useState(false)

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

  function updateTroop(unitId: UnitId, patch: Partial<ScavengeConfig['troops'][UnitId]>) {
    setConfig({
      ...config,
      troops: {
        ...config.troops,
        [unitId]: { ...config.troops[unitId], ...patch },
      },
    })
    setJustSaved(false)
  }

  function handleChange(patch: Partial<ScavengeConfig>) {
    setConfig({ ...config, ...patch })
    setJustSaved(false)
  }

  function handleSave() {
    const toSave = { ...config, configured: true }
    saveScavengeConfig(toSave)
    setConfig(toSave)
    setJustSaved(true)
  }

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>COLETA AUTOMÁTICA</h3>

      <h4 className={styles.sectionTitle}>GERAL</h4>
      <div className={styles.row}>
        <span>Rodar a cada</span>
        <div className={styles.intervalControl}>
          <input
            type="number"
            min={0.5}
            step={0.5}
            className={styles.numberInput}
            value={config.intervalHours}
            onChange={(event) => handleChange({ intervalHours: Number(event.target.value) || 0 })}
          />
          <span className={styles.unit}>horas</span>
        </div>
      </div>

      <div className={styles.rowCheckbox}>
        <Checkbox
          checked={config.autoUnlock}
          onChange={(checked) => handleChange({ autoUnlock: checked })}
          label="Desbloquear níveis de coleta automaticamente"
        />
      </div>

      <h4 className={styles.sectionTitle}>TROPAS</h4>
      {SCAVENGE_UNITS.map((unit) => {
        const rule = config.troops[unit.id]
        return (
          <div key={unit.id} className={styles.troopRow}>
            <div className={styles.troopInfo}>
              <Checkbox checked={rule.enabled} onChange={(checked) => updateTroop(unit.id, { enabled: checked })} />
              <img src={getUnitIconUrl(unit.id)} alt={unit.label} className={styles.troopIcon} />
              <span>{unit.label}</span>
            </div>
            {rule.enabled && (
              <div className={styles.reserveControl}>
                <span className={styles.unit}>Reservar</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className={styles.numberInput}
                  value={rule.reserve}
                  onChange={(event) => updateTroop(unit.id, { reserve: Number(event.target.value) || 0 })}
                />
              </div>
            )}
          </div>
        )
      })}

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        {justSaved ? 'salvo!' : 'salvar'}
      </button>
    </div>
  )
}
