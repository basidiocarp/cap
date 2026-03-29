import { Table, Text } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

import type { TopicSummary } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'

export function TopicsSection({ topics }: { topics: TopicSummary[] }) {
  const navigate = useNavigate()

  return (
    <SectionCard
      h='100%'
      title='Topics'
    >
      {topics.length > 0 ? (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Topic</Table.Th>
              <Table.Th>Count</Table.Th>
              <Table.Th>Avg Weight</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {topics.map((topic) => (
              <Table.Tr key={topic.topic}>
                <Table.Td>
                  <Text
                    component='button'
                    fw={500}
                    onClick={() => navigate(`/memories?topic=${encodeURIComponent(topic.topic)}`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    variant='link'
                  >
                    {topic.topic}
                  </Text>
                </Table.Td>
                <Table.Td>{topic.count}</Table.Td>
                <Table.Td>{topic.avg_weight.toFixed(3)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <EmptyState>No topics yet</EmptyState>
      )}
    </SectionCard>
  )
}
