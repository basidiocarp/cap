import { IconAlertCircle, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'

import type { DiagnosticItem } from '../../lib/api'

export const severityConfig = {
  error: { color: 'gill', icon: IconAlertCircle, order: 0 },
  hint: { color: 'chitin', icon: IconInfoCircle, order: 3 },
  info: { color: 'lichen', icon: IconInfoCircle, order: 2 },
  warning: { color: 'substrate', icon: IconAlertTriangle, order: 1 },
} as const

type Severity = keyof typeof severityConfig

export function countBySeverity(items: DiagnosticItem[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    error: 0,
    hint: 0,
    info: 0,
    warning: 0,
  }

  for (const item of items) {
    counts[item.severity]++
  }

  return counts
}

export function groupByFile(items: DiagnosticItem[]): Record<string, DiagnosticItem[]> {
  const groups: Record<string, DiagnosticItem[]> = {}
  for (const item of items) {
    if (!groups[item.file]) {
      groups[item.file] = []
    }
    groups[item.file].push(item)
  }
  return groups
}
