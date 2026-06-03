import { Badge, Button, Stack, Table, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'

import { ActionEmptyState } from '../../components/ActionEmptyState'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { useMemoryIndex } from '../../lib/queries'

export function FileMemorySection() {
  const { data, isLoading } = useMemoryIndex()

  if (isLoading) {
    return <PageLoader size='sm' />
  }

  const entries = data?.entries ?? []
  const orphanFiles = data?.orphanFiles ?? []

  if (entries.length === 0 && orphanFiles.length === 0) {
    return (
      <SectionCard title='File Memory Index'>
        <ActionEmptyState
          actions={
            <Button
              component={Link}
              size='xs'
              to='/status'
              variant='light'
            >
              Check status
            </Button>
          }
          description='No file-based memory index was found for this project.'
          hint='Claude Code writes a MEMORY.md index under ~/.claude/projects/<project>/memory/. This surface works even when the Hyphae database is unavailable.'
          title='No file memory yet'
        />
      </SectionCard>
    )
  }

  return (
    <SectionCard title='File Memory Index'>
      <Stack gap='md'>
        {entries.length > 0 ? (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>File</Table.Th>
                <Table.Th>Hook</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((entry) => (
                <Table.Tr key={`${entry.file}:${entry.lineNumber}`}>
                  <Table.Td>
                    <Text size='sm'>{entry.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      ff='monospace'
                      size='sm'
                    >
                      {entry.file}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      {entry.hook || '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : null}

        {orphanFiles.length > 0 ? (
          <div>
            <Text
              fw={500}
              mb='xs'
              size='sm'
            >
              Orphan files (not in index)
            </Text>
            <Stack gap={4}>
              {orphanFiles.map((file) => (
                <Badge
                  color='yellow'
                  key={file}
                  size='sm'
                  variant='light'
                >
                  {file}
                </Badge>
              ))}
            </Stack>
          </div>
        ) : null}
      </Stack>
    </SectionCard>
  )
}
