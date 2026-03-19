import { Alert, Badge, Button, Group, List, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconAlertTriangle, IconInfoCircle, IconRefresh } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'

import type { DiagnosticItem } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { onActivate } from '../lib/keyboard'
import { useDiagnostics, useRhizomeStatus } from '../lib/queries'

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
  const { data: status } = useRhizomeStatus()
  const isLsp = status?.backend === 'lsp'
  const { data: diagnostics = [], error: diagError, isLoading: loading, refetch } = useDiagnostics()

  const error = diagError

  const grouped = groupByFile(diagnostics)
  const sortedFiles = Object.keys(grouped).sort()

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Diagnostics</Title>
        <Button
          disabled={!isLsp}
          leftSection={<IconRefresh size={16} />}
          loading={loading}
          onClick={() => refetch()}
          variant='light'
        >
          Refresh
        </Button>
      </Group>

      <ErrorAlert error={error} />

      {status && !isLsp && (
        <Alert
          color='substrate'
          title='Language Server Required'
        >
          <Text size='sm'>
            Diagnostics (errors, warnings, type issues) require a running language server. Tree-sitter provides symbol extraction only — it
            cannot type-check code.
          </Text>
          <Text
            mt='xs'
            size='sm'
          >
            To enable diagnostics:
          </Text>
          <List
            mt='xs'
            size='sm'
          >
            <List.Item>
              Go to{' '}
              <Text
                c='mycelium'
                component={Link}
                to='/settings'
              >
                Settings → Language Servers
              </Text>{' '}
              and install an LSP server for your language
            </List.Item>
            <List.Item>Rhizome will auto-upgrade to the LSP backend when a server is available</List.Item>
          </List>
        </Alert>
      )}

      {loading && <PageLoader />}

      {!loading && !error && isLsp && diagnostics.length === 0 && <EmptyState>No diagnostics found</EmptyState>}

      {!loading &&
        sortedFiles.map((file) => {
          const items = grouped[file]
          const counts = countBySeverity(items)

          return (
            <SectionCard
              key={file}
              padding='md'
            >
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
        })}
    </Stack>
  )
}
