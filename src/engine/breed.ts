import {
  GENOME_LENGTH,
  hammingDistance,
  isDominant,
  nibbleAt,
  nibbleValue,
  popcountHex,
  posToRowCol,
  replaceNibble,
  rowColToPos,
} from './genome'
import { sampleMosaicVariant } from './mosaic'
import {
  baseMutationRates,
  rollDeNovoNibble,
  rollMissense,
  tryRetrotransposon,
} from './mutations'
import { regionAtPos } from './regions'
import type {
  BreedEvent,
  BreedingConfig,
  BreedingResult,
  CellResolution,
  CellSource,
  Genome,
  Plant,
} from './types'

const newId = (): string => Math.random().toString(36).slice(2, 10)

const resolveCell = (
  pos: number,
  motherGenome: Genome,
  fatherGenome: Genome,
): { expressed: string; source: CellSource; carrier: string | null; aDom: boolean; bDom: boolean; a: string; b: string } => {
  const a = nibbleAt(motherGenome, pos)
  const b = nibbleAt(fatherGenome, pos)
  const aDom = isDominant(a)
  const bDom = isDominant(b)

  if (aDom && bDom) {
    const aV = nibbleValue(a)
    const bV = nibbleValue(b)
    const expressed = aV >= bV ? a : b
    const source: CellSource = aV >= bV ? 'A' : 'B'
    return { expressed, source, carrier: null, aDom, bDom, a, b }
  }

  if (aDom && !bDom) return { expressed: a, source: 'A', carrier: b, aDom, bDom, a, b }
  if (!aDom && bDom) return { expressed: b, source: 'B', carrier: a, aDom, bDom, a, b }

  const aV = nibbleValue(a)
  const bV = nibbleValue(b)
  const expressed = aV >= bV ? a : b
  const source: CellSource = aV >= bV ? 'A' : 'B'
  return { expressed, source, carrier: null, aDom, bDom, a, b }
}

// Offspring baseline 10.5 (not 7.5) because dominance always selects the higher
// allele at each cell — the expected per-cell value of a random cross is ~10.25,
// not the raw 7.5 you'd get from a uniform [0,15] sample. Without this shift,
// every offspring scores +175 from the math alone and lands in S.
const computeResilience = (genome: Genome, carriers: Record<number, string>): number => {
  let score = 0
  for (let i = 0; i < GENOME_LENGTH; i++) {
    const v = nibbleValue(nibbleAt(genome, i))
    score += v - 10.5
  }
  for (const carrierVal of Object.values(carriers)) {
    if (nibbleValue(carrierVal) <= 2) score -= 0.5
  }
  return Math.round(score)
}

const computeSeedCount = (genome: Genome): number => {
  let total = 0
  for (let r = 6; r <= 7; r++) {
    for (let c = 0; c <= 1; c++) {
      total += nibbleValue(nibbleAt(genome, rowColToPos(r, c)))
    }
  }
  return Math.max(1, Math.round(total / 4))
}

export const breed = (
  mother: Plant,
  father: Plant,
  config: BreedingConfig,
  knownAlleles: Set<string>,
): BreedingResult => {
  const motherGenome = sampleMosaicVariant(mother.genome, config.mosaicEnabled)
  const fatherGenome = father.genome

  const events: BreedEvent[] = []
  const resolution: CellResolution[] = []
  const carriers: Record<number, string> = {}
  let childGenome: Genome = '0'.repeat(GENOME_LENGTH)

  const rates = baseMutationRates(config.stress)

  for (let pos = 0; pos < GENOME_LENGTH; pos++) {
    const r = resolveCell(pos, motherGenome, fatherGenome)
    let expressed = r.expressed
    let event: BreedEvent | null = null

    const roll = Math.random()
    if (roll < rates.denovo) {
      const next = rollDeNovoNibble(expressed, r.a, r.b)
      const lineageKey = `${regionAtPos(pos)}:${pos}:${next}`
      const firstOccurrence = !knownAlleles.has(lineageKey)
      knownAlleles.add(lineageKey)
      event = {
        type: 'denovo',
        pos,
        from: expressed,
        to: next,
        firstOccurrence,
        regionId: regionAtPos(pos),
      }
      expressed = next
    } else if (roll < rates.denovo + rates.nonsense) {
      event = { type: 'nonsense', pos, from: expressed }
      expressed = '0'
    } else if (roll < rates.denovo + rates.nonsense + rates.missense) {
      const next = rollMissense(expressed)
      event = { type: 'missense', pos, from: expressed, to: next }
      expressed = next
    }

    if (event) events.push(event)
    if (r.carrier) carriers[pos] = r.carrier

    childGenome = replaceNibble(childGenome, pos, expressed)

    const [row, col] = posToRowCol(pos)
    resolution.push({
      pos,
      row,
      col,
      aNibble: r.a,
      bNibble: r.b,
      aDominant: r.aDom,
      bDominant: r.bDom,
      expressed,
      source: event ? 'mutation' : r.source,
      carrier: r.carrier,
      event,
    })
  }

  const retro = tryRetrotransposon(config.stress)
  if (retro) {
    const sourcePositions = retro.sourceCells.map(([row, col]) => rowColToPos(row, col))
    const targetPositions = retro.targetCells.map(([row, col]) => rowColToPos(row, col))
    for (let i = 0; i < sourcePositions.length; i++) {
      const srcPos = sourcePositions[i]!
      const tgtPos = targetPositions[i]!
      const sourceNibble = nibbleAt(childGenome, srcPos)
      childGenome = replaceNibble(childGenome, tgtPos, sourceNibble)
      const target = resolution[tgtPos]!
      target.expressed = sourceNibble
      target.source = 'mutation'
    }
    const event: BreedEvent = {
      type: 'retrotransposon',
      sourceCells: retro.sourceCells,
      targetCells: retro.targetCells,
      sourceRegion: retro.sourceRegion,
      targetRegion: retro.targetRegion,
    }
    events.push(event)
    for (const tgtPos of targetPositions) {
      resolution[tgtPos]!.event = event
    }
  }

  const generation = Math.max(mother.generation, father.generation) + 1
  const distance = hammingDistance(motherGenome, fatherGenome)
  const denovoFirsts = events.filter((e) => e.type === 'denovo' && e.firstOccurrence).length
  const child: Plant = {
    id: newId(),
    label: `Gen ${generation} • ${childGenome.slice(0, 4)}`,
    genome: childGenome,
    parents: { mother: mother.id, father: father.id },
    generation,
    events,
    resilience: computeResilience(childGenome, carriers) + denovoFirsts * 4 + Math.floor(distance / 16),
    seedCount: computeSeedCount(childGenome),
    carriers,
    createdAt: Date.now(),
    planted: false,
    litterId: null,
  }

  return { child, resolution, motherVariant: motherGenome, fatherGenome }
}

export const popcountSummary = (genome: Genome): { bits: number; total: number } => ({
  bits: popcountHex(genome),
  total: genome.length * 4,
})
