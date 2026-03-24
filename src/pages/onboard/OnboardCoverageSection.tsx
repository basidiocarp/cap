import { Alert, Text } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import type { AllowedStipeAction } from '../../lib/onboarding'
import type { EcosystemReadinessModel, HostCoverageMode } from '../../lib/readiness'
import { EcosystemReadinessPanels } from '../../components/EcosystemReadinessPanels'
import { HostCoveragePanel } from '../../components/HostCoveragePanel'
import { SectionCard } from '../../components/SectionCard'

interface OnboardCoverageSectionProps {
  actionIsRunning?: (actionKey?: AllowedStipeAction) => boolean
  codexGuidance: string
  hostCoverageMode: HostCoverageMode
  lifecycleGaps: string[]
  onModeChange: (mode: HostCoverageMode) => void
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
  readiness: EcosystemReadinessModel
  repairPlanUnavailable: boolean
  status: EcosystemStatus
}

export function OnboardCoverageSection({
  actionIsRunning,
  codexGuidance,
  hostCoverageMode,
  lifecycleGaps,
  onModeChange,
  onRefresh,
  onRun,
  readiness,
  repairPlanUnavailable,
  status,
}: OnboardCoverageSectionProps) {
  return (
    <SectionCard title='Host coverage'>
      <HostCoveragePanel
        mode={hostCoverageMode}
        onModeChange={onModeChange}
        showProjectContext
        status={status}
        summary={<Text size='sm'>{codexGuidance}</Text>}
      >
        <EcosystemReadinessPanels
          actionIsRunning={actionIsRunning}
          onRefresh={onRefresh}
          onRun={onRun}
          readiness={readiness}
          status={status}
        />

        {status.agents.claude_code.adapter.configured && lifecycleGaps.length > 0 && (
          <Alert
            color='gray'
            title='Claude coverage needs repair'
          >
            Missing recommended lifecycle events: {lifecycleGaps.join(', ')}
          </Alert>
        )}

        {repairPlanUnavailable && (
          <Alert
            color='orange'
            title='Using fallback onboarding guidance'
          >
            Structured Stipe repair data was unavailable, so this page is using status-based suggestions only.
          </Alert>
        )}
      </HostCoveragePanel>
    </SectionCard>
  )
}
