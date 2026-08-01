import { NextResponse, type NextRequest } from 'next/server'
import {
  FUEL_FAILURE_MESSAGES,
  isRetryableFailure,
  parseFuelQuery,
  sortByDistance,
  type FuelQuery,
  type FuelSearchFailure,
} from '@/domain/fuel-stations'
import { getFuelStationClient } from '@/lib/fuel-stations'

/**
 * A fronteira de LEITURA de um serviço externo medido.
 *
 * O resto do produto lê pelo Server Component e escreve por Server Action, e as
 * duas outras consultas de cliente a serviço externo (Commons, MapTiler) são
 * Server Actions. Esta é uma rota, e a razão é o que ela precisa fazer e as
 * Actions não fazem:
 *
 * 1. **Cancelamento.** Trocar de ponto de busca precisa abortar a consulta
 *    anterior — uma Server Action não é cancelável pelo chamador, e a resposta
 *    velha chegaria depois da nova e sobrescreveria a lista certa.
 * 2. **Cache por URL.** A chave de cache é a coordenada arredondada mais raio e
 *    limite; com Action, cada chamada é um POST opaco e não há o que cachear.
 * 3. **Erro nomeado com status.** Cota estourada e rede caída precisam chegar à
 *    interface como coisas diferentes, com o código HTTP correspondente.
 *
 * Ver ADR 0020.
 *
 * **A rota já nasce protegida por sessão:** `src/proxy.ts` cobre tudo que não
 * está em `PUBLIC_PATHS`, e `/api/fuel-stations` não está. Isso não é detalhe de
 * privacidade — postos são dado público — é o que impede que a cota diária da
 * chave seja drenada por quem não usa o Rastro.
 */

/**
 * O código HTTP de cada falha.
 *
 * `502` quando o provedor respondeu errado, `504` quando não respondeu a tempo,
 * `503` quando a integração está indisponível por configuração ou cota. Nenhum
 * deles é `500`: nada aqui é um defeito do Rastro, e um `500` faria a
 * observabilidade tratar cota estourada como bug.
 */
const STATUS: Record<FuelSearchFailure, number> = {
  parametro: 400,
  'sem-chave': 503,
  cota: 503,
  'chave-recusada': 502,
  rede: 502,
  indisponivel: 502,
  'tempo-esgotado': 504,
}

/**
 * Corpo de erro padronizado.
 *
 * `code` é o que a interface consome; `message` é PT-BR pronto para a tela. **A
 * chave nunca aparece aqui, e nenhum erro cru do provedor tampouco** — o que
 * volta é vocabulário do produto.
 */
function failure(reason: FuelSearchFailure) {
  return NextResponse.json(
    {
      error: {
        code: reason,
        message: FUEL_FAILURE_MESSAGES[reason],
        retryable: isRetryableFailure(reason),
      },
    },
    { status: STATUS[reason] },
  )
}

/**
 * Diagnóstico no servidor, e só no servidor.
 *
 * O único `console` deliberado do projeto. Ele existe porque uma falha de
 * integração que vira mensagem amigável na tela some sem deixar rastro — e a
 * diferença entre "a chave expirou" e "a Geoapify caiu" só aparece no log.
 *
 * **Nunca inclui a chave nem a URL montada.** Sai o código da falha e o ponto
 * arredondado da consulta, que é o que permite reproduzir.
 */
function logFailure(reason: FuelSearchFailure, query: FuelQuery): void {
  console.error(
    `[postos] ${reason} · ${query.center.latitude.toFixed(3)},` +
      `${query.center.longitude.toFixed(3)} r=${query.radiusM}`,
  )
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const parsed = parseFuelQuery({
    lat: params.get('lat'),
    lon: params.get('lon'),
    radius: params.get('radius'),
    limit: params.get('limit'),
  })

  if (!parsed.ok) {
    // O problema de validação vira o mesmo código de falha para a interface —
    // a pessoa não precisa saber se foi o raio ou a coordenada, porque nenhum
    // dos dois foi digitado por ela. O detalhe fica no log.
    console.error(`[postos] parâmetro inválido: ${parsed.problem}`)
    return failure('parametro')
  }

  const client = getFuelStationClient()
  if (!client) return failure('sem-chave')

  const outcome = await client.search(parsed.query)

  if (!outcome.ok) {
    logFailure(outcome.failure, parsed.query)
    return failure(outcome.failure)
  }

  return NextResponse.json(
    {
      stations: sortByDistance(outcome.stations),
      /*
       * Atribuição junto do dado, e não só na tela.
       *
       * A ODbL exige o crédito ao OpenStreetMap, e o plano gratuito da Geoapify
       * exige o dela. Viajar com a resposta é o que impede que um consumidor
       * futuro deste endpoint — um cache offline, uma tela nova — receba o dado
       * sem a obrigação que vem junto dele.
       */
      attribution: {
        provider: 'Geoapify',
        providerUrl: 'https://www.geoapify.com/',
        data: '© OpenStreetMap contributors',
        dataUrl: 'https://www.openstreetmap.org/copyright',
      },
    },
    {
      headers: {
        /*
         * `private`: a rota exige sessão, e uma CDN não deve guardar resposta de
         * requisição autenticada. A economia de cota real não mora aqui — mora
         * no cache de seis horas da chamada à Geoapify, que é compartilhado
         * entre todos os usuários do servidor (ver `geoapify.ts`).
         */
        'Cache-Control': 'private, max-age=600',
      },
    },
  )
}
