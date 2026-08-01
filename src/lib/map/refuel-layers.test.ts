import { describe, expect, it } from 'vitest'
import type { RefuelPoint } from '@/domain/fuel'
import { paletteFor } from './palette'
import {
  REFUEL_LAYERS,
  REFUEL_SOURCE_ID,
  buildRefuelGeoJson,
  buildRefuelLayers,
} from './refuel-layers'

/**
 * As duas camadas, já estreitadas por tipo.
 *
 * A lista é união de círculo e símbolo, e sem estreitar não dá para ler
 * `circle-color` nem `text-color` — o que é a garantia certa num arquivo que
 * espelha a paleta do mapa à mão.
 */
function camadasDe(tema: 'escuro' | 'claro') {
  const camadas = buildRefuelLayers(tema)
  const marca = camadas.find((c) => c.type === 'circle')
  const rotulo = camadas.find((c) => c.type === 'symbol')
  if (marca?.type !== 'circle' || rotulo?.type !== 'symbol') {
    throw new Error('faltou uma das camadas de abastecimento')
  }
  return { marca, rotulo }
}

const PONTOS: RefuelPoint[] = [
  { atKm: 255, coordinates: { latitude: -28.1, longitude: -49.5 } },
  { atKm: 510, coordinates: { latitude: -28.4, longitude: -49.9 } },
]

describe('buildRefuelGeoJson', () => {
  it('escreve a coordenada na ordem do GeoJSON', () => {
    const geo = buildRefuelGeoJson(PONTOS)

    expect(geo.features[0]?.geometry.coordinates).toEqual([-49.5, -28.1])
  })

  it('monta o rótulo com o quilômetro, pronto para a camada ler', () => {
    const geo = buildRefuelGeoJson(PONTOS)

    expect(geo.features.map((f) => f.properties.label)).toEqual([
      'km 255',
      'km 510',
    ])
    expect(geo.features[1]?.properties.atKm).toBe(510)
  })

  it('sem parada, coleção vazia — e não uma feature nula', () => {
    expect(buildRefuelGeoJson([]).features).toEqual([])
  })
})

describe('buildRefuelLayers', () => {
  it('as duas camadas leem a mesma fonte', () => {
    const camadas = buildRefuelLayers('escuro')

    expect(camadas.map((c) => c.id)).toEqual([...REFUEL_LAYERS].reverse())
    for (const camada of camadas) {
      expect(camada.source).toBe(REFUEL_SOURCE_ID)
    }
  })

  it('a marca NÃO é âmbar: o traçado da viagem já é', () => {
    // Um anel âmbar sobre uma linha âmbar é um anel invisível. A tinta é a cor
    // que este mapa reserva para o que se destaca sobre o desenho.
    for (const tema of ['escuro', 'claro'] as const) {
      const { pin, trip } = paletteFor(tema)
      const { marca } = camadasDe(tema)

      expect(marca.paint?.['circle-stroke-color']).toBe(pin.bone)
      expect(marca.paint?.['circle-stroke-color']).not.toBe(trip.asphalt)
    }
  })

  it('o miolo é a cor do fundo: a marca corta a estrada em vez de pousar nela', () => {
    for (const tema of ['escuro', 'claro'] as const) {
      const { map } = paletteFor(tema)

      expect(camadasDe(tema).marca.paint?.['circle-color']).toBe(map.background)
    }
  })

  it('o rótulo NÃO cede à colisão, ao contrário dos outros do mapa', () => {
    // `km 315` é a resposta da seção "onde abastecer". Um número que some
    // porque um nome de município ocupou o espaço deixa a marca sem dizer o que
    // ela é.
    const { rotulo } = camadasDe('escuro')

    expect(rotulo.layout?.['text-allow-overlap']).toBe(true)
    expect(rotulo.layout?.['text-ignore-placement']).toBe(true)
  })

  it('o tema troca as cores das duas camadas', () => {
    // Estreitado por `type`: a lista é união de círculo e símbolo, e ler
    // `text-color` de um círculo não compila — o que é exatamente a garantia
    // que se quer de um arquivo que espelha a paleta à mão.
    const cor = (tema: 'escuro' | 'claro') => {
      const { marca, rotulo } = camadasDe(tema)
      return {
        miolo: marca.paint?.['circle-color'],
        texto: rotulo.paint?.['text-color'],
      }
    }

    expect(cor('escuro').miolo).not.toBe(cor('claro').miolo)
    expect(cor('escuro').texto).not.toBe(cor('claro').texto)
  })
})
