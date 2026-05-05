import { GENOME_LENGTH, isDominant, nibbleAt, nibbleValue, posToRowCol, rowColToPos } from '@/engine/genome'
import { regionAtPos, regionById } from '@/engine/regions'
import type { CellResolution, Genome, RegionId } from '@/engine/types'

const REGION_HUE: Record<RegionId, number | null> = {
  root: 240,
  canopy: 130,
  flowering: 320,
  seed: 38,
  pest: 190,
  modifier: null,
}

const cellBackground = (regionId: RegionId, value: number, isExpressed: boolean): string => {
  const hue = REGION_HUE[regionId]
  const lightness = 6 + value * 3
  if (hue === null) {
    return `hsl(0 0% ${lightness + (isExpressed ? 4 : 0)}%)`
  }
  const saturation = 36 + (isExpressed ? 8 : 0)
  return `hsl(${hue} ${saturation}% ${lightness + (isExpressed ? 6 : 0)}%)`
}

const cellTextColor = (value: number): string => {
  return value >= 7 ? '#f4f4f5' : '#a1a1aa'
}

type Props = {
  genome: Genome
  resolution?: CellResolution[]
  revealedCells?: number
  carriers?: Record<number, string>
  highlightCells?: Array<[number, number]>
  burstCells?: Array<[number, number]>
  showGhosts?: boolean
  size?: number
  onCellHover?: (pos: number | null) => void
}

export const GenomeGrid = ({
  genome,
  resolution,
  revealedCells = GENOME_LENGTH,
  carriers,
  highlightCells,
  burstCells,
  showGhosts = true,
  size = 44,
  onCellHover,
}: Props) => {
  const highlightSet = new Set<number>(
    (highlightCells ?? []).map(([r, c]) => rowColToPos(r, c)),
  )
  const burstSet = new Set<number>((burstCells ?? []).map(([r, c]) => rowColToPos(r, c)))

  return (
    <div
      className="inline-grid gap-[2px] rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2"
      style={{ gridTemplateColumns: `repeat(8, ${size}px)`, gridAutoRows: `${size}px` }}
      onMouseLeave={() => onCellHover?.(null)}
    >
      {Array.from({ length: GENOME_LENGTH }, (_, pos) => {
        const [row, col] = posToRowCol(pos)
        const value = nibbleValue(nibbleAt(genome, pos))
        const nibble = nibbleAt(genome, pos)
        const region = regionAtPos(pos)
        const carrier = carriers?.[pos]
        const dominant = isDominant(nibble)
        const cellRes = resolution?.[pos]
        const event = cellRes?.event ?? null
        const revealed = pos < revealedCells

        const eventClass = (() => {
          if (!event) return ''
          if (event.type === 'retrotransposon') return 'animate-retro-burst'
          return 'animate-cell-flash'
        })()
        const eventColor = (() => {
          if (!event) return undefined
          if (event.type === 'missense') return 'var(--color-event-missense)'
          if (event.type === 'nonsense') return 'var(--color-event-nonsense)'
          if (event.type === 'denovo') return 'var(--color-event-denovo)'
          return 'var(--color-event-retro)'
        })()

        const inHighlight = highlightSet.has(pos)
        const inBurst = burstSet.has(pos)

        return (
          <div
            key={pos}
            onMouseEnter={() => onCellHover?.(pos)}
            title={`${region} (${row},${col}) = ${nibble}${carrier ? ` • carrier ${carrier}` : ''}`}
            className={`relative flex items-center justify-center font-mono text-base select-none ${revealed ? eventClass : ''}`}
            style={{
              backgroundColor: cellBackground(region, value, true),
              color: cellTextColor(value),
              borderRadius: 4,
              borderWidth: dominant ? 2 : 1,
              borderStyle: 'solid',
              borderColor: dominant ? '#52525b' : '#27272a',
              opacity: revealed ? 1 : 0.15,
              transition: 'opacity 200ms ease-out, transform 200ms ease-out',
              outline: inHighlight ? `2px solid ${regionById(region)?.colorVar ?? '#fff'}` : undefined,
              boxShadow: inBurst
                ? '0 0 0 3px var(--color-event-retro), inset 0 0 12px rgba(52,211,153,0.4)'
                : undefined,
              animationDelay: `${pos * 18}ms`,
              ...(eventColor ? ({ ['--cell-event-color' as string]: eventColor } as Record<string, string>) : {}),
            }}
          >
            <span style={{ color: eventColor ? eventColor : undefined, transition: 'color 300ms ease-out' }}>
              {revealed ? nibble : '·'}
            </span>
            {showGhosts && carrier && revealed && (
              <span
                className="absolute right-[2px] bottom-[1px] text-[8px] leading-none"
                style={{ color: '#71717a' }}
                title={`carrier ${carrier}`}
              >
                {carrier}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
