/**
 * Mesmo padrão do MapFallback: quando falta configuração, dizer o que falta em
 * texto, no lugar do conteúdo — nunca degradar em silêncio para dado falso.
 */
export function DataFallback() {
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-void px-6">
      <div className="max-w-md border-t border-line pt-4">
        <span className="instrument-label">Banco não configurado</span>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">
          Defina <span className="instrument-value">NEXT_PUBLIC_SUPABASE_URL</span>{' '}
          e{' '}
          <span className="instrument-value">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{' '}
          em <span className="instrument-value">.env.local</span> e reinicie o
          servidor. Sem elas não há lugares para mostrar — e mostrar dados de
          exemplo aqui esconderia que nada seria gravado.
        </p>
      </div>
    </div>
  )
}
