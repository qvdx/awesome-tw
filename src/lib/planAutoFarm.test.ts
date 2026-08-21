import { describe, expect, it } from 'vitest'
import { planAutoFarmAcrossVillages, type PlanAutoFarmOptions, type VillageFarmState } from './planAutoFarm'
import type { FarmAssistantState, FarmReport } from './farmAssistant'

const templateA = { id: 3609, units: { spy: 1, light: 10 } } // total = 11
const noLimits: PlanAutoFarmOptions = { maxWallLevel: null, maxDistance: null }

/** recursos previstos concentrados em madeira, só pra não poluir os testes com os três campos */
function res(total: number) {
  return { wood: total, stone: 0, iron: 0 }
}

/** builder de relatório com defaults sensatos — só passa o que o teste precisa customizar */
function report(overrides: Partial<FarmReport> & Pick<FarmReport, 'targetVillageId' | 'reportId'>): FarmReport {
  return {
    targetLabel: `#${overrides.targetVillageId}`,
    fullLoot: false,
    forecast: null,
    wallLevel: 0,
    distance: 5,
    resources: res(0),
    ...overrides,
  }
}

function baseState(overrides: Partial<FarmAssistantState> = {}): FarmAssistantState {
  return {
    templateA,
    currentUnits: { spy: 100, light: 100 },
    reports: [],
    ...overrides,
  }
}

/** planeja pra uma aldeia só, devolvendo direto a lista de ações dela (a maioria dos testes não é sobre coordenação entre aldeias) */
function planSingle(state: FarmAssistantState, options: PlanAutoFarmOptions = noLimits) {
  const plan = planAutoFarmAcrossVillages([{ villageId: 1, state }], options)
  return plan.get(1)
}

