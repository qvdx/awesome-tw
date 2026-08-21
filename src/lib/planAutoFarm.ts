import type { FarmAssistantState, FarmReport } from './farmAssistant'

export type FarmAction =
  | { model: 'C'; targetVillageId: number; targetLabel: string; reportId: number }
  | { model: 'A'; targetVillageId: number; targetLabel: string; templateId: number }

export type PlanAutoFarmOptions = {
  /** maior nível de muralha descoberto que ainda pode receber comando; null = sem limite */
  maxWallLevel: number | null
  /** maior distância (em campos) que ainda pode receber comando; null = sem limite */
  maxDistance: number | null
}

export type VillageFarmState = { villageId: number; state: FarmAssistantState }

function canAfford(pool: Record<string, number>, need: Record<string, number>): boolean {
  return Object.entries(need).every(([unit, count]) => (pool[unit] ?? 0) >= count)
}

function consume(pool: Record<string, number>, need: Record<string, number>): void {
  Object.entries(need).forEach(([unit, count]) => {
    pool[unit] = (pool[unit] ?? 0) - count
  })
}

function totalUnits(units: Record<string, number>): number {
  return Object.values(units).reduce((sum, count) => sum + count, 0)
}

/**
 * "Farm ótimo" = maximizar recurso saqueado por campo percorrido, não por
 * aldeia mais perto — uma aldeia longe com bastante recurso vale mais que uma
 * pertinho quase vazia. `distance` já é proporcional ao tempo de viagem pra
 * qualquer velocidade de tropa fixa (a ida-e-volta é só um fator 2 constante,
 * não muda a ordem relativa), então serve como proxy sem precisar calcular
 * tempo de verdade. `Math.max(distance, 0.1)` evita divisão por zero num
 * alvo colado na aldeia de origem.
 */
function lootEfficiency(report: FarmReport): number {
  const totalResources = report.resources.wood + report.resources.stone + report.resources.iron
  return totalResources / Math.max(report.distance, 0.1)
}

function eligibleReports(state: FarmAssistantState, options: PlanAutoFarmOptions): FarmReport[] {
  return state.reports.filter((report) => {
    if (options.maxWallLevel !== null && report.wallLevel > options.maxWallLevel) return false
    if (options.maxDistance !== null && report.distance > options.maxDistance) return false
    return true
  })
}

type Candidate = {
  villageId: number
  report: FarmReport
  model: 'C' | 'A'
  cost: Record<string, number>
  templateId?: number
  score: number
}

/**
 * O assistente de saque é compartilhado pra conta inteira — os mesmos alvos
 * aparecem em qualquer aldeia, só a distância (e por consequência a
 * eficiência) muda. Planejar aldeia por aldeia de forma isolada podia mandar
 * duas aldeias atacarem o MESMO alvo no mesmo ciclo (desperdício de tropa,
 * já que uma delas bastava), enquanto outro alvo ficava sem nenhuma tropa
 * disponível pra ele. Aqui cada alvo só é reivindicado por UMA aldeia — a
 * mais eficiente entre as que ainda têm tropa pra ele — liberando o resto
 * das aldeias pra outros alvos.
 *
 * Duas rodadas GLOBAIS (não por aldeia, por cima de todas juntas):
 *
 * 1. Modelo C tem prioridade em toda a lista, em qualquer aldeia — só entra
 *    quando o relatório não é de saque total e o forecast pede tropa
 *    suficiente (não menos que o modelo A daquela aldeia). Candidatos
 *    ordenados por `lootEfficiency` (maior primeiro); pra um mesmo alvo,
 *    isso naturalmente favorece a aldeia mais perto — mas cai pra outra
 *    aldeia elegível se a mais perto não tiver tropa.
 * 2. O que sobrar de tropa em cada aldeia, nos alvos que nenhuma aldeia
 *    reivindicou no modelo C (saque total, forecast menor que o modelo A, ou
 *    sem tropa em lugar nenhum), vai pro modelo A — mesma lógica de
 *    eficiência e de aldeia mais barata primeiro.
 *
 * Devolve o plano por aldeia (id → ações), já pronto pra `sendAutoFarmActions`.
 */
export function planAutoFarmAcrossVillages(
  villages: VillageFarmState[],
  options: PlanAutoFarmOptions,
): Map<number, FarmAction[]> {
  const pools = new Map(villages.map(({ villageId, state }) => [villageId, { ...state.currentUnits }]))
  const actionsByVillage = new Map<number, FarmAction[]>(villages.map(({ villageId }) => [villageId, []]))
  const eligibleByVillage = new Map(villages.map(({ villageId, state }) => [villageId, eligibleReports(state, options)]))
  const claimedTargets = new Set<number>()

  function commit(candidate: Candidate): void {
    consume(pools.get(candidate.villageId)!, candidate.cost)
    claimedTargets.add(candidate.report.targetVillageId)

    const action: FarmAction =
      candidate.model === 'C'
        ? {
            model: 'C',
            targetVillageId: candidate.report.targetVillageId,
            targetLabel: candidate.report.targetLabel,
            reportId: candidate.report.reportId,
          }
        : {
            model: 'A',
            targetVillageId: candidate.report.targetVillageId,
            targetLabel: candidate.report.targetLabel,
            templateId: candidate.templateId as number,
          }

    actionsByVillage.get(candidate.villageId)!.push(action)
  }

  function runRound(candidates: Candidate[]): void {
    const sorted = [...candidates].sort((a, b) => b.score - a.score)
    for (const candidate of sorted) {
      if (claimedTargets.has(candidate.report.targetVillageId)) continue
      if (!canAfford(pools.get(candidate.villageId)!, candidate.cost)) continue
      commit(candidate)
    }
  }

  const cCandidates: Candidate[] = []
  for (const { villageId, state } of villages) {
    const templateATotal = state.templateA ? totalUnits(state.templateA.units) : 0

    for (const report of eligibleByVillage.get(villageId) ?? []) {
      const forecastCoversTemplateA = !state.templateA || (report.forecast && totalUnits(report.forecast) >= templateATotal)
      if (!report.fullLoot && report.forecast && forecastCoversTemplateA) {
        cCandidates.push({ villageId, report, model: 'C', cost: report.forecast, score: lootEfficiency(report) })
      }
    }
  }
  runRound(cCandidates)

  const aCandidates: Candidate[] = []
  for (const { villageId, state } of villages) {
    if (!state.templateA) continue
    const templateA = state.templateA

    for (const report of eligibleByVillage.get(villageId) ?? []) {
      if (claimedTargets.has(report.targetVillageId)) continue
      aCandidates.push({
        villageId,
        report,
        model: 'A',
        cost: templateA.units,
        templateId: templateA.id,
        score: lootEfficiency(report),
      })
    }
  }
  runRound(aCandidates)

  return actionsByVillage
}
