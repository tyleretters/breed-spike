import { useState } from 'react'
import { GENOME_LENGTH, isDominant, nibbleAt, nibbleValue, posToRowCol } from '@/engine/genome'
import { gradeColor, gradeFromResilience } from '@/engine/grading'
import { regionAtPos, regionById, REGIONS } from '@/engine/regions'
import type { Plant, RegionId } from '@/engine/types'
import { RegionDetail } from './RegionDetail'

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
  const lightness = 8 + value * 3.5
  if (hue === null) return `hsl(0 0% ${lightness}%)`
  return `hsl(${hue} 42% ${lightness + 6}%)`
}

type Props = {
  specimen: Plant
  siblings: Plant[]
  mother: Plant | null
  father: Plant | null
  onSelectSibling: (plantId: string) => void
  onPlant: (plantId: string) => void
  onDiscard: (plantId: string) => void
  onPedigree: (plantId: string) => void
  onBreedAgain: () => void
}

export const SpecimenViewer = ({
  specimen,
  siblings,
  mother,
  father,
  onSelectSibling,
  onPlant,
  onDiscard,
  onPedigree,
  onBreedAgain,
}: Props) => {
  const [magnifiedRegion, setMagnifiedRegion] = useState<RegionId | null>(null)
  const [hoveredPos, setHoveredPos] = useState<number | null>(null)

  const grade = gradeFromResilience(specimen.resilience)
  const color = gradeColor(grade)
  const motherGrade = mother ? gradeFromResilience(mother.resilience) : null
  const fatherGrade = father ? gradeFromResilience(father.resilience) : null

  const handleRegionClick = (pos: number) => {
    const region = regionAtPos(pos)
    setMagnifiedRegion(region)
  }

  const cellSize = 48

  return (
    <div className="relative mx-auto max-w-[1100px] px-6 py-10">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-amber)]">
          From
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 text-[12px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
          <span>{mother?.label ?? 'unknown'}</span>
          {motherGrade && (
            <span className="rounded border border-[var(--color-border)] px-1 text-[10px]">
              {motherGrade}
            </span>
          )}
          <span className="text-[var(--color-dim)]">×</span>
          <span>{father?.label ?? 'unknown'}</span>
          {fatherGrade && (
            <span className="rounded border border-[var(--color-border)] px-1 text-[10px]">
              {fatherGrade}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <div
          className="relative inline-grid gap-[3px] rounded-md p-3"
          style={{
            gridTemplateColumns: `repeat(8, ${cellSize}px)`,
            gridAutoRows: `${cellSize}px`,
            backgroundColor: 'var(--color-panel-2)',
            border: `1px solid ${color}33`,
            boxShadow: `0 0 60px ${color}1a`,
          }}
        >
          {Array.from({ length: GENOME_LENGTH }, (_, pos) => {
            const value = nibbleValue(nibbleAt(specimen.genome, pos))
            const region = regionAtPos(pos)
            const dom = isDominant(nibbleAt(specimen.genome, pos))
            const inMagnified = magnifiedRegion !== null && region === magnifiedRegion
            const isHovered = hoveredPos !== null && regionAtPos(hoveredPos) === region
            return (
              <button
                key={pos}
                type="button"
                onClick={() => handleRegionClick(pos)}
                onMouseEnter={() => setHoveredPos(pos)}
                onMouseLeave={() => setHoveredPos(null)}
                style={{
                  backgroundColor: cellBackground(region, value),
                  border: dom
                    ? '1.5px solid rgba(255,255,255,0.18)'
                    : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  outline: inMagnified
                    ? '2px solid var(--color-amber)'
                    : isHovered
                      ? '1px solid rgba(251,191,36,0.5)'
                      : 'none',
                  outlineOffset: -2,
                  transition: 'outline 120ms ease-out, transform 120ms ease-out',
                }}
                title={`${region} (${posToRowCol(pos)[0]},${posToRowCol(pos)[1]}) — click to magnify`}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div
          key={specimen.id}
          className="animate-grade-rise text-[80px] leading-none font-bold"
          style={{ color }}
        >
          {grade}
        </div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.4em] text-[var(--color-muted)]">
          {specimen.label} · res {specimen.resilience}
        </div>
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-dim)]">
          {specimen.seedCount} seeds (next litter)
        </div>
      </div>

      {siblings.length > 1 && (
        <div className="mt-8">
          <div className="mb-2 text-center text-[10px] uppercase tracking-[0.4em] text-[var(--color-dim)]">
            Litter · {siblings.length} offspring
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {siblings.map((sibling) => {
              const sibGrade = gradeFromResilience(sibling.resilience)
              const sibColor = gradeColor(sibGrade)
              const isCurrent = sibling.id === specimen.id
              return (
                <button
                  key={sibling.id}
                  type="button"
                  onClick={() => onSelectSibling(sibling.id)}
                  className="flex flex-col items-center gap-1 rounded border px-2 py-1.5 transition-colors"
                  style={{
                    borderColor: isCurrent ? sibColor : 'var(--color-border)',
                    backgroundColor: isCurrent ? `${sibColor}1a` : 'transparent',
                  }}
                  title={`${sibling.label} · res ${sibling.resilience}`}
                >
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: sibColor }}
                  />
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isCurrent ? sibColor : 'var(--color-muted)' }}
                  >
                    {sibGrade}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {!specimen.planted && (
          <>
            <button
              type="button"
              onClick={() => onPlant(specimen.id)}
              className="rounded border border-emerald-500/60 px-5 py-1.5 text-[11px] tracking-[0.3em] text-emerald-300 uppercase hover:bg-emerald-500/10"
            >
              Plant
            </button>
            <button
              type="button"
              onClick={() => onDiscard(specimen.id)}
              className="rounded border border-[var(--color-border)] px-5 py-1.5 text-[11px] tracking-[0.3em] text-[var(--color-muted)] uppercase hover:border-rose-500/40 hover:text-rose-300"
            >
              Discard
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onPedigree(specimen.id)}
          className="rounded border border-[var(--color-border)] px-5 py-1.5 text-[11px] tracking-[0.3em] text-[var(--color-muted)] uppercase hover:border-[var(--color-border-bright)] hover:text-[var(--color-text)]"
        >
          Pedigree
        </button>
        <button
          type="button"
          onClick={onBreedAgain}
          className="rounded border border-[var(--color-amber)]/60 px-5 py-1.5 text-[11px] tracking-[0.3em] text-[var(--color-amber)] uppercase hover:bg-[var(--color-amber)]/10"
        >
          ← Run another sequence
        </button>
      </div>

      {magnifiedRegion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          onClick={() => setMagnifiedRegion(null)}
        >
          <div
            className="max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <RegionDetail
              hoveredPos={
                regionById(magnifiedRegion)?.cells[0]
                  ? regionById(magnifiedRegion)!.cells[0][0] * 8 +
                    regionById(magnifiedRegion)!.cells[0][1]
                  : (REGIONS.find((r) => r.id === magnifiedRegion)?.cells[0]
                      ? REGIONS.find((r) => r.id === magnifiedRegion)!.cells[0][0] * 8 +
                        REGIONS.find((r) => r.id === magnifiedRegion)!.cells[0][1]
                      : null)
              }
              mother={mother}
              father={father}
              child={specimen}
            />
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setMagnifiedRegion(null)}
                className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-dim)] hover:text-[var(--color-text)]"
              >
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
