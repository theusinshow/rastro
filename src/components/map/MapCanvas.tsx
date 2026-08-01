'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MAPTILER_KEY,
  hasMapTilerKey,
} from '@/lib/map/config'
import { buildRastroStyle } from '@/lib/map/style'
import { useTheme } from '@/components/layout/theme-context'
import { MapFallback, MapLoadError } from './MapFallback'
import { useMapRegistry } from './map-context'

/**
 * A superfície do mapa, montada uma vez no layout raiz (ADR 0018).
 *
 * Não recebe mais `interactive`: quem decide se o mapa é cenário ou instrumento
 * é a rota, e isso muda durante a vida da instância — ver `MapChrome` e
 * `lib/map/interactivity.ts`. Passar pelo construtor voltaria a exigir um mapa
 * novo a cada mudança, que é exatamente o que este arquivo existe para evitar.
 */
export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { registerMap, updateView } = useMapRegistry()
  const { theme } = useTheme()
  const [loadFailure, setLoadFailure] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const mapRef = useRef<maplibregl.Map | null>(null)

  // O tema entra como `ref` e NÃO como dependência do efeito que cria o mapa:
  // recriar o mapa a cada troca de tema perderia a câmera, os pins e o traçado,
  // e faria a tela piscar do zero. A troca é feita por `setStyle` no efeito
  // separado abaixo.
  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    if (!hasMapTilerKey) return
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
      container,
      style: buildRastroStyle(MAPTILER_KEY, themeRef.current),
      center: [INITIAL_CENTER.longitude, INITIAL_CENTER.latitude],
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
      // Sem rotação PELO USUÁRIO: o norte fixo é convenção cartográfica e evita
      // desorientação em uso rápido, que é o caso durante uma viagem. Não
      // impede a câmera dirigida por código — é dela que vive o sobrevoo da
      // entrada, que gira e inclina de propósito.
      dragRotate: false,
      pitchWithRotate: false,
    })

    map.touchZoomRotate.disableRotation()

    let loaded = false

    function publishView() {
      const center = map.getCenter()
      updateView({
        center: { latitude: center.lat, longitude: center.lng },
        zoom: map.getZoom(),
      })
    }

    map.on('load', () => {
      loaded = true
      publishView()
      registerMap(map)
      setLoaded(true)
    })
    map.on('move', publishView)

    // Erro depois do `load` é transitório — um tile que não veio, um glyph que
    // faltou — e o mapa segue utilizável. Antes do `load` é fatal: estilo,
    // fonte ou chave inválidos deixariam uma tela preta com o console limpo,
    // que é exatamente o resultado que o estado de fallback existe para evitar.
    map.on('error', (event) => {
      if (loaded) return
      setLoadFailure(event.error.message)
    })

    mapRef.current = map

    /*
     * A instância exposta para o teste de fumaça — e só para ele.
     *
     * O mapa desenha em WebGL: fonte, camada, inclinação e rumo não existem no
     * DOM, e nenhum deles pode ser conferido por seletor. Três defeitos reais
     * deste repositório viveram exatamente nesse ponto cego — as camadas
     * sumindo ao trocar de tema, a câmera entrando inclinada, o ponteiro não
     * chegando ao mapa —, e todos passavam por lint, typecheck e a suíte
     * inteira. Sem esta porta não há como um teste perguntar o que só o MapLibre
     * sabe.
     *
     * Dois portões, e qualquer um sozinho já fecha, como em `/entrar-dev`:
     *
     * 1. `NODE_ENV` de produção. `next build` resolve isto para `false` e a
     *    condição inteira vira código morto que o empacotador remove.
     * 2. A variável, que vive só em `.env.local` — ignorado pelo git.
     *
     * Não é uma API: nada do produto lê `__rastroMap`, e apagar esta linha não
     * muda comportamento nenhum. Ver ADR 0022.
     */
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_RASTRO_E2E === '1'
    ) {
      ;(window as unknown as { __rastroMap?: maplibregl.Map }).__rastroMap = map
    }

    return () => {
      mapRef.current = null
      registerMap(null)
      setLoaded(false)
      map.remove()
    }
  }, [registerMap, updateView])

  /*
   * Troca de tema: `setStyle`, e não mapa novo.
   *
   * `setStyle` derruba TODAS as camadas nossas junto — pins, traçado, fonte de
   * dados. Quem as recoloca são os componentes de camada, que já escutam
   * `styledata` exatamente por isso: eles foram escritos assim quando se
   * descobriu que `map.once('load')` nunca dispara para um mapa já carregado, e
   * a rota ficava invisível ao navegar pelo cliente. A mesma escuta resolve
   * isto de graça.
   *
   * `diff: false` porque a diferença entre os dois estilos é a paleta inteira:
   * calcular o diff custa mais do que reconstruir.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setStyle(buildRastroStyle(MAPTILER_KEY, theme), { diff: false })
  }, [theme])

  if (!hasMapTilerKey) {
    return <MapFallback />
  }

  // O posicionamento vive no wrapper, não no contêiner do mapa: o CSS do
  // maplibre-gl aplica `position: relative` em `.maplibregl-map` e, por vir
  // depois das utilitárias do Tailwind na ordem da folha, venceria um
  // `absolute` aplicado direto no contêiner — colapsando a altura para zero.
  //
  // O aviso de falha cobre o contêiner em vez de substituí-lo: desmontar o nó
  // que o MapLibre já adotou atrapalharia a limpeza do efeito.
  // O fade de primeira pintura mora num nó só nosso: aplicá-lo no contêiner que
  // o MapLibre adota misturaria nossas classes com as dele.
  return (
    <div className="absolute inset-0">
      <div className="map-surface h-full w-full" data-loaded={loaded}>
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {loadFailure === null ? null : <MapLoadError detail={loadFailure} />}
    </div>
  )
}