describe('planAutoFarmAcrossVillages — decisão por relatório (aldeia única)', () => {
  it('prioriza o modelo C quando o relatório não é de saque total, tem tropa pro forecast e o forecast não é menor que o modelo A', () => {
    const state = baseState({
      reports: [report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 20 }, resources: res(1000) })],
    })

    expect(planSingle(state)).toEqual([{ model: 'C', targetVillageId: 1, targetLabel: '#1', reportId: 10 }])
  })

  it('prefere o modelo A quando o forecast do modelo C pede menos tropa no total que o modelo A', () => {
    const state = baseState({
      reports: [report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 3 }, resources: res(1000) })],
    })

    expect(planSingle(state)).toEqual([{ model: 'A', targetVillageId: 1, targetLabel: '#1', templateId: 3609 }])
  })

  it('cai pro modelo A quando o relatório é de saque total', () => {
    const state = baseState({
      reports: [
        report({ targetVillageId: 1, reportId: 10, fullLoot: true, forecast: { spy: 1, light: 20 }, resources: res(1000) }),
      ],
    })

    expect(planSingle(state)).toEqual([{ model: 'A', targetVillageId: 1, targetLabel: '#1', templateId: 3609 }])
  })

  it('cai pro modelo A quando não tem tropa suficiente pro forecast do modelo C', () => {
    const state = baseState({
      currentUnits: { spy: 1, light: 10 }, // dá pra A (spy:1, light:10), não dá pro forecast de C (light:50)
      reports: [report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 50 }, resources: res(1000) })],
    })

    expect(planSingle(state)).toEqual([{ model: 'A', targetVillageId: 1, targetLabel: '#1', templateId: 3609 }])
  })

  it('não envia nada quando não tem tropa nem pra C nem pra A', () => {
    const state = baseState({
      currentUnits: { spy: 0, light: 0 },
      reports: [
        report({ targetVillageId: 1, reportId: 10, fullLoot: true, forecast: { spy: 1, light: 20 }, resources: res(1000) }),
      ],
    })

    expect(planSingle(state)).toEqual([])
  })

  it('não envia o modelo A sem um modelo A configurado', () => {
    const state = baseState({
      templateA: null,
      reports: [report({ targetVillageId: 1, reportId: 10, fullLoot: true })],
    })

    expect(planSingle(state)).toEqual([])
  })

  it('consome o pool de tropas entre relatórios, sem prometer a mesma tropa duas vezes', () => {
    const state = baseState({
      currentUnits: { spy: 1, light: 15 }, // só dá pra um envio (C ou A, ambos custam light:10), não os dois
      reports: [
        report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 10 }, resources: res(1000) }),
        report({ targetVillageId: 2, reportId: 20, fullLoot: true }),
      ],
    })

    expect(planSingle(state)).toEqual([{ model: 'C', targetVillageId: 1, targetLabel: '#1', reportId: 10 }])
  })

  it('prioriza o alvo com mais recurso por campo (lootEfficiency), mesmo mais longe que um alvo mais pobre e mais perto', () => {
    const state = baseState({
      currentUnits: { spy: 1, light: 10 }, // só dá pra mandar UM modelo C dos dois
      reports: [
        // perto (distância 2) mas pobre: 100/2 = 50 de eficiência
        report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 10 }, distance: 2, resources: res(100) }),
        // longe (distância 20) mas rico: 5000/20 = 250 de eficiência — vence
        report({ targetVillageId: 2, reportId: 20, forecast: { spy: 1, light: 10 }, distance: 20, resources: res(5000) }),
      ],
    })

    expect(planSingle(state)).toEqual([{ model: 'C', targetVillageId: 2, targetLabel: '#2', reportId: 20 }])
  })

  it('prioriza modelo C em toda a lista antes de gastar tropa com modelo A, mesmo que a aldeia de saque total seja mais eficiente', () => {
    // aldeia 1 tem eficiência maior (perto) mas já foi totalmente saqueada;
    // aldeia 2 tem eficiência menor mas ainda tem recurso — só dá pra mandar UM dos dois
    const state = baseState({
      currentUnits: { spy: 1, light: 10 },
      reports: [
        report({ targetVillageId: 1, reportId: 10, fullLoot: true, distance: 3 }),
        report({ targetVillageId: 2, reportId: 20, forecast: { spy: 1, light: 10 }, distance: 9, resources: res(1000) }),
      ],
    })

    expect(planSingle(state)).toEqual([{ model: 'C', targetVillageId: 2, targetLabel: '#2', reportId: 20 }])
  })

  it('ignora relatórios com muralha acima do limite configurado, pros dois modelos', () => {
    const state = baseState({
      reports: [
        report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 20 }, wallLevel: 2, resources: res(1000) }),
        report({ targetVillageId: 2, reportId: 20, fullLoot: true, wallLevel: 1 }),
      ],
    })

    expect(planSingle(state, { maxWallLevel: 1, maxDistance: null })).toEqual([
      { model: 'A', targetVillageId: 2, targetLabel: '#2', templateId: 3609 },
    ])
  })

  it('ignora relatórios além da distância máxima configurada, pros dois modelos', () => {
    const state = baseState({
      reports: [
        report({ targetVillageId: 1, reportId: 10, forecast: { spy: 1, light: 20 }, distance: 15, resources: res(1000) }),
        report({ targetVillageId: 2, reportId: 20, fullLoot: true, distance: 8 }),
      ],
    })

    expect(planSingle(state, { maxWallLevel: null, maxDistance: 10 })).toEqual([
      { model: 'A', targetVillageId: 2, targetLabel: '#2', templateId: 3609 },
    ])
  })

  it('sem limite de muralha nem distância configurados (null), processa qualquer relatório', () => {
    const state = baseState({
      reports: [
        report({
          targetVillageId: 1,
          reportId: 10,
          forecast: { spy: 1, light: 20 },
          wallLevel: 20,
          distance: 50,
          resources: res(1000),
        }),
      ],
    })

    expect(planSingle(state)).toEqual([{ model: 'C', targetVillageId: 1, targetLabel: '#1', reportId: 10 }])
  })
})

