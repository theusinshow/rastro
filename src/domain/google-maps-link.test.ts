import { describe, expect, it } from 'vitest'
import { googleMapsRouteUrl } from './google-maps-link'

const ORIGIN = { latitude: -27.6455, longitude: -48.67 }

describe('googleMapsRouteUrl', () => {
  it('volta para a origem: ela é destino e ponto de partida', () => {
    const url = new URL(
      googleMapsRouteUrl(ORIGIN, [{ latitude: -28.1, longitude: -49.4 }]),
    )

    expect(url.searchParams.get('origin')).toBe('-27.6455,-48.67')
    expect(url.searchParams.get('destination')).toBe('-27.6455,-48.67')
    expect(url.searchParams.get('waypoints')).toBe('-28.1,-49.4')
  })

  it('separa múltiplas paradas por barra vertical', () => {
    const url = new URL(
      googleMapsRouteUrl(ORIGIN, [
        { latitude: -28.1, longitude: -49.4 },
        { latitude: -28.3, longitude: -49.6 },
      ]),
    )

    expect(url.searchParams.get('waypoints')).toBe('-28.1,-49.4|-28.3,-49.6')
  })

  it('sem paradas, não emite waypoints vazio', () => {
    const url = new URL(googleMapsRouteUrl(ORIGIN, []))

    expect(url.searchParams.has('waypoints')).toBe(false)
  })
})
