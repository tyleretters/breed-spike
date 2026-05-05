import { useMemo, useState } from 'react'
import { GENOME_LENGTH, isDominant, nibbleAt, nibbleValue, posToRowCol } from '@/engine/genome'
import { gradeColor, gradeFromResilience } from '@/engine/grading'
import { regionAtPos } from '@/engine/regions'
import type { Genome, Plant, RegionId } from '@/engine/types'
import { GradeBadge } from './GradeBadge'

const REGION_HUE: Record<RegionId, number | null> = {
  root: 240,
  canopy: 130,
  flowering: 320,
  seed: 38,
  pest: 190,
  modifier: null,
}

const MAX_DEPTH = 3
const NODE_WIDTH = 110
const NODE_HEIGHT = 80
const GENERATION_HEIGHT = 130
const NODE_GAP_X = 12

const SLOT_PX = NODE_WIDTH + NODE_GAP_X

type Node = {
  plant: Plant | null
  gen: number
  slot: number
  x: number
  y: number
}

const renderMiniGrid = (genome: Genome, cell: number): React.ReactNode => {
  return (
    <svg
      width={cell * 8}
      height={cell * 8}
      className="rounded"
      style={{ display: 'block' }}
    >
      <rect x={0} y={0} width={cell * 8} height={cell * 8} fill="#0f0f10" />
      {Array.from({ length: GENOME_LENGTH }, (_, pos) => {
        const [row, col] = posToRowCol(pos)
        const value = nibbleValue(nibbleAt(genome, pos))
        const region = regionAtPos(pos)
        const hue = REGION_HUE[region]
        const lightness = 6 + value * 3
        const fill =
          hue === null
            ? `hsl(0 0% ${lightness}%)`
            : `hsl(${hue} 40% ${lightness + 4}%)`
        const dom = isDominant(nibbleAt(genome, pos))
        return (
          <rect
            key={pos}
            x={col * cell + 0.5}
            y={row * cell + 0.5}
            width={cell - 1}
            height={cell - 1}
            fill={fill}
            stroke={dom ? 'rgba(255,255,255,0.18)' : 'transparent'}
            strokeWidth={dom ? 0.5 : 0}
          />
        )
      })}
      <rect
        x={0}
        y={0}
        width={cell * 8}
        height={cell * 8}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />
    </svg>
  )
}

type Props = {
  rootPlant: Plant
  plants: Plant[]
  onSelectPlant?: (plantId: string) => void
  onClose: () => void
}

