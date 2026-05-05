import type { Genome } from './types'

export const GENOME_LENGTH = 64

export const isValidGenome = (g: string): g is Genome => /^[0-9a-f]{64}$/i.test(g)

export const nibbleAt = (g: Genome, pos: number): string => g[pos]!.toLowerCase()

export const nibbleValue = (nibble: string): number => parseInt(nibble, 16)

export const isDominant = (nibble: string): boolean => nibbleValue(nibble) >= 8

export const popcountHex = (hex: string): number => {
  let count = 0
  for (let i = 0; i < hex.length; i++) {
    let v = parseInt(hex[i]!, 16)
    while (v) {
      count += v & 1
      v >>= 1
    }
  }
  return count
}

export const hammingDistance = (a: Genome, b: Genome): number => {
  let count = 0
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16)
    while (x) {
      count += x & 1
      x >>= 1
    }
  }
  return count
}

export const posToRowCol = (pos: number): [number, number] => [Math.floor(pos / 8), pos % 8]
export const rowColToPos = (row: number, col: number): number => row * 8 + col

export const replaceNibble = (g: Genome, pos: number, nibble: string): Genome =>
  g.slice(0, pos) + nibble + g.slice(pos + 1)
