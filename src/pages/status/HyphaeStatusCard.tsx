import { Badge, Grid, Group, Stack, Text } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

import type { EcosystemStatus } from '../../lib/api'
import type { AllowedStipeAction } from '../../lib/onboarding'
import type { EcosystemReadinessModel } from '../../lib/readiness'
import { ReadinessQuickActions } from '../../components/ReadinessQuickActions'
import { getToolQuickActions } from '../../lib/readiness'
import { StatusToolCard } from './StatusToolCard'

export function HyphaeStatusCard({
  actionIsRunning,
  onRefresh,
  onRun,
  readiness,
  status,
}: {
  actionIsRunning: (actionKey?: AllowedStipeAction) => boolean
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
  readiness: EcosystemReadinessModel
  status: EcosystemStatus
}) {
  const hyphaeFlow = readiness.hyphaeFlow

  return (
    <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
      <StatusToolCard
        available={status.hyphae.available}
        description='Persistent memory store'
        title='Hyphae'
      >
        <Stack gap='xs'>
          <Group justify='space-between'>
            {status.hyphae.version && (
              <Badge
                color='spore'
                size='sm'
                variant='light'
              >
                v{status.hyphae.version}
              </Badge>
            )}
            <Badge
              color={hyphaeFlow.color}
              leftSection={hyphaeFlow.label === 'Flowing' ? <IconCircleCheck size={12} /> : <IconAlertCircle size={12} />}
              size='sm'
              variant='light'
            >
              {hyphaeFlow.label}
            </Badge>
          </Group>

          <Text
            c='dimmed'
            size='sm'
          >
            {hyphaeFlow.detail}
          </Text>

          {status.hyphae.available && (
            <Group gap='xs'>
              <Badge
                color='spore'
                size='sm'
                variant='outline'
              >
                {status.hyphae.memories} memories
              </Badge>
              <Badge
                color='spore'
                size='sm'
                variant='outline'
              >
                {status.hyphae.memoirs} memoirs
              </Badge>
              <Badge
                color='gray'
                size='sm'
                variant='outline'
              >
                {status.hyphae.activity.codex_memory_count} Codex
              </Badge>
            </Group>
          )}

          {status.hyphae.activity.last_session_topic && (
            <Text
              c='dimmed'
              size='xs'
            >
              Last session topic: {status.hyphae.activity.last_session_topic}
            </Text>
          )}

          <ReadinessQuickActions
            actionIsRunning={actionIsRunning}
            actions={getToolQuickActions('hyphae', readiness, status)}
            onRefresh={onRefresh}
            onRun={onRun}
          />

          {!status.hyphae.available && (
            <Text
              c='dimmed'
              size='xs'
            >
              Install with: cargo install hyphae
            </Text>
          )}
        </Stack>
      </StatusToolCard>
    </Grid.Col>
  )
}
