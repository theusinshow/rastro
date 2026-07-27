import { describe, expect, it } from 'vitest'
import { mockPlaceRepository } from './mock-place-repository'

describe('mockPlaceRepository', () => {
  it('lista todos os lugares mockados', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    expect(places).toHaveLength(14)
  })

  it('combina catálogo com estado pessoal', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    const rastro = places.find((p) => p.slug === 'serra-do-rio-do-rastro')

    expect(rastro).toBeDefined()
    expect(rastro!.visitStatus).toBe('visitado')
    expect(rastro!.isFavorite).toBe(true)
    expect(rastro!.photoCount).toBe(12)
  })

  it('dá estado neutro a lugar sem registro pessoal', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    const garopaba = places.find((p) => p.slug === 'garopaba')

    expect(garopaba).toBeDefined()
    expect(garopaba!.visitStatus).toBe('nao-visitado')
    expect(garopaba!.isFavorite).toBe(false)
    expect(garopaba!.photoCount).toBe(0)
  })

  it('cobre os três status de visita nos dados de desenvolvimento', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    const status = new Set(places.map((p) => p.visitStatus))

    expect(status).toContain('visitado')
    expect(status).toContain('quero-conhecer')
    expect(status).toContain('nao-visitado')
  })

  it('busca por slug', async () => {
    const place = await mockPlaceRepository.getBySlug('urubici')
    expect(place?.name).toBe('Urubici')
  })

  it('devolve null para slug inexistente', async () => {
    expect(await mockPlaceRepository.getBySlug('nao-existe')).toBeNull()
  })
})
