/**
 * Condição na estrada.
 *
 * Este arquivo é puro e não sabe de onde os números vêm. Ele responde uma
 * pergunta só, e é a pergunta que um mapa não responde: *"vale sair?"*
 */

/** Uma hora de previsão num ponto. Horário LOCAL, sem fuso embutido. */
export interface HourReading {
  /** `'2026-07-31T14:00'`. */
  hour: string
  temperatureC: number
  /** Probabilidade de precipitação, em %. */
  rainChance: number
  visibilityM: number
  windKph: number
}

/** As 72 horas de um ponto da rota. */
export interface StopWeather {
  label: string
  readings: HourReading[]
}

/**
 * O que a visibilidade significa para quem está em cima da moto.
 *
 * `fechado` usa o corte meteorológico de nevoeiro — **abaixo de 1 km** — e não
 * um número inventado. `limitado` marca os 5 km em que ainda se anda, mas sem
 * ver curva nem mirante, que é metade do motivo de subir a serra.
 *
 * A cobertura de nuvem baixa NÃO entra nesta conta. Medido: Palhoça aparece com
 * 100% de nuvem baixa e 22 km de visibilidade na mesma hora. Nuvem alta sobre a
 * cabeça não é serra fechada; visibilidade é.
 */
export type RoadVisibility = 'limpo' | 'limitado' | 'fechado'

export const VISIBILITY_LABELS: Record<RoadVisibility, string> = {
  limpo: 'limpo',
  // Curto de propósito: numa trilha de 380px, "visibilidade curta" quebrava em
  // duas linhas e comia o nome da parada ao lado.
  limitado: 'pouca visão',
  fechado: 'fechado',
}

const FOG_M = 1000
const HAZE_M = 5000

export function visibilityOf(meters: number): RoadVisibility {
  if (meters < FOG_M) return 'fechado'
  if (meters < HAZE_M) return 'limitado'
  return 'limpo'
}

/**
 * A janela em que se anda de moto: das 7h às 19h.
 *
 * Sem ela, a serra "fecha" às 3 da manhã em quase todo dia de inverno e o aviso
 * vira ruído — ninguém sobe a Serra do Corvo Branco às 3h. Medido nas 72 h do
 * Morro da Igreja: 25 horas abaixo de 1 km, quase todas de madrugada.
 */
export const RIDE_START_HOUR = 7
export const RIDE_END_HOUR = 19

/** Temperatura a partir da qual o frio deixa de ser detalhe. */
export const COLD_C = 10

/** O balanço de um ponto da rota num dia. */
export interface StopDay {
  label: string
  minC: number
  maxC: number
  /** A maior probabilidade de chuva da janela, em %. */
  rainChance: number
  /** A PIOR condição da janela, nunca a média: a média esconde a hora ruim. */
  visibility: RoadVisibility
  /** Primeira hora em que fecha, quando fecha. `'14:00'`. */
  closesAt: string | null
  /**
   * Quantas horas da janela ficam abaixo de 1 km de visibilidade.
   *
   * Separa a neblina de amanhecer do litoral — que levanta às 8h — de uma serra
   * que fica dentro da nuvem o dia inteiro. Sem esta contagem, as duas apareciam
   * como "fechado" e Palhoça era eleita o ponto que decide a viagem.
   */
  closedHours: number
}

export interface RouteDay {
  /** `'2026-07-31'`. */
  date: string
  stops: StopDay[]
  /** O ponto mais crítico do dia. `null` quando nenhum tem problema. */
  worst: StopDay | null
}

const SEVERITY: Record<RoadVisibility, number> = {
  limpo: 0,
  limitado: 1,
  fechado: 2,
}

/**
 * As horas de um dia dentro da janela de rodagem.
 *
 * Para HOJE começa em `fromHour` — a previsão das horas que já passaram não é
 * previsão, é história, e avisar que a serra fechou às 8h para quem lê às 15h
 * não ajuda ninguém. Devolve vazio quando o dia já acabou.
 */
