interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    // A `<label>` inteira já era o alvo; o que faltava era altura. 32px no total.
    <label className="flex cursor-pointer items-center gap-2 py-2 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 appearance-none border border-line-strong
                   checked:border-accent checked:bg-accent"
      />
      <span className="text-[11px] text-ink-muted">{label}</span>
    </label>
  )
}
