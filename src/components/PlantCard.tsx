import { popcountHex } from '@/engine/genome'
import type { Plant } from '@/engine/types'
import { GradeBadge } from './GradeBadge'

type Props = {
  plant: Plant
  selected?: boolean
  role?: 'mother' | 'father' | null
  onClick?: () => void
  compact?: boolean
}

export const PlantCard = ({ plant, selected, role, onClick, compact }: Props) => {
  const popcount = popcountHex(plant.genome)
  const denovoFirsts = plant.events.filter(
    (e) => e.type === 'denovo' && e.firstOccurrence,
  ).length
  const retroCount = plant.events.filter((e) => e.type === 'retrotransposon').length

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md border px-3 py-2 text-left transition-colors ${
        selected
          ? 'border-[var(--color-border-bright)] bg-[var(--color-panel-2)]'
          : 'border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)]'
      }`}
    >
      <div className="flex items-center gap-2">
        <GradeBadge resilience={plant.resilience} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm">{plant.label}</div>
            {role && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  role === 'mother'
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {role}
              </span>
            )}
          </div>
          <div
            className="truncate font-mono text-[10px] text-[var(--color-dim)]"
            title={plant.genome}
          >
            {plant.genome.slice(0, 32)}…
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-muted)]">
          <span>gen {plant.generation}</span>
          <span>seeds {plant.seedCount}</span>
          <span>resilience {plant.resilience}</span>
          <span>popcount {popcount}/256</span>
          {denovoFirsts > 0 && (
            <span className="text-[var(--color-event-denovo)]">de novo ×{denovoFirsts}</span>
          )}
          {retroCount > 0 && (
            <span className="text-[var(--color-event-retro)]">retro ×{retroCount}</span>
          )}
        </div>
      )}
    </button>
  )
}
