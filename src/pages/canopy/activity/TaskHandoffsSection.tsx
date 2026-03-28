import { Badge, Divider, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { timeAgo } from '../../../lib/time'
import { attentionColor, attentionSummaryLabel, freshnessColor, joinedReasons } from '../canopy-formatters'

export function TaskHandoffsSection({
  handoffs,
  handoffAttentionById,
}: {
  handoffs: CanopyTaskDetail['handoffs']
  handoffAttentionById: Map<string, CanopyTaskDetail['handoff_attention'][number]>
}) {
  return (
    <>
      <Divider label='Handoffs' />
      {handoffs.length > 0 ? (
        <Stack gap='xs'>
          {handoffs.map((handoff) => {
            const attention = handoffAttentionById.get(handoff.handoff_id)

            return (
              <SectionCard
                key={handoff.handoff_id}
                p='sm'
              >
                <Stack gap={4}>
                  <Group gap='xs'>
                    <Badge
                      color={handoff.status === 'open' ? 'yellow' : 'gray'}
                      size='xs'
                      variant='light'
                    >
                      {handoff.status}
                    </Badge>
                    <Badge
                      color='grape'
                      size='xs'
                      variant='outline'
                    >
                      {handoff.handoff_type}
                    </Badge>
                    {attention ? (
                      <>
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
                      </>
                    ) : null}
                  </Group>
                  <Text size='sm'>{handoff.summary}</Text>
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    {handoff.from_agent_id} → {handoff.to_agent_id}
                  </Text>
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Created {timeAgo(handoff.created_at, { allowMonths: true })}
                  </Text>
                  {handoff.due_at ? (
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      Due {timeAgo(handoff.due_at, { allowMonths: true })}
                    </Text>
                  ) : null}
                  {handoff.expires_at ? (
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      Expires {timeAgo(handoff.expires_at, { allowMonths: true })}
                    </Text>
                  ) : null}
                  {attention?.reasons.length ? (
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      Reasons: {joinedReasons(attention.reasons)}
                    </Text>
                  ) : null}
                  {handoff.resolved_at ? (
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      Resolved {timeAgo(handoff.resolved_at, { allowMonths: true })}
                    </Text>
                  ) : null}
                </Stack>
              </SectionCard>
            )
          })}
        </Stack>
      ) : (
        <EmptyState>No handoffs attached to this task.</EmptyState>
      )}
    </>
  )
}
