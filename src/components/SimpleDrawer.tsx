import { useEffect, useState } from 'react'
import type { BreedingConfig, Plant } from '@/engine/types'
import { Backpack } from './Backpack'
import { Controls } from './Controls'
import { EventFrequencyPanel } from './EventFrequencyPanel'
import { LineagePanel } from './LineagePanel'
import { NewFounderForm } from './NewFounderForm'

type Totals = {
  missense: number
  nonsense: number
  denovo: number
  retro: number
  denovoFirsts: number
  breedings: number
}

type Props = {
  open: boolean
  onClose: () => void
  plants: Plant[]
  selectedMotherId: string | null
  selectedFatherId: string | null
  config: BreedingConfig
  totals: Totals
  inspectedPlantId: string | null
  onSelect: (plantId: string, role: 'mother' | 'father') => void
  onClear: (role: 'mother' | 'father') => void
  onPlant: (plantId: string) => void
  onDiscard: (plantId: string) => void
  onInspect: (plantId: string) => void
  onView: (plantId: string) => void
  onAddFounder: (label: string, source: string) => void
  onStressChange: (next: number) => void
  onMosaicToggle: (next: boolean) => void
}

const Section = ({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[11px] tracking-[0.25em] text-[var(--color-muted)] uppercase hover:text-[var(--color-text)]"
      >
        <span>{title}</span>
        <span className="text-[var(--color-dim)]">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

export const SimpleDrawer = ({
  open,
  onClose,
  plants,
  selectedMotherId,
  selectedFatherId,
  config,
  totals,
  inspectedPlantId,
  onSelect,
  onClear,
  onPlant,
  onDiscard,
  onInspect,
  onView,
  onAddFounder,
  onStressChange,
  onMosaicToggle,
}: Props) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isEditable) return
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-40 flex h-full w-[360px] flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl"
        style={{ animation: 'drawer-slide-in 220ms ease-out' }}
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-[11px] tracking-[0.3em] text-[var(--color-amber)] uppercase">
            Library
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] tracking-[0.25em] text-[var(--color-muted)] uppercase hover:text-[var(--color-text)]"
          >
            close · esc
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          <Section title="Backpack" defaultOpen>
            <Backpack
              plants={plants}
              onPlant={onPlant}
              onDiscard={onDiscard}
              onInspect={onInspect}
              inspectedPlantId={inspectedPlantId}
              onView={onView}
            />
          </Section>
          <Section title="Planted Lineage" defaultOpen>
            <LineagePanel
              plants={plants}
              selectedMotherId={selectedMotherId}
              selectedFatherId={selectedFatherId}
              onSelect={onSelect}
              onClear={onClear}
              onView={onView}
            />
          </Section>
          <Section title="Environment & Mosaic">
            <Controls
              stress={config.stress}
              onStressChange={onStressChange}
              mosaicEnabled={config.mosaicEnabled}
              onMosaicToggle={onMosaicToggle}
            />
          </Section>
          <Section title="Cumulative Events">
            <EventFrequencyPanel totals={totals} />
          </Section>
          <Section title="Spawn Founder">
            <NewFounderForm onCreate={onAddFounder} />
          </Section>
        </div>
      </aside>
    </>
  )
}
