'use client'

import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCoordinate, type Coordinates } from '@/domain/geo'
import { searchAddressAction } from '@/app/actions/geocoding-actions'
import { setAutonomyAction, setHomeAction } from '@/app/actions/profile-actions'
import { MAX_AUTONOMY_KM, MIN_AUTONOMY_KM } from '@/domain/fuel'
import type { GeocodedPlace } from '@/lib/geocoding'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { useOrigin } from '@/components/layout/origin-context'
import { PointPicker } from '@/components/map/PointPicker'
import { useMyLocation } from './use-my-location'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'

interface OriginSetupProps {
  /** Autonomia já gravada. `null` quando o usuário nunca informou. */
  autonomyKm: number | null
}

export function OriginSetup({ autonomyKm }: OriginSetupProps) {
  const router = useRouter()
  const { origin: current, label: currentLabel } = useOrigin()
  const [point, setPoint] = useState<Coordinates | null>(current)
  const [label, setLabel] = useState(currentLabel ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [autonomy, setAutonomy] = useState(
    autonomyKm === null ? '' : String(autonomyKm),
  )

  /**
   * Primeira vez é quem ainda não tem origem nenhuma gravada.
   *
   * É lido do estado do servidor, e não de um parâmetro na URL, porque é a
   * mesma condição que mandou a pessoa para cá depois de entrar
   * (`destinationAfterEntry`) — duas fontes para o mesmo fato divergiriam no dia
   * em que uma delas mudasse.
   */
  const firstTime = current === null

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodedPlace[] | null>(null)

  /*
   * A partida vinda do próprio aparelho — o que faltava e era o maior atrito do
   * produto: a única forma de dizer de onde se parte era digitar um endereço,
   * no cenário em que a pessoa está de pé ao lado da moto, de luva.
   *
   * Aqui ela só PREENCHE o formulário: quem grava continua sendo o botão de
   * confirmar, porque a pessoa ainda pode querer ajustar o pino ou o nome.
   */
  const {
    locate,
    locating,
    error: locationError,
  } = useMyLocation({
    onLocated: useCallback((coordinates: Coordinates, nome: string) => {
      setPoint(coordinates)
      setLabel(nome)
      setResults(null)
      setQuery('')
    }, []),
  })

  const [searching, startSearch] = useTransition()

  // Identidade estável: sem `useCallback`, o efeito do PointPicker remonta a
  // cada render e o modo de mira pisca.
  //
  // Clicar no mapa NÃO apaga o rótulo escolhido na busca: quem buscou "Palhoça"
  // e depois ajustou o pino algumas quadras continua em Palhoça.
  const handlePick = useCallback((picked: Coordinates) => {
    setPoint(picked)
  }, [])

  function search() {
    startSearch(async () => {
      setResults(await searchAddressAction(query))
    })
  }

  /**
   * Escolher um resultado grava coordenada E rótulo juntos.
   *
   * É o ponto todo desta busca: antes o rótulo era texto livre e podia discordar
   * em silêncio da coordenada — este perfil dizia "Palhoça, SC" com o pino 82 km
   * dali, no alto da serra, e toda distância do produto saía errada parecendo
   * certa.
   */
  function choose(result: GeocodedPlace) {
    setPoint(result.coordinates)
    setLabel(result.label)
    setResults(null)
    setQuery('')
  }

  function save() {
    if (!point) return
    startTransition(async () => {
      const home = await setHomeAction(point.latitude, point.longitude, label)
      if (!home.ok) {
        setError(home.message)
        return
      }

      // Campo vazio limpa a autonomia, e isso é intencional: quem trocou de moto
      // prefere que o produto pare de opinar a que ele opine com o número antigo.
      const trimmed = autonomy.trim()
      const parsed = trimmed === '' ? null : Number(trimmed)
      const fuel = await setAutonomyAction(parsed)
      if (!fuel.ok) {
        setError(fuel.message)
        return
      }

      router.push('/')
    })
  }

  return (
    <>
      <PointPicker onPick={handlePick} />

      <OverlayPanel side="right">
        {/* `min-h-0` para o rodapé de ações caber: sem isto o conteúdo empurra a
            coluna e os botões saem da tela em vez de a lista rolar. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <span className="instrument-label">Ponto de partida</span>
            {/*
              Duas frases, porque são duas situações.

              Quem chega aqui logo depois de entrar não sabe por que o produto
              está perguntando o endereço dele, e "toda distância parte daqui" é
              abstrato demais para justificar um formulário na primeira tela. A
              versão de primeira vez diz o que a resposta COMPRA — os destinos
              que cabem numa tarde, a conta de ida e volta —, que é o que a
              pessoa veio buscar.

              Quem voltou aqui pelo menu já sabe o que está fazendo, e a frase
              curta não gasta o tempo dele.
            */}
            <p className="mt-1.5 text-body leading-relaxed text-ink-muted">
              {firstTime
                ? 'De onde você sai de moto? É a partir daqui que o Rastro acha os destinos que cabem na sua tarde, mede a ida e a volta e mostra os postos no caminho.'
                : 'Busque o endereço ou clique no mapa. Toda distância e todo cálculo de tempo do Rastro partem daqui.'}
            </p>
          </div>

          {/* Antes da busca de propósito: é a única forma de definir a partida
              sem digitar nada, e o cenário de uso deste produto é alguém parado
              ao lado da moto, de luva. Digitar endereço é a alternativa, não o
              caminho principal. Ver RASTRO-002 da auditoria. */}
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={locate}
              disabled={locating}
            >
              {locating ? 'Localizando…' : 'Usar minha localização'}
            </Button>

            {/* A recusa NÃO bloqueia: a mensagem diz o que houve e aponta a
                busca logo abaixo, que nunca depende de permissão nenhuma. */}
            {locationError ? (
              <InlineMessage tone="info">{locationError}</InlineMessage>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <Field label="Buscar endereço">
              {(field) => (
                <Input
                  {...field}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    // Sem isto o Enter envia o formulário do painel e a busca
                    // some antes de acontecer.
                    event.preventDefault()
                    search()
                  }}
                  placeholder="Rua, bairro ou cidade"
                />
              )}
            </Field>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={search}
              disabled={searching || query.trim().length < 3}
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </Button>

            {results !== null && results.length === 0 ? (
              <InlineMessage tone="info">
                Nenhum endereço encontrado. Clique no mapa para marcar o ponto.
              </InlineMessage>
            ) : null}

            {results && results.length > 0 ? (
              <ul className="-mx-5 border-y border-line">
                {results.map((result) => (
                  <li
                    key={`${result.label}-${result.coordinates.latitude}`}
                    className="border-b border-line last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => choose(result)}
                      className="press flex w-full flex-col gap-0.5 px-5 py-3
                                 text-left hover:bg-overlay"
                    >
                      <span className="text-body text-ink">{result.label}</span>
                      <span className="instrument-value text-micro text-ink-faint">
                        {formatCoordinate(result.coordinates.latitude)}{' '}
                        {formatCoordinate(result.coordinates.longitude)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <SectionHeader label="Coordenada" />
            <p className="instrument-value text-lead text-ink">
              {point
                ? `${formatCoordinate(point.latitude)} ${formatCoordinate(point.longitude)}`
                : 'aguardando o clique'}
            </p>
          </div>

          <Field label="Como chamar">
            {(field) => (
              <Input
                {...field}
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Palhoça, SC"
              />
            )}
          </Field>

          {/* Autonomia mora aqui, junto da origem, porque as duas são as
              medidas que alimentam todo cálculo do produto — e porque construir
              cadastro de motos para chegar a um único número seria uma
              funcionalidade inteira no caminho de uma conta simples. */}
          <div className="border-t border-line pt-4">
            <Field
              label="Autonomia da moto"
              hint="Quantos quilômetros ela faz com um tanque. Em branco, o Rastro não opina sobre combustível."
            >
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  inputMode="numeric"
                  numeric
                  min={MIN_AUTONOMY_KM}
                  max={MAX_AUTONOMY_KM}
                  value={autonomy}
                  onChange={(event) => setAutonomy(event.target.value)}
                  placeholder="300"
                />
              )}
            </Field>
          </div>

        </div>

        {/*
          As ações saem da área que rola e viram rodapé fixo.

          Medido em 1440×900: com tudo numa coluna só, "Definir origem" ficava
          cortado na borda inferior e a saída não aparecia sem rolar — numa tela
          que passou a ser a PRIMEIRA que se vê depois de entrar. Uma saída que
          exige rolar para ser descoberta não é saída.

          É o mesmo desenho de `PlacePanel` e do painel de postos: conteúdo rola,
          ação fica.
        */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-line px-5 py-4">
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <Button
            type="button"
            variant="solid"
            size="sm"
            onClick={save}
            disabled={!point || pending}
            className="w-full"
          >
            {pending ? 'Gravando…' : 'Definir origem'}
          </Button>

          {/*
            A SAÍDA. Só na primeira vez, que é quando ela é necessária.

            Esta tela passou a ser a primeira coisa que se vê depois de entrar, e
            uma primeira tela sem saída é um muro — exatamente o padrão que a
            auditoria derrubou na Descoberta (RASTRO-003). O produto continua
            inteiro sem origem: o mapa abre, os lugares aparecem, a lista
            funciona. O que some é o que depende de um ponto de partida, e some
            dizendo por quê.

            Peso de link, e não de botão: ela não disputa com "Definir origem",
            que é o caminho que resolve o problema da pessoa.

            Quem chegou aqui pelo menu já tem a barra de cima para sair, e um
            "Depois" ali seria um terceiro jeito de fazer a mesma coisa.
          */}
          {firstTime ? (
            <Link
              href="/"
              className="press flex h-11 items-center justify-center rounded-full
                         text-small text-ink-faint hover:text-ink-muted"
            >
              Depois — ir para o mapa
            </Link>
          ) : null}
        </div>
      </OverlayPanel>
    </>
  )
}
