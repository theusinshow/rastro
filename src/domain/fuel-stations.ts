import { haversineKm, type Coordinates } from './geo'

/**
 * O posto de combustível como o Rastro o conhece.
 *
 * Nasce de um provedor externo (ver `src/lib/fuel-stations/`), e não do catálogo:
 * posto não é destino, é serviço. Ele não entra em `places`, não tem visita, não
 * tem favorito e não vira memória — por isso mora num tipo próprio em vez de
 * virar mais uma categoria de `ExplorePlace`.
 *
 * **Todo campo opcional é `null`, nunca inventado.** O dado vem do
 * OpenStreetMap, onde um posto pode ter bandeira e horário mapeados e o vizinho
 * não ter nem nome. Preencher a lacuna com "Posto" ou "24h" seria afirmar sobre
 * a estrada de alguém uma coisa que ninguém verificou — que é exatamente o que
 * este produto não faz.
 */
export interface FuelStation {
  /** `place_id` do provedor. Estável o bastante para servir de chave de lista. */
  id: string
  /** Nome mapeado, ou a bandeira quando o nome falta. Nunca vazio — ver `toFuelStation`. */
  name: string
  latitude: number
  longitude: number
  /** Endereço em uma linha. `null` quando o provedor não monta nenhum. */
  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  /** Distância até o ponto consultado. `null` quando o provedor não a informa. */
  distanceMeters: number | null
  /** Bandeira: Ipiranga, Shell, Petrobras. `null` quando não mapeada. */
  brand: string | null
  /** Horário como o OpenStreetMap o escreve (`Mo-Su 06:00-22:00`). `null` quando não mapeado. */
  openingHours: string | null
  /** Categorias do provedor. Guardadas cruas para o filtro futuro por tipo. */
  categories: string[]
}

/**
 * Limites do raio de busca, em metros.
 *
 * O padrão é 20 km porque é a distância em que a pergunta ainda é *"onde
 * abasteço?"* e não *"onde durmo?"*: com a autonomia útil de uma moto de médio
 * porte (ver `REFUEL_SAFETY_MARGIN` em `fuel.ts`), 20 km é folga de reserva, não
 * de tanque.
 *
 * O teto de 50 km não é gosto: a busca é circular e o provedor cobra por
 * resultado. Um raio maior devolveria postos de outro vale, atrás de uma serra
 * que a linha reta não enxerga — precisão falsa paga a preço de crédito.
 */
export const FUEL_RADIUS_MIN_M = 1_000
export const FUEL_RADIUS_DEFAULT_M = 20_000
export const FUEL_RADIUS_MAX_M = 50_000

/**
 * Os três raios oferecidos na tela.
 *
 * Três, e não um controle contínuo: a diferença entre 18 e 22 km não muda
 * decisão nenhuma, e um deslizador convidaria a gastar crédito procurando uma
 * precisão que o problema não tem. São o bairro, a saída da cidade e o trecho.
 */
export const FUEL_RADIUS_OPTIONS_M = [5_000, 20_000, 50_000] as const

/**
 * Quantos postos pedir.
 *
 * Vinte cobre a decisão inteira — ninguém escolhe entre o 34º e o 35º posto — e
 * segura o mapa longe do formigueiro de marcadores que o próprio ADR 0005
 * evitou nos pins do catálogo.
 */
export const FUEL_LIMIT_DEFAULT = 20
export const FUEL_LIMIT_MAX = 50

export interface FuelQuery {
  center: Coordinates
  radiusM: number
  limit: number
}

/** O que estava malformado. Vira mensagem em PT-BR na fronteira, nunca aqui. */
export type FuelQueryProblem = 'coordenada' | 'raio' | 'limite'

export type FuelQueryParse =
  | { ok: true; query: FuelQuery }
  | { ok: false; problem: FuelQueryProblem }

/**
 * Número finito a partir de texto de URL. `null` para qualquer outra coisa.
 *
 * `Number('')` é zero e `Number(' ')` também: sem o corte no vazio, `radius=`
 * viraria um raio de zero metro em vez de cair no padrão.
 */
