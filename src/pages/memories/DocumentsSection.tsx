import { Badge, Button, Table, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import { ActionEmptyState } from '../../components/ActionEmptyState'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { useIngestionSources } from '../../lib/queries'
import { timeAgo } from '../../lib/time'

export function DocumentsSection() {
  const { data: sources = [], isLoading } = useIngestionSources()

  if (isLoading) {
    return <PageLoader size='sm' />
  }

  if (sources.length === 0) {
    return (
      <SectionCard title='Ingested Documents'>
        <ActionEmptyState
          actions={
            <>
              <Button
                component={Link}
                size='xs'
                to='/status'
                variant='light'
              >
                Check status
              </Button>
              <Button
                component={Link}
                size='xs'
                to='/memoirs'
                variant='subtle'
              >
                Open memoirs
              </Button>
            </>
          }
          description='No ingested documents are indexed yet.'
          hint='Documents are usually created during context-gathering or RAG-style workflows. If you expected indexed material already, check Hyphae status first.'
          title='No documents yet'
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard title='Ingested Documents'>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>File Path</Table.Th>
            <Table.Th>Chunks</Table.Th>
            <Table.Th>Last Ingested</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map((source) => (
            <Table.Tr key={source.source_path}>
              <Table.Td>
                <Text
                  ff='monospace'
                  size='sm'
                >
                  {source.source_path}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color='spore'
                  size='sm'
                  variant='light'
                >
                  {source.chunk_count}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{source.last_ingested ? timeAgo(source.last_ingested) : '—'}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </SectionCard>
  )
}
