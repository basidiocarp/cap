import { Button, Group, Stack, Title } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'

import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { useDiagnostics, useRhizomeStatus } from '../../lib/queries'
import { DiagnosticsFileSection } from './DiagnosticsFileSection'
import { DiagnosticsUnavailableAlert } from './DiagnosticsUnavailableAlert'
import { groupByFile } from './diagnostic-helpers'

export function DiagnosticsPage() {
  const { data: status } = useRhizomeStatus()
  const isLsp = status?.backend === 'lsp'
  const { data: diagnostics = [], error, isLoading: loading, refetch } = useDiagnostics()

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

      {status && !isLsp && <DiagnosticsUnavailableAlert />}

      {loading && <PageLoader />}

      {!loading && !error && isLsp && diagnostics.length === 0 && <EmptyState>No diagnostics found</EmptyState>}

      {!loading &&
        sortedFiles.map((file) => (
          <DiagnosticsFileSection
            file={file}
            items={grouped[file]}
            key={file}
          />
        ))}
    </Stack>
  )
}
