import { describe, expect, it } from 'vitest'
import { classifyVillages, extractSectorPrefech, parseSectorPrefech } from './villageMap'

// Reproduz as duas formas que o jogo serializa `villages`: array denso
// (sector 580,720) e objeto esparso, inclusive uma coluna com só uma linha
// na posição 0 virando array de um elemento em vez de objeto (sector
// 600,740, coluna "9") — os dois formatos apareceram na mesma resposta real
// capturada nesta conversa.
const FIXTURE_HTML = `<html><body><script>
    TWMap.sectorPrefech = [{"x":580,"y":720,"data":{"x":580,"y":720,"villages":[{},{"5":["1002",16,0,"293","0",42,["bonus de 10% na população","bonus/farm.png"],"0",4,null,"standard",null,16]},{},{"2":["1001",4,0,"120","0",42,null,"0",null,null,"standard",null,4]},{"9":["1003",9,"Aldeia Jogador","1.500","919916402",42,null,"0",null,null,"standard","0",9]}]}},{"x":600,"y":740,"data":{"x":600,"y":740,"villages":{"5":{"2":["1004",5,0,"80","0",42,null,"0",null,null,"standard",null,5]},"9":[["1005",4,0,"60","0",42,null,"0",null,null,"standard",null,4]]}}}];
    TWMap.non_attackable_villages = [];
</script></body></html>`

describe('extractSectorPrefech', () => {
  it('extrai o array com os colchetes balanceados', () => {
    const extracted = extractSectorPrefech(FIXTURE_HTML)
    expect(extracted).not.toBeNull()
    expect(() => JSON.parse(extracted!)).not.toThrow()
    expect(extracted!.startsWith('[{"x":580')).toBe(true)
    expect(extracted!.endsWith('}}]')).toBe(true)
  })

  it('sem o marcador no html, retorna null', () => {
    expect(extractSectorPrefech('<html></html>')).toBeNull()
  })
})

describe('parseSectorPrefech', () => {
  it('html sem o array, retorna lista vazia em vez de quebrar', () => {
    expect(parseSectorPrefech('<html></html>')).toEqual([])
  })

  it('parseia os dois setores do fixture', () => {
    const sectors = parseSectorPrefech(FIXTURE_HTML)
    expect(sectors).toHaveLength(2)
    expect(sectors[0].data.x).toBe(580)
    expect(sectors[1].data.y).toBe(740)
  })
})

describe('classifyVillages', () => {
  const sectors = parseSectorPrefech(FIXTURE_HTML)
  const villages = classifyVillages(sectors, { x: 580, y: 720 })

  it('ignora aldeias de jogador (dono != "0")', () => {
    expect(villages.find((v) => v.id === 1003)).toBeUndefined()
  })

  it('calcula a coordenada absoluta a partir do setor + deslocamento (array denso)', () => {
    const village = villages.find((v) => v.id === 1001)
    expect(village).toMatchObject({ x: 583, y: 722, type: 'barbarian' })
  })

  it('reconhece aldeia bônus e extrai o texto do bônus', () => {
    const village = villages.find((v) => v.id === 1002)
    expect(village).toMatchObject({ x: 581, y: 725, type: 'bonus', bonusText: 'bonus de 10% na população' })
  })

  it('funciona com o formato esparso (objeto por coluna)', () => {
    const village = villages.find((v) => v.id === 1004)
    expect(village).toMatchObject({ x: 605, y: 742, type: 'barbarian' })
  })

  it('funciona com coluna de uma linha só serializada como array (não objeto)', () => {
    const village = villages.find((v) => v.id === 1005)
    expect(village).toMatchObject({ x: 609, y: 740, type: 'barbarian' })
  })

  it('ordena por distância crescente da base', () => {
    expect(villages.map((v) => v.id)).toEqual([1001, 1002, 1004, 1005])
  })
})
