import { haversineKm, type RoutePosition } from './geo'

/** Um ponto do perfil: quanto já se rodou, e a que altura se está. */
export interface ElevationSample {
  /** Distância acumulada desde a origem, em km. */
  km: number
  meters: number
}

export interface ElevationProfile {
  /** Já reduzido para desenho. Os números abaixo vêm da resolução cheia. */
  samples: ElevationSample[]
  lowestM: number
  highestM: number
  /** Desnível: quanto se sobe do ponto mais baixo ao mais alto da rota. */
  climbM: number
  totalKm: number
}

/*
 * NÃO acrescente "subida acumulada" aqui.
 *
 * É a primeira coisa que falta neste arquivo e a tentação é grande — mas o dado
 * não sustenta o número. A altitude vem de um modelo de elevação amostrado em
 * grade, sob uma estrada que corre em corte e aterro, e somar delta a delta
 * acumula a tremida do modelo, não o esforço da viagem.
 *
 * Medido contra a API real, na BR-101 entre Tubarão e Araranguá — 78 km de
 * planície costeira, altitude entre 0 e 89 m: somando tudo dá 601 m de subida.
 * Ignorando variações abaixo de 6 m ainda dá 449 m. Abaixo de 20 m, 197 m. Não
 * existe limiar que separe ruído de estrada nesses dados.
 *
 * A altitude ponto a ponto, essa sim, se sustenta: aferida contra cotas
 * conhecidas, errou +3 m em Urubici, −10 m no mirante da Serra do Rio do Rastro,
 * +51 m em Bom Jardim da Serra e −99 m no cume do Morro da Igreja (um pico
 * agudo, que a grade suaviza). Daí o produto mostrar altitude e desnível, que
 * são leituras, e não acumulação, que seria invenção.
 */

/** Pontos desenhados. Acima disso o traço é mais denso que a tela. */
const MAX_SAMPLES = 140

function elevationOf(position: RoutePosition): number | null {
  const meters = position[2]
  return typeof meters === 'number' ? meters : null
}

/**
 * Perfil de altimetria de um traçado.
 *
 * `null` quando o traçado não traz altitude — que é o caso de toda viagem
 * gravada antes de o roteador passar a pedi-la. Devolver um perfil chapado seria
 * afirmar que a estrada é plana, e a interface não tem como saber a diferença.
 */
export function buildElevationProfile(
  coordinates: readonly RoutePosition[],
): ElevationProfile | null {
  const samples: ElevationSample[] = []
  let km = 0
  let previous: RoutePosition | null = null

  for (const position of coordinates) {
    const meters = elevationOf(position)
    if (meters === null) return null

    if (previous) {
      km += haversineKm(
        { longitude: previous[0], latitude: previous[1] },
        { longitude: position[0], latitude: position[1] },
      )
    }
    previous = position

    samples.push({ km, meters })
  }

  // Um ponto só não é perfil: não há subida nem descida entre ele e nada.
  if (samples.length < 2) return null

  let lowestM = Infinity
  let highestM = -Infinity
  for (const sample of samples) {
    if (sample.meters < lowestM) lowestM = sample.meters
    if (sample.meters > highestM) highestM = sample.meters
  }

  return {
    samples: downsample(samples, MAX_SAMPLES),
    lowestM: Math.round(lowestM),
    highestM: Math.round(highestM),
    climbM: Math.round(highestM - lowestM),
    totalKm: km,
  }
}

/**
 * Reduz a série preservando o formato — "largest triangle three buckets".
 *
 * Pegar um ponto a cada N apagaria justamente o que interessa: o cume do Morro
 * da Igreja tem grande chance de cair entre duas amostras, e o perfil mostraria
 * a serra mais baixa do que ela é. Aqui cada balde entrega o ponto que forma o
 * maior triângulo com o ponto já escolhido e a média do balde seguinte, ou seja,
 * o ponto que mais destoa da reta — picos e vales sobrevivem.
 *
 * A escala vertical (metros) domina a área do triângulo sobre a horizontal (km),
 * e isso é desejado: é o relevo que se quer preservar, não o espaçamento.
 */
function downsample(
  samples: readonly ElevationSample[],
  target: number,
): ElevationSample[] {
  const first = samples[0]
  const last = samples[samples.length - 1]
  if (samples.length <= target || target < 3 || !first || !last) {
    return [...samples]
  }

  const bucketSize = (samples.length - 2) / (target - 2)
  const kept: ElevationSample[] = [first]
  let anchor = first

  for (let bucket = 0; bucket < target - 2; bucket++) {
    const start = Math.floor(bucket * bucketSize) + 1
    const end = Math.floor((bucket + 1) * bucketSize) + 1
    const nextEnd = Math.min(
      Math.floor((bucket + 2) * bucketSize) + 1,
      samples.length,
    )

    let averageKm = 0
    let averageM = 0
    const count = Math.max(1, nextEnd - end)
    for (let i = end; i < nextEnd; i++) {
      const sample = samples[i]
      if (!sample) continue
      averageKm += sample.km
      averageM += sample.meters
    }
    averageKm /= count
    averageM /= count

    let chosen = samples[start] ?? anchor
    let largest = -1
    for (let i = start; i < end; i++) {
      const sample = samples[i]
      if (!sample) continue
      const area = Math.abs(
        (anchor.km - averageKm) * (sample.meters - anchor.meters) -
          (anchor.km - sample.km) * (averageM - anchor.meters),
      )
      if (area > largest) {
        largest = area
        chosen = sample
      }
    }

    kept.push(chosen)
    anchor = chosen
  }

  kept.push(last)
  return kept
}

/** `1822` → `1.822`. Metros não levam decimal: a medida não tem essa precisão. */
export function formatMeters(meters: number): string {
  return Math.round(meters).toLocaleString('pt-BR')
}