function toFiniteNumber(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/**
 * Valida os parâmetros da busca antes de qualquer ida à rede.
 *
 * Recusa em vez de corrigir em silêncio nos dois casos em que corrigir mentiria:
 * uma coordenada fora do globo e um raio ou limite fora da faixa. Um `radius`
 * de 900 km grampeado para 50 devolveria uma resposta que não é a que foi
 * pedida, e quem chamou não teria como saber.
 *
 * Ausência é outra coisa: parâmetro que não veio cai no padrão, porque não pedir
 * não é pedir errado.
 */
export function parseFuelQuery(params: {
  lat?: string | null
  lon?: string | null
  radius?: string | null
  limit?: string | null
}): FuelQueryParse {
  const latitude = toFiniteNumber(params.lat)
  const longitude = toFiniteNumber(params.lon)

  if (latitude === null || longitude === null) {
    return { ok: false, problem: 'coordenada' }
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { ok: false, problem: 'coordenada' }
  }

  const rawRadius = toFiniteNumber(params.radius)
  const radiusM = rawRadius === null ? FUEL_RADIUS_DEFAULT_M : Math.round(rawRadius)
  if (radiusM < FUEL_RADIUS_MIN_M || radiusM > FUEL_RADIUS_MAX_M) {
    return { ok: false, problem: 'raio' }
  }

  const rawLimit = toFiniteNumber(params.limit)
  const limit = rawLimit === null ? FUEL_LIMIT_DEFAULT : Math.round(rawLimit)
  if (limit < 1 || limit > FUEL_LIMIT_MAX) {
    return { ok: false, problem: 'limite' }
  }

  return {
    ok: true,
    query: { center: { latitude, longitude }, radiusM, limit },
  }
}

/**
 * Do mais perto para o mais longe.
 *
 * Quem não tem distância informada vai para o fim, e não para o começo: sem
 * distância não há como afirmar que está perto, e ordenar um desconhecido à
 * frente de um posto medido a 3 km inverteria a única pergunta da lista.
 */
export function sortByDistance(
  stations: readonly FuelStation[],
): FuelStation[] {
  return [...stations].sort((a, b) => {
    if (a.distanceMeters === null && b.distanceMeters === null) return 0
    if (a.distanceMeters === null) return 1
    if (b.distanceMeters === null) return -1
    return a.distanceMeters - b.distanceMeters
  })
}

/**
 * Casas decimais da chave de cache. Três ≈ 110 m no equador.
 *
 * Arredondar é o ponto: mover o mapa dois quarteirões não pode custar uma
 * consulta nova, porque o conjunto de postos num raio de 20 km é rigorosamente o
 * mesmo. Quatro casas (≈11 m) faria o cache nunca acertar; duas (≈1,1 km)
 * devolveria a lista do bairro vizinho como se fosse desta esquina.
 */
const CACHE_KEY_PRECISION = 3

/** Chave de cache: coordenada aproximada + raio + limite. */
export function fuelCacheKey(query: FuelQuery): string {
  const lat = query.center.latitude.toFixed(CACHE_KEY_PRECISION)
  const lon = query.center.longitude.toFixed(CACHE_KEY_PRECISION)
  return `${lat},${lon},${query.radiusM},${query.limit}`
}

/**
 * Fração do raio que o mapa precisa andar antes de valer a pena buscar de novo.
 *
 * Um quinto do raio: abaixo disso a área nova é sobreposição quase inteira da
 * anterior, e oferecer "buscar nesta área" ali seria oferecer o mesmo resultado
 * com outro nome.
 */
const RESEARCH_FRACTION = 0.2

/**
 * O mapa se afastou o bastante da última busca para valer outra?
 *
 * Existe para que **nenhuma requisição saia de um `drag` ou de um `zoom`**: o
 * movimento do mapa não busca nada, ele só decide se o botão "Buscar nesta área"
 * aparece. A ação continua sendo do usuário.
 */
export function movedEnoughToSearchAgain(
  searchedAt: Coordinates,
  now: Coordinates,
  radiusM: number,
): boolean {
  const movedM = haversineKm(searchedAt, now) * 1000
  return movedM > radiusM * RESEARCH_FRACTION
}

/** `683` → `680 m`; `2232` → `2,2 km`. Mesma escada de `PlaceNearbyPhotos`. */
export function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

/**
 * De onde a busca partiu.
 *
 * São as três respostas para "perto de quê?", e as três precisam existir porque
 * nenhuma cobre as outras: a origem do perfil é onde a moto dorme, o lugar
 * selecionado é o destino da viagem, e o centro do mapa é para onde a pessoa
 * está olhando agora. Sem a terceira, quem ainda não definiu origem ficaria sem
 * a funcionalidade inteira — que é exatamente o muro que a auditoria
 * (RASTRO-003) derrubou na Descoberta.
 */
export type FuelAnchorKind = 'origem' | 'lugar' | 'mapa'

export interface FuelAnchor {
  kind: FuelAnchorKind
  /** Nome para a tela: "Palhoça, Santa Catarina", "Serra do Corvo Branco". */
  label: string
  coordinates: Coordinates
}

/**
 * Garante que o ponto de referência ATUAL continue na lista de opções.
 *
 * Existe por um caso concreto: ligar a camada de postos com um lugar
 * selecionado busca perto daquele lugar e fecha o painel do lugar — e aí o
 * lugar sai da lista de opções, deixando a busca em curso apontando para um
 * botão que não está mais na tela. Sem isto, nenhum chip apareceria marcado e a
 * pessoa perderia a referência do que está vendo.
 */
export function mergeAnchor(
  options: readonly FuelAnchor[],
  current: FuelAnchor | null,
): FuelAnchor[] {
  if (!current) return [...options]
  if (options.some((option) => option.kind === current.kind)) {
    return [...options]
  }
  return [current, ...options]
}

/**
 * O horário como o OpenStreetMap o escreve, com UMA tradução.
 *
 * `24/7` vira "24 horas" porque é o único caso em que a sintaxe crua esconde a
 * informação que muda a decisão de quem está na estrada às três da manhã. Todo o
 * resto (`Mo-Su 06:00-22:00`, `Mo-Fr 07:00-19:00; Sa 08:00-12:00`) sai **como
 * está**: interpretar a gramática de horários do OSM daria um formatador cheio
 * de casos, e cada caso mal traduzido seria o produto afirmando um horário de
 * funcionamento que ninguém verificou. Texto cru é feio; horário errado faz
 * alguém dormir no acostamento.
 *
 * `null` entra e sai como `null` — posto sem horário mapeado não ganha horário.
 */
export function describeOpeningHours(raw: string | null): string | null {
  if (raw === null) return null
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  return trimmed === '24/7' ? '24 horas' : trimmed
}

/**
 * Por que a busca de postos não deu certo, na língua de quem está na estrada.
 *
 * O mesmo desenho de `GeolocationFailure`, pelo mesmo motivo: o provedor entrega
 * um código HTTP, e "429" não diz a ninguém parado no acostamento o que fazer a
 * seguir. A diferença entre "acabou a cota de hoje" e "a rede caiu" muda se vale
 * apertar "tentar de novo" ou se é hora de olhar o mapa.
 *
 * Vive no domínio — e não na camada que fala com o provedor — porque as duas
 * pontas precisam do mesmo vocabulário: o endpoint classifica, a interface
 * escreve, e um enum só impede que as duas metades divirjam.
 */
export type FuelSearchFailure =
  | 'sem-chave'
  | 'parametro'
  | 'tempo-esgotado'
  | 'rede'
  | 'cota'
  | 'chave-recusada'
  | 'indisponivel'

export const FUEL_FAILURE_MESSAGES: Record<FuelSearchFailure, string> = {
  'sem-chave':
    'A busca de postos não está configurada nesta instalação do Rastro.',
  parametro: 'A busca saiu com um parâmetro inválido e não foi feita.',
  'tempo-esgotado':
    'A busca de postos demorou demais para responder. Tente de novo.',
  rede: 'Não foi possível falar com a busca de postos — verifique a conexão.',
  cota: 'A cota diária de buscas de postos acabou. Tente de novo amanhã.',
  'chave-recusada':
    'A busca de postos recusou a credencial desta instalação do Rastro.',
  indisponivel:
    'A busca de postos não respondeu como esperado. Tente de novo em instantes.',
}

/**
 * Vale oferecer "tentar de novo"?
 *
 * Um botão que repete uma falha determinística — chave ausente, parâmetro
 * inválido — não é acolhimento, é fazer a pessoa apertar duas vezes para receber
 * a mesma recusa.
 */
export function isRetryableFailure(failure: FuelSearchFailure): boolean {
  return failure !== 'sem-chave' && failure !== 'parametro'
}

/** Resultado de uma busca de postos: lista, ou uma razão nomeada. */
export type FuelSearchOutcome =
  | { ok: true; stations: FuelStation[] }
  | { ok: false; failure: FuelSearchFailure }
