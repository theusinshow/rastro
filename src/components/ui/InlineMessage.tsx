import { cn } from '@/lib/utils/cn'

type Tone = 'error' | 'warn' | 'info' | 'ok'

const TONE: Record<Tone, string> = {
  error: 'border-alert/40 bg-alert/10',
  warn: 'border-warn/40 bg-warn/10',
  info: 'border-line-strong bg-raised',
  ok: 'border-ok/40 bg-ok/10',
}

const TONE_TEXT: Record<Tone, string> = {
  error: 'text-alert',
  warn: 'text-warn',
  info: 'text-ink-faint',
  ok: 'text-ok',
}

/** Prefixo em mono. Diz o que aconteceu antes de dizer o quê. */
const PREFIX: Record<Tone, string> = {
  error: 'Falhou',
  warn: 'Atenção',
  info: 'Nota',
  ok: 'Gravado',
}

interface InlineMessageProps extends React.ComponentProps<'p'> {
  tone?: Tone
}

/**
 * Mensagem de estado no lugar onde ela importa: junto do controle que falhou.
 *
 * Existe porque toast e snackbar estão fora do sistema — uma mensagem que
 * aparece num canto e some sozinha não serve a quem estava olhando o mapa. E
 * porque, antes disto, toda mensagem de erro usava `ink-muted` e era
 * visualmente idêntica a uma legenda.
 *
 * `role="alert"` só no tom de erro: anunciar "Gravado" interrompendo a leitura
 * seria ruído, e `alert` é assertivo por definição.
 */
export function InlineMessage({
  tone = 'info',
  children,
  className,
  ...props
}: InlineMessageProps) {
  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={cn(
        'flex flex-col gap-1 rounded-md border px-4 py-3 leading-relaxed',
        'text-base sm:flex-row sm:items-baseline sm:gap-3',
        TONE[tone],
        className,
      )}
      {...props}
    >
      <span className={cn('instrument-label shrink-0', TONE_TEXT[tone])}>
        {PREFIX[tone]}
      </span>
      <span className="text-ink">{children}</span>
    </p>
  )
}