export const LineageGraph = ({ rootPlant, plants, onSelectPlant, onClose }: Props) => {
  const [zoomedPlantId, setZoomedPlantId] = useState<string | null>(rootPlant.id)
  const byId = useMemo(() => new Map(plants.map((p) => [p.id, p])), [plants])

  const totalSlots = 1 << MAX_DEPTH
  const totalWidth = totalSlots * SLOT_PX
  const totalHeight = (MAX_DEPTH + 1) * GENERATION_HEIGHT

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = []
    const recurse = (plantId: string | null, gen: number, slot: number) => {
      if (gen > MAX_DEPTH) return
      const plant = plantId ? (byId.get(plantId) ?? null) : null
      const slotsAtGen = 1 << gen
      const x = (slot + 0.5) * (totalWidth / slotsAtGen)
      const y = totalHeight - (gen + 0.5) * GENERATION_HEIGHT
      out.push({ plant, gen, slot, x, y })
      if (plant?.parents) {
        recurse(plant.parents.mother, gen + 1, slot * 2)
        recurse(plant.parents.father, gen + 1, slot * 2 + 1)
      }
    }
    recurse(rootPlant.id, 0, 0)
    return out
  }, [rootPlant, byId, totalWidth, totalHeight])

  const edges = useMemo(() => {
    const lines: Array<{ from: Node; to: Node; role: 'mother' | 'father' }> = []
    for (const n of nodes) {
      if (!n.plant?.parents) continue
      const motherSlot = n.slot * 2
      const fatherSlot = n.slot * 2 + 1
      const mom = nodes.find((m) => m.gen === n.gen + 1 && m.slot === motherSlot)
      const dad = nodes.find((d) => d.gen === n.gen + 1 && d.slot === fatherSlot)
      if (mom) lines.push({ from: n, to: mom, role: 'mother' })
      if (dad) lines.push({ from: n, to: dad, role: 'father' })
    }
    return lines
  }, [nodes])

  const zoomedPlant = zoomedPlantId ? (byId.get(zoomedPlantId) ?? rootPlant) : rootPlant

  return (
    <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div>
          <h2 className="text-sm font-medium">Pedigree</h2>
          <p className="text-[11px] text-[var(--color-muted)]">
            Ancestors of <span className="font-mono">{rootPlant.label}</span>. Each node shows the
            grade and a miniature of the genome. Click any node to inspect it on the right; click a
            node's label to make it the new root of the chart.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-[var(--color-border-bright)] bg-[var(--color-panel-2)] px-3 py-1 text-xs hover:bg-[var(--color-border)]"
        >
          Close pedigree
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto">
          <div
            className="relative"
            style={{ width: totalWidth, height: totalHeight, minWidth: '100%' }}
          >
            <svg
              className="absolute inset-0"
              width={totalWidth}
              height={totalHeight}
              style={{ pointerEvents: 'none' }}
            >
              {edges.map((edge, i) => {
                const fromX = edge.from.x
                const fromY = edge.from.y - NODE_HEIGHT / 2
                const toX = edge.to.x
                const toY = edge.to.y + NODE_HEIGHT / 2
                const midY = (fromY + toY) / 2
                const path = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`
                return (
                  <path
                    key={i}
                    d={path}
                    fill="none"
                    stroke={edge.role === 'mother' ? '#ec4899' : '#3b82f6'}
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                  />
                )
              })}
            </svg>
            {nodes.map((node) => {
              const isRoot = node.gen === 0
              const isZoomed = node.plant?.id === zoomedPlantId
              if (!node.plant) {
                return (
                  <div
                    key={`${node.gen}-${node.slot}`}
                    className="absolute flex items-center justify-center rounded border border-dashed border-[var(--color-border)] text-[10px] text-[var(--color-dim)]"
                    style={{
                      left: node.x - NODE_WIDTH / 2,
                      top: node.y - NODE_HEIGHT / 2,
                      width: NODE_WIDTH,
                      height: NODE_HEIGHT,
                    }}
                    title="Unknown ancestor"
                  >
                    unknown
                  </div>
                )
              }
              const grade = gradeFromResilience(node.plant.resilience)
              const color = gradeColor(grade)
              return (
                <div
                  key={node.plant.id}
                  className={`absolute flex flex-col rounded border bg-[var(--color-panel-2)] p-1 transition-colors ${
                    isZoomed
                      ? 'border-[var(--color-border-bright)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-bright)]'
                  }`}
                  style={{
                    left: node.x - NODE_WIDTH / 2,
                    top: node.y - NODE_HEIGHT / 2,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    boxShadow: isRoot ? `0 0 0 2px ${color}80` : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setZoomedPlantId(node.plant!.id)}
                    className="flex items-center gap-1.5 text-left"
                    title={`Click to inspect ${node.plant.label}`}
                  >
                    <GradeBadge resilience={node.plant.resilience} size="sm" />
                    <span
                      className="truncate text-[10px] leading-tight text-[var(--color-text)]"
                      style={{ flex: 1 }}
                    >
                      {node.plant.label}
                    </span>
                  </button>
                  <div className="mt-1 flex flex-1 items-center justify-center">
                    {renderMiniGrid(node.plant.genome, 6)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="space-y-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Inspecting
          </div>
          <div className="flex items-center gap-2">
            <GradeBadge resilience={zoomedPlant.resilience} size="lg" />
            <div>
              <div className="text-sm">{zoomedPlant.label}</div>
              <div className="text-[10px] text-[var(--color-dim)]">
                gen {zoomedPlant.generation} · res {zoomedPlant.resilience} · {zoomedPlant.seedCount}{' '}
                seeds
              </div>
            </div>
          </div>
          <div className="font-mono text-[9px] break-all text-[var(--color-dim)]">
            {zoomedPlant.genome}
          </div>
          <div className="flex justify-center pt-1">{renderMiniGrid(zoomedPlant.genome, 16)}</div>
          {zoomedPlant.events.length > 0 && (
            <div>
              <div className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Mutation events
              </div>
              <ul className="mt-1 space-y-0.5 text-[10px] text-[var(--color-muted)]">
                {zoomedPlant.events.slice(0, 8).map((event, i) => (
                  <li key={i}>
                    <span
                      className="font-medium"
                      style={{
                        color:
                          event.type === 'denovo'
                            ? 'var(--color-event-denovo)'
                            : event.type === 'retrotransposon'
                              ? 'var(--color-event-retro)'
                              : event.type === 'nonsense'
                                ? 'var(--color-event-nonsense)'
                                : 'var(--color-event-missense)',
                      }}
                    >
                      {event.type}
                    </span>
                  </li>
                ))}
                {zoomedPlant.events.length > 8 && (
                  <li className="italic">+{zoomedPlant.events.length - 8} more</li>
                )}
              </ul>
            </div>
          )}
          {onSelectPlant && zoomedPlant.id !== rootPlant.id && (
            <button
              type="button"
              onClick={() => onSelectPlant(zoomedPlant.id)}
              className="mt-2 w-full rounded border border-[var(--color-border-bright)] bg-[var(--color-panel-2)] px-2 py-1 text-[11px] hover:bg-[var(--color-border)]"
            >
              Make this plant the pedigree root
            </button>
          )}
        </aside>
      </div>
    </div>
  )
}
