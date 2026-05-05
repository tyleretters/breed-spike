import { REGIONS } from '@/engine/regions'

export const RegionLegend = () => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
    {REGIONS.map((region) => (
      <span key={region.id} className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: region.colorVar }}
        />
        <span className="text-[var(--color-muted)]">{region.label}</span>
      </span>
    ))}
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#3f3f46]" />
      <span className="text-[var(--color-muted)]">Modifier</span>
    </span>
  </div>
)
