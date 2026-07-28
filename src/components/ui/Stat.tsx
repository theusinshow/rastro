interface StatProps {
  label: string
  value: string
  unit?: string
}

/** Par rótulo/valor no vocabulário de instrumento. O valor sempre em mono. */
export function Stat({ label, value, unit }: StatProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="instrument-label">{label}</span>
      <span className="instrument-value text-title leading-none text-ink">
        {value}
        {unit ? (
          <span className="ml-1.5 text-base text-ink-faint">{unit}</span>
        ) : null}
      </span>
    </div>
  )
}
