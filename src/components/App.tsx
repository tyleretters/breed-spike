import { useCallback, useEffect, useMemo, useState } from 'react'
import { breed } from '@/engine/breed'
import { createFounderFromString, seedKnownAlleles } from '@/engine/lineage'
import type { BreedingResult, Plant } from '@/engine/types'
import type { BreedingConfig } from '@/engine/types'
import { Backpack } from './Backpack'
import { BreedingPanel } from './BreedingPanel'
import { Controls } from './Controls'
import { EventFrequencyPanel } from './EventFrequencyPanel'
import { LineageGraph } from './LineageGraph'
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

const newLitterId = () => `litter-${Math.random().toString(36).slice(2, 9)}`

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
  const [lastLitter, setLastLitter] = useState<BreedingResult[]>([])
  const [inspectedPlantId, setInspectedPlantId] = useState<string | null>(null)
  const [pedigreeRootId, setPedigreeRootId] = useState<string | null>(null)

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

  const mother = useMemo(
    () => plants.find((p) => p.id === selectedMotherId) ?? null,
    [plants, selectedMotherId],
  )
  const father = useMemo(
    () => plants.find((p) => p.id === selectedFatherId) ?? null,
    [plants, selectedFatherId],
  )

  const litterSize = mother?.seedCount ?? 0

  const handleBreed = useCallback(() => {
    if (!mother || !father || litterSize <= 0) return

    const knownNext = new Set(knownAlleles)
    const litterId = newLitterId()
    const results: BreedingResult[] = []

    for (let i = 0; i < litterSize; i++) {
      const result = breed(mother, father, config, knownNext)
      result.child.litterId = litterId
      results.push(result)
    }

    const aggregate = results.flatMap((r) => r.child.events)
    setTotals((prev) => ({
      missense: prev.missense + aggregate.filter((e) => e.type === 'missense').length,
      nonsense: prev.nonsense + aggregate.filter((e) => e.type === 'nonsense').length,
      denovo: prev.denovo + aggregate.filter((e) => e.type === 'denovo').length,
      retro: prev.retro + aggregate.filter((e) => e.type === 'retrotransposon').length,
      denovoFirsts:
        prev.denovoFirsts +
        aggregate.filter((e) => e.type === 'denovo' && e.firstOccurrence).length,
      breedings: prev.breedings + 1,
    }))
    setKnownAlleles(knownNext)
    setPlants((prev) => [...prev, ...results.map((r) => r.child)])
    setLastLitter(results)
    setInspectedPlantId(results[0]?.child.id ?? null)
  }, [mother, father, litterSize, config, knownAlleles])

  const handleInspect = useCallback((plantId: string) => {
    setInspectedPlantId(plantId)
  }, [])

  const handlePlant = useCallback((plantId: string) => {
    setPlants((prev) => prev.map((p) => (p.id === plantId ? { ...p, planted: true } : p)))
  }, [])

  const handleDiscard = useCallback(
    (plantId: string) => {
      setPlants((prev) => prev.filter((p) => p.id !== plantId))
      setLastLitter((prev) => prev.filter((r) => r.child.id !== plantId))
      setInspectedPlantId((prev) => (prev === plantId ? null : prev))
    },
    [],
  )

  const inspectedPlant = useMemo(
    () => plants.find((p) => p.id === inspectedPlantId) ?? null,
    [plants, inspectedPlantId],
  )
  const inspectedResult = useMemo(
    () => lastLitter.find((r) => r.child.id === inspectedPlantId) ?? null,
    [lastLitter, inspectedPlantId],
  )

  const pedigreeRoot = useMemo(
    () => plants.find((p) => p.id === pedigreeRootId) ?? null,
    [plants, pedigreeRootId],
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
          {pedigreeRoot ? (
            <LineageGraph
              rootPlant={pedigreeRoot}
              plants={plants}
              onSelectPlant={(id) => setPedigreeRootId(id)}
              onClose={() => setPedigreeRootId(null)}
            />
          ) : (
            <BreedingPanel
              mother={mother}
              father={father}
              inspectedPlant={inspectedPlant}
              inspectedResult={inspectedResult}
              litterSize={litterSize}
              onBreed={handleBreed}
            />
          )}
        </main>
        <aside className="space-y-4">
          <Controls
            stress={config.stress}
            onStressChange={(stress) => setConfig((c) => ({ ...c, stress }))}
            mosaicEnabled={config.mosaicEnabled}
            onMosaicToggle={(mosaicEnabled) => setConfig((c) => ({ ...c, mosaicEnabled }))}
          />
          <EventFrequencyPanel totals={totals} />
          <Backpack
            plants={plants}
            onPlant={handlePlant}
            onDiscard={handleDiscard}
            onInspect={handleInspect}
            inspectedPlantId={inspectedPlantId}
            onView={(id) => setPedigreeRootId(id)}
          />
          <LineagePanel
            plants={plants}
            selectedMotherId={selectedMotherId}
            selectedFatherId={selectedFatherId}
            onSelect={handleSelect}
            onClear={handleClear}
            onView={(id) => setPedigreeRootId(id)}
          />
          <NewFounderForm onCreate={handleAddFounder} />
        </aside>
      </div>
    </div>
  )
}
