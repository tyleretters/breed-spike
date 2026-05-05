import { rowColLabel } from '@/engine/mutations'
import { regionAtPos } from '@/engine/regions'
import type { BreedEvent } from '@/engine/types'

const eventColorClass = (type: BreedEvent['type']): string => {
  switch (type) {
    case 'missense':
      return 'text-[var(--color-event-missense)]'
    case 'nonsense':
      return 'text-[var(--color-event-nonsense)]'
    case 'denovo':
      return 'text-[var(--color-event-denovo)]'
    case 'retrotransposon':
      return 'text-[var(--color-event-retro)]'
  }
}

const eventLabel = (type: BreedEvent['type']): string => {
  switch (type) {
    case 'missense':
      return 'Missense'
    case 'nonsense':
      return 'Nonsense'
    case 'denovo':
      return 'De Novo'
    case 'retrotransposon':
      return 'Retrotransposon'
  }
}

const describe = (event: BreedEvent): string => {
  switch (event.type) {
    case 'missense':
      return `${rowColLabel(event.pos)} ${event.from} → ${event.to} (${regionAtPos(event.pos)})`
    case 'nonsense':
      return `${rowColLabel(event.pos)} ${event.from} → 0 (${regionAtPos(event.pos)})`
    case 'denovo':
      return `${rowColLabel(event.pos)} ${event.from} → ${event.to} ${event.firstOccurrence ? '— FIRST OCCURRENCE' : ''} (${event.regionId})`
    case 'retrotransposon': {
      const src = event.sourceCells[0]!
      const tgt = event.targetCells[0]!
      return `(${src[0]},${src[1]}) ${event.sourceRegion} → (${tgt[0]},${tgt[1]}) ${event.targetRegion}`
    }
  }
}

type Props = {
  events: BreedEvent[]
  emptyMessage?: string
}

export const EventLog = ({ events, emptyMessage = 'No mutation events.' }: Props) => {
  if (events.length === 0) {
    return <div className="text-xs text-[var(--color-dim)] italic">{emptyMessage}</div>
  }
  return (
    <ul className="space-y-1">
      {events.map((event, i) => (
        <li key={i} className="flex items-baseline gap-2 text-xs">
          <span className={`shrink-0 font-medium ${eventColorClass(event.type)}`}>
            {eventLabel(event.type)}
          </span>
          <span className="font-mono text-[var(--color-muted)]">{describe(event)}</span>
        </li>
      ))}
    </ul>
  )
}
