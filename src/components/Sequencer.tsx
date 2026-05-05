import { useEffect, useMemo, useState } from 'react'
import { GENOME_LENGTH, hammingDistance } from '@/engine/genome'
import type { BreedingResult, Plant } from '@/engine/types'
import { GradeBadge } from './GradeBadge'
import { ParentChip } from './ParentChip'
import { SequencerStrand } from './SequencerStrand'

const REVEAL_PER_CELL_MS = 22
const TOTAL_REVEAL_MS = GENOME_LENGTH * REVEAL_PER_CELL_MS
const TRANSITION_DELAY_MS = 600

type Props = {
  mother: Plant | null
  father: Plant | null
  plants: Plant[]
  litterSize: number
  pendingResult: BreedingResult | null
  onBreed: () => void
  onComplete: () => void
  onSelectParent: (plantId: string, role: 'mother' | 'father') => void
  onClearParent: (role: 'mother' | 'father') => void
}

export const Sequencer = ({
  mother,
  father,
  plants,
  litterSize,
  pendingResult,
  onBreed,
  onComplete,
  onSelectParent,
  onClearParent,
}: Props) => {
  const [revealedCells, setRevealedCells] = useState(GENOME_LENGTH)
  const [scanActive, setScanActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'complete'>('idle')

  useEffect(() => {
    if (!pendingResult) return
    setRevealedCells(0)
    setScanActive(true)
    setPhase('scanning')

    const interval = setInterval(() => {
      setRevealedCells((n) => {
        const next = n + 1
        if (next >= GENOME_LENGTH) {
          clearInterval(interval)
        }
        return Math.min(GENOME_LENGTH, next)
      })
    }, REVEAL_PER_CELL_MS)

    const completeAt = setTimeout(() => {
      setPhase('complete')
      setScanActive(false)
    }, TOTAL_REVEAL_MS)

    const transitionAt = setTimeout(() => {
      onComplete()
    }, TOTAL_REVEAL_MS + TRANSITION_DELAY_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(completeAt)
      clearTimeout(transitionAt)
    }
  }, [pendingResult, onComplete])

  const motherGenome = pendingResult?.motherVariant ?? mother?.genome ?? null
  const fatherGenome = pendingResult?.fatherGenome ?? father?.genome ?? null
  const offspring = pendingResult?.child ?? null

  const distance = useMemo(() => {
    if (!motherGenome || !fatherGenome) return null
    return hammingDistance(motherGenome, fatherGenome)
  }, [motherGenome, fatherGenome])

  return (
    <div className="relative mx-auto max-w-[1100px] px-6 py-10">
      <div className="space-y-10">
        {/* Parent A */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <ParentChip
              plant={mother}
              plants={plants}
              role="mother"
              onChange={(id) => onSelectParent(id, 'mother')}
              onClear={() => onClearParent('mother')}
            />
            {mother && (
              <span className="text-[10px] tracking-[0.25em] text-[var(--color-dim)] uppercase">
                gen {mother.generation} · res {mother.resilience}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            {motherGenome ? (
              <SequencerStrand
                genome={motherGenome}
                diffAgainst={offspring?.genome}
                diffPosition="bottom"
                revealedCells={revealedCells}
                cellWidth={14}
                cellHeight={32}
              />
            ) : (
              <div className="h-[32px] rounded border border-dashed border-[var(--color-border)]" />
            )}
          </div>
        </div>

        {/* Offspring */}
        <div className="relative">
          <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.2em]">
            <span className="text-[var(--color-text)]">Offspring</span>
            <span
              className={`text-[var(--color-amber)] ${
                phase === 'scanning' ? 'animate-amber-pulse' : ''
              }`}
            >
              {phase === 'scanning'
                ? '▌ Scanning…'
                : phase === 'complete'
                  ? '◯ Match resolved'
                  : '◯ Awaiting sequence'}
            </span>
          </div>
          <div className="relative overflow-x-auto">
            {offspring ? (
              <SequencerStrand
                genome={offspring.genome}
                revealedCells={revealedCells}
                cellWidth={14}
                cellHeight={48}
              />
            ) : (
              <div className="flex h-[48px] items-center justify-center rounded border border-dashed border-[var(--color-border)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-dim)]">
                Awaiting parents
              </div>
            )}
            {scanActive && (
              <div
                key={pendingResult?.child.id}
                className="animate-scan-sweep pointer-events-none absolute top-0 bottom-0 z-10"
                style={{
                  width: 2,
                  background:
                    'linear-gradient(to bottom, transparent, var(--color-amber), transparent)',
                  boxShadow: '0 0 12px 2px rgba(251,191,36,0.6)',
                }}
              />
            )}
          </div>
        </div>

        {/* Parent B */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <ParentChip
              plant={father}
              plants={plants}
              role="father"
              onChange={(id) => onSelectParent(id, 'father')}
              onClear={() => onClearParent('father')}
            />
            {father && (
              <span className="text-[10px] tracking-[0.25em] text-[var(--color-dim)] uppercase">
                gen {father.generation} · res {father.resilience}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            {fatherGenome ? (
              <SequencerStrand
                genome={fatherGenome}
                diffAgainst={offspring?.genome}
                diffPosition="top"
                revealedCells={revealedCells}
                cellWidth={14}
                cellHeight={32}
              />
            ) : (
              <div className="h-[32px] rounded border border-dashed border-[var(--color-border)]" />
            )}
          </div>
        </div>
      </div>

      {/* Outcome */}
      <div className="mt-10 flex flex-col items-center gap-3">
        {offspring && phase === 'complete' && (
          <div
            key={offspring.id}
            className="animate-grade-rise flex flex-col items-center"
          >
            <GradeBadge resilience={offspring.resilience} size="lg" />
            <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-[var(--color-muted)]">
              {litterSize} seeds · gen {offspring.generation}
              {distance !== null && ` · Hamming ${distance}`}
            </div>
          </div>
        )}
        {!offspring && (
          <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-dim)]">
            Pair two parents in the drawer to enable a sequence run.
          </div>
        )}
        <button
          type="button"
          onClick={onBreed}
          disabled={!mother || !father || phase === 'scanning'}
          className="mt-4 rounded border border-[var(--color-amber)]/60 bg-transparent px-8 py-2 text-[13px] tracking-[0.4em] text-[var(--color-amber)] uppercase transition-colors hover:bg-[var(--color-amber)]/10 disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:text-[var(--color-dim)] disabled:hover:bg-transparent"
        >
          {phase === 'scanning'
            ? 'Scanning…'
            : pendingResult
              ? 'Run another sequence'
              : `Run sequence${litterSize > 0 ? ` · ${litterSize} seeds` : ''}`}
        </button>
      </div>
    </div>
  )
}
