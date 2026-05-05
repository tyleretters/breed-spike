import { sha256 } from './hash'
import { GENOME_LENGTH, nibbleAt, nibbleValue, popcountHex, rowColToPos } from './genome'
import { regionAtPos } from './regions'
import type { Genome, Plant } from './types'

const computeSeedCount = (genome: Genome): number => {
  let total = 0
  for (let r = 6; r <= 7; r++) {
    for (let c = 0; c <= 1; c++) {
      total += nibbleValue(nibbleAt(genome, rowColToPos(r, c)))
    }
  }
  return Math.max(1, Math.round(total / 4))
}

const computeResilience = (genome: Genome): number => {
  let score = 0
  for (let i = 0; i < GENOME_LENGTH; i++) {
    score += nibbleValue(nibbleAt(genome, i)) - 7.5
  }
  return Math.round(score)
}

let plantCounter = 0
const nextPlantNum = (): number => ++plantCounter

export const createFounderFromString = async (
  label: string,
  source: string,
): Promise<Plant> => {
  const genome = (await sha256(source)) as Genome
  return {
    id: `founder-${nextPlantNum()}`,
    label,
    genome,
    parents: null,
    generation: 0,
    events: [],
    resilience: computeResilience(genome),
    seedCount: computeSeedCount(genome),
    carriers: {},
    createdAt: Date.now(),
  }
}

export const summarizePlant = (plant: Plant) => ({
  popcount: popcountHex(plant.genome),
  seeds: plant.seedCount,
  resilience: plant.resilience,
})

export const seedKnownAlleles = (plants: Plant[]): Set<string> => {
  const known = new Set<string>()
  for (const plant of plants) {
    for (let pos = 0; pos < GENOME_LENGTH; pos++) {
      const region = regionAtPos(pos)
      known.add(`${region}:${pos}:${nibbleAt(plant.genome, pos)}`)
    }
  }
  return known
}
