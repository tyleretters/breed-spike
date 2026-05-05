import { baseMutationRates } from '@/engine/mutations'

type Props = {
  stress: number
  onStressChange: (next: number) => void
  mosaicEnabled: boolean
  onMosaicToggle: (next: boolean) => void
}

export const Controls = ({ stress, onStressChange, mosaicEnabled, onMosaicToggle }: Props) => {
  const rates = baseMutationRates(stress)
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`

  return (
    <div className="space-y-4 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="stress" className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Environmental Stress
          </label>
          <span className="font-mono text-xs text-[var(--color-text)]">{Math.round(stress * 100)}%</span>
        </div>
        <input
          id="stress"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(stress * 100)}
          onChange={(e) => onStressChange(Number(e.target.value) / 100)}
          className="w-full accent-[var(--color-event-retro)]"
        />
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[var(--color-dim)]">
          <span>missense {pct(rates.missense)}/nibble</span>
          <span>nonsense {pct(rates.nonsense)}/nibble</span>
          <span className="text-[var(--color-event-denovo)]">de novo {pct(rates.denovo)}/nibble</span>
          <span className="text-[var(--color-event-retro)]">retrotransposon {pct(rates.retro)}/breeding</span>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={mosaicEnabled}
            onChange={(e) => onMosaicToggle(e.target.checked)}
            className="h-3.5 w-3.5 accent-pink-400"
          />
          <span className="font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Maternal Germline Mosaicism
          </span>
        </label>
        <p className="mt-1 text-[10px] text-[var(--color-dim)]">
          When enabled, each breeding samples a variant of the mother's genome (within Hamming
          distance ~3 of her displayed consensus). Same parents can produce different siblings.
        </p>
      </div>
    </div>
  )
}
