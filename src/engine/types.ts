export type Genome = string

export type RegionId = 'root' | 'canopy' | 'flowering' | 'seed' | 'pest' | 'modifier'

export type Region = {
  id: RegionId
  label: string
  description: string
  traits: string[]
  cells: Array<[number, number]>
  colorVar: string
}

export type BreedEvent =
  | { type: 'missense'; pos: number; from: string; to: string }
  | { type: 'nonsense'; pos: number; from: string }
  | { type: 'denovo'; pos: number; from: string; to: string; firstOccurrence: boolean; regionId: RegionId }
  | {
      type: 'retrotransposon'
      sourceCells: Array<[number, number]>
      targetCells: Array<[number, number]>
      sourceRegion: RegionId
      targetRegion: RegionId
    }

export type CellSource = 'A' | 'B' | 'mutation'

export type CellResolution = {
  pos: number
  row: number
  col: number
  aNibble: string
  bNibble: string
  aDominant: boolean
  bDominant: boolean
  expressed: string
  source: CellSource
  carrier: string | null
  event: BreedEvent | null
}

export type Plant = {
  id: string
  label: string
  genome: Genome
  parents: { mother: string; father: string } | null
  generation: number
  events: BreedEvent[]
  resilience: number
  seedCount: number
  carriers: Record<number, string>
  createdAt: number
}

export type StressLevel = number

export type BreedingConfig = {
  stress: StressLevel
  mosaicEnabled: boolean
}

export type BreedingResult = {
  child: Plant
  resolution: CellResolution[]
  motherVariant: Genome
  fatherGenome: Genome
}
