import { Alert, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../lib/api'
import type { AllowedStipeAction } from '../lib/onboarding'
import type { EcosystemReadinessModel } from '../lib/readiness'
import { CodexModeChecklist } from './CodexModeChecklist'
import { ReadinessQuickActions } from './ReadinessQuickActions'

interface EcosystemReadinessPanelsProps {
  actionIsRunning?: (actionKey?: AllowedStipeAction) => boolean
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
  readiness: EcosystemReadinessModel
  status: EcosystemStatus
  showRecommendedAction?: boolean
}

export function EcosystemReadinessPanels({
  actionIsRunning,
  onRefresh,
  onRun,
  readiness,
  status,
  showRecommendedAction = true,
}: EcosystemReadinessPanelsProps) {
  return (
    <Stack gap='sm'>
      <CodexModeChecklist status={status} />

      <Alert
        color={readiness.codex.adapter.color}
        title='Codex adapter health'
      >
        {readiness.codex.adapter.detail}
      </Alert>

      <Alert
        color={readiness.hyphaeFlow.color}
        title='Hyphae memory flow'
      >
        <Stack gap='xs'>
          <Text size='sm'>{readiness.hyphaeFlow.detail}</Text>
          <Text
            c='dimmed'
            size='sm'
          >
            {readiness.hyphaeFlow.recommendation}
          </Text>
          <ReadinessQuickActions
            actionIsRunning={actionIsRunning}
            actions={readiness.hyphaeQuickActions}
            onRefresh={onRefresh}
            onRun={onRun}
          />
        </Stack>
      </Alert>

      {showRecommendedAction && readiness.recommendedAction && (
        <Alert
          color='mycelium'
          title='Recommended next step'
        >
          <Stack gap='sm'>
            <Text size='sm'>{readiness.recommendedAction.label}</Text>
            <Text
              c='dimmed'
              ff='monospace'
              size='xs'
            >
              {readiness.recommendedAction.command}
            </Text>
            <ReadinessQuickActions
              actionIsRunning={actionIsRunning}
              actions={readiness.recommendedQuickActions}
              onRefresh={onRefresh}
              onRun={onRun}
            />
          </Stack>
        </Alert>
      )}
    </Stack>
  )
}
