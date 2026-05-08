import { Alert, Stack } from '@mantine/core'
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react'

export type Severity = 'crit' | 'warn'

export interface Anomaly {
  id: string
  severity: Severity
  title: string
  detail: string
}

export interface AnomalyListProps {
  anomalies: Anomaly[]
  onDismiss?: (id: string) => void
}

export function AnomalyList({ anomalies, onDismiss }: AnomalyListProps) {
  if (anomalies.length === 0) return null

  return (
    <Stack gap='xs'>
      {anomalies.map((a) => (
        <Alert
          color={a.severity === 'crit' ? 'gill' : 'substrate'}
          icon={a.severity === 'crit' ? <IconAlertCircle size={16} /> : <IconAlertTriangle size={16} />}
          key={a.id}
          onClose={() => onDismiss?.(a.id)}
          title={a.title}
          withCloseButton={!!onDismiss}
        >
          {a.detail}
        </Alert>
      ))}
    </Stack>
  )
}
