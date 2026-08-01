'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '@/domain/geo'
import {
  FUEL_LIMIT_DEFAULT,
  FUEL_RADIUS_DEFAULT_M,
  type FuelAnchor,
  type FuelSearchFailure,
  type FuelStation,
} from '@/domain/fuel-stations'
import { searchFuelStations } from '@/lib/fuel-stations/browser'

export type FuelStatus = 'ocioso' | 'buscando' | 'pronto' | 'falhou'

interface FuelState {
  status: FuelStatus
  stations: FuelStation[]
  failure: FuelSearchFailure | null
  /** O ponto da última busca CONCLUÍDA. É contra ele que o mapa se mede. */
  searchedAt: Coordinates | null
}

const INITIAL: FuelState = {
  status: 'ocioso',
  stations: [],
  failure: null,
  searchedAt: null,
}

/**
 * O estado da camada de postos.
 *
 * **Nenhuma busca acontece por conta própria.** Não há efeito escutando o mapa,
 * não há debounce de `drag`, não há refetch ao mudar o zoom: toda ida à rede sai
 * de um gesto — ligar a camada, trocar o ponto de referência, mudar o raio,
 * apertar "buscar nesta área" ou "tentar de novo". É o que impede a cota diária
 * de virar refém de quem está só passeando pelo mapa.
 *
 * O estado vive em React, e não na URL como os filtros do catálogo (ADR 0006):
 * posto não é entidade do Rastro, é uma consulta a um serviço externo. Guardá-lo
 * na URL prometeria que um link compartilhado devolveria a mesma lista, e a
 * lista depende de cota, de horário e do OpenStreetMap de hoje.
 */
export function useFuelStations() {
  const [active, setActive] = useState(false)
  const [anchor, setAnchor] = useState<FuelAnchor | null>(null)
  const [radiusM, setRadiusM] = useState(FUEL_RADIUS_DEFAULT_M)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [state, setState] = useState<FuelState>(INITIAL)

  // A busca em curso. Trocar de ponto ou de raio aborta a anterior: sem isso, a
  // resposta do ponto antigo pode chegar depois e sobrescrever a lista certa.
  const inFlight = useRef<AbortController | null>(null)

  const run = useCallback(async (next: FuelAnchor, nextRadiusM: number) => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller

    /*
     * A lista anterior sai da tela ANTES da busca nova.
     *
     * Mantê-la enquanto o novo ponto carrega pareceria continuidade, mas seria o
     * contrário: o cabeçalho já diria "perto de Urubici" com os postos de
     * Palhoça embaixo, e os losangos do mapa continuariam no vale errado.
     */
    setState((current) => ({
      ...current,
      status: 'buscando',
      stations: [],
      failure: null,
    }))

    const outcome = await searchFuelStations(
      {
        center: next.coordinates,
        radiusM: nextRadiusM,
        limit: FUEL_LIMIT_DEFAULT,
      },
      controller.signal,
    )

    // `null` é cancelamento, e cancelamento não escreve na tela: quem cancelou
    // foi uma busca nova, e é ela que manda agora.
    if (outcome === null) return
    if (controller.signal.aborted) return

    setState(
      outcome.ok
        ? {
            status: 'pronto',
            stations: outcome.stations,
            failure: null,
            searchedAt: next.coordinates,
          }
        : {
            status: 'falhou',
            stations: [],
            failure: outcome.failure,
            searchedAt: null,
          },
    )
  }, [])

  /** Liga a camada e busca em volta do ponto informado. */
  const open = useCallback(
    (next: FuelAnchor) => {
      setActive(true)
      setAnchor(next)
      setSelectedId(null)
      void run(next, radiusM)
    },
    [run, radiusM],
  )

  /** Troca o ponto de referência sem sair da camada. */
  const searchAt = useCallback(
    (next: FuelAnchor) => {
      setAnchor(next)
      setSelectedId(null)
      void run(next, radiusM)
    },
    [run, radiusM],
  )

  const changeRadius = useCallback(
    (next: number) => {
      setRadiusM(next)
      setSelectedId(null)
      if (anchor) void run(anchor, next)
    },
    [run, anchor],
  )

  const retry = useCallback(() => {
    if (anchor) void run(anchor, radiusM)
  }, [run, anchor, radiusM])

  /**
   * Desliga a camada e **descarta a lista**.
   *
   * Manter os postos em memória pareceria economia, mas deixaria os marcadores
   * voltarem sozinhos ao religar, sem que ninguém tenha pedido uma busca — e
   * então a tela mostraria o resultado de um ponto que talvez não seja mais o
   * atual. O cache de dez minutos do `browser.ts` já faz a economia de rede sem
   * mentir sobre o que está na tela.
   */
  const close = useCallback(() => {
    inFlight.current?.abort()
    inFlight.current = null
    setActive(false)
    setAnchor(null)
    setSelectedId(null)
    setState(INITIAL)
  }, [])

  // Sair da rota no meio de uma busca não pode deixar um `setState` órfão.
  useEffect(() => () => inFlight.current?.abort(), [])

  return {
    active,
    anchor,
    radiusM,
    selectedId,
    selected:
      state.stations.find((station) => station.id === selectedId) ?? null,
    ...state,
    open,
    close,
    searchAt,
    changeRadius,
    retry,
    select: setSelectedId,
  }
}
