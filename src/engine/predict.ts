import { GENOME_LENGTH, isDominant, nibbleAt, nibbleValue } from './genome'
import type { Genome } from './types'

export type CellPrediction = {
  motherNibble: string
  fatherNibble: string
  motherDominant: boolean
  fatherDominant: boolean
  expressed: string
  source: 'mother' | 'father' | 'tie'
  carrier: string | null
  rule: 'both-dom' | 'mother-dom' | 'father-dom' | 'both-rec'
}

export const predictCell = (motherGenome: Genome, fatherGenome: Genome, pos: number): CellPrediction => {
  const a = nibbleAt(motherGenome, pos)
  const b = nibbleAt(fatherGenome, pos)
  const aV = nibbleValue(a)
  const bV = nibbleValue(b)
  const aDom = isDominant(a)
  const bDom = isDominant(b)

  if (aDom && bDom) {
    return {
      motherNibble: a,
      fatherNibble: b,
      motherDominant: true,
      fatherDominant: true,
      expressed: aV >= bV ? a : b,
      source: aV === bV ? 'tie' : aV > bV ? 'mother' : 'father',
      carrier: null,
      rule: 'both-dom',
    }
  }
  if (aDom && !bDom) {
    return {
      motherNibble: a,
      fatherNibble: b,
      motherDominant: true,
      fatherDominant: false,
      expressed: a,
      source: 'mother',
      carrier: b,
      rule: 'mother-dom',
    }
  }
  if (!aDom && bDom) {
    return {
      motherNibble: a,
      fatherNibble: b,
      motherDominant: false,
      fatherDominant: true,
      expressed: b,
      source: 'father',
      carrier: a,
      rule: 'father-dom',
    }
  }
  return {
    motherNibble: a,
    fatherNibble: b,
    motherDominant: false,
    fatherDominant: false,
    expressed: aV >= bV ? a : b,
    source: aV === bV ? 'tie' : aV > bV ? 'mother' : 'father',
    carrier: null,
    rule: 'both-rec',
  }
}

export const predictOffspringGenome = (motherGenome: Genome, fatherGenome: Genome): Genome => {
  let out = ''
  for (let pos = 0; pos < GENOME_LENGTH; pos++) {
    out += predictCell(motherGenome, fatherGenome, pos).expressed
  }
  return out
}

// Mirrors the offspring resilience formula in breed.ts so forecast and actual stay aligned.
const OFFSPRING_BASELINE = 10.5

export const predictResilience = (motherGenome: Genome, fatherGenome: Genome): number => {
  const child = predictOffspringGenome(motherGenome, fatherGenome)
  let score = 0
  for (let i = 0; i < GENOME_LENGTH; i++) {
    score += nibbleValue(nibbleAt(child, i)) - OFFSPRING_BASELINE
  }
  // Carriers reduce score slightly per the breed formula. We only count "low" carriers
  // (<= 2) at positions where one parent is dominant and the other is recessive.
  for (let i = 0; i < GENOME_LENGTH; i++) {
    const cell = predictCell(motherGenome, fatherGenome, i)
    if (cell.carrier && nibbleValue(cell.carrier) <= 2) score -= 0.5
  }
  return Math.round(score)
}
