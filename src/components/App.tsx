import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFounderFromString, seedKnownAlleles } from '@/engine/lineage'
import type { BreedingConfig, BreedingResult, Plant } from '@/engine/types'
import { BreedingPanel } from './BreedingPanel'
import { Controls } from './Controls'
import { EventFrequencyPanel } from './EventFrequencyPanel'
import { LineagePanel } from './LineagePanel'
import { NewFounderForm } from './NewFounderForm'
import { RegionLegend } from './RegionLegend'

type Totals = {
  missense: number
  nonsense: number
  denovo: number
  retro: number
  denovoFirsts: number
  breedings: number
}

const DEFAULT_FOUNDERS: Array<{ label: string; source: string }> = [
  { label: 'Parent A', source: 'revery prairie clover #001' },
  { label: 'Parent B', source: 'revery prairie clover #002' },
]

export const App = () => {
  const [plants, setPlants] = useState<Plant[]>([])
  const [knownAlleles, setKnownAlleles] = useState<Set<string>>(() => new Set())
  const [selectedMotherId, setSelectedMotherId] = useState<string | null>(null)
  const [selectedFatherId, setSelectedFatherId] = useState<string | null>(null)
  const [config, setConfig] = useState<BreedingConfig>({ stress: 0.2, mosaicEnabled: true })
  const [totals, setTotals] = useState<Totals>({
    missense: 0,
    nonsense: 0,
    denovo: 0,
    retro: 0,
    denovoFirsts: 0,
    breedings: 0,
  })

  useEffect(() => {
    let cancelled = false
    const setupDefaults = async () => {
      const founders = await Promise.all(
        DEFAULT_FOUNDERS.map((f) => createFounderFromString(f.label, f.source)),
      )
      if (cancelled) return
      setPlants(founders)
      setKnownAlleles(seedKnownAlleles(founders))
      setSelectedMotherId(founders[0]?.id ?? null)
      setSelectedFatherId(founders[1]?.id ?? null)
    }
    void setupDefaults()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddFounder = useCallback(async (label: string, source: string) => {
    const plant = await createFounderFromString(label, source)
    setPlants((prev) => [...prev, plant])
    setKnownAlleles((prev) => {
      const next = new Set(prev)
      seedKnownAlleles([plant]).forEach((k) => next.add(k))
      return next
    })
  }, [])

  const handleSelect = useCallback((plantId: string, role: 'mother' | 'father') => {
    if (role === 'mother') {
      setSelectedMotherId(plantId)
      setSelectedFatherId((prev) => (prev === plantId ? null : prev))
    } else {
      setSelectedFatherId(plantId)
      setSelectedMotherId((prev) => (prev === plantId ? null : prev))
    }
  }, [])

  const handleClear = useCallback((role: 'mother' | 'father') => {
    if (role === 'mother') setSelectedMotherId(null)
    else setSelectedFatherId(null)
  }, [])

  const handleChild = useCallback((result: BreedingResult) => {
    setPlants((prev) => [...prev, result.child])
    const events = result.child.events
    setTotals((prev) => ({
      missense: prev.missense + events.filter((e) => e.type === 'missense').length,
      nonsense: prev.nonsense + events.filter((e) => e.type === 'nonsense').length,
      denovo: prev.denovo + events.filter((e) => e.type === 'denovo').length,
      retro: prev.retro + events.filter((e) => e.type === 'retrotransposon').length,
      denovoFirsts:
        prev.denovoFirsts +
        events.filter((e) => e.type === 'denovo' && e.firstOccurrence).length,
      breedings: prev.breedings + 1,
    }))
  }, [])

  const mother = useMemo(
    () => plants.find((p) => p.id === selectedMotherId) ?? null,
    [plants, selectedMotherId],
  )
  const father = useMemo(
    () => plants.find((p) => p.id === selectedFatherId) ?? null,
    [plants, selectedFatherId],
  )

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-6">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Breed-spike</h1>
          <p className="text-xs text-[var(--color-muted)]">
            8×8 SHA256 genome · dominance, mutation, maternal mosaicism, retrotransposons
          </p>
        </div>
        <RegionLegend />
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <main className="space-y-5">
          <BreedingPanel
            mother={mother}
            father={father}
            config={config}
            knownAlleles={knownAlleles}
            onChild={handleChild}
          />
        </main>
        <aside className="space-y-4">
          <Controls
            stress={config.stress}
            onStressChange={(stress) => setConfig((c) => ({ ...c, stress }))}
            mosaicEnabled={config.mosaicEnabled}
            onMosaicToggle={(mosaicEnabled) => setConfig((c) => ({ ...c, mosaicEnabled }))}
          />
          <EventFrequencyPanel totals={totals} />
          <LineagePanel
            plants={plants}
            selectedMotherId={selectedMotherId}
            selectedFatherId={selectedFatherId}
            onSelect={handleSelect}
            onClear={handleClear}
          />
          <NewFounderForm onCreate={handleAddFounder} />
        </aside>
      </div>
    </div>
  )
}
