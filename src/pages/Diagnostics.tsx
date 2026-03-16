import { Alert, Badge, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconAlertTriangle, IconInfoCircle, IconRefresh } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { DiagnosticItem, RhizomeStatus } from '../lib/api'
import { rhizomeApi } from '../lib/api'

const severityConfig = {
  error: { color: 'gill', icon: IconAlertCircle, order: 0 },
  hint: { color: 'chitin', icon: IconInfoCircle, order: 3 },
  info: { color: 'lichen', icon: IconInfoCircle, order: 2 },
  warning: { color: 'substrate', icon: IconAlertTriangle, order: 1 },
} as const

type Severity = keyof typeof severityConfig

function countBySeverity(items: DiagnosticItem[]): Record<Severity, number> {
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

function groupByFile(items: DiagnosticItem[]): Record<string, DiagnosticItem[]> {
  const groups: Record<string, DiagnosticItem[]> = {}
  for (const item of items) {
    if (!groups[item.file]) {
      groups[item.file] = []
    }
    groups[item.file].push(item)
  }
  return groups
}

export function Diagnostics() {
  const navigate = useNavigate()
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<RhizomeStatus | null>(null)

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await rhizomeApi.diagnostics()
      setDiagnostics(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diagnostics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const s = await rhizomeApi.status()
        setStatus(s)
        if (s.backend === 'lsp') {
          await fetchDiagnostics()
        } else {
          setLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check rhizome status')
        setLoading(false)
      }
    }
    init()
  }, [fetchDiagnostics])

  const grouped = groupByFile(diagnostics)
  const sortedFiles = Object.keys(grouped).sort()

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Diagnostics</Title>
        <Button
          disabled={status?.backend !== 'lsp'}
          leftSection={<IconRefresh size={16} />}
          loading={loading}
          onClick={fetchDiagnostics}
          variant='light'
        >
          Refresh
        </Button>
      </Group>

      {error && (
        <Alert
          color='decay'
          title='Error'
        >
          {error}
        </Alert>
      )}

      {status && status.backend !== 'lsp' && (
        <Alert
          color='substrate'
          title='LSP Backend Required'
        >
          LSP backend required for diagnostics. Tree-sitter backend provides symbol analysis only.
        </Alert>
      )}

      {loading && (
        <Group
          justify='center'
          p='xl'
        >
          <Loader />
        </Group>
      )}

      {!loading && !error && status?.backend === 'lsp' && diagnostics.length === 0 && <Text c='dimmed'>No diagnostics found</Text>}

      {!loading &&
        sortedFiles.map((file) => {
          const items = grouped[file]
          const counts = countBySeverity(items)

          return (
            <Card
              key={file}
              padding='md'
              withBorder
            >
              <Group mb='sm'>
                <Text
                  fw={600}
                  size='sm'
                  style={{ fontFamily: 'monospace' }}
                >
                  {file}
                </Text>
                {counts.error > 0 && (
                  <Badge
                    color='gill'
                    size='sm'
                    variant='filled'
                  >
                    {counts.error} {counts.error === 1 ? 'error' : 'errors'}
                  </Badge>
                )}
                {counts.warning > 0 && (
                  <Badge
                    color='substrate'
                    size='sm'
                    variant='filled'
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
                  .sort((a, b) => severityConfig[a.severity].order - severityConfig[b.severity].order || a.line - b.line)
                  .map((item) => {
                    const config = severityConfig[item.severity]
                    const Icon = config.icon

                    return (
                      <Group
                        gap='sm'
                        key={`${item.file}:${item.line}:${item.column}:${item.severity}:${item.message}`}
                        onClick={() => navigate(`/code?file=${encodeURIComponent(item.file)}&line=${item.line}`)}
                        style={{ cursor: 'pointer' }}
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
                          size='sm'
                          style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
                        >
                          {item.line}:{item.column}
                        </Text>
                        {item.code && (
                          <Text
                            c='dimmed'
                            size='xs'
                            style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}
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
            </Card>
          )
        })}
    </Stack>
  )
}
