import { Badge, Grid, Group, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import type { AllowedStipeAction } from '../../lib/onboarding'
import type { EcosystemReadinessModel } from '../../lib/readiness'
import { ReadinessQuickActions } from '../../components/ReadinessQuickActions'
import { getToolQuickActions } from '../../lib/readiness'
import { StatusToolCard } from './StatusToolCard'

export function RhizomeStatusCard({
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
  return (
    <Grid.Col span={{ base: 12, lg: 6, md: 12 }}>
      <StatusToolCard
        available={status.rhizome.available}
        description='Code intelligence engine'
        title='Rhizome'
      >
        {status.rhizome.backend && (
          <Badge
            color='lichen'
            mb='sm'
            size='sm'
            variant='light'
          >
            {status.rhizome.backend}
          </Badge>
        )}
        {status.rhizome.languages.length > 0 && (
          <Stack gap='xs'>
            <Text size='sm'>{status.rhizome.languages.length} languages supported</Text>
            <Group gap={4}>
              {status.rhizome.languages.map((lang) => (
                <Badge
                  color='lichen'
                  key={lang}
                  size='xs'
                  variant='outline'
                >
                  {lang}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}
        {!status.rhizome.available && (
          <Stack gap='xs'>
            <Text
              c='dimmed'
              mt='sm'
              size='xs'
            >
              No Rhizome backend is detected yet. Install with: cargo install rhizome, or open onboarding for the repair path.
            </Text>
            <ReadinessQuickActions
              actionIsRunning={actionIsRunning}
              actions={getToolQuickActions('rhizome', readiness, status)}
              onRefresh={onRefresh}
              onRun={onRun}
            />
          </Stack>
        )}
        {status.rhizome.available && (
          <ReadinessQuickActions
            actions={getToolQuickActions('rhizome', readiness, status)}
            onRefresh={onRefresh}
            onRun={onRun}
          />
        )}
      </StatusToolCard>
    </Grid.Col>
  )
}
