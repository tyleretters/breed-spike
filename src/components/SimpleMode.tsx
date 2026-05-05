import { useEffect, useState } from 'react'
import type { BreedingConfig, BreedingResult, Plant } from '@/engine/types'
import { Sequencer } from './Sequencer'
import { SimpleDrawer } from './SimpleDrawer'
import { SpecimenViewer } from './SpecimenViewer'

type Totals = {
  missense: number
  nonsense: number
  denovo: number
  retro: number
  denovoFirsts: number
  breedings: number
}

type Props = {
  plants: Plant[]
  mother: Plant | null
  father: Plant | null
  config: BreedingConfig
  totals: Totals
  litterSize: number
  lastLitter: BreedingResult[]
  inspectedPlant: Plant | null
  inspectedPlantId: string | null
  selectedMotherId: string | null
  selectedFatherId: string | null
  onBreed: () => void
  onPlant: (plantId: string) => void
  onDiscard: (plantId: string) => void
  onInspect: (plantId: string) => void
  onSelect: (plantId: string, role: 'mother' | 'father') => void
  onClear: (role: 'mother' | 'father') => void
  onView: (plantId: string) => void
  onAddFounder: (label: string, source: string) => void
  onStressChange: (next: number) => void
  onMosaicToggle: (next: boolean) => void
}

export const SimpleMode = ({
  plants,
  mother,
  father,
  config,
  totals,
  litterSize,
  lastLitter,
  inspectedPlant,
  inspectedPlantId,
  selectedMotherId,
  selectedFatherId,
  onBreed,
  onPlant,
  onDiscard,
  onInspect,
  onSelect,
  onClear,
  onView,
  onAddFounder,
  onStressChange,
  onMosaicToggle,
}: Props) => {
  const [view, setView] = useState<'sequencer' | 'specimen'>('sequencer')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pendingResult, setPendingResult] = useState<BreedingResult | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isEditable) return
      if (e.key === ']') {
        e.preventDefault()
        setDrawerOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // When a fresh litter comes in (lastLitter changes & we're in sequencer), play the scan.
  useEffect(() => {
    if (lastLitter.length === 0) {
      setPendingResult(null)
      return
    }
    if (view !== 'sequencer') return
    const first = lastLitter[0] ?? null
    setPendingResult(first)
  }, [lastLitter, view])

  const handleBreedClick = () => {
    setView('sequencer')
    setPendingResult(null)
    onBreed()
  }

  const handleSequencerComplete = () => {
    setView('specimen')
  }

  const siblings = lastLitter.map((r) => r.child)

  return (
    <div className="relative min-h-[calc(100vh-100px)]">
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed top-1/2 right-0 z-20 -translate-y-1/2 rotate-180 rounded-l border border-r-0 border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-3 text-[10px] tracking-[0.3em] text-[var(--color-muted)] uppercase hover:text-[var(--color-amber)]"
        style={{ writingMode: 'vertical-rl' }}
        title="Open library (])"
      >
        ‹ library · ]
      </button>

      {view === 'sequencer' || !inspectedPlant ? (
        <Sequencer
          mother={mother}
          father={father}
          litterSize={litterSize}
          pendingResult={pendingResult}
          onBreed={handleBreedClick}
          onComplete={handleSequencerComplete}
        />
      ) : (
        <SpecimenViewer
          specimen={inspectedPlant}
          siblings={siblings.length > 0 ? siblings : [inspectedPlant]}
          mother={mother}
          father={father}
          onSelectSibling={onInspect}
          onPlant={onPlant}
          onDiscard={onDiscard}
          onPedigree={onView}
          onBreedAgain={() => {
            setView('sequencer')
            setPendingResult(null)
          }}
        />
      )}

      <SimpleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        plants={plants}
        selectedMotherId={selectedMotherId}
        selectedFatherId={selectedFatherId}
        config={config}
        totals={totals}
        inspectedPlantId={inspectedPlantId}
        onSelect={onSelect}
        onClear={onClear}
        onPlant={onPlant}
        onDiscard={onDiscard}
        onInspect={onInspect}
        onView={onView}
        onAddFounder={onAddFounder}
        onStressChange={onStressChange}
        onMosaicToggle={onMosaicToggle}
      />
    </div>
  )
}
