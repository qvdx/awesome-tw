import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './ScavengeSettings.module.css'
import { Checkbox } from './Checkbox'
import { DEFAULT_AUTO_FARM_CONFIG, loadAutoFarmConfig, saveAutoFarmConfig, type AutoFarmConfig } from '../lib/autoFarmConfig'
import { getOwnedVillages, type Village } from '../lib/villages'

type AutoFarmSettingsProps = {
  onBack: () => void
}

export function AutoFarmSettings({ onBack }: AutoFarmSettingsProps) {
  const [config, setConfig] = useState<AutoFarmConfig>(loadAutoFarmConfig)
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

  function handleChange(patch: Partial<AutoFarmConfig>) {
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
    saveAutoFarmConfig(toSave)
    setConfig(toSave)
    setJustSaved(true)
  }

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>AUTOFARM</h3>

      <h4 className={styles.sectionTitle}>GERAL</h4>
      <div className={styles.row}>
        <span>Checar a cada</span>
        <div className={styles.intervalControl}>
          <input
            type="number"
            min={1}
            step={1}
            className={styles.numberInput}
            value={config.intervalMinutes}
            onChange={(event) =>
              handleChange({ intervalMinutes: Number(event.target.value) || DEFAULT_AUTO_FARM_CONFIG.intervalMinutes })
            }
          />
          <span className={styles.unit}>minutos</span>
        </div>
      </div>

      <div className={styles.row}>
        <span>Intervalo entre envios</span>
        <div className={styles.intervalControl}>
          <input
            type="number"
            min={0}
            step={1}
            className={styles.numberInput}
            value={config.minDelaySeconds}
            onChange={(event) => handleChange({ minDelaySeconds: Number(event.target.value) || 0 })}
          />
          <span className={styles.unit}>a</span>
          <input
            type="number"
            min={0}
            step={1}
            className={styles.numberInput}
            value={config.maxDelaySeconds}
            onChange={(event) => handleChange({ maxDelaySeconds: Number(event.target.value) || 0 })}
          />
          <span className={styles.unit}>segundos</span>
        </div>
      </div>

      <h4 className={styles.sectionTitle}>LIMITES</h4>
      <div className={styles.row}>
        <Checkbox
          checked={config.maxWallLevel !== null}
          onChange={(checked) => handleChange({ maxWallLevel: checked ? 0 : null })}
          label="Muralha máxima"
        />
        {config.maxWallLevel !== null && (
          <div className={styles.intervalControl}>
            <input
              type="number"
              min={0}
              step={1}
              className={styles.numberInput}
              value={config.maxWallLevel}
              onChange={(event) => handleChange({ maxWallLevel: Number(event.target.value) || 0 })}
            />
            <span className={styles.unit}>nível</span>
          </div>
        )}
      </div>

      <div className={styles.row}>
        <Checkbox
          checked={config.maxDistance !== null}
          onChange={(checked) => handleChange({ maxDistance: checked ? 10 : null })}
          label="Distância máxima"
        />
        {config.maxDistance !== null && (
          <div className={styles.intervalControl}>
            <input
              type="number"
              min={0}
              step={1}
              className={styles.numberInput}
              value={config.maxDistance}
              onChange={(event) => handleChange({ maxDistance: Number(event.target.value) || 0 })}
            />
            <span className={styles.unit}>campos</span>
          </div>
        )}
      </div>

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
        <p className={styles.unit}>Não consegui listar suas aldeias — o autofarm vai rodar só na aldeia atual.</p>
      )}

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        {justSaved ? 'salvo!' : 'salvar'}
      </button>
    </div>
  )
}
