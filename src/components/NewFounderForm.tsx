import { useState } from 'react'

type Props = {
  onCreate: (label: string, source: string) => void
}

export const NewFounderForm = ({ onCreate }: Props) => {
  const [label, setLabel] = useState('')
  const [source, setSource] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedLabel = label.trim() || `Founder ${source.slice(0, 12) || 'unnamed'}`
    const trimmedSource = source.trim() || trimmedLabel
    onCreate(trimmedLabel, trimmedSource)
    setLabel('')
    setSource('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-3"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        Spawn Founder
      </div>
      <div className="space-y-1.5">
        <input
          type="text"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)] placeholder:text-[var(--color-dim)] focus:border-[var(--color-border-bright)] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Seed string (hashed → genome)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 font-mono text-xs text-[var(--color-text)] placeholder:text-[var(--color-dim)] focus:border-[var(--color-border-bright)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded border border-[var(--color-border-bright)] bg-[var(--color-panel-2)] px-2 py-1 text-xs hover:bg-[var(--color-border)]"
      >
        Add Founder
      </button>
    </form>
  )
}
