import type { Coordinates } from '@/domain/geo'

/**
 * Chave do MapTiler. Inlinada no bundle do cliente pelo prefixo NEXT_PUBLIC_,
 * o que é esperado: chaves de tiles são públicas por natureza e devem ser
 * restringidas por domínio no painel do MapTiler, não escondidas.
 */
export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ''

export const hasMapTilerKey = MAPTILER_KEY.length > 0

/**
 * Enquadramento inicial: Grande Florianópolis com a serra ao alcance.
 *
 * O centro fica a oeste do meio geográfico de propósito. O mapa ocupa a
 * viewport inteira, mas a trilha da esquerda cobre os primeiros 232px — o que
 * sobra visível é a metade leste, e centralizar na geografia entregava um terço
 * de Atlântico. O Atlântico é geografia real e continua na tela; o que muda é
 * ele deixar de ser o protagonista de um app sobre estradas.
 */
export const INITIAL_CENTER: Coordinates = {
  latitude: -27.8,
  longitude: -49.35,
}

export const INITIAL_ZOOM = 8.3

/** Não definimos maxBounds: viagens longas podem sair de Santa Catarina. */
