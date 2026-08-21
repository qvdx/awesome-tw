import { describe, expect, it } from 'vitest'
import { formatTravelTime, parseUnitSpeeds } from './worldSpeeds'

// respostas reais de /interface.php?func=get_config e func=get_unit_info do
// mundo br143, capturadas nesta conversa via curl (endpoints públicos, sem
// precisar de sessão).
const CONFIG_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<config>
<speed>1</speed>
<unit_speed>1</unit_speed>
<moral>1</moral>
</config>`

const UNIT_INFO_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<config>
  <spear><build_time>1020</build_time><pop>1</pop><speed>18</speed><attack>10</attack><defense>15</defense><defense_cavalry>45</defense_cavalry><defense_archer>20</defense_archer><carry>25</carry></spear>
  <light><build_time>1800</build_time><pop>4</pop><speed>10</speed><attack>130</attack><defense>30</defense><defense_cavalry>40</defense_cavalry><defense_archer>30</defense_archer><carry>80</carry></light>
  <ram><build_time>4800</build_time><pop>5</pop><speed>30</speed><attack>2</attack><defense>20</defense><defense_cavalry>50</defense_cavalry><defense_archer>20</defense_archer><carry>0</carry></ram>
  <catapult><build_time>7200</build_time><pop>8</pop><speed>30</speed><attack>100</attack><defense>100</defense><defense_cavalry>50</defense_cavalry><defense_archer>100</defense_archer><carry>0</carry></catapult>
  <snob><build_time>18000</build_time><pop>100</pop><speed>35</speed><attack>30</attack><defense>100</defense><defense_cavalry>50</defense_cavalry><defense_archer>100</defense_archer><carry>0</carry></snob>
</config>`

describe('parseUnitSpeeds', () => {
  it('extrai minutos-por-campo de cada unidade (mundo velocidade 1x)', () => {
    const speeds = parseUnitSpeeds(CONFIG_XML, UNIT_INFO_XML)
    expect(speeds).toEqual({ spear: 18, light: 10, ram: 30, catapult: 30, snob: 35 })
  })

  it('ajusta pela velocidade do mundo e das unidades', () => {
    const doubleSpeedConfig = CONFIG_XML.replace('<speed>1</speed>', '<speed>2</speed>')
    const speeds = parseUnitSpeeds(doubleSpeedConfig, UNIT_INFO_XML)
    // mundo 2x mais rápido -> metade do tempo por campo
    expect(speeds.light).toBe(5)
  })
})

describe('formatTravelTime', () => {
  it('formata como HH:MM:SS', () => {
    // 10 campos * 10 min/campo = 100min = 1:40:00
    expect(formatTravelTime(10, 10)).toBe('01:40:00')
  })

  it('arredonda os segundos', () => {
    expect(formatTravelTime(1, 1.5)).toBe('00:01:30')
  })
})
