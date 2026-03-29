import { Badge, Group, ScrollArea, Table, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

import type { SearchResult } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { symbolKindColor } from '../../lib/colors'
import { onActivate } from '../../lib/keyboard'
import { codeExplorerHref } from '../../lib/routes'

export function SymbolSearchResults({ query, results }: { query: string; results: SearchResult[] }) {
  const navigate = useNavigate()

  return (
    <>
      <Group justify='space-between'>
        <Text
          c='dimmed'
          size='sm'
        >
          {results.length} symbols matching &lsquo;{query}&rsquo;
        </Text>
        <Group gap={4}>
          {Object.entries(
            results.reduce(
              (acc, result) => {
                acc[result.kind] = (acc[result.kind] || 0) + 1
                return acc
              },
              {} as Record<string, number>
            )
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([kind, count]) => (
              <Badge
                color={symbolKindColor(kind)}
                key={kind}
                size='xs'
                variant='light'
              >
                {kind}: {count}
              </Badge>
            ))}
        </Group>
      </Group>

      <SectionCard>
        <ScrollArea>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Symbol</Table.Th>
                <Table.Th w={80}>Kind</Table.Th>
                <Table.Th>File</Table.Th>
                <Table.Th w={60}>Line</Table.Th>
                <Table.Th>Signature</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.map((result) => (
                <Table.Tr
                  key={`${result.file}:${result.line}:${result.name}`}
                  onClick={() => navigate(codeExplorerHref({ file: result.file, symbol: result.name }))}
                  onKeyDown={onActivate(() => navigate(codeExplorerHref({ file: result.file, symbol: result.name })))}
                  style={{ cursor: 'pointer' }}
                  tabIndex={0}
                >
                  <Table.Td>
                    <Text
                      fw={500}
                      size='sm'
                    >
                      {result.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={symbolKindColor(result.kind)}
                      size='xs'
                      variant='light'
                    >
                      {result.kind}
                    </Badge>
                  </Table.Td>
                  <Table.Td maw={300}>
                    <Text
                      c='dimmed'
                      ff='monospace'
                      size='xs'
                      truncate='end'
                    >
                      {result.file}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      ff='monospace'
                      size='xs'
                    >
                      {result.line}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      c='dimmed'
                      ff='monospace'
                      size='xs'
                      truncate='end'
                    >
                      {result.signature || '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </SectionCard>
    </>
  )
}
