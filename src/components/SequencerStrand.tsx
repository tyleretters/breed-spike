import { GENOME_LENGTH, isDominant, nibbleAt, nibbleValue } from '@/engine/genome'
import { regionAtPos } from '@/engine/regions'
import type { Genome, RegionId } from '@/engine/types'

const REGION_HUE: Record<RegionId, number | null> = {
  root: 240,
  canopy: 130,
  flowering: 320,
  seed: 38,
  pest: 190,
  modifier: null,
}

const cellBackground = (regionId: RegionId, value: number): string => {
  const hue = REGION_HUE[regionId]
  const lightness = 8 + value * 3.2
  if (hue === null) return `hsl(0 0% ${lightness}%)`
  return `hsl(${hue} 38% ${lightness + 4}%)`
}

type Props = {
  genome: Genome
  diffAgainst?: Genome
  diffPosition?: 'top' | 'bottom'
  revealedCells?: number
  cellWidth?: number
  cellHeight?: number
  onCellHover?: (pos: number | null) => void
  highlightCells?: number[]
}

export const SequencerStrand = ({
  genome,
  diffAgainst,
  diffPosition,
  revealedCells = GENOME_LENGTH,
  cellWidth = 14,
  cellHeight = 28,
  onCellHover,
  highlightCells,
}: Props) => {
  const highlightSet = new Set(highlightCells ?? [])

  return (
    <div
      className="flex flex-col"
      onMouseLeave={() => onCellHover?.(null)}
      style={{ gap: 1 }}
    >
      {diffPosition === 'top' && (
        <DiffTicks
          genome={genome}
          other={diffAgainst}
          revealedCells={revealedCells}
          cellWidth={cellWidth}
        />
      )}
      <div className="flex" style={{ gap: 1 }}>
        {Array.from({ length: GENOME_LENGTH }, (_, pos) => {
          const value = nibbleValue(nibbleAt(genome, pos))
          const region = regionAtPos(pos)
          const dom = isDominant(nibbleAt(genome, pos))
          const revealed = pos < revealedCells
          const highlighted = highlightSet.has(pos)
          return (
            <div
              key={pos}
              onMouseEnter={() => onCellHover?.(pos)}
              style={{
                width: cellWidth,
                height: cellHeight,
                backgroundColor: revealed
                  ? cellBackground(region, value)
                  : 'rgba(40,40,46,0.8)',
                borderTop: dom ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                borderBottom: dom ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                outline: highlighted ? '1px solid var(--color-amber)' : 'none',
                outlineOffset: -1,
                opacity: revealed ? 1 : 0.35,
                transition: 'background-color 200ms ease-out, opacity 200ms ease-out',
              }}
            />
          )
        })}
      </div>
      {diffPosition === 'bottom' && (
        <DiffTicks
          genome={genome}
          other={diffAgainst}
          revealedCells={revealedCells}
          cellWidth={cellWidth}
        />
      )}
    </div>
  )
}

const DiffTicks = ({
  genome,
  other,
  revealedCells,
  cellWidth,
}: {
  genome: Genome
  other?: Genome
  revealedCells: number
  cellWidth: number
}) => {
  if (!other) {
    return <div style={{ height: 8 }} />
  }
  return (
    <div className="flex" style={{ gap: 1, height: 8 }}>
      {Array.from({ length: GENOME_LENGTH }, (_, pos) => {
        const differs = nibbleAt(genome, pos) !== nibbleAt(other, pos)
        const revealed = pos < revealedCells
        return (
          <div
            key={pos}
            style={{
              width: cellWidth,
              height: '100%',
              backgroundColor:
                differs && revealed ? 'var(--color-amber)' : 'transparent',
              opacity: differs && revealed ? 0.8 : 0,
              transition: 'opacity 180ms ease-out',
            }}
          />
        )
      })}
    </div>
  )
}
