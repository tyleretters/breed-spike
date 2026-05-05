import { rowColToPos } from './genome'
import type { Region, RegionId } from './types'

const block2x2 = (r0: number, c0: number): Array<[number, number]> => [
  [r0, c0],
  [r0, c0 + 1],
  [r0 + 1, c0],
  [r0 + 1, c0 + 1],
]

const floweringBand = (): Array<[number, number]> => {
  const cells: Array<[number, number]> = []
  for (let r = 3; r <= 4; r++) {
    for (let c = 2; c <= 5; c++) {
      cells.push([r, c])
    }
  }
  return cells
}

export const REGIONS: Region[] = [
  {
    id: 'root',
    label: 'Root System',
    description:
      'Taproot depth and lateral root density. High alleles produce deep, drought-resilient roots that reach the water table; low alleles produce shallow surface roots that dry out fast in midsummer.',
    traits: ['Drought tolerance', 'Anchoring strength', 'Nutrient uptake from deep soil'],
    cells: block2x2(0, 0),
    colorVar: 'var(--color-region-root)',
  },
  {
    id: 'canopy',
    label: 'Canopy',
    description:
      'Leaf size, count, and arrangement. Determines photosynthetic surface area, shade tolerance, and how the plant competes with neighbors for sunlight.',
    traits: ['Photosynthetic capacity', 'Shade tolerance', 'Wind exposure'],
    cells: block2x2(0, 6),
    colorVar: 'var(--color-region-canopy)',
  },
  {
    id: 'flowering',
    label: 'Flowering Time',
    description:
      'When the plant bolts, blooms, and sets seed. Flowering windows determine which other plants it can cross-pollinate with and whether it overlaps with key pollinators (bees, moths).',
    traits: ['Bloom timing', 'Pollinator overlap', 'Reproductive window length'],
    cells: floweringBand(),
    colorVar: 'var(--color-region-flowering)',
  },
  {
    id: 'seed',
    label: 'Seed Coat',
    description:
      'Seed coat thickness, dormancy, and overwinter viability. The hex values here directly drive the seed-count yield from a successful breeding.',
    traits: ['Seed yield', 'Dormancy length', 'Cold tolerance'],
    cells: block2x2(6, 0),
    colorVar: 'var(--color-region-seed)',
  },
  {
    id: 'pest',
    label: 'Pest Resistance',
    description:
      'Tannins, defensive secondary compounds, and structural toughness against insect and pathogen attack. High alleles shrug off browsing damage and fungal infection.',
    traits: ['Insect resistance', 'Fungal resistance', 'Browsing tolerance'],
    cells: block2x2(6, 6),
    colorVar: 'var(--color-region-pest)',
  },
]

export const MODIFIER_DESCRIPTION =
  'Minor modifier alleles — small effects on vigor, color, scent, and how the named regions express. This is where epistasis lives: a modifier can suppress or amplify nearby trait genes.'

export const MODIFIER_TRAITS = ['Vigor modifier', 'Color/scent shift', 'Epistatic interaction']

const namedRegionPositions = new Set<number>(
  REGIONS.flatMap((r) => r.cells.map(([row, col]) => rowColToPos(row, col))),
)

export const regionAtPos = (pos: number): RegionId => {
  for (const region of REGIONS) {
    for (const [row, col] of region.cells) {
      if (rowColToPos(row, col) === pos) return region.id
    }
  }
  return 'modifier'
}

export const isCodingRegion = (regionId: RegionId): boolean => regionId !== 'modifier'

export const isModifierPos = (pos: number): boolean => !namedRegionPositions.has(pos)

export const regionById = (id: RegionId): Region | undefined =>
  REGIONS.find((r) => r.id === id)
