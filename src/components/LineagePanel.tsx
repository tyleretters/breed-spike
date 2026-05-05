import type { Plant } from '@/engine/types'
import { PlantCard } from './PlantCard'

type Props = {
  plants: Plant[]
  selectedMotherId: string | null
  selectedFatherId: string | null
  onSelect: (plantId: string, role: 'mother' | 'father') => void
  onClear: (role: 'mother' | 'father') => void
}

export const LineagePanel = ({
  plants,
  selectedMotherId,
  selectedFatherId,
  onSelect,
  onClear,
}: Props) => {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Lineage
        </h3>
        <span className="text-[10px] text-[var(--color-dim)]">{plants.length} plants</span>
      </div>
      {plants.length === 0 && (
        <div className="text-xs italic text-[var(--color-dim)]">
          No plants yet. Spawn a founder below.
        </div>
      )}
      <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {[...plants]
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((plant) => {
            const isMother = plant.id === selectedMotherId
            const isFather = plant.id === selectedFatherId
            const role = isMother ? 'mother' : isFather ? 'father' : null
            return (
              <li key={plant.id} className="space-y-1">
                <PlantCard
                  plant={plant}
                  role={role}
                  selected={isMother || isFather}
                  onClick={() => {
                    /* selection is via the buttons below */
                  }}
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      isMother ? onClear('mother') : onSelect(plant.id, 'mother')
                    }
                    className={`flex-1 rounded border px-1 py-0.5 text-[10px] uppercase tracking-wide transition-colors ${
                      isMother
                        ? 'border-pink-500/50 bg-pink-500/20 text-pink-300'
                        : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-pink-500/40 hover:text-pink-300'
                    }`}
                  >
                    {isMother ? '✓ mother' : 'Set mother'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isFather ? onClear('father') : onSelect(plant.id, 'father')
                    }
                    className={`flex-1 rounded border px-1 py-0.5 text-[10px] uppercase tracking-wide transition-colors ${
                      isFather
                        ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                        : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-blue-500/40 hover:text-blue-300'
                    }`}
                  >
                    {isFather ? '✓ father' : 'Set father'}
                  </button>
                </div>
              </li>
            )
          })}
      </ul>
    </div>
  )
}
