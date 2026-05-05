import { gradeColor, gradeFromResilience } from '@/engine/grading'
import type { Plant } from '@/engine/types'
import { GradeBadge } from './GradeBadge'

type Props = {
  plants: Plant[]
  onPlant: (plantId: string) => void
  onDiscard: (plantId: string) => void
  onView?: (plantId: string) => void
  onInspect?: (plantId: string) => void
  inspectedPlantId?: string | null
}

const sortByGrade = (a: Plant, b: Plant): number => {
  if (b.resilience !== a.resilience) return b.resilience - a.resilience
  return b.createdAt - a.createdAt
}

export const Backpack = ({
  plants,
  onPlant,
  onDiscard,
  onView,
  onInspect,
  inspectedPlantId,
}: Props) => {
  const seeds = plants.filter((p) => !p.planted)

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Seed Backpack
        </h3>
        <span className="text-[10px] text-[var(--color-dim)]">
          {seeds.length} seed{seeds.length === 1 ? '' : 's'}
        </span>
      </div>
      {seeds.length === 0 && (
        <div className="text-xs italic text-[var(--color-dim)]">
          Empty. Each breeding event drops a litter of seeds here — pick which ones to plant.
        </div>
      )}
      <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {[...seeds].sort(sortByGrade).map((plant) => {
          const grade = gradeFromResilience(plant.resilience)
          const color = gradeColor(grade)
          const isInspected = plant.id === inspectedPlantId
          const denovoFirsts = plant.events.filter(
            (e) => e.type === 'denovo' && e.firstOccurrence,
          ).length
          const retroCount = plant.events.filter((e) => e.type === 'retrotransposon').length
          return (
            <li
              key={plant.id}
              className={`rounded border px-2 py-1.5 transition-colors ${
                isInspected
                  ? 'border-[var(--color-border-bright)] bg-[var(--color-panel-2)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)]'
              }`}
              style={isInspected ? { boxShadow: `inset 0 0 0 1px ${color}66` } : undefined}
            >
              <button
                type="button"
                onClick={() => onInspect?.(plant.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <GradeBadge resilience={plant.resilience} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs">{plant.label}</div>
                  <div
                    className="truncate font-mono text-[9px] text-[var(--color-dim)]"
                    title={plant.genome}
                  >
                    {plant.genome.slice(0, 24)}…
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0 text-[10px] text-[var(--color-muted)]">
                    <span>seeds {plant.seedCount}</span>
                    <span>res {plant.resilience}</span>
                    {denovoFirsts > 0 && (
                      <span className="text-[var(--color-event-denovo)]">de novo×{denovoFirsts}</span>
                    )}
                    {retroCount > 0 && (
                      <span className="text-[var(--color-event-retro)]">retro×{retroCount}</span>
                    )}
                  </div>
                </div>
              </button>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => onPlant(plant.id)}
                  className="flex-1 rounded border border-emerald-500/40 px-1 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300 hover:bg-emerald-500/15"
                >
                  Plant
                </button>
                <button
                  type="button"
                  onClick={() => onDiscard(plant.id)}
                  className="flex-1 rounded border border-[var(--color-border)] px-1 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)] hover:border-rose-500/40 hover:text-rose-300"
                >
                  Discard
                </button>
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(plant.id)}
                    className="rounded border border-[var(--color-border)] px-1 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)] hover:border-[var(--color-border-bright)] hover:text-[var(--color-text)]"
                    title="View pedigree"
                  >
                    Pedigree
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
