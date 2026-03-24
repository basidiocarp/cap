import { Badge, Button, Group, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { EcosystemStatus, StipeRepairPlan } from '../../lib/api'
import { CodexModeChecklist } from '../../components/CodexModeChecklist'
import { SectionCard } from '../../components/SectionCard'
import { getEcosystemReadinessModel } from '../../lib/readiness'

export function StatusGettingStartedCard({ repairPlan, status }: { repairPlan?: StipeRepairPlan; status: EcosystemStatus }) {
  const readiness = getEcosystemReadinessModel(status, repairPlan)
  const actions = [...readiness.groups.primary, ...readiness.groups.secondary].slice(0, 3)

  return (
    <SectionCard title='Codex mode'>
      <Stack gap='sm'>
        <Text size='sm'>{readiness.summary}</Text>
        <CodexModeChecklist status={status} />
        <Text
          c='dimmed'
          size='sm'
        >
          Active project: {status.project.active}
        </Text>
        <Group gap='xs'>
          <Badge
            color={readiness.codex.mode.color}
            size='sm'
            variant='light'
          >
            {readiness.codex.mode.label}
          </Badge>
          <Badge
            color={readiness.hyphaeFlow.color}
            size='sm'
            variant='light'
          >
            {readiness.hyphaeFlow.label}
          </Badge>
        </Group>
        <Group gap='xs'>
          {actions.map((action) => (
            <Badge
              color={action.tier === 'primary' ? 'mycelium' : 'substrate'}
              key={action.command}
              size='sm'
              variant='light'
            >
              {action.command}
            </Badge>
          ))}
        </Group>
        <Text
          c='dimmed'
          size='sm'
        >
          Best next step: {readiness.recommendedAction?.command ?? 'Open onboarding for guided repair'}
        </Text>
        <Button
          component={Link}
          leftSection={<IconAlertCircle size={14} />}
          to='/onboard'
          variant='light'
        >
          Open onboarding
        </Button>
        <Group gap='xs'>
          <Button
            component={Link}
            size='xs'
            to='/code'
            variant='subtle'
          >
            Open code explorer
          </Button>
          <Button
            component={Link}
            size='xs'
            to='/memories'
            variant='subtle'
          >
            Review memories
          </Button>
        </Group>
      </Stack>
    </SectionCard>
  )
}
