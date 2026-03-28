import { Badge, Divider, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { timeAgo } from '../../../lib/time'
import { attentionColor, attentionSummaryLabel, freshnessColor, joinedReasons } from '../canopy-formatters'

export function TaskAgentAttentionSection({
  agentAttention,
  agentHeartbeatSummaryById,
}: {
  agentAttention: CanopyTaskDetail['agent_attention']
  agentHeartbeatSummaryById: Map<string, CanopyTaskDetail['agent_heartbeat_summaries'][number]>
}) {
  return (
    <>
      <Divider label='Agent Attention' />
      {agentAttention.length > 0 ? (
        <Stack gap='xs'>
          {agentAttention.map((attention) => (
            <SectionCard
              key={attention.agent_id}
              p='sm'
            >
              <Stack gap={4}>
                <Group justify='space-between'>
                  <Group gap='xs'>
                    <Badge
                      color={attentionColor(attention.level)}
                      size='xs'
                      variant='light'
                    >
                      {attentionSummaryLabel(attention.level)}
                    </Badge>
                    <Badge
                      color={freshnessColor(attention.freshness)}
                      size='xs'
                      variant='outline'
                    >
                      {attention.freshness}
                    </Badge>
                  </Group>
                  {attention.last_heartbeat_at ? (
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {timeAgo(attention.last_heartbeat_at, { allowMonths: true })}
                    </Text>
                  ) : null}
                </Group>
                <Text size='sm'>Agent: {attention.agent_id}</Text>
                {attention.current_task_id ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Current task {attention.current_task_id}
                  </Text>
                ) : null}
                {agentHeartbeatSummaryById.get(attention.agent_id) ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Heartbeats {agentHeartbeatSummaryById.get(attention.agent_id)?.heartbeat_count} · latest status{' '}
                    {agentHeartbeatSummaryById.get(attention.agent_id)?.last_status ?? 'unknown'}
                  </Text>
                ) : null}
                {attention.reasons.length ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Reasons: {joinedReasons(attention.reasons)}
                  </Text>
                ) : null}
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      ) : (
        <EmptyState>No agent attention summary for this task yet.</EmptyState>
      )}
    </>
  )
}
