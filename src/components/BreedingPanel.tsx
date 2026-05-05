import { useEffect, useMemo, useState } from 'react'
import { GENOME_LENGTH, hammingDistance, popcountHex, posToRowCol } from '@/engine/genome'
import { regionAtPos, regionById } from '@/engine/regions'
import type { BreedingResult, Plant } from '@/engine/types'
import { EventLog } from './EventLog'
import { GenomeGrid } from './GenomeGrid'
import { GradeBadge } from './GradeBadge'
import { PlantCard } from './PlantCard'
import { RegionDetail } from './RegionDetail'

const REVEAL_PER_CELL_MS = 22

type Props = {
  mother: Plant | null
  father: Plant | null
  inspectedPlant: Plant | null
  inspectedResult: BreedingResult | null
  litterSize: number
  onBreed: () => void
}

export const BreedingPanel = ({
  mother,
  father,
  inspectedPlant,
  inspectedResult,
  litterSize,
  onBreed,
}: Props) => {
  const [revealedCells, setRevealedCells] = useState(GENOME_LENGTH)
  const [retroVisible, setRetroVisible] = useState(true)
  const [hoveredPos, setHoveredPos] = useState<number | null>(null)

  const hoverHighlightCells = useMemo<Array<[number, number]> | undefined>(() => {
    if (hoveredPos === null) return undefined
    const region = regionById(regionAtPos(hoveredPos))
    if (region) return region.cells
    return [posToRowCol(hoveredPos)]
  }, [hoveredPos])

  const inspectedKey = inspectedPlant?.id ?? null
  useEffect(() => {
    if (!inspectedKey || !inspectedResult) {
      setRevealedCells(GENOME_LENGTH)
      setRetroVisible(true)
      return
    }
    setRevealedCells(0)
    setRetroVisible(false)
    const total = GENOME_LENGTH * REVEAL_PER_CELL_MS
    const interval = setInterval(() => {
      setRevealedCells((n) => Math.min(GENOME_LENGTH, n + 1))
    }, REVEAL_PER_CELL_MS)
    const stopRetro = setTimeout(() => setRetroVisible(true), total + 200)
    return () => {
      clearInterval(interval)
      clearTimeout(stopRetro)
    }
  }, [inspectedKey, inspectedResult])

  const distance = useMemo(() => {
    if (!mother || !father) return null
    return hammingDistance(mother.genome, father.genome)
  }, [mother, father])

  const retroEvent =
    inspectedResult?.child.events.find((e) => e.type === 'retrotransposon') ?? null

  return (
    <div className="space-y-4 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-pink-300">Mother</h3>
          {mother ? (
            <>
              <PlantCard plant={mother} role="mother" compact />
              <div className="mt-3 flex justify-center">
                <GenomeGrid
                  genome={mother.genome}
                  carriers={mother.carriers}
                  size={36}
                  highlightCells={hoverHighlightCells}
                  onCellHover={setHoveredPos}
                />
              </div>
            </>
          ) : (
            <div className="rounded border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-dim)]">
              Pick a mother from the lineage panel.
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-300">Father</h3>
          {father ? (
            <>
              <PlantCard plant={father} role="father" compact />
              <div className="mt-3 flex justify-center">
                <GenomeGrid
                  genome={father.genome}
                  carriers={father.carriers}
                  size={36}
                  highlightCells={hoverHighlightCells}
                  onCellHover={setHoveredPos}
                />
              </div>
            </>
          ) : (
            <div className="rounded border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-dim)]">
              Pick a father from the lineage panel.
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Inspector
          </h3>
          {inspectedPlant ? (
            <>
              <PlantCard plant={inspectedPlant} compact />
              <div className="mt-3 flex justify-center">
                <GenomeGrid
                  key={inspectedPlant.id}
                  genome={inspectedPlant.genome}
                  resolution={inspectedResult?.resolution}
                  carriers={inspectedPlant.carriers}
                  revealedCells={revealedCells}
                  burstCells={
                    hoverHighlightCells === undefined &&
                    retroEvent &&
                    retroVisible &&
                    retroEvent.type === 'retrotransposon'
                      ? retroEvent.targetCells
                      : undefined
                  }
                  highlightCells={
                    hoverHighlightCells ??
                    (retroEvent && retroVisible && retroEvent.type === 'retrotransposon'
                      ? retroEvent.sourceCells
                      : undefined)
                  }
                  size={36}
                  onCellHover={setHoveredPos}
                />
              </div>
            </>
          ) : (
            <div className="rounded border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-dim)]">
              Breed two plants to see a litter resolve here. Click any seed in the backpack to
              inspect it.
            </div>
          )}
        </div>
      </div>

      <RegionDetail
        hoveredPos={hoveredPos}
        mother={mother}
        father={father}
        child={inspectedPlant}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <div className="text-xs text-[var(--color-muted)]">
          {mother && father ? (
            <>
              Hamming distance:{' '}
              <span className="font-mono text-[var(--color-text)]">{distance ?? '—'}</span>
              {' • '}
              <span>
                A popcount {popcountHex(mother.genome)} / B popcount {popcountHex(father.genome)}
              </span>
              {' • '}
              <span>
                Litter size <span className="font-mono text-[var(--color-text)]">{litterSize}</span>{' '}
                (mother's seed coat)
              </span>
            </>
          ) : (
            <span className="italic">Select two parents to enable breeding.</span>
          )}
        </div>
        <button
          type="button"
          disabled={!mother || !father}
          onClick={onBreed}
          className="rounded-md border border-[var(--color-border-bright)] bg-[var(--color-panel-2)] px-4 py-1.5 text-sm font-medium hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Breed → {litterSize > 0 ? `${litterSize} seeds` : ''}
        </button>
      </div>

      {inspectedResult && inspectedPlant && (
        <div className="grid grid-cols-1 gap-3 border-t border-[var(--color-border)] pt-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              This sibling's events
            </h4>
            <EventLog
              events={inspectedPlant.events}
              emptyMessage="Clean breeding — no mutation events fired."
            />
          </div>
          <div>
            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Outcome
            </h4>
            <ul className="space-y-1 text-xs">
              <li className="flex items-center gap-2">
                grade{' '}
                <GradeBadge resilience={inspectedPlant.resilience} size="sm" />
                <span className="font-mono text-[var(--color-text)]">
                  res {inspectedPlant.resilience}
                </span>
              </li>
              <li>
                seeds (next litter){' '}
                <span className="font-mono text-[var(--color-text)]">
                  {inspectedPlant.seedCount}
                </span>
              </li>
              <li>
                generation{' '}
                <span className="font-mono text-[var(--color-text)]">
                  {inspectedPlant.generation}
                </span>
              </li>
              {mother && (
                <li className="text-pink-300">
                  mother variant ≠ consensus by{' '}
                  <span className="font-mono">
                    {hammingDistance(inspectedResult.motherVariant, mother.genome)}
                  </span>{' '}
                  bits
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
