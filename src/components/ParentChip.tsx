import { useEffect, useRef, useState } from 'react'
import { gradeColor, gradeFromResilience } from '@/engine/grading'
import type { Plant } from '@/engine/types'

type Role = 'mother' | 'father'

type Props = {
  plant: Plant | null
  plants: Plant[]
  role: Role
  onChange: (plantId: string) => void
  onClear?: () => void
}

const sortByGrade = (a: Plant, b: Plant): number => {
  if (b.resilience !== a.resilience) return b.resilience - a.resilience
  return b.createdAt - a.createdAt
}

export const ParentChip = ({ plant, plants, role, onChange, onClear }: Props) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleClickAway)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClickAway)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const planted = plants.filter((p) => p.planted)
  const grade = plant ? gradeFromResilience(plant.resilience) : null
  const color = grade ? gradeColor(grade) : 'var(--color-dim)'
  const accent = role === 'mother' ? '#f9a8d4' : '#93c5fd'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1 text-[11px] tracking-[0.15em] uppercase transition-colors hover:border-[var(--color-amber)]/60"
        title={`Click to change ${role}`}
      >
        <span className="text-[10px]" style={{ color: accent }}>
          {role}
        </span>
        {plant ? (
          <>
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold"
              style={{
                color,
                backgroundColor: `${color}1f`,
                border: `1px solid ${color}66`,
              }}
            >
              {grade}
            </span>
            <span className="text-[var(--color-text)]">{plant.label}</span>
          </>
        ) : (
          <span className="text-[var(--color-dim)]">none — pick</span>
        )}
        <span className="text-[var(--color-dim)]">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 w-[260px] rounded-md border border-[var(--color-border-bright)] bg-[var(--color-panel)] p-1 shadow-lg"
        >
          <div className="px-2 py-1 text-[9px] tracking-[0.3em] text-[var(--color-dim)] uppercase">
            Set as {role} ·{' '}
            <span className="text-[var(--color-muted)]">
              sorted by grade
            </span>
          </div>
          {planted.length === 0 ? (
            <div className="px-2 py-2 text-[11px] italic text-[var(--color-dim)]">
              No planted specimens. Plant a seed first.
            </div>
          ) : (
            <ul className="max-h-[280px] overflow-y-auto">
              {[...planted].sort(sortByGrade).map((p) => {
                const g = gradeFromResilience(p.resilience)
                const c = gradeColor(g)
                const isCurrent = p.id === plant?.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(p.id)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                        isCurrent
                          ? 'bg-[var(--color-panel-2)]'
                          : 'hover:bg-[var(--color-panel-2)]'
                      }`}
                    >
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                        style={{
                          color: c,
                          backgroundColor: `${c}1f`,
                          border: `1px solid ${c}66`,
                        }}
                      >
                        {g}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px]">
                        {p.label}
                      </span>
                      <span className="text-[10px] text-[var(--color-dim)]">
                        gen {p.generation}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {onClear && plant && (
            <div className="mt-1 border-t border-[var(--color-border)] pt-1">
              <button
                type="button"
                onClick={() => {
                  onClear()
                  setOpen(false)
                }}
                className="w-full rounded px-2 py-1 text-left text-[10px] tracking-[0.25em] text-[var(--color-dim)] uppercase hover:text-rose-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
