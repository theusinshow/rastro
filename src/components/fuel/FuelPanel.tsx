'use client'

import {
  FUEL_FAILURE_MESSAGES,
  FUEL_RADIUS_OPTIONS_M,
  isRetryableFailure,
  movedEnoughToSearchAgain,
  type FuelAnchor,
  type FuelSearchFailure,
  type FuelStation,
} from '@/domain/fuel-stations'
import type { Coordinates } from '@/domain/geo'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { useMapView } from '@/components/map/map-context'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { CloseButton } from '@/components/ui/CloseButton'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'
import { FuelStationRow } from './FuelStationRow'
import type { FuelStatus } from './use-fuel-stations'

interface FuelPanelProps {
  anchor: FuelAnchor | null
  /** Os pontos de referência disponíveis agora. Nunca vazio. */
  anchorOptions: FuelAnchor[]
  radiusM: number
  status: FuelStatus
  stations: FuelStation[]
  failure: FuelSearchFailure | null
  searchedAt: Coordinates | null
  selectedId: string | null
  origin: Coordinates | null
  onSelect: (id: string) => void
  onCenter: (station: FuelStation) => void
  onSearchAt: (anchor: FuelAnchor) => void
  onChangeRadius: (radiusM: number) => void
  onRetry: () => void
  onClose: () => void
  exiting?: boolean
}

/** `5000` → `5 km`. Os três raios são redondos por construção. */
function radiusLabel(meters: number): string {
  return `${Math.round(meters / 1000)} km`
}

/**
 * "Buscar nesta área", e só quando faz diferença.
 *
 * Componente separado de propósito: `useMapView` publica a cada evento de
 * `move`, e ler o mapa aqui dentro mantém o repintar num botão em vez de na
 * lista inteira durante um arrasto.
 *
 * Ele **não busca** ao mover o mapa. Ele decide se o convite aparece — a ação
 * continua sendo um toque, e nenhuma requisição sai de um `drag` ou de um
 * `zoom`. Ver `movedEnoughToSearchAgain`.
 */
function ResearchHere({
  searchedAt,
  radiusM,
  onSearchAt,
}: {
  searchedAt: Coordinates | null
  radiusM: number
  onSearchAt: (anchor: FuelAnchor) => void
}) {
  const view = useMapView()
  if (!view || !searchedAt) return null
  if (!movedEnoughToSearchAgain(searchedAt, view.center, radiusM)) return null

  return (
    <div className="border-b border-line px-4 py-3">
      <Button
        size="sm"
        className="w-full"
        onClick={() =>
          onSearchAt({
            kind: 'mapa',
            label: 'centro do mapa',
            coordinates: view.center,
          })
        }
      >
        Buscar nesta área
      </Button>
    </div>
  )
}

/**
 * A lista de postos, do mais perto para o mais longe.
 *
 * Ocupa o mesmo lado da tela que o painel de lugar, e é o lugar que decide quem
 * aparece — ver `ExploreView`. Não empilha painéis: numa folha inferior de
 * celular os dois não caberiam, e no desktop dois painéis sobrepostos apagam
 * qual deles tem o teclado.
 */
