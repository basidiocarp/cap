import { Badge, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { symbolKindColor } from '../lib/colors'
import { useSymbolSearch } from '../lib/queries'

export function SymbolSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 400)

  const { data: results = [], error, isLoading: loading } = useSymbolSearch(debouncedQuery)

  return (
    <Stack>
      <Title order={2}>Symbol Search</Title>

      <TextInput
        leftSection={<IconSearch size={16} />}
        onChange={(e) => setQuery(e.currentTarget.value)}
        placeholder='Search symbols across your project...'
        value={query}
      />

      <ErrorAlert error={error} />

      {loading && (
        <PageLoader
          mt='md'
          size='sm'
        />
      )}

      {!loading && !error && debouncedQuery.trim() && results.length > 0 && (
        <Text
          c='dimmed'
          size='sm'
        >
          Found {results.length} symbols matching &apos;{debouncedQuery}&apos;
        </Text>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState mt='md'>
          {debouncedQuery.trim()
            ? `No symbols found matching '${debouncedQuery}'`
            : 'Search for functions, classes, types across your project'}
        </EmptyState>
      )}

      {results.length > 0 && (
        <SectionCard>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Symbol Name</Table.Th>
                <Table.Th>Kind</Table.Th>
                <Table.Th>File Path</Table.Th>
                <Table.Th>Line</Table.Th>
                <Table.Th>Signature</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.map((r) => (
                <Table.Tr
                  key={`${r.file}:${r.line}:${r.name}`}
                  onClick={() => navigate(`/code?file=${encodeURIComponent(r.file)}&symbol=${encodeURIComponent(r.name)}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Text
                      fw={500}
                      size='sm'
                    >
                      {r.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={symbolKindColor(r.kind)}
                      size='sm'
                      variant='light'
                    >
                      {r.kind}
                    </Badge>
                  </Table.Td>
                  <Table.Td maw={300}>
                    <Text
                      c='dimmed'
                      lineClamp={1}
                      size='sm'
                    >
                      {r.file}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{r.line}</Text>
                  </Table.Td>
                  <Table.Td maw={350}>
                    {r.signature && (
                      <Text
                        ff='monospace'
                        lineClamp={1}
                        size='xs'
                      >
                        {r.signature}
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}
