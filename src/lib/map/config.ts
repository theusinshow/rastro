import type { Coordinates } from '@/domain/geo'

/**
 * Chave do MapTiler. Inlinada no bundle do cliente pelo prefixo NEXT_PUBLIC_,
 * o que é esperado: chaves de tiles são públicas por natureza e devem ser
 * restringidas por domínio no painel do MapTiler, não escondidas.
 */
export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ''

export const hasMapTilerKey = MAPTILER_KEY.length > 0

/** Enquadramento inicial: Grande Florianópolis com a serra ao alcance. */
export const INITIAL_CENTER: Coordinates = {
  latitude: -27.85,
  longitude: -48.95,
}

export const INITIAL_ZOOM = 8.2

/** Não definimos maxBounds: viagens longas podem sair de Santa Catarina. */
