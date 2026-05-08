import { Badge, Card, Grid, Group, Table, Stack, Text, TextInput, ThemeIcon, UnstyledButton } from '@mantine/core'
import { IconBrain, IconChartBar, IconCommand, IconGraph, IconHeartbeat } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

import type { DashboardVariantProps } from './DashboardOperator'
import { AnomalyList, type Anomaly } from '../../../components/AnomalyList'
import { HealthStrip } from '../../../components/HealthStrip'
import { SectionCard } from '../../../components/SectionCard'

export function DashboardFieldLab({
  gain,
  stats,
  topics,
  health,
  ecosystemStatus,
  sessions,
}: DashboardVariantProps) {
  const navigate = useNavigate()
  const avgSavingsPct = gain?.avg_savings_pct ?? gain?.summary?.avg_savings_pct ?? null

  const toolsStatus = [
    { name: 'mycelium', status: 'up' as const },
    { name: 'hyphae', status: 'up' as const },
    { name: 'rhizome', status: 'up' as const },
  ]

  const PLACEHOLDER_ANOMALIES: Anomaly[] = [
    { id: '1', severity: 'warn', title: 'Hyphae index stale', detail: 'Last indexed 4 hours ago — search recall may be degraded.' },
  ]

  const quickActions = [
    {
      label: 'Search memories',
      icon: IconBrain,
      color: 'mycelium',
      onClick: () => navigate('/memories'),
    },
    {
      label: 'View memoir graph',
      icon: IconGraph,
      color: 'spore',
      onClick: () => navigate('/memoir-graph'),
    },
    {
      label: 'Run analytics',
      icon: IconChartBar,
      color: 'fruiting',
      onClick: () => navigate('/analytics'),
    },
    {
      label: 'Check status',
      icon: IconHeartbeat,
      color: 'substrate',
      onClick: () => navigate('/status'),
    },
  ]

  return (
    <Stack gap='md'>
      {/* Health Strip */}
      <HealthStrip tools={toolsStatus} tokensSaved={gain?.summary?.total_saved ?? undefined} />

      {/* Anomaly List */}
      <AnomalyList anomalies={PLACEHOLDER_ANOMALIES} />

      {/* Command Bar */}
      <TextInput
        leftSection={<IconCommand size={16} />}
        placeholder='search memories, topics, commands...'
        radius='md'
        rightSection={
          <Text c='dimmed' ff='monospace' size='xs'>
            ⌘K
          </Text>
        }
        size='md'
      />

      {/* Stats Strip */}
      <Grid gutter='sm'>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding='sm' radius='md' withBorder>
            <Text c='dimmed' size='xs'>
              total memories
            </Text>
            <Text c='mycelium.7' ff='monospace' fw={700} fz='xl'>
              {stats.total_memories}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding='sm' radius='md' withBorder>
            <Text c='dimmed' size='xs'>
              total topics
            </Text>
            <Text c='spore.6' ff='monospace' fw={700} fz='xl'>
              {stats.total_topics}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding='sm' radius='md' withBorder>
            <Text c='dimmed' size='xs'>
              avg weight
            </Text>
            <Text c='substrate.6' ff='monospace' fw={700} fz='xl'>
              {stats.avg_weight?.toFixed(3) ?? '—'}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <Card padding='sm' radius='md' withBorder>
            <Text c='dimmed' size='xs'>
              token savings %
            </Text>
            <Text c='fruiting.6' ff='monospace' fw={700} fz='xl'>
              {avgSavingsPct !== null ? `${avgSavingsPct.toFixed(1)}%` : '—'}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Two-column grid */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <SectionCard title='Top Topics'>
            {topics.length > 0 ? (
              <Table highlightOnHover striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Topic</Table.Th>
                    <Table.Th style={{ width: '80px' }}>Memories</Table.Th>
                    <Table.Th style={{ width: '100px' }}>Health</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {topics.slice(0, 10).map((topic) => {
                    const healthItem = health.find((h) => h.topic === topic.topic)
                    const healthColor = healthItem?.avg_weight ? (healthItem.avg_weight > 0.7 ? 'mycelium' : healthItem.avg_weight > 0.4 ? 'substrate' : 'decay') : 'gray'

                    return (
                      <Table.Tr key={topic.topic}>
                        <Table.Td>
                          <Text size='sm'>{topic.topic}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>{topic.count}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={healthColor} size='xs' variant='light'>
                            {topic.avg_weight.toFixed(3)}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c='dimmed' size='sm'>
                No topics yet
              </Text>
            )}
          </SectionCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <SectionCard title='Quick Actions'>
            <Stack gap='xs'>
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <UnstyledButton
                    key={action.label}
                    onClick={action.onClick}
                    style={{ borderRadius: 6, padding: '8px 12px', width: '100%' }}
                  >
                    <Group gap='sm'>
                      <ThemeIcon color={action.color} size='sm' variant='light'>
                        <Icon size={14} />
                      </ThemeIcon>
                      <Text size='sm'>{action.label}</Text>
                    </Group>
                  </UnstyledButton>
                )
              })}
            </Stack>
          </SectionCard>
        </Grid.Col>
      </Grid>

      {/* Ecosystem Status */}
      {ecosystemStatus && (
        <Group gap='xs'>
          <Badge color={ecosystemStatus.mycelium.available ? 'mycelium' : 'red'} variant='light'>
            Mycelium {ecosystemStatus.mycelium.available ? '✓' : '✗'}
          </Badge>
          <Badge color={ecosystemStatus.hyphae.available ? 'substrate' : 'red'} variant='light'>
            Hyphae {ecosystemStatus.hyphae.available ? '✓' : '✗'}
          </Badge>
          <Badge color={ecosystemStatus.rhizome.available ? 'fruiting' : 'red'} variant='light'>
            Rhizome {ecosystemStatus.rhizome.available ? '✓' : '✗'}
          </Badge>
        </Group>
      )}

      {/* Recent Sessions */}
      <SectionCard title='Recent Sessions'>
        {sessions.length > 0 ? (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Session</Table.Th>
                <Table.Th style={{ width: '100px' }}>Tokens</Table.Th>
                <Table.Th style={{ width: '80px' }}>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.slice(0, 5).map((session) => (
                <Table.Tr key={session.id}>
                  <Table.Td>
                    <Text size='sm'>{session.id.slice(0, 8)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>—</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={session.status === 'completed' ? 'mycelium' : 'gray'} size='xs' variant='light'>
                      {session.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c='dimmed' size='sm'>
            No sessions yet
          </Text>
        )}
      </SectionCard>
    </Stack>
  )
}
