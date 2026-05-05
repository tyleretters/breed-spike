import { GENOME_LENGTH, posToRowCol, rowColToPos } from './genome'
import { isCodingRegion, regionAtPos, REGIONS } from './regions'
import type { BreedEvent, RegionId, StressLevel } from './types'

export const baseMutationRates = (stress: StressLevel) => {
  const s = Math.max(0, Math.min(1, stress))
  return {
    missense: 0.01 + s * 0.04,
    nonsense: 0.001 + s * 0.02,
    denovo: 0.0001 + s * 0.005,
    retro: 0.005 + s * 0.2,
  }
}

const NIBBLES = '0123456789abcdef'

export const rollMissense = (current: string): string => {
  const idx = NIBBLES.indexOf(current)
  const dir = Math.random() < 0.5 ? -1 : 1
  const next = (idx + dir + 16) % 16
  return NIBBLES[next]!
}

export const rollDeNovoNibble = (current: string, parentA: string, parentB: string): string => {
  const exclude = new Set([current, parentA, parentB])
  const options = NIBBLES.split('').filter((n) => !exclude.has(n))
  if (options.length === 0) return current
  return options[Math.floor(Math.random() * options.length)]!
}

export const tryRetrotransposon = (stress: StressLevel): {
  sourceCells: Array<[number, number]>
  targetCells: Array<[number, number]>
  sourceRegion: RegionId
  targetRegion: RegionId
} | null => {
  const { retro } = baseMutationRates(stress)
  if (Math.random() >= retro) return null

  const blocks: Array<{ regionId: RegionId; cells: Array<[number, number]>; topLeft: [number, number] }> = []
  for (const region of REGIONS) {
    if (region.id === 'flowering') continue
    blocks.push({ regionId: region.id, cells: region.cells, topLeft: region.cells[0]! })
  }
  for (let r = 0; r <= 6; r++) {
    for (let c = 0; c <= 6; c++) {
      const cells: Array<[number, number]> = [
        [r, c],
        [r, c + 1],
        [r + 1, c],
        [r + 1, c + 1],
      ]
      const allModifier = cells.every(([rr, cc]) => regionAtPos(rowColToPos(rr, cc)) === 'modifier')
      if (allModifier) {
        blocks.push({ regionId: 'modifier', cells, topLeft: [r, c] })
      }
    }
  }

  const sourceBlock = blocks[Math.floor(Math.random() * blocks.length)]!
  let targetBlock = blocks[Math.floor(Math.random() * blocks.length)]!
  let attempts = 0
  while (targetBlock.topLeft[0] === sourceBlock.topLeft[0] && targetBlock.topLeft[1] === sourceBlock.topLeft[1] && attempts < 8) {
    targetBlock = blocks[Math.floor(Math.random() * blocks.length)]!
    attempts++
  }

  return {
    sourceCells: sourceBlock.cells,
    targetCells: targetBlock.cells,
    sourceRegion: sourceBlock.regionId,
    targetRegion: targetBlock.regionId,
  }
}

export const eventColor = (type: BreedEvent['type']): string => {
  switch (type) {
    case 'missense':
      return 'var(--color-event-missense)'
    case 'nonsense':
      return 'var(--color-event-nonsense)'
    case 'denovo':
      return 'var(--color-event-denovo)'
    case 'retrotransposon':
      return 'var(--color-event-retro)'
  }
}

export const isCodingPos = (pos: number): boolean => isCodingRegion(regionAtPos(pos))

export const positionsForGenome = (): number[] => {
  const out: number[] = []
  for (let i = 0; i < GENOME_LENGTH; i++) out.push(i)
  return out
}

export const rowColLabel = (pos: number): string => {
  const [r, c] = posToRowCol(pos)
  return `(${r},${c})`
}
