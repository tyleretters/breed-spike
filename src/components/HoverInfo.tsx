import { posToRowCol } from '@/engine/genome'
import { predictCell, type CellPrediction } from '@/engine/predict'
import { MODIFIER_DESCRIPTION, regionAtPos, regionById } from '@/engine/regions'
import type { Plant } from '@/engine/types'

type Props = {
  pos: number | null
  mother: Plant | null
  father: Plant | null
  offspring: Plant | null
}

const sourceLabel = (cell: CellPrediction): string => {
  switch (cell.rule) {
    case 'both-dom':
      return cell.source === 'tie'
        ? `both dominant — tie at ${cell.expressed}`
        : `both dominant — ${cell.source}'s ${cell.expressed} wins (max)`
    case 'mother-dom':
      return `mother's ${cell.motherNibble} dominant; father's ${cell.fatherNibble} carried as recessive`
    case 'father-dom':
      return `father's ${cell.fatherNibble} dominant; mother's ${cell.motherNibble} carried as recessive`
    case 'both-rec':
      return cell.source === 'tie'
        ? `both recessive — tie at ${cell.expressed}`
        : `both recessive — higher ${cell.source}'s ${cell.expressed} expresses`
  }
}

export const HoverInfo = ({ pos, mother, father, offspring }: Props) => {
  if (pos === null || !mother || !father) return null

  const region = regionAtPos(pos)
  const regionInfo = regionById(region)
  const isModifier = region === 'modifier'
  const [row, col] = posToRowCol(pos)

  const prediction = predictCell(mother.genome, father.genome, pos)
  const colorVar = isModifier ? '#71717a' : (regionInfo?.colorVar ?? '#71717a')

  const actualOffspring = offspring ? offspring.genome[pos] : null
  const matchesPrediction =
    actualOffspring !== null && actualOffspring === prediction.expressed

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-md border bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm"
      style={{
        borderColor: colorVar,
        minWidth: 420,
        maxWidth: 600,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className="text-[10px] tracking-[0.3em] uppercase"
            style={{ color: colorVar }}
          >
            {isModifier ? 'Modifier locus' : (regionInfo?.label ?? region)}
          </div>
          <div className="text-[10px] text-[var(--color-dim)]">
            cell ({row},{col}) · pos {pos}
          </div>
        </div>
        {!isModifier && regionInfo && (
          <ul className="flex flex-wrap justify-end gap-1 text-[9px] text-[var(--color-muted)]">
            {regionInfo.traits.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded border border-[var(--color-border)] px-1.5 py-0.5"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-[var(--color-text)]">
        {isModifier ? MODIFIER_DESCRIPTION : (regionInfo?.description ?? '')}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <AlleleCell
          label="Mother"
          accent="#f9a8d4"
          nibble={prediction.motherNibble}
          dominant={prediction.motherDominant}
        />
        <AlleleCell
          label="Father"
          accent="#93c5fd"
          nibble={prediction.fatherNibble}
          dominant={prediction.fatherDominant}
        />
        <AlleleCell
          label={actualOffspring ? 'Offspring' : 'Predicted'}
          accent={
            actualOffspring && !matchesPrediction
              ? 'var(--color-event-denovo)'
              : 'var(--color-amber)'
          }
          nibble={actualOffspring ?? prediction.expressed}
          dominant={(actualOffspring ?? prediction.expressed).charCodeAt(0) >= '8'.charCodeAt(0)}
          accentLabel={
            actualOffspring && !matchesPrediction ? 'mutated' : actualOffspring ? 'actual' : 'expected'
          }
        />
      </div>

      <div className="mt-2 text-[10px] text-[var(--color-muted)]">
        <span className="text-[var(--color-amber)]">→</span> {sourceLabel(prediction)}
        {prediction.carrier && (
          <>
            <span className="mx-1 text-[var(--color-dim)]">·</span>
            <span>
              recessive <span className="font-mono">{prediction.carrier}</span> carried (hidden)
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const AlleleCell = ({
  label,
  accent,
  nibble,
  dominant,
  accentLabel,
}: {
  label: string
  accent: string
  nibble: string
  dominant: boolean
  accentLabel?: string
}) => (
  <div
    className="flex items-center gap-2 rounded border border-[var(--color-border)] px-2 py-1.5"
    style={{ borderColor: `${accent}40` }}
  >
    <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: accent }}>
      {label}
    </span>
    <span
      className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded font-mono text-xs"
      style={{
        color: '#f4f4f5',
        backgroundColor: '#18181b',
        border: dominant
          ? '1.5px solid rgba(255,255,255,0.4)'
          : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {nibble}
    </span>
    {accentLabel && (
      <span className="text-[9px] text-[var(--color-dim)]">{accentLabel}</span>
    )}
  </div>
)
