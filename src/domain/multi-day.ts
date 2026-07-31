import { estimateRoadKm } from './discovery'
import { haversineKm, type Coordinates } from './geo'
import type { ExplorePlace } from './place'

/** Teto de dias. Acima disso deixa de ser passeio e vira mudança de endereço. */
export const MAX_DAYS = 7

/** Piso do limite diário. Abaixo disso não se sai da região metropolitana. */
export const MIN_KM_PER_DAY = 100

export const MAX_KM_PER_DAY = 1200

export interface DayPlan {
  /** 1 para o primeiro dia. */
  dayIndex: number
  stops: ExplorePlace[]
  roadKm: number
  /**
   * O dia passou do limite diário.
   *
   * Acontece em dois casos legítimos: um trecho único maior que um dia inteiro,
   * e a volta para casa somada ao último dia. Em ambos a divisão fez o que podia
   * — e dizer que o dia estourou é melhor que fingir que coube.
   */
  overLimit: boolean
  /**
   * Onde a noite termina. `null` no último dia, que fecha o ciclo em casa.
   *
   * É a última parada do dia, e não um hotel: buscar hospedagem exigiria outra
   * fonte de dados. O Rastro diz onde o dia acaba; a cama é com você.
   */
  sleepsAt: ExplorePlace | null
}

export interface MultiDayPlan {
  days: DayPlan[]
  totalRoadKm: number
  /** Verdadeiro quando a volta precisa de mais dias do que os pedidos. */
  exceedsDays: boolean
  /**
   * Quilometragem de um trecho único que não cabe num dia. `null` quando não há.
   *
   * Nenhuma divisão resolve isso — não existe onde parar no meio de um trecho
   * entre duas paradas —, e por isso vira recusa explícita em vez de um plano
   * que não fecha.
   */
  impossibleLegKm: number | null
}

/**
 * Reparte paradas já ordenadas em dias, respeitando um limite diário.
 *
 * A ordem NÃO é recalculada aqui: ela vem do 2-opt de `itinerary.ts`. Esta
 * função só decide onde o dia termina, caminhando pelos trechos e fechando o dia
 * quando a próxima parada estouraria o limite.
 *
 * O trecho de volta para casa entra no último dia. Sem isso o total mentiria por
 * quase metade numa viagem de ida e volta.
 *
 * `requestedDays` só serve para dizer se o plano cabe no que foi pedido; a
 * divisão sai do limite diário, não do número de dias. Espremer 900 km em dois
 * dias porque alguém digitou "2" seria produzir um plano que ninguém cumpre.
 */
export function splitIntoDays(
  origin: Coordinates,
  orderedStops: readonly ExplorePlace[],
  maxKmPerDay: number,
  requestedDays?: number,
): MultiDayPlan {
  if (orderedStops.length === 0) {
    return { days: [], totalRoadKm: 0, exceedsDays: false, impossibleLegKm: null }
  }

  const legKm = (from: Coordinates, to: Coordinates) =>
    estimateRoadKm(haversineKm(from, to))

  const days: DayPlan[] = []
  let current: DayPlan = {
    dayIndex: 1,
    stops: [],
    roadKm: 0,
    overLimit: false,
    sleepsAt: null,
  }
  let from: Coordinates = origin
  let impossibleLegKm: number | null = null

  for (const stop of orderedStops) {
    const km = legKm(from, stop)

    // Trecho maior que um dia inteiro: nenhuma divisão resolve.
    if (km > maxKmPerDay && impossibleLegKm === null) {
      impossibleLegKm = km
    }

    const cabeNoDia = current.stops.length === 0 || current.roadKm + km <= maxKmPerDay

    if (!cabeNoDia) {
      current.sleepsAt = current.stops[current.stops.length - 1] ?? null
      current.overLimit = current.roadKm > maxKmPerDay
      days.push(current)
      current = {
        dayIndex: days.length + 1,
        stops: [],
        roadKm: 0,
        overLimit: false,
        sleepsAt: null,
      }
      // O dia novo começa onde o anterior dormiu.
      from = days[days.length - 1]?.sleepsAt ?? from
    }

    current.stops.push(stop)
    current.roadKm += legKm(from, stop)
    from = stop
  }

  // A volta para casa fecha o último dia. Se ela estourar o limite, o dia é
  // aceito assim mesmo: parar a 40 km de casa para dormir não é plano.
  const voltaKm = legKm(from, origin)
  current.roadKm += voltaKm
  current.sleepsAt = null
  current.overLimit = current.roadKm > maxKmPerDay
  days.push(current)

  const totalRoadKm = days.reduce((sum, day) => sum + day.roadKm, 0)

  return {
    days,
    totalRoadKm,
    // Não cabe no pedido se sobram dias OU se algum dia estourou o limite. Um
    // plano de dois dias em que o segundo tem 900 km com limite de 200 não é um
    // plano de dois dias — e reportá-lo como tal seria mentir sobre o que ele é.
    exceedsDays:
      (requestedDays !== undefined && days.length > requestedDays) ||
      days.some((day) => day.overLimit),
    impossibleLegKm,
  }
}
