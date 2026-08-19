import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './VillageMapping.module.css'
import { Checkbox } from './Checkbox'
import { fetchNearbyVillages, getNearbyVillagesFetchedAt, type NearbyVillage } from '../lib/villageMap'

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

function villageLabel(village: NearbyVillage): string {
  return village.type === 'bonus' ? `Bônus: ${village.bonusText}` : 'Bárbara'
}

export function VillageMapping({ onBack }: VillageMappingProps) {
  const [villages, setVillages] = useState<NearbyVillage[] | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

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

  const filteredVillages = (villages ?? []).filter((village) =>
    `${villageLabel(village)} ${village.x}|${village.y}`.toLowerCase().includes(query.toLowerCase()),
  )
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
              {fetchedAt ? formatRelativeTime(fetchedAt) : ''} · {villages.length} aldeias
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

          <input
            type="text"
            placeholder="Buscar por tipo ou coordenada..."
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className={styles.villageRow}>
            <div className={styles.villageInfo}>
              <Checkbox checked={allFilteredSelected} onChange={toggleAllVillages} label="Selecionar todas" />
            </div>
          </div>

          <div className={styles.villageList}>
            {filteredVillages.length > 0 ? (
              filteredVillages.map((village) => (
                <div key={village.id} className={styles.villageRow}>
                  <div className={styles.villageInfo}>
                    <Checkbox
                      checked={selectedIds.has(village.id)}
                      onChange={(checked) => toggleVillage(village.id, checked)}
                    />
                    <span className={village.type === 'bonus' ? styles.bonusTag : undefined}>
                      {villageLabel(village)}
                    </span>
                    <span className={styles.unit}>
                      ({village.x}|{village.y})
                    </span>
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
