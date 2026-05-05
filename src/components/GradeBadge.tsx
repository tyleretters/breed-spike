import { gradeColor, gradeFromResilience, gradeLabel } from '@/engine/grading'

type Props = {
  resilience: number
  size?: 'sm' | 'md' | 'lg'
}

export const GradeBadge = ({ resilience, size = 'md' }: Props) => {
  const grade = gradeFromResilience(resilience)
  const color = gradeColor(grade)
  const sizeClass =
    size === 'lg'
      ? 'h-10 w-10 text-2xl'
      : size === 'sm'
        ? 'h-5 w-5 text-[11px]'
        : 'h-7 w-7 text-base'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded font-bold ${sizeClass}`}
      style={{
        color,
        backgroundColor: `${color}1f`,
        border: `1.5px solid ${color}80`,
      }}
      title={`${grade} — ${gradeLabel(grade)} (resilience ${resilience})`}
    >
      {grade}
    </span>
  )
}
