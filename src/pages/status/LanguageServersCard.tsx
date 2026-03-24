import { Badge, Stack, Table, Text } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'

export function LanguageServersCard({ status }: { status: EcosystemStatus }) {
  const installed = status.lsps.filter((lsp) => lsp.available)
  const missing = status.lsps.filter((lsp) => !lsp.available)

  return (
    <SectionCard title='Language Servers'>
      {installed.length === 0 ? (
        <Text
          c='dimmed'
          size='sm'
        >
          No language servers detected.
        </Text>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Server</Table.Th>
              <Table.Th>Language</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {installed.map((lsp) => (
              <Table.Tr key={lsp.bin}>
                <Table.Td>
                  <Text size='sm'>{lsp.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{lsp.language}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={lsp.running ? 'mycelium' : 'chitin'}
                    size='sm'
                    variant='light'
                  >
                    {lsp.running ? 'Running' : 'Installed'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {missing.length > 0 && (
        <Stack
          gap='xs'
          mt='md'
        >
          <Text
            c='dimmed'
            size='xs'
          >
            Not found: {missing.map((lsp) => lsp.name).join(', ')}
          </Text>
        </Stack>
      )}
    </SectionCard>
  )
}
