export type Grade = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

const THRESHOLDS: Array<{ grade: Grade; min: number }> = [
  { grade: 'S', min: 120 },
  { grade: 'A', min: 60 },
  { grade: 'B', min: 20 },
  { grade: 'C', min: -20 },
  { grade: 'D', min: -60 },
  { grade: 'E', min: -120 },
  { grade: 'F', min: -Infinity },
]

export const gradeFromResilience = (resilience: number): Grade => {
  for (const t of THRESHOLDS) {
    if (resilience >= t.min) return t.grade
  }
  return 'F'
}

export const gradeColor = (grade: Grade): string => {
  switch (grade) {
    case 'S':
      return '#f0abfc'
    case 'A':
      return '#4ade80'
    case 'B':
      return '#a3e635'
    case 'C':
      return '#a1a1aa'
    case 'D':
      return '#fde047'
    case 'E':
      return '#fb923c'
    case 'F':
      return '#fb7185'
  }
}

export const gradeLabel = (grade: Grade): string => {
  switch (grade) {
    case 'S':
      return 'Exceptional'
    case 'A':
      return 'Strong'
    case 'B':
      return 'Promising'
    case 'C':
      return 'Average'
    case 'D':
      return 'Weak'
    case 'E':
      return 'Poor'
    case 'F':
      return 'Failing'
  }
}
