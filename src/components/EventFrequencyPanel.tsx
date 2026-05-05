type EventTotals = {
  missense: number
  nonsense: number
  denovo: number
  retro: number
  denovoFirsts: number
  breedings: number
}

type Props = {
  totals: EventTotals
}

const ROWS: Array<{ key: keyof Omit<EventTotals, 'breedings' | 'denovoFirsts'>; label: string; color: string }> = [
  { key: 'missense', label: 'Missense', color: 'var(--color-event-missense)' },
  { key: 'nonsense', label: 'Nonsense', color: 'var(--color-event-nonsense)' },
  { key: 'denovo', label: 'De Novo', color: 'var(--color-event-denovo)' },
  { key: 'retro', label: 'Retrotransposon', color: 'var(--color-event-retro)' },
]

export const EventFrequencyPanel = ({ totals }: Props) => {
  const max = Math.max(1, totals.missense, totals.nonsense, totals.denovo, totals.retro)
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Cumulative events
        </h3>
        <span className="text-[10px] text-[var(--color-dim)]">{totals.breedings} breedings</span>
      </div>
      <ul className="space-y-1.5">
        {ROWS.map((row) => {
          const value = totals[row.key]
          const pct = (value / max) * 100
          return (
            <li key={row.key} className="space-y-0.5">
              <div className="flex items-baseline justify-between text-[11px]">
                <span style={{ color: row.color }}>{row.label}</span>
                <span className="font-mono text-[var(--color-text)]">
                  {value}
                  {totals.breedings > 0 && (
                    <span className="ml-1 text-[var(--color-dim)]">
                      ({(value / totals.breedings).toFixed(2)}/cross)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-[var(--color-panel-2)]">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: row.color }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      {totals.denovoFirsts > 0 && (
        <div
          className="mt-2 rounded border border-[var(--color-event-denovo)]/40 bg-[var(--color-event-denovo)]/10 px-2 py-1 text-[10px]"
          style={{ color: 'var(--color-event-denovo)' }}
        >
          {totals.denovoFirsts} de novo first occurrence{totals.denovoFirsts === 1 ? '' : 's'} this session
        </div>
      )}
    </div>
  )
}
