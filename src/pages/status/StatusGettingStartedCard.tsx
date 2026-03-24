import { Badge, Button, Group, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { EcosystemStatus, StipeRepairPlan } from '../../lib/api'
import { EcosystemReadinessPanels } from '../../components/EcosystemReadinessPanels'
import { HostCoveragePanel } from '../../components/HostCoveragePanel'
import { SectionCard } from '../../components/SectionCard'
import { StipeActionFeedback } from '../../components/StipeActionFeedback'
import { getEcosystemReadinessModel } from '../../lib/readiness'
import { useStipeActionController } from '../../lib/stipe-actions'
import { useHostCoverageStore } from '../../store/host-coverage'

export function StatusGettingStartedCard({
  onRefresh,
  repairPlan,
  hostCoverageMode,
  status,
}: {
  hostCoverageMode: 'auto' | 'both' | 'claude' | 'codex'
  onRefresh: () => void
  repairPlan?: StipeRepairPlan
  status: EcosystemStatus
}) {
  const readiness = getEcosystemReadinessModel(status, repairPlan)
  const actions = [...readiness.groups.primary, ...readiness.groups.secondary].slice(0, 3)
  const { actionIsRunning, runAction, runStipe } = useStipeActionController()
  const setHostCoverageMode = useHostCoverageStore((state) => state.setMode)

  return (
    <SectionCard title='Host coverage'>
      <HostCoveragePanel
        mode={hostCoverageMode}
        onModeChange={setHostCoverageMode}
        showProjectContext
        status={status}
        summary={<Text size='sm'>{readiness.summary}</Text>}
      >
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
        <EcosystemReadinessPanels
          actionIsRunning={actionIsRunning}
          onRefresh={onRefresh}
          onRun={runAction}
          readiness={readiness}
          status={status}
        />
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
        <StipeActionFeedback mutation={runStipe} />
      </HostCoveragePanel>
    </SectionCard>
  )
}
