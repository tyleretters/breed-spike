import { useEffect, useMemo, useRef, useState } from 'react'
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

type PedigreeNode = {
  plant: Plant | null
  gen: number
  slot: number
  x: number
  y: number
}

type Edge = {
  from: PedigreeNode
  to: PedigreeNode
  role: 'mother' | 'father'
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

const buildNodes = (
  rootPlant: Plant,
  byId: Map<string, Plant>,
  totalWidth: number,
  totalHeight: number,
): PedigreeNode[] => {
  const out: PedigreeNode[] = []
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
}

const buildEdges = (nodes: PedigreeNode[]): Edge[] => {
  const lines: Edge[] = []
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
}

const SHARED_ACCENT = '#fbbf24' // amber

type ComparePickerProps = {
  current: Plant | null
  plants: Plant[]
  excludeId: string
  onPick: (id: string) => void
  onClear: () => void
}

const ComparePicker = ({ current, plants, excludeId, onPick, onClear }: ComparePickerProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onAway)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onAway)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const candidates = plants.filter((p) => p.id !== excludeId)

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-1 text-[11px] tracking-[0.2em] uppercase hover:border-[var(--color-amber)]/60"
      >
        {current ? (
          <>
            <GradeBadge resilience={current.resilience} size="sm" />
            <span className="text-[var(--color-text)]">vs · {current.label}</span>
          </>
        ) : (
          <span className="text-[var(--color-amber)]">+ compare with…</span>
        )}
        <span className="text-[var(--color-dim)]">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-[280px] rounded-md border border-[var(--color-border-bright)] bg-[var(--color-panel)] p-1 shadow-lg">
          {current && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className="mb-1 w-full rounded px-2 py-1 text-left text-[10px] tracking-[0.25em] text-rose-300 uppercase hover:bg-[var(--color-panel-2)]"
            >
              Stop comparing
            </button>
          )}
          {candidates.length === 0 ? (
            <div className="px-2 py-2 text-[11px] italic text-[var(--color-dim)]">
              No other plants to compare to.
            </div>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto">
              {[...candidates]
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((p) => {
                  const g = gradeFromResilience(p.resilience)
                  const c = gradeColor(g)
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onPick(p.id)
                          setOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-panel-2)]"
                      >
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                          style={{
                            color: c,
                            backgroundColor: `${c}1f`,
                            border: `1px solid ${c}66`,
                          }}
                        >
                          {g}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px]">{p.label}</span>
                        <span className="text-[10px] text-[var(--color-dim)]">
                          gen {p.generation}
                        </span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

type TreeProps = {
  rootPlant: Plant
  nodes: PedigreeNode[]
  edges: Edge[]
  totalWidth: number
  totalHeight: number
  zoomedPlantId: string | null
  setZoomedPlantId: (id: string) => void
  sharedIds: Set<string>
  sharedIndex: Map<string, number>
  treeColor: string
}

const TreeView = ({
  rootPlant,
  nodes,
  edges,
  totalWidth,
  totalHeight,
  zoomedPlantId,
  setZoomedPlantId,
  sharedIds,
  sharedIndex,
  treeColor,
}: TreeProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="self-start text-[10px] tracking-[0.3em] uppercase"
        style={{ color: treeColor }}
      >
        ◆ {rootPlant.label}
      </div>
      <div
        className="relative"
        style={{ width: totalWidth, height: totalHeight }}
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
          const isShared = sharedIds.has(node.plant.id)
          const matchNum = sharedIndex.get(node.plant.id)
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
                boxShadow: isShared
                  ? `0 0 0 2px ${SHARED_ACCENT}, 0 0 12px rgba(251,191,36,0.35)`
                  : isRoot
                    ? `0 0 0 2px ${color}80`
                    : undefined,
              }}
            >
              {isShared && matchNum !== undefined && (
                <span
                  className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: SHARED_ACCENT,
                    color: '#0f0f10',
                  }}
                  title="Shared ancestor between both pedigrees"
                >
                  {matchNum}
                </span>
              )}
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
  )
}

type Props = {
  rootPlant: Plant
  compareTo?: Plant | null
  plants: Plant[]
  onSelectPlant?: (plantId: string) => void
  onCompareChange?: (plantId: string | null) => void
  onClose: () => void
}

