interface StatProps {
  label: string
  value: string
  unit?: string
}

export function Stat({ label, value, unit }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="instrument-label">{label}</span>
      <span className="instrument-value text-sm text-ink">
        {value}
        {unit ? <span className="ml-1 text-ink-faint">{unit}</span> : null}
      </span>
    </div>
  )
}
