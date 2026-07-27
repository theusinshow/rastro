import type { Coordinates } from '@/domain/geo'

/**
 * Usuário único desta fase. Existe para que toda linha de dado já carregue um
 * `userId` real desde o início, tornando a migração para multiusuário uma troca
 * de origem do id — e não uma migração de schema.
 */
export const DEV_USER_ID = '00000000-0000-4000-8000-000000000001'

/** Palhoça, Grande Florianópolis. Origem padrão de distâncias e descoberta. */
export const DEFAULT_ORIGIN: Coordinates = {
  latitude: -27.6455,
  longitude: -48.67,
}

export const DEFAULT_ORIGIN_LABEL = 'Palhoça, SC'
