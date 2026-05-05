import { GENOME_LENGTH, replaceNibble } from './genome'
import { mulberry32, seedFromString } from './hash'
import type { Genome } from './types'

const MOSAIC_VARIANT_COUNT = 4
const MOSAIC_MAX_NIBBLE_DRIFT = 3

export const generateMosaic = (genome: Genome): Genome[] => {
  const rng = mulberry32(seedFromString('mosaic:' + genome))
  const variants: Genome[] = []
  for (let v = 0; v < MOSAIC_VARIANT_COUNT; v++) {
    let variant: Genome = genome
    const drift = 1 + Math.floor(rng() * MOSAIC_MAX_NIBBLE_DRIFT)
    for (let d = 0; d < drift; d++) {
      const pos = Math.floor(rng() * GENOME_LENGTH)
      const newNib = Math.floor(rng() * 16).toString(16)
      variant = replaceNibble(variant, pos, newNib)
    }
    variants.push(variant)
  }
  return variants
}

export const sampleMosaicVariant = (genome: Genome, mosaicEnabled: boolean): Genome => {
  if (!mosaicEnabled) return genome
  const variants = generateMosaic(genome)
  return variants[Math.floor(Math.random() * variants.length)]!
}