export function rideHours(
  readings: readonly HourReading[],
  date: string,
  fromHour: string | null,
): HourReading[] {
  return readings.filter((reading) => {
    if (!reading.hour.startsWith(date)) return false
    const hour = Number(reading.hour.slice(11, 13))
    if (hour < RIDE_START_HOUR || hour > RIDE_END_HOUR) return false
    if (fromHour && reading.hour < fromHour) return false
    return true
  })
}

/** `null` quando não sobrou hora de rodar naquele dia. */
export function summarizeStopDay(
  stop: StopWeather,
  date: string,
  fromHour: string | null,
): StopDay | null {
  const hours = rideHours(stop.readings, date, fromHour)
  const first = hours[0]
  if (!first) return null

  let minC = first.temperatureC
  let maxC = first.temperatureC
  let rainChance = 0
  let visibility: RoadVisibility = 'limpo'
  let closesAt: string | null = null
  let closedHours = 0

  for (const reading of hours) {
    if (reading.temperatureC < minC) minC = reading.temperatureC
    if (reading.temperatureC > maxC) maxC = reading.temperatureC
    if (reading.rainChance > rainChance) rainChance = reading.rainChance

    const atual = visibilityOf(reading.visibilityM)
    if (SEVERITY[atual] > SEVERITY[visibility]) visibility = atual
    if (atual === 'fechado') {
      closedHours += 1
      if (closesAt === null) closesAt = reading.hour.slice(11, 16)
    }
  }

  return {
    label: stop.label,
    minC,
    maxC,
    rainChance,
    visibility,
    closesAt,
    closedHours,
  }
}

/**
 * O dia inteiro da rota, ponto a ponto.
 *
 * `worst` é o ponto que decide a viagem, e a ordem de desempate importa:
 * primeiro a gravidade, depois **quantas horas** ela dura, e só então o frio.
 *
 * Sem o critério das horas, a origem no litoral era eleita por uma neblina de
 * amanhecer que levanta às 8h, na frente de uma serra dentro da nuvem o dia
 * todo — foi o que a tela mostrou na primeira medição.
 */
export function summarizeRouteDay(
  stops: readonly StopWeather[],
  date: string,
  fromHour: string | null,
): RouteDay | null {
  const resumos: StopDay[] = []
  for (const stop of stops) {
    const resumo = summarizeStopDay(stop, date, fromHour)
    if (resumo) resumos.push(resumo)
  }
  if (resumos.length === 0) return null

  let worst: StopDay | null = null
  for (const stop of resumos) {
    if (stop.visibility === 'limpo' && stop.rainChance < 50) continue
    if (worst === null || isWorse(stop, worst)) worst = stop
  }

  return { date, stops: resumos, worst }
}

function isWorse(candidate: StopDay, current: StopDay): boolean {
  const grave = SEVERITY[candidate.visibility] - SEVERITY[current.visibility]
  if (grave !== 0) return grave > 0

  const horas = candidate.closedHours - current.closedHours
  if (horas !== 0) return horas > 0

  return candidate.minC < current.minC
}

/** `'2026-07-31'` → `'hoje'`, `'amanhã'`, ou `'sábado'`. */
export function dayLabel(date: string, today: string): string {
  if (date === today) return 'hoje'

  const [ano, mes, dia] = date.split('-').map(Number)
  const [anoH, mesH, diaH] = today.split('-').map(Number)
  if (!ano || !mes || !dia || !anoH || !mesH || !diaH) return date

  const alvo = Date.UTC(ano, mes - 1, dia)
  const base = Date.UTC(anoH, mesH - 1, diaH)
  if (alvo - base === 86_400_000) return 'amanhã'

  const DIAS = [
    'domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado',
  ] as const
  return DIAS[new Date(alvo).getUTCDay()] ?? date
}

/** `22.7` → `23`. Meio grau não muda decisão de quem veste jaqueta. */
export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°`
}
