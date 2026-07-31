import { describe, expect, it } from 'vitest'
import { MAX_DAYS, MIN_KM_PER_DAY, splitIntoDays } from './multi-day'
import type { ExplorePlace } from './place'

const ORIGIN = { latitude: 0, longitude: 0 }

/**
 * Lugares ao longo do equador: 1 grau de longitude ≈ 111,32 km em linha reta, e
 * o fator de sinuosidade de 1,35 leva cada grau a ≈ 150 km rodoviários.
 */
function place(id: string, grausLeste: number): ExplorePlace {
  return {
    id,
    slug: id,
    name: id,
    description: '',
    latitude: 0,
    longitude: grausLeste,
    municipality: '',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    visits: [],
    isOwn: false,
    photoCount: 0,
    lastVisitedAt: null,
  }
}

describe('splitIntoDays', () => {
  it('volta curta cabe num dia só', () => {
    const plano = splitIntoDays(ORIGIN, [place('a', 0.5)], 400)

    expect(plano.days).toHaveLength(1)
    expect(plano.days[0]?.sleepsAt).toBeNull()
    expect(plano.exceedsDays).toBe(false)
  })

  it('a última parada do dia é onde se dorme, e o último dia volta para casa', () => {
    // Cada grau ≈ 150 km rodoviários. Com 250 km/dia, o segundo grau não cabe.
    const plano = splitIntoDays(
      ORIGIN,
      [place('a', 1), place('b', 2)],
      250,
    )

    expect(plano.days.length).toBeGreaterThan(1)
    expect(plano.days[0]?.sleepsAt?.id).toBe('a')
    // O último dia fecha o ciclo: ninguém dorme na estrada de volta.
    expect(plano.days[plano.days.length - 1]?.sleepsAt).toBeNull()
  })

  it('conta o trecho de volta no último dia', () => {
    // Sem contar a volta, o total dos dias mentiria por metade.
    const plano = splitIntoDays(ORIGIN, [place('a', 1)], 400)
    const somaDias = plano.days.reduce((s, d) => s + d.roadKm, 0)

    expect(somaDias).toBeCloseTo(plano.totalRoadKm, 5)
    expect(plano.totalRoadKm).toBeGreaterThan(250)
  })

  it('não finge que cabe: dia acima do limite é marcado, e o plano se declara estourado', () => {
    // Quatro graus ≈ 600 km só de ida, com 200 km/dia. A divisão faz o que pode
    // — não existe onde parar no meio de um trecho —, mas um dia de 900 km com
    // limite de 200 não é um dia que coube.
    const plano = splitIntoDays(ORIGIN, [place('a', 2), place('b', 4)], 200, 2)

    expect(plano.days.some((d) => d.overLimit)).toBe(true)
    expect(plano.exceedsDays).toBe(true)
  })

  it('dia dentro do limite não é marcado', () => {
    const plano = splitIntoDays(ORIGIN, [place('a', 0.5)], 400)

    expect(plano.days[0]?.overLimit).toBe(false)
    expect(plano.exceedsDays).toBe(false)
  })

  it('parada mais distante que um dia inteiro é recusada explicitamente', () => {
    // Um trecho único de 450 km não cabe num limite de 200 km/dia, e nenhuma
    // divisão resolve: não existe onde parar no meio.
    const plano = splitIntoDays(ORIGIN, [place('longe', 3)], 200)

    expect(plano.impossibleLegKm).not.toBeNull()
    expect(plano.impossibleLegKm!).toBeGreaterThan(200)
  })

  it('sem paradas não há dias', () => {
    const plano = splitIntoDays(ORIGIN, [], 400)

    expect(plano.days).toEqual([])
    expect(plano.totalRoadKm).toBe(0)
  })

  it('numera os dias a partir de 1', () => {
    const plano = splitIntoDays(
      ORIGIN,
      [place('a', 1), place('b', 2), place('c', 3)],
      250,
    )

    expect(plano.days.map((d) => d.dayIndex)).toEqual(
      plano.days.map((_, i) => i + 1),
    )
  })

  it('respeita o teto de dias e o piso de km por dia', () => {
    expect(MAX_DAYS).toBeGreaterThanOrEqual(2)
    expect(MIN_KM_PER_DAY).toBeGreaterThan(0)
  })
})
