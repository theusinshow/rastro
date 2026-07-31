import { describe, expect, it } from 'vitest'
import {
  dayLabel,
  formatTemperature,
  rideHours,
  summarizeRouteDay,
  summarizeStopDay,
  visibilityOf,
  type HourReading,
  type StopWeather,
} from './weather'

function hora(
  hour: string,
  overrides: Partial<HourReading> = {},
): HourReading {
  return {
    hour,
    temperatureC: 20,
    rainChance: 0,
    visibilityM: 20000,
    windKph: 10,
    ...overrides,
  }
}

function ponto(label: string, readings: HourReading[]): StopWeather {
  return { label, readings }
}

describe('visibilityOf', () => {
  it('usa o corte meteorológico de nevoeiro, e não um número inventado', () => {
    expect(visibilityOf(160)).toBe('fechado')
    expect(visibilityOf(999)).toBe('fechado')
    expect(visibilityOf(1000)).toBe('limitado')
    expect(visibilityOf(4999)).toBe('limitado')
    expect(visibilityOf(5000)).toBe('limpo')
    expect(visibilityOf(48620)).toBe('limpo')
  })
})

describe('rideHours', () => {
  const readings = [
    hora('2026-07-31T03:00'),
    hora('2026-07-31T07:00'),
    hora('2026-07-31T14:00'),
    hora('2026-07-31T19:00'),
    hora('2026-07-31T22:00'),
    hora('2026-08-01T09:00'),
  ]

  // Ninguém sobe a Serra do Corvo Branco às 3 da manhã: contar aquela hora faria
  // o aviso de serra fechada aparecer em quase todo dia de inverno.
  it('fica entre 7h e 19h', () => {
    const hours = rideHours(readings, '2026-07-31', null)

    expect(hours.map((h) => h.hour.slice(11, 16))).toEqual([
      '07:00',
      '14:00',
      '19:00',
    ])
  })

  it('não mistura dias', () => {
    expect(rideHours(readings, '2026-08-01', null)).toHaveLength(1)
  })

  it('para hoje, ignora as horas que já passaram', () => {
    // Avisar às 15h que a serra fechou às 8h não é previsão, é história.
    const hours = rideHours(readings, '2026-07-31', '2026-07-31T14:00')

    expect(hours.map((h) => h.hour.slice(11, 16))).toEqual(['14:00', '19:00'])
  })

  it('devolve vazio quando o dia de rodar já acabou', () => {
    expect(rideHours(readings, '2026-07-31', '2026-07-31T20:00')).toEqual([])
  })
})

describe('summarizeStopDay', () => {
  it('devolve null quando não sobrou hora de rodar', () => {
    const stop = ponto('Morro da Igreja', [hora('2026-07-31T09:00')])

    expect(summarizeStopDay(stop, '2026-07-31', '2026-07-31T18:00')).toBeNull()
  })

  it('leva a PIOR visibilidade da janela, nunca a média', () => {
    // A média esconde justamente a hora em que não dá para subir.
    const stop = ponto('Serra do Corvo Branco', [
      hora('2026-07-31T08:00', { visibilityM: 30000 }),
      hora('2026-07-31T11:00', { visibilityM: 200 }),
      hora('2026-07-31T16:00', { visibilityM: 30000 }),
    ])

    const dia = summarizeStopDay(stop, '2026-07-31', null)

    expect(dia?.visibility).toBe('fechado')
    expect(dia?.closesAt).toBe('11:00')
  })

  it('registra a primeira hora em que fecha, não a última', () => {
    const stop = ponto('Morro da Igreja', [
      hora('2026-07-31T07:00', { visibilityM: 120 }),
      hora('2026-07-31T08:00', { visibilityM: 220 }),
    ])

    expect(summarizeStopDay(stop, '2026-07-31', null)?.closesAt).toBe('07:00')
  })

  it('sem fechar, não inventa hora de fechamento', () => {
    const stop = ponto('Praia do Rosa', [hora('2026-07-31T09:00')])

    expect(summarizeStopDay(stop, '2026-07-31', null)?.closesAt).toBeNull()
  })

  it('leva a maior chance de chuva e a faixa de temperatura', () => {
    const stop = ponto('Morro da Igreja', [
      hora('2026-07-31T07:00', { temperatureC: 5.1, rainChance: 10 }),
      hora('2026-07-31T15:00', { temperatureC: 17.5, rainChance: 70 }),
    ])

    const dia = summarizeStopDay(stop, '2026-07-31', null)

    expect(dia?.minC).toBe(5.1)
    expect(dia?.maxC).toBe(17.5)
    expect(dia?.rainChance).toBe(70)
  })
})

