import { Badge, Group, Stack, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

import type { DiagnosticItem } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { onActivate } from '../../lib/keyboard'
import { countBySeverity, severityConfig } from './diagnostic-helpers'

export function DiagnosticsFileSection({ file, items }: { file: string; items: DiagnosticItem[] }) {
  const navigate = useNavigate()
  const counts = countBySeverity(items)

  return (
    <SectionCard padding='md'>
      <Group mb='sm'>
        <Text
          ff='monospace'
          fw={600}
          size='sm'
        >
          {file}
        </Text>
        {counts.error > 0 && (
          <Badge
            color='gill'
            size='sm'
            variant='light'
          >
            {counts.error} {counts.error === 1 ? 'error' : 'errors'}
          </Badge>
        )}
        {counts.warning > 0 && (
          <Badge
            color='substrate'
            size='sm'
            variant='light'
          >
            {counts.warning} {counts.warning === 1 ? 'warning' : 'warnings'}
          </Badge>
        )}
        {counts.info > 0 && (
          <Badge
            color='lichen'
            size='sm'
            variant='light'
          >
            {counts.info} info
          </Badge>
        )}
        {counts.hint > 0 && (
          <Badge
            color='chitin'
            size='sm'
            variant='light'
          >
            {counts.hint} {counts.hint === 1 ? 'hint' : 'hints'}
          </Badge>
        )}
      </Group>

      <Stack gap='xs'>
        {items
          .toSorted((a, b) => severityConfig[a.severity].order - severityConfig[b.severity].order || a.line - b.line)
          .map((item) => {
            const config = severityConfig[item.severity]
            const Icon = config.icon

            return (
              <Group
                gap='sm'
                key={`${item.file}:${item.line}:${item.column}:${item.severity}:${item.message}`}
                onClick={() => navigate(`/code?file=${encodeURIComponent(item.file)}&line=${item.line}`)}
                onKeyDown={onActivate(() => navigate(`/code?file=${encodeURIComponent(item.file)}&line=${item.line}`))}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                wrap='nowrap'
              >
                <Badge
                  color={config.color}
                  leftSection={<Icon size={12} />}
                  size='sm'
                  variant='light'
                >
                  {item.severity}
                </Badge>
                <Text
                  c='dimmed'
                  ff='monospace'
                  size='sm'
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {item.line}:{item.column}
                </Text>
                {item.code && (
                  <Text
                    c='dimmed'
                    ff='monospace'
                    size='xs'
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    [{item.code}]
                  </Text>
                )}
                <Text
                  size='sm'
                  style={{ flex: 1 }}
                >
                  {item.message}
                </Text>
              </Group>
            )
          })}
      </Stack>
    </SectionCard>
  )
}