describe('planAutoFarmAcrossVillages — coordenação entre aldeias', () => {
  it('reivindica um alvo só pra uma aldeia (a mais eficiente), mesmo que apareça na lista das duas', () => {
    const sharedReport = (distance: number) =>
      report({ targetVillageId: 100, reportId: 1000, forecast: { spy: 1, light: 10 }, distance, resources: res(1000) })

    const villages: VillageFarmState[] = [
      { villageId: 1, state: baseState({ reports: [sharedReport(2)] }) }, // eficiência 500
      { villageId: 2, state: baseState({ reports: [sharedReport(10)] }) }, // eficiência 100
    ]

    const plan = planAutoFarmAcrossVillages(villages, noLimits)

    expect(plan.get(1)).toEqual([{ model: 'C', targetVillageId: 100, targetLabel: '#100', reportId: 1000 }])
    expect(plan.get(2)).toEqual([])
  })

  it('a aldeia mais longe assume o alvo quando a mais perto não tem tropa suficiente', () => {
    const sharedReport = (distance: number) =>
      report({ targetVillageId: 100, reportId: 1000, forecast: { spy: 1, light: 10 }, distance, resources: res(1000) })

    const villages: VillageFarmState[] = [
      { villageId: 1, state: baseState({ currentUnits: { spy: 0, light: 0 }, reports: [sharedReport(2)] }) }, // perto, sem tropa
      { villageId: 2, state: baseState({ reports: [sharedReport(10)] }) }, // longe, com tropa
    ]

    const plan = planAutoFarmAcrossVillages(villages, noLimits)

    expect(plan.get(1)).toEqual([])
    expect(plan.get(2)).toEqual([{ model: 'C', targetVillageId: 100, targetLabel: '#100', reportId: 1000 }])
  })

  it('a aldeia que perde a disputa por um alvo compartilhado usa a tropa liberada num alvo só dela', () => {
    const villages: VillageFarmState[] = [
      {
        villageId: 1,
        state: baseState({
          currentUnits: { spy: 1, light: 10 }, // só dá pra UM envio
          reports: [
            // disputado com a aldeia 2, que é mais perto — vai perder
            report({ targetVillageId: 100, reportId: 1000, forecast: { spy: 1, light: 10 }, distance: 2, resources: res(1000) }),
            // só a aldeia 1 enxerga esse
            report({ targetVillageId: 200, reportId: 2000, forecast: { spy: 1, light: 10 }, distance: 5, resources: res(300) }),
          ],
        }),
      },
      {
        villageId: 2,
        state: baseState({
          reports: [
            report({
              targetVillageId: 100,
              reportId: 1000,
              forecast: { spy: 1, light: 10 },
              distance: 1, // mais perto que a aldeia 1
              resources: res(1000),
            }),
          ],
        }),
      },
    ]

    const plan = planAutoFarmAcrossVillages(villages, noLimits)

    expect(plan.get(2)).toEqual([{ model: 'C', targetVillageId: 100, targetLabel: '#100', reportId: 1000 }])
    expect(plan.get(1)).toEqual([{ model: 'C', targetVillageId: 200, targetLabel: '#200', reportId: 2000 }])
  })

  it('não deixa uma aldeia repetir um alvo já reivindicado por outra nem no modelo A', () => {
    const villages: VillageFarmState[] = [
      {
        villageId: 1,
        state: baseState({
          reports: [report({ targetVillageId: 100, reportId: 1000, fullLoot: true, distance: 2, resources: res(1000) })],
        }),
      },
      {
        villageId: 2,
        state: baseState({
          reports: [report({ targetVillageId: 100, reportId: 1000, fullLoot: true, distance: 1, resources: res(1000) })],
        }),
      },
    ]

    const plan = planAutoFarmAcrossVillages(villages, noLimits)

    expect(plan.get(2)).toEqual([{ model: 'A', targetVillageId: 100, targetLabel: '#100', templateId: 3609 }])
    expect(plan.get(1)).toEqual([])
  })
})
