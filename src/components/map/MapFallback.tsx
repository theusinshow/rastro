/**
 * Moldura comum dos estados em que o mapa não pode ser desenhado. Mesma
 * gramática do resto da interface: hairline, sem card, sem sombra.
 */
function MapNotice({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-void">
      <div className="max-w-sm border border-line px-6 py-5">
        <span className="instrument-label">{title}</span>
        {children}
      </div>
    </div>
  )
}

/** Chave do MapTiler ausente. Estado esperado, não é falha. */
export function MapFallback() {
  return (
    <MapNotice title="Mapa indisponível">
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        A chave do MapTiler não foi configurada. Defina{' '}
        <code className="instrument-value text-ink">
          NEXT_PUBLIC_MAPTILER_KEY
        </code>{' '}
        em <code className="instrument-value text-ink">.env.local</code> e
        reinicie o servidor.
      </p>
      <p className="mt-3 text-small leading-relaxed text-ink-faint">
        A chave gratuita fica em cloud.maptiler.com, em Account → Keys.
      </p>
    </MapNotice>
  )
}

/**
 * O MapLibre falhou antes de terminar de carregar. Sem este estado o resultado
 * seria uma tela preta com o console limpo — exatamente o que o fallback existe
 * para evitar.
 */
export function MapLoadError({ detail }: Readonly<{ detail: string }>) {
  return (
    <MapNotice title="Falha ao carregar o mapa">
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        O mapa não terminou de carregar. Verifique a conexão e se a chave do
        MapTiler continua válida em cloud.maptiler.com, em Account → Keys.
      </p>
      <p className="mt-3 text-small leading-relaxed text-ink-faint">
        Recarregue a página depois de corrigir.
      </p>
      <p className="mt-3 border-t border-line pt-3 text-small leading-relaxed text-ink-faint">
        <code className="instrument-value">{detail}</code>
      </p>
    </MapNotice>
  )
}