describe('summarizeRouteDay', () => {
  const limpo = ponto('Praia do Rosa', [hora('2026-07-31T09:00')])
  const fechado = ponto('Morro da Igreja', [
    hora('2026-07-31T09:00', { visibilityM: 240, temperatureC: 5 }),
  ])
  const curto = ponto('Serra do Corvo Branco', [
    hora('2026-07-31T09:00', { visibilityM: 3000, temperatureC: 11 }),
  ])

  it('aponta o ponto que decide a viagem', () => {
    const dia = summarizeRouteDay([limpo, curto, fechado], '2026-07-31', null)

    expect(dia?.worst?.label).toBe('Morro da Igreja')
    expect(dia?.stops).toHaveLength(3)
  })

  it('não elege pior nenhum quando está tudo limpo e seco', () => {
    const dia = summarizeRouteDay([limpo], '2026-07-31', null)

    expect(dia?.worst).toBeNull()
  })

  it('chuva provável conta como problema mesmo com o céu limpo', () => {
    const chuva = ponto('Praia do Rosa', [
      hora('2026-07-31T09:00', { rainChance: 80 }),
    ])
    const dia = summarizeRouteDay([chuva], '2026-07-31', null)

    expect(dia?.worst?.label).toBe('Praia do Rosa')
  })

  it('empatadas a visibilidade e as horas, decide o frio', () => {
    const frio = ponto('Morro da Igreja', [
      hora('2026-07-31T09:00', { visibilityM: 240, temperatureC: 3 }),
    ])
    const morno = ponto('Serra do Rio do Rastro', [
      hora('2026-07-31T09:00', { visibilityM: 240, temperatureC: 15 }),
    ])

    expect(summarizeRouteDay([morno, frio], '2026-07-31', null)?.worst?.label).toBe(
      'Morro da Igreja',
    )
  })

  // Visto na tela: a origem no litoral era eleita "o ponto que decide a viagem"
  // por uma neblina de amanhecer que levanta às 8h, na frente de uma serra
  // dentro da nuvem o dia inteiro.
  it('uma hora de neblina no litoral não ganha da serra fechada o dia todo', () => {
    const litoral = ponto('Palhoça', [
      hora('2026-07-31T07:00', { visibilityM: 900, temperatureC: 10 }),
      hora('2026-07-31T09:00', { visibilityM: 20000, temperatureC: 17 }),
      hora('2026-07-31T15:00', { visibilityM: 20000, temperatureC: 22 }),
    ])
    const serra = ponto('Serra do Corvo Branco', [
      hora('2026-07-31T07:00', { visibilityM: 200, temperatureC: 11 }),
      hora('2026-07-31T09:00', { visibilityM: 300, temperatureC: 12 }),
      hora('2026-07-31T15:00', { visibilityM: 400, temperatureC: 14 }),
    ])

    const dia = summarizeRouteDay([litoral, serra], '2026-07-31', null)

    expect(dia?.worst?.label).toBe('Serra do Corvo Branco')
    expect(dia?.worst?.closedHours).toBe(3)
  })

  it('conta as horas fechadas, e não só a primeira', () => {
    const serra = ponto('Morro da Igreja', [
      hora('2026-07-31T07:00', { visibilityM: 200 }),
      hora('2026-07-31T08:00', { visibilityM: 20000 }),
      hora('2026-07-31T09:00', { visibilityM: 300 }),
    ])

    const dia = summarizeRouteDay([serra], '2026-07-31', null)

    expect(dia?.worst?.closedHours).toBe(2)
    expect(dia?.worst?.closesAt).toBe('07:00')
  })

  it('devolve null quando o dia acabou para todos os pontos', () => {
    expect(
      summarizeRouteDay([limpo, fechado], '2026-07-31', '2026-07-31T21:00'),
    ).toBeNull()
  })
})

describe('dayLabel', () => {
  it('fala como gente perto, e como calendário longe', () => {
    expect(dayLabel('2026-07-31', '2026-07-31')).toBe('hoje')
    expect(dayLabel('2026-08-01', '2026-07-31')).toBe('amanhã')
    expect(dayLabel('2026-08-02', '2026-07-31')).toBe('domingo')
  })

  it('atravessa a virada do mês sem tropeçar', () => {
    expect(dayLabel('2026-09-01', '2026-08-31')).toBe('amanhã')
  })
})

describe('formatTemperature', () => {
  it('arredonda: meio grau não muda quem veste jaqueta', () => {
    expect(formatTemperature(22.7)).toBe('23°')
    expect(formatTemperature(5.1)).toBe('5°')
  })
})
