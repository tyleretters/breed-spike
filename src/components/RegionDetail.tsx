import { isDominant, nibbleAt, nibbleValue, posToRowCol, rowColToPos } from '@/engine/genome'
import { MODIFIER_DESCRIPTION, MODIFIER_TRAITS, regionAtPos, regionById } from '@/engine/regions'
import type { Plant, RegionId } from '@/engine/types'

const dominanceLabel = (nibble: string): string => (isDominant(nibble) ? 'dominant' : 'recessive')

type Props = {
  hoveredPos: number | null
  mother: Plant | null
  father: Plant | null
  child: Plant | null
}

const renderRow = (label: string, plant: Plant | null, cells: Array<[number, number]>, accent: string) => {
  if (!plant) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[var(--color-dim)]">
        <span className="w-14 shrink-0" style={{ color: accent }}>
          {label}
        </span>
        <span className="italic">none</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-14 shrink-0" style={{ color: accent }}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {cells.map(([row, col]) => {
          const pos = rowColToPos(row, col)
          const nibble = nibbleAt(plant.genome, pos)
          const carrier = plant.carriers[pos]
          const dom = isDominant(nibble)
          return (
            <span
              key={pos}
              className="relative inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 font-mono text-xs"
              style={{
                borderColor: dom ? '#52525b' : '#27272a',
                borderWidth: dom ? 2 : 1,
                backgroundColor: '#18181b',
                color: nibbleValue(nibble) >= 7 ? '#f4f4f5' : '#a1a1aa',
              }}
              title={`(${row},${col}) ${nibble} • ${dominanceLabel(nibble)}${carrier ? ` • carrier ${carrier}` : ''}`}
            >
              {nibble}
              {carrier && (
                <span
                  className="absolute right-[1px] bottom-[-1px] text-[7px] leading-none text-[var(--color-dim)]"
                  title={`carrier ${carrier}`}
                >
                  {carrier}
                </span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export const RegionDetail = ({ hoveredPos, mother, father, child }: Props) => {
  if (hoveredPos === null) {
    return (
      <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] p-3">
        <p className="text-xs text-[var(--color-dim)] italic">
          Hover any cell on a genome grid to inspect what trait that locus controls and compare its
          alleles across the parents and child.
        </p>
      </div>
    )
  }

  const regionId: RegionId = regionAtPos(hoveredPos)
  const region = regionById(regionId)
  const isModifier = regionId === 'modifier'
  const cells: Array<[number, number]> = isModifier
    ? [posToRowCol(hoveredPos)]
    : (region?.cells ?? [posToRowCol(hoveredPos)])

  const label = isModifier ? 'Modifier locus' : (region?.label ?? regionId)
  const description = isModifier ? MODIFIER_DESCRIPTION : (region?.description ?? '')
  const traits = isModifier ? MODIFIER_TRAITS : (region?.traits ?? [])
  const colorVar = isModifier ? '#71717a' : (region?.colorVar ?? '#71717a')

  return (
    <div
      className="rounded-md border bg-[var(--color-panel)] p-3"
      style={{ borderColor: colorVar }}
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-sm font-medium" style={{ color: colorVar }}>
          {label}
        </h3>
        <span className="text-[10px] text-[var(--color-dim)]">
          {isModifier ? `cell ${posToRowCol(hoveredPos)[0]},${posToRowCol(hoveredPos)[1]}` : `${cells.length} cell${cells.length === 1 ? '' : 's'}`}
        </span>
        <ul className="ml-auto flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[var(--color-muted)]">
          {traits.map((t) => (
            <li
              key={t}
              className="rounded border px-1.5 py-px"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text)]">{description}</p>
      <div className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-2">
        {renderRow('Mother', mother, cells, '#f9a8d4')}
        {renderRow('Father', father, cells, '#93c5fd')}
        {renderRow('Child', child, cells, '#e4e4e7')}
      </div>
      {!isModifier && (
        <p className="mt-2 text-[10px] text-[var(--color-dim)]">
          Bordered cells with a 2-pixel ring are dominant alleles (≥ 8). Subscript chars in a
          cell's bottom-right corner are hidden recessive carriers — they don't express but pass to
          offspring.
        </p>
      )}
    </div>
  )
}
