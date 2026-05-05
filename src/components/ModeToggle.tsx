import { useEffect } from 'react'

type Mode = 'simple' | 'dense'

type Props = {
  mode: Mode
  onChange: (next: Mode) => void
}

export const ModeToggle = ({ mode, onChange }: Props) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const target = e.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      if (isEditable) return
      e.preventDefault()
      onChange(mode === 'simple' ? 'dense' : 'simple')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, onChange])

  return (
    <div className="flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] p-0.5">
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={`rounded px-3 py-1 text-[10px] tracking-[0.25em] uppercase transition-colors ${
          mode === 'simple'
            ? 'bg-[var(--color-amber)]/15 text-[var(--color-amber)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        Specimen
      </button>
      <button
        type="button"
        onClick={() => onChange('dense')}
        className={`rounded px-3 py-1 text-[10px] tracking-[0.25em] uppercase transition-colors ${
          mode === 'dense'
            ? 'bg-[var(--color-text)]/10 text-[var(--color-text)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        Dense
      </button>
      <span className="px-1 text-[9px] tracking-[0.2em] text-[var(--color-dim)] uppercase">
        /
      </span>
    </div>
  )
}