export const LineageGraph = ({
  rootPlant,
  compareTo,
  plants,
  onSelectPlant,
  onCompareChange,
  onClose,
}: Props) => {
  const [zoomedPlantId, setZoomedPlantId] = useState<string | null>(rootPlant.id)
  const byId = useMemo(() => new Map(plants.map((p) => [p.id, p])), [plants])

  const totalSlots = 1 << MAX_DEPTH
  const totalWidth = totalSlots * SLOT_PX
  const totalHeight = (MAX_DEPTH + 1) * GENERATION_HEIGHT

  const nodesA = useMemo<PedigreeNode[]>(
    () => buildNodes(rootPlant, byId, totalWidth, totalHeight),
    [rootPlant, byId, totalWidth, totalHeight],
  )
  const edgesA = useMemo(() => buildEdges(nodesA), [nodesA])

  const nodesB = useMemo<PedigreeNode[] | null>(
    () => (compareTo ? buildNodes(compareTo, byId, totalWidth, totalHeight) : null),
    [compareTo, byId, totalWidth, totalHeight],
  )
  const edgesB = useMemo(() => (nodesB ? buildEdges(nodesB) : null), [nodesB])

  const { sharedIds, sharedIndex, mostRecentCommonAncestor } = useMemo(() => {
    if (!nodesB) {
      return {
        sharedIds: new Set<string>(),
        sharedIndex: new Map<string, number>(),
        mostRecentCommonAncestor: null as Plant | null,
      }
    }
    const idsA = new Set(
      nodesA.map((n) => n.plant?.id).filter((id): id is string => Boolean(id)),
    )
    const idsB = new Set(
      nodesB.map((n) => n.plant?.id).filter((id): id is string => Boolean(id)),
    )
    const shared = new Set<string>()
    for (const id of idsA) if (idsB.has(id)) shared.add(id)

    const idx = new Map<string, number>()
    let counter = 1
    const orderedShared: Plant[] = []
    for (const node of nodesA) {
      if (node.plant && shared.has(node.plant.id) && !idx.has(node.plant.id)) {
        idx.set(node.plant.id, counter++)
        orderedShared.push(node.plant)
      }
    }
    let mrca: Plant | null = null
    let mrcaGen = -Infinity
    for (const node of nodesA) {
      if (node.plant && shared.has(node.plant.id)) {
        if (node.plant.generation > mrcaGen) {
          mrca = node.plant
          mrcaGen = node.plant.generation
        }
      }
    }
    return {
      sharedIds: shared,
      sharedIndex: idx,
      mostRecentCommonAncestor: mrca,
    }
  }, [nodesA, nodesB])

  const zoomedPlant = zoomedPlantId
    ? (byId.get(zoomedPlantId) ?? rootPlant)
    : rootPlant
  const isCompareMode = compareTo !== undefined && compareTo !== null

  return (
    <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-3">
        <div>
          <h2 className="text-sm font-medium">
            Pedigree {isCompareMode && '· comparison'}
          </h2>
          <p className="text-[11px] text-[var(--color-muted)]">
            {isCompareMode ? (
              <>
                Comparing <span className="font-mono">{rootPlant.label}</span> with{' '}
                <span className="font-mono">{compareTo!.label}</span>. Shared ancestors are
                outlined in amber and numbered. {sharedIds.size > 0 ? (
                  <>
                    {sharedIds.size} shared ancestor{sharedIds.size === 1 ? '' : 's'}.
                    {mostRecentCommonAncestor && (
                      <>
                        {' '}
                        Most recent common ancestor:{' '}
                        <span style={{ color: SHARED_ACCENT }}>
                          {mostRecentCommonAncestor.label}
                        </span>{' '}
                        (gen {mostRecentCommonAncestor.generation}).
                      </>
                    )}
                  </>
                ) : (
                  ' No shared ancestors within depth 3 — these lineages are independent.'
                )}
              </>
            ) : (
              <>
                Ancestors of <span className="font-mono">{rootPlant.label}</span>. Click a node to
                inspect; pick a second plant to compare.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCompareChange && (
            <ComparePicker
              current={compareTo ?? null}
              plants={plants}
              excludeId={rootPlant.id}
              onPick={(id) => onCompareChange(id)}
              onClear={() => onCompareChange(null)}
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--color-border-bright)] bg-[var(--color-panel-2)] px-3 py-1 text-xs hover:bg-[var(--color-border)]"
          >
            Close pedigree
          </button>
        </div>
      </div>

      {isCompareMode ? (
        <div className="overflow-x-auto">
          <div className="flex gap-12">
            <TreeView
              rootPlant={rootPlant}
              nodes={nodesA}
              edges={edgesA}
              totalWidth={totalWidth}
              totalHeight={totalHeight}
              zoomedPlantId={zoomedPlantId}
              setZoomedPlantId={setZoomedPlantId}
              sharedIds={sharedIds}
              sharedIndex={sharedIndex}
              treeColor="#f9a8d4"
            />
            {nodesB && edgesB && compareTo && (
              <TreeView
                rootPlant={compareTo}
                nodes={nodesB}
                edges={edgesB}
                totalWidth={totalWidth}
                totalHeight={totalHeight}
                zoomedPlantId={zoomedPlantId}
                setZoomedPlantId={setZoomedPlantId}
                sharedIds={sharedIds}
                sharedIndex={sharedIndex}
                treeColor="#93c5fd"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="overflow-x-auto">
            <TreeView
              rootPlant={rootPlant}
              nodes={nodesA}
              edges={edgesA}
              totalWidth={totalWidth}
              totalHeight={totalHeight}
              zoomedPlantId={zoomedPlantId}
              setZoomedPlantId={setZoomedPlantId}
              sharedIds={sharedIds}
              sharedIndex={sharedIndex}
              treeColor="var(--color-amber)"
            />
          </div>

          <aside className="space-y-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <div className="text-[10px] font-medium tracking-wide text-[var(--color-muted)] uppercase">
              Inspecting
            </div>
            <div className="flex items-center gap-2">
              <GradeBadge resilience={zoomedPlant.resilience} size="lg" />
              <div>
                <div className="text-sm">{zoomedPlant.label}</div>
                <div className="text-[10px] text-[var(--color-dim)]">
                  gen {zoomedPlant.generation} · res {zoomedPlant.resilience} ·{' '}
                  {zoomedPlant.seedCount} seeds
                </div>
              </div>
            </div>
            <div className="font-mono text-[9px] break-all text-[var(--color-dim)]">
              {zoomedPlant.genome}
            </div>
            <div className="flex justify-center pt-1">
              {renderMiniGrid(zoomedPlant.genome, 16)}
            </div>
            {zoomedPlant.events.length > 0 && (
              <div>
                <div className="mt-2 text-[10px] font-medium tracking-wide text-[var(--color-muted)] uppercase">
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
      )}
    </div>
  )
}
