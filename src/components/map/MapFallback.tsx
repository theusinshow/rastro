export function MapFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-void">
      <div className="max-w-sm border border-line px-6 py-5">
        <span className="instrument-label">Mapa indisponível</span>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          A chave do MapTiler não foi configurada. Defina{' '}
          <code className="instrument-value text-ink">
            NEXT_PUBLIC_MAPTILER_KEY
          </code>{' '}
          em <code className="instrument-value text-ink">.env.local</code> e
          reinicie o servidor.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          A chave gratuita fica em cloud.maptiler.com, em Account → Keys.
        </p>
      </div>
    </div>
  )
}
