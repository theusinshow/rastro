import { describe, expect, it } from 'vitest'
import type { FuelStation } from '@/domain/fuel-stations'
import { buildDiamondIcon, hexToRgb } from './fuel-icon'
import {
  FUEL_ICONS,
  FUEL_LAYERS,
  FUEL_SOURCE_ID,
  buildFuelIcons,
  buildFuelLayers,
  buildFuelStationsGeoJson,
} from './fuel-layers'

function posto(overrides: Partial<FuelStation> = {}): FuelStation {
  return {
    id: 'a',
    name: 'Posto Serra',
    latitude: -27.6,
    longitude: -48.6,
    address: null,
    city: null,
    state: null,
    postcode: null,
    distanceMeters: null,
    brand: null,
    openingHours: null,
    categories: [],
    ...overrides,
  }
}

describe('hexToRgb', () => {
  it('lê hex de seis dígitos', () => {
    expect(hexToRgb('#8fa9c2')).toEqual({ r: 143, g: 169, b: 194 })
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('recusa formato que a paleta do mapa não usa', () => {
    // Aceitar outros formatos abriria caminho para uma cor entrar aqui sem
    // passar pelo teste de contraste.
    expect(() => hexToRgb('#fff')).toThrow('hex inválido')
    expect(() => hexToRgb('azul')).toThrow('hex inválido')
  })
})

describe('buildDiamondIcon', () => {
  const size = 29
  const icone = buildDiamondIcon({
    size,
    fill: '#8fa9c2',
    stroke: '#16120f',
    strokeWidth: 3,
  })

  function pixel(x: number, y: number) {
    const offset = (y * size + x) * 4
    return {
      r: icone.data[offset],
      g: icone.data[offset + 1],
      b: icone.data[offset + 2],
      a: icone.data[offset + 3],
    }
  }

  it('devolve RGBA do tamanho pedido', () => {
    expect(icone.width).toBe(size)
    expect(icone.height).toBe(size)
    expect(icone.data).toHaveLength(size * size * 4)
  })

  it('o centro é o miolo, opaco', () => {
    const centro = pixel(14, 14)

    expect(centro).toEqual({ r: 143, g: 169, b: 194, a: 255 })
  })

  it('os CANTOS são vazados: é isso que faz a forma ser losango e não quadrado', () => {
    // Se os cantos tivessem tinta, o marcador seria um quadrado — e a única
    // coisa que separa posto de destino a 12px é a silhueta.
    expect(pixel(0, 0).a).toBe(0)
    expect(pixel(size - 1, 0).a).toBe(0)
    expect(pixel(0, size - 1).a).toBe(0)
    expect(pixel(size - 1, size - 1).a).toBe(0)
  })

  it('as quatro pontas têm tinta', () => {
    expect(pixel(14, 1).a).toBeGreaterThan(0)
    expect(pixel(14, size - 2).a).toBeGreaterThan(0)
    expect(pixel(1, 14).a).toBeGreaterThan(0)
    expect(pixel(size - 2, 14).a).toBeGreaterThan(0)
  })

  it('a borda leva a cor do contorno, não a do miolo', () => {
    // O contorno é a cor do fundo do mapa: é ele que descola o marcador do
    // terreno, como o halo descola um rótulo.
    const borda = pixel(14, 2)

    expect(borda.b).toBeLessThan(100)
    expect(borda.a).toBeGreaterThan(0)
  })

  it('a borda externa é suavizada em vez de serrilhada', () => {
    // Alguma coluna precisa ter alfa parcial; sem isso o losango lê como falha
    // de renderização.
    const alphas = []
    for (let i = 0; i < size * size; i += 1) {
      const a = icone.data[i * 4 + 3] ?? 0
      if (a > 0 && a < 255) alphas.push(a)
    }

    expect(alphas.length).toBeGreaterThan(0)
  })
})

describe('buildFuelIcons', () => {
  it('gera as duas imagens nos dois temas', () => {
    for (const tema of ['escuro', 'claro'] as const) {
      const icones = buildFuelIcons(tema)

      expect(icones.map((item) => item.id)).toEqual([
        FUEL_ICONS.base,
        FUEL_ICONS.selected,
      ])
      // O selecionado é maior: é o que amarra a seleção ao marcador quando há
      // vários postos agrupados na entrada de uma cidade.
      expect(icones[1]!.icon.width).toBeGreaterThan(icones[0]!.icon.width)
    }
  })

  it('o tema muda a imagem, e não só a camada', () => {
    // O MapLibre desenha em WebGL e não lê variável CSS: se a imagem não fosse
    // refeita, trocar para o tema claro deixaria o contorno escuro sobre areia.
    const escuro = buildFuelIcons('escuro')[0]!.icon.data
    const claro = buildFuelIcons('claro')[0]!.icon.data

    expect(Array.from(escuro)).not.toEqual(Array.from(claro))
  })
})

describe('buildFuelStationsGeoJson', () => {
  it('leva id, nome e seleção, e nada além disso', () => {
    const geojson = buildFuelStationsGeoJson([posto()], null)

    expect(geojson.features[0]?.properties).toEqual({
      id: 'a',
      name: 'Posto Serra',
      selected: false,
    })
  })

  it('escreve a coordenada na ordem do GeoJSON', () => {
    const geojson = buildFuelStationsGeoJson([posto()])

    expect(geojson.features[0]?.geometry.coordinates).toEqual([-48.6, -27.6])
  })

  it('marca só o posto selecionado', () => {
    const geojson = buildFuelStationsGeoJson(
      [posto({ id: 'a' }), posto({ id: 'b' })],
      'b',
    )

    expect(geojson.features.map((f) => f.properties.selected)).toEqual([
      false,
      true,
    ])
  })

  it('lista vazia vira coleção vazia, e não uma feature nula', () => {
    expect(buildFuelStationsGeoJson([]).features).toEqual([])
  })
})

describe('buildFuelLayers', () => {
  it('as duas camadas leem a mesma fonte', () => {
    const camadas = buildFuelLayers('escuro')

    expect(camadas.map((camada) => camada.id)).toEqual([
      FUEL_LAYERS.marker,
      FUEL_LAYERS.label,
    ])
    for (const camada of camadas) {
      expect(camada.source).toBe(FUEL_SOURCE_ID)
    }
  })

  it('o marcador aparece mesmo colado noutro, mas não apaga rótulo do catálogo', () => {
    const marcador = buildFuelLayers('escuro')[0]!

    expect(marcador.layout?.['icon-allow-overlap']).toBe(true)
    // `icon-ignore-placement` ausente: o posto entra no cálculo de colisão dos
    // outros símbolos, e não engole o nome de um lugar.
    expect(marcador.layout?.['icon-ignore-placement']).toBeUndefined()
  })

  it('o rótulo do posto só entra depois do rótulo do catálogo', () => {
    // O catálogo abre em 8.5; posto em 10.5. A lista da direita já nomeia os
    // postos em ordem de distância.
    expect(buildFuelLayers('escuro')[1]!.minzoom).toBeGreaterThan(8.5)
  })
})