export function FuelPanel({
  anchor,
  anchorOptions,
  radiusM,
  status,
  stations,
  failure,
  searchedAt,
  selectedId,
  origin,
  onSelect,
  onCenter,
  onSearchAt,
  onChangeRadius,
  onRetry,
  onClose,
  exiting,
}: FuelPanelProps) {
  return (
    <OverlayPanel side="right" exiting={exiting}>
      <header className="flex shrink-0 items-start gap-3 border-b border-line px-4 py-4">
        <div className="min-w-0 flex-1">
          <span className="instrument-label">Postos de combustível</span>
          {/* `h2`: o `h1` da rota é o título da tela. */}
          <h2 className="mt-1 truncate text-lead font-medium text-ink">
            {anchor ? `Perto de ${anchor.label}` : 'Postos'}
          </h2>
        </div>

        <CloseButton
          onClick={onClose}
          label="Fechar a lista de postos e apagar os marcadores"
          className="-mt-1 -mr-1"
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Os três pontos de referência do produto. Só aparecem os que existem
            agora: sem origem no perfil não há chip de origem, e sem lugar
            selecionado não há chip de destino. */}
        {anchorOptions.length > 1 ? (
          <section className="border-b border-line px-4 py-3">
            <SectionHeader label="Buscar perto de" />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {anchorOptions.map((option) => (
                <Chip
                  key={option.kind}
                  active={anchor?.kind === option.kind}
                  onClick={() => onSearchAt(option)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-b border-line px-4 py-3">
          <SectionHeader label="Raio em linha reta" />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {FUEL_RADIUS_OPTIONS_M.map((option) => (
              <Chip
                key={option}
                active={radiusM === option}
                onClick={() => onChangeRadius(option)}
              >
                {radiusLabel(option)}
              </Chip>
            ))}
          </div>
        </section>

        <ResearchHere
          searchedAt={searchedAt}
          radiusM={radiusM}
          onSearchAt={onSearchAt}
        />

        {/* A lista é WebGL no mapa e `<li>` aqui; esta é a única representação
            acessível do resultado da busca. */}
        <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {status === 'buscando'
            ? 'Procurando postos'
            : status === 'falhou'
              ? 'A busca de postos falhou'
              : status === 'pronto'
                ? `${stations.length} ${stations.length === 1 ? 'posto encontrado' : 'postos encontrados'}`
                : ''}
        </span>

        {status === 'buscando' ? (
          // Sem skeleton — o ADR 0016 o proíbe, e um retângulo cinza fingindo
          // uma lista que pode voltar vazia é pior que uma frase honesta.
          <p className="px-4 py-5 text-body text-ink-muted">
            Procurando postos num raio de {radiusLabel(radiusM)}…
          </p>
        ) : null}

        {status === 'falhou' && failure ? (
          <div className="flex flex-col items-start gap-3 px-4 py-4">
            <InlineMessage tone="error">
              {FUEL_FAILURE_MESSAGES[failure]}
            </InlineMessage>
            {/* Botão que repete uma falha determinística não é acolhimento: é
                fazer a pessoa apertar duas vezes para receber a mesma recusa. */}
            {isRetryableFailure(failure) ? (
              <Button size="sm" className="w-full" onClick={onRetry}>
                Tentar de novo
              </Button>
            ) : null}
          </div>
        ) : null}

        {status === 'pronto' && stations.length === 0 ? (
          <div className="empty-state flex flex-col items-start gap-3 px-4 py-5">
            <p className="text-body leading-relaxed text-ink-muted">
              Nenhum posto mapeado num raio de {radiusLabel(radiusM)}
              {anchor ? ` de ${anchor.label}` : ''}.
            </p>
            <p className="text-small leading-relaxed text-ink-faint">
              A serra tem trechos assim de verdade — e o dado vem do
              OpenStreetMap, onde um posto existente pode simplesmente não estar
              mapeado. Ampliar o raio costuma responder.
            </p>
            {radiusM < FUEL_RADIUS_OPTIONS_M[2] ? (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onChangeRadius(FUEL_RADIUS_OPTIONS_M[2])}
              >
                Ampliar para {radiusLabel(FUEL_RADIUS_OPTIONS_M[2])}
              </Button>
            ) : null}
          </div>
        ) : null}

        {stations.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-2.5">
              <span className="instrument-label">Do mais perto</span>
              <span
                key={stations.length}
                className="value-changed instrument-value px-1 text-micro text-ink-faint"
                data-motion="signal"
              >
                {stations.length}
              </span>
            </div>
            <ul>
              {stations.map((station) => (
                <FuelStationRow
                  key={station.id}
                  station={station}
                  selected={station.id === selectedId}
                  onSelect={onSelect}
                  onCenter={onCenter}
                  origin={origin}
                />
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {/*
        ATRIBUIÇÃO — condição de uso, não cortesia.

        Duas obrigações distintas, e por isso dois créditos:

        1. O dado é do OpenStreetMap, licenciado sob ODbL 1.0, que exige o
           crédito com link para a página de copyright.
        2. O plano gratuito da Geoapify exige o crédito ao provedor, com link
           seguível — daí `rel="noopener"` sem `noreferrer` neste, enquanto o
           link do OSM mantém o par completo.

        Fica no rodapé do painel, sempre visível enquanto a camada existe, e não
        dentro do detalhe de um posto: a licença vale para a lista inteira. A
        atribuição do MAPA (MapTiler e OpenStreetMap) continua onde sempre
        esteve, no controle do MapLibre, e nada aqui a substitui.
      */}
      <footer className="shrink-0 border-t border-line px-4 py-3">
        <p className="text-micro leading-relaxed text-ink-faint">
          Postos do{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent"
          >
            © OpenStreetMap contributors
          </a>
          , via{' '}
          <a
            href="https://www.geoapify.com/"
            target="_blank"
            rel="noopener"
            className="hover:text-accent"
          >
            Geoapify
          </a>
          . Distâncias em linha reta, não por estrada.
        </p>
      </footer>
    </OverlayPanel>
  )
}
