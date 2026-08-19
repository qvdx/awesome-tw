import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './VillageMapping.module.css'
import { Checkbox } from './Checkbox'
import { fetchNearbyVillages, getNearbyVillagesFetchedAt, type NearbyVillage } from '../lib/villageMap'
import { formatTravelTime, getUnitSpeeds, type UnitSpeeds } from '../lib/worldSpeeds'

const TRAVEL_UNITS = ['light', 'ram', 'catapult', 'snob'] as const

function unitIconUrl(unitId: string): string {
  return `/graphic/unit/unit_${unitId}.png`
}

type VillageMappingProps = {
  onBack: () => void
}

function formatRelativeTime(fetchedAt: number): string {
  const minutes = Math.round((Date.now() - fetchedAt) / 60_000)
  if (minutes < 1) return 'atualizado agora mesmo'
  if (minutes < 60) return `atualizado há ${minutes}min`
  const hours = Math.round(minutes / 60)
  return `atualizado há ${hours}h`
}

function villageTypeLabel(village: NearbyVillage): string {
  return village.type === 'bonus' ? 'Bônus' : 'Bárbara'
}

const DISTANCE_FILTERS: { label: string; maxDistance: number | null }[] = [
  { label: 'Todas as distâncias', maxDistance: null },
  { label: 'Até 10 campos', maxDistance: 10 },
  { label: 'Até 15 campos', maxDistance: 15 },
  { label: 'Até 20 campos', maxDistance: 20 },
]

type TypeFilter = 'all' | 'barbarian' | 'bonus'

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'Bárbaras e bônus', value: 'all' },
  { label: 'Só bárbaras', value: 'barbarian' },
  { label: 'Só bônus', value: 'bonus' },
]

export function VillageMapping({ onBack }: VillageMappingProps) {
  const [villages, setVillages] = useState<NearbyVillage[] | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [maxDistance, setMaxDistance] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [unitSpeeds, setUnitSpeeds] = useState<UnitSpeeds | null>(null)

  useEffect(() => {
    getUnitSpeeds()
      .then(setUnitSpeeds)
      .catch((err) => console.error('[awesometw] falha ao buscar a velocidade das tropas do mundo', err))
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

  useEffect(() => {
    // se já tem cache de uma mapeada anterior, mostra ele sem precisar clicar
    // no botão de novo (não busca na rede aqui, só lê o cache)
    if (getNearbyVillagesFetchedAt() === null) return

    fetchNearbyVillages()
      .then((result) => {
        setVillages(result)
        setFetchedAt(getNearbyVillagesFetchedAt())
      })
      .catch(() => {
        // sem cache válido pra mostrar de cara, sem problema — o botão de mapear resolve
      })
  }, [])

  function runMapping(forceRefresh: boolean) {
    setLoading(true)
    setError(null)
    fetchNearbyVillages({ forceRefresh })
      .then((result) => {
        setVillages(result)
        setFetchedAt(getNearbyVillagesFetchedAt())
        setSelectedIds(new Set())
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Falha ao mapear as aldeias.')
      })
      .finally(() => setLoading(false))
  }

  const filteredVillages = (villages ?? []).filter((village) => {
    const matchesType = typeFilter === 'all' || village.type === typeFilter
    const matchesDistance = maxDistance === null || village.distance <= maxDistance
    return matchesType && matchesDistance
  })
  const allFilteredSelected = filteredVillages.length > 0 && filteredVillages.every((v) => selectedIds.has(v.id))

  function toggleVillage(id: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAllVillages() {
    setSelectedIds((current) => {
      if (allFilteredSelected) {
        const next = new Set(current)
        filteredVillages.forEach((v) => next.delete(v.id))
        return next
      }
      return new Set([...current, ...filteredVillages.map((v) => v.id)])
    })
  }

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>MAPEAMENTO DE ALDEIAS</h3>
      <p className={styles.subtitle}>
        Bárbaras e aldeias bônus ao redor da aldeia atual, lendo os dados que a própria tela do Mapa carrega.
      </p>

      {villages === null && (
        <button type="button" className={styles.mapButton} onClick={() => runMapping(false)} disabled={loading}>
          {loading ? 'Mapeando...' : 'Mapear aldeias bárbaras próximas a mim'}
        </button>
      )}

      {villages !== null && (
        <>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.unit}>
              {fetchedAt ? formatRelativeTime(fetchedAt) : ''} · {filteredVillages.length} de {villages.length}{' '}
              aldeias
            </span>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => runMapping(true)}
              disabled={loading}
              aria-label="Atualizar mapeamento"
            >
              <RefreshCw size={14} strokeWidth={2.5} className={loading ? styles.spinning : undefined} />
            </button>
          </div>

          <div className={styles.filtersRow}>
            <select
              className={styles.distanceSelect}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            >
              {TYPE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <select
              className={styles.distanceSelect}
              value={maxDistance ?? ''}
              onChange={(event) => setMaxDistance(event.target.value === '' ? null : Number(event.target.value))}
            >
              {DISTANCE_FILTERS.map((filter) => (
                <option key={filter.label} value={filter.maxDistance ?? ''}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.villageRow}>
            <div className={styles.villageInfo}>
              <Checkbox checked={allFilteredSelected} onChange={toggleAllVillages} label="Selecionar todas" />
            </div>
          </div>

          <div className={styles.villageList}>
            {filteredVillages.length > 0 ? (
              filteredVillages.map((village) => (
                <div key={village.id} className={styles.villageRow}>
                  <div className={styles.villageColumn}>
                    <div className={styles.villageInfo}>
                      <Checkbox
                        checked={selectedIds.has(village.id)}
                        onChange={(checked) => toggleVillage(village.id, checked)}
                      />
                      <span className={village.type === 'bonus' ? styles.bonusTag : undefined}>
                        {villageTypeLabel(village)}
                      </span>
                      <span className={styles.unit}>
                        ({village.x}|{village.y}) · {village.points.toLocaleString('pt-BR')} pts
                      </span>
                    </div>
                    {village.type === 'bonus' && village.bonusText && (
                      <span className={styles.bonusDescription}>{village.bonusText}</span>
                    )}
                    {unitSpeeds && (
                      <div className={styles.travelTimes}>
                        {TRAVEL_UNITS.map((unitId) => {
                          const minutesPerField = unitSpeeds[unitId]
                          if (!minutesPerField) return null
                          return (
                            <span key={unitId} className={styles.travelTime}>
                              <img src={unitIconUrl(unitId)} alt="" className={styles.travelIcon} />
                              {formatTravelTime(village.distance, minutesPerField)}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <span className={styles.unit}>{village.distance.toFixed(1)}</span>
                </div>
              ))
            ) : (
              <p className={styles.unit}>nenhuma aldeia encontrada</p>
            )}
          </div>
        </>
      )}

      {loading && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
