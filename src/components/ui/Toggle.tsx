interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/**
 * Checkbox nativo estilizado — acessível de graça, sem biblioteca.
 *
 * A `<label>` inteira é o alvo, com 44px de altura. A caixa desenhada tem 20px:
 * era 14px, e um alvo de luva não se acerta em 14px.
 */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 shrink-0 appearance-none rounded-sm border
                   border-line-strong transition-colors checked:border-accent
                   checked:bg-accent"
      />
      <span className="text-body text-ink-muted">{label}</span>
    </label>
  )
}
