import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './ScavengeSettings.module.css'
import { Checkbox } from './Checkbox'
import { SCAVENGE_UNITS, getUnitIconUrl, loadScavengeConfig, saveScavengeConfig, type ScavengeConfig, type UnitId } from '../lib/scavengeConfig'
import { getOwnedVillages, type Village } from '../lib/villages'

type ScavengeSettingsProps = {
  onBack: () => void
}

export function ScavengeSettings({ onBack }: ScavengeSettingsProps) {
  const [config, setConfig] = useState<ScavengeConfig>(loadScavengeConfig)
  const [justSaved, setJustSaved] = useState(false)
  const [villages, setVillages] = useState<Village[]>([])
  const [villagesLoading, setVillagesLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [villageQuery, setVillageQuery] = useState('')

  function loadVillages(forceRefresh = false) {
    const setLoading = forceRefresh ? setRefreshing : setVillagesLoading
    setLoading(true)
    getOwnedVillages({ forceRefresh })
      .then(setVillages)
      .catch((error) => {
        console.error('[awesometw] falha ao listar aldeias', error)
        if (!forceRefresh) setVillages([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadVillages()
  }, [])

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

  const filteredVillages = villages.filter((village) =>
    `${village.name} ${village.coord}`.toLowerCase().includes(villageQuery.toLowerCase()),
  )
  const allFilteredSelected =
    filteredVillages.length > 0 && filteredVillages.every((village) => config.villageIds.includes(village.id))

  function toggleVillage(villageId: number, checked: boolean) {
    handleChange({
      villageIds: checked ? [...config.villageIds, villageId] : config.villageIds.filter((id) => id !== villageId),
    })
  }

  function toggleAllVillages() {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredVillages.map((village) => village.id))
      handleChange({ villageIds: config.villageIds.filter((id) => !filteredIds.has(id)) })
    } else {
      const merged = new Set([...config.villageIds, ...filteredVillages.map((village) => village.id)])
      handleChange({ villageIds: Array.from(merged) })
    }
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

      <div className={styles.sectionHeaderRow}>
        <h4 className={styles.sectionTitle}>ALDEIAS</h4>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => loadVillages(true)}
          disabled={refreshing}
          aria-label="Atualizar lista de aldeias"
        >
          <RefreshCw size={14} strokeWidth={2.5} className={refreshing ? styles.spinning : undefined} />
        </button>
      </div>
      {villagesLoading ? (
        <p className={styles.unit}>carregando aldeias...</p>
      ) : villages.length > 0 ? (
        <>
          {villages.length > 8 && (
            <input
              type="text"
              placeholder="Buscar aldeia..."
              className={styles.searchInput}
              value={villageQuery}
              onChange={(event) => setVillageQuery(event.target.value)}
            />
          )}
          <div className={styles.troopRow}>
            <div className={styles.troopInfo}>
              <Checkbox checked={allFilteredSelected} onChange={toggleAllVillages} label="Selecionar todas" />
            </div>
          </div>
          <div className={styles.villageList}>
            {filteredVillages.length > 0 ? (
              filteredVillages.map((village) => (
                <div key={village.id} className={styles.troopRow}>
                  <div className={styles.troopInfo}>
                    <Checkbox
                      checked={config.villageIds.includes(village.id)}
                      onChange={(checked) => toggleVillage(village.id, checked)}
                      label={`${village.name} (${village.coord})`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.unit}>nenhuma aldeia encontrada</p>
            )}
          </div>
        </>
      ) : (
        <p className={styles.unit}>
          Não consegui listar suas aldeias — a coleta vai rodar só na aldeia atual.
        </p>
      )}

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        {justSaved ? 'salvo!' : 'salvar'}
      </button>
    </div>
  )
}
