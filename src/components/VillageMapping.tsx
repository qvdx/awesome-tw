import { Eye, Filter, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import styles from './VillageMapping.module.css'
import { Checkbox } from './Checkbox'
import { sendMassSpyAttacks, type MassSpyProgress } from '../lib/sendMassSpyAttacks'
import { showSpySendBanner } from '../lib/spySendBanner'
import { fetchNearbyVillages, getNearbyVillagesFetchedAt, type NearbyVillage } from '../lib/villageMap'
import { formatTravelTime, getUnitSpeeds, type UnitSpeeds } from '../lib/worldSpeeds'

const TRAVEL_UNITS = ['light', 'ram', 'catapult', 'snob'] as const

// valor inicial do campo "exploradores por ataque" no diálogo — o jogador pode mudar antes de confirmar
const DEFAULT_SPY_COUNT = 5
// intervalo aleatório entre cada envio, pra não disparar em rajada
const SPY_MIN_DELAY_MS = 1000
const SPY_MAX_DELAY_MS = 3000

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
  const [minPoints, setMinPoints] = useState<number | null>(null)
  const [maxPoints, setMaxPoints] = useState<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [unitSpeeds, setUnitSpeeds] = useState<UnitSpeeds | null>(null)
  const [spyDialogOpen, setSpyDialogOpen] = useState(false)
  const [spyCountInput, setSpyCountInput] = useState(DEFAULT_SPY_COUNT)
  const [spying, setSpying] = useState(false)
  const [spyProgress, setSpyProgress] = useState<MassSpyProgress | null>(null)
  const [spySummary, setSpySummary] = useState<string | null>(null)
  const spyAbortRef = useRef<AbortController | null>(null)

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
    const matchesMinPoints = minPoints === null || village.points >= minPoints
    const matchesMaxPoints = maxPoints === null || village.points <= maxPoints
    return matchesType && matchesDistance && matchesMinPoints && matchesMaxPoints
  })
  const allFilteredSelected = filteredVillages.length > 0 && filteredVillages.every((v) => selectedIds.has(v.id))

  useEffect(() => {
    // ao mudar o filtro, tira do conjunto qualquer aldeia que ficou de fora
    // dele — senão a seleção "vaza" pra aldeias escondidas (bug: "selecionar
    // todas" parecia ignorar o filtro porque a espionagem em massa lê
    // `selectedIds` puro, sem cruzar com a lista filtrada)
    const filteredIds = new Set(filteredVillages.map((v) => v.id))
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => filteredIds.has(id)))
      return next.size === current.size ? current : next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a mudança de filtro, não a toda recomputação de filteredVillages
  }, [typeFilter, maxDistance, minPoints, maxPoints])

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

  function confirmSpySelected() {
    const targets = (villages ?? [])
      .filter((v) => selectedIds.has(v.id))
      .map((v) => ({ villageId: v.id, x: v.x, y: v.y }))
    if (targets.length === 0) return

    const controller = new AbortController()
    spyAbortRef.current = controller

    setSpyDialogOpen(false)
    setSpying(true)
    setSpySummary(null)
    setSpyProgress({ completed: 0, total: targets.length })

    const banner = showSpySendBanner(() => controller.abort())

    sendMassSpyAttacks(
      targets,
      { spyCount: spyCountInput, minDelayMs: SPY_MIN_DELAY_MS, maxDelayMs: SPY_MAX_DELAY_MS, signal: controller.signal },
      (progress) => {
        setSpyProgress(progress)
        banner.update(progress)
      },
    )
      .then((results) => {
        const successCount = results.filter((r) => r.success).length
        const wasStopped = results.length < targets.length
        setSpySummary(
          wasStopped
            ? `Espionagem interrompida: ${results.length} de ${targets.length} aldeias processadas (${successCount} com sucesso).`
            : `Espionagem concluída: ${successCount} de ${results.length} enviados com sucesso.`,
        )
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Falha ao espiar as aldeias selecionadas.')
      })
      .finally(() => {
        setSpying(false)
        spyAbortRef.current = null
        banner.remove()
      })
  }

  function stopSpying() {
    spyAbortRef.current?.abort()
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
            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.refreshButton} ${filtersOpen ? styles.refreshButtonActive : ''}`}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-label="Mostrar/ocultar filtros"
              >
                <Filter size={14} strokeWidth={2.5} />
              </button>
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
          </div>

          {filtersOpen && (
            <>
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

              <div className={styles.filtersRow}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={styles.pointsInput}
                  placeholder="Pontos mín."
                  value={minPoints ?? ''}
                  onChange={(event) => setMinPoints(event.target.value === '' ? null : Number(event.target.value))}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={styles.pointsInput}
                  placeholder="Pontos máx."
                  value={maxPoints ?? ''}
                  onChange={(event) => setMaxPoints(event.target.value === '' ? null : Number(event.target.value))}
                />
              </div>
            </>
          )}

          <div className={styles.villageRow}>
            <div className={styles.villageInfo}>
              <Checkbox
                checked={allFilteredSelected}
                onChange={toggleAllVillages}
                label={selectedIds.size > 0 ? `Selecionar todas (${selectedIds.size})` : 'Selecionar todas'}
              />
            </div>
            <button
              type="button"
              className={styles.spyButton}
              onClick={() => setSpyDialogOpen((open) => !open)}
              disabled={selectedIds.size === 0 || spying}
              aria-label="Espiar aldeias selecionadas"
              aria-expanded={spyDialogOpen}
              title={
                selectedIds.size === 0
                  ? 'Espiar aldeias selecionadas (selecione ao menos uma aldeia pra usar a espionagem em massa)'
                  : 'Espiar aldeias selecionadas'
              }
            >
              <Eye size={16} strokeWidth={2.5} />
            </button>
          </div>

          {spyDialogOpen && !spying && (
            <div className={styles.spyDialog}>
              <label className={styles.spyDialogLabel}>
                Exploradores por ataque
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className={styles.pointsInput}
                  value={spyCountInput}
                  onChange={(event) => setSpyCountInput(Math.max(1, Number(event.target.value) || 1))}
                />
              </label>
              <div className={styles.spyDialogActions}>
                <button type="button" className={styles.spyDialogCancel} onClick={() => setSpyDialogOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className={styles.mapButton} onClick={confirmSpySelected}>
                  Espiar {selectedIds.size} {selectedIds.size === 1 ? 'aldeia' : 'aldeias'}
                </button>
              </div>
            </div>
          )}

          {spying && spyProgress && (
            <div className={styles.spyProgressWrap}>
              <div className={styles.spyProgressHeader}>
                <span className={styles.unit}>
                  Espiando {spyProgress.completed} de {spyProgress.total}...
                </span>
                <button type="button" className={styles.spyStopButton} onClick={stopSpying}>
                  Interromper
                </button>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.spyProgressFill}
                  style={{ width: `${Math.round((spyProgress.completed / spyProgress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {!spying && spySummary && <p className={styles.unit}>{spySummary}</p>}

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
