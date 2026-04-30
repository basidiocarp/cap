import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { OnboardingAction } from '../lib/onboarding'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { StipeActionFeedback } from '../components/StipeActionFeedback'
import { ToolingUnavailableState } from '../components/ToolingUnavailableState'
import { useEcosystemStatusController } from '../lib/ecosystem-status'
import { getCodexModeGuidance } from '../lib/host-guidance'
import { failingDoctorChecks, initPlanSteps, missingLifecycleHooks } from '../lib/onboarding'
import { getEcosystemReadinessModel, getHostCoverageView } from '../lib/readiness'
import { useStipeActionController } from '../lib/stipe-actions'
import { useHostCoverageStore } from '../store/host-coverage'
import { OnboardCoverageSection } from './onboard/OnboardCoverageSection'
import { OnboardDetectedIssuesSection } from './onboard/OnboardDetectedIssuesSection'
import { OnboardInitPlanSection } from './onboard/OnboardInitPlanSection'
import { OnboardingActionsLayout } from './onboard/OnboardingActionsLayout'

export function Onboard() {
  const { refreshAll, repairPlanQuery, statusQuery } = useEcosystemStatusController()
  const { data: status, error, isLoading } = statusQuery
  const { actionIsRunning, actionWasLastRun, runAction: runStipeAction, runStipe } = useStipeActionController()
  const hostCoverageMode = useHostCoverageStore((state) => state.mode)
  const setHostCoverageMode = useHostCoverageStore((state) => state.setMode)

  if (isLoading || repairPlanQuery.isLoading) {
    return <PageLoader mt='xl' />
  }

  if (!status) {
    return (
      <Stack>
        <Title order={2}>Onboarding</Title>

        <ErrorAlert error={error ?? new Error('No status data available')} />

        <ToolingUnavailableState
          description='Cap could not load the current ecosystem status, so it cannot build a guided onboarding plan yet.'
          hint='Onboarding derives its repair steps from the same live health data as Status. If this persists, check Status first to confirm the ecosystem is reachable, then open Settings to verify local tool configuration.'
          includeOnboardingLink={false}
          onRetry={refreshAll}
          retryLabel='Retry loading onboarding'
          title='Onboarding is unavailable'
        />
      </Stack>
    )
  }

  const readiness = getEcosystemReadinessModel(status, repairPlanQuery.data)
  const failingChecks = failingDoctorChecks(repairPlanQuery.data)
  const lifecycleGaps = missingLifecycleHooks(status)
  const steps = initPlanSteps(repairPlanQuery.data)
  const codexGuidance = getCodexModeGuidance()
  const hostCoverage = getHostCoverageView(status, hostCoverageMode)
  const { summary } = readiness
  const requiredCoverageTitle = hostCoverage.requiredSectionTitle
  const optionalCoverageTitle = hostCoverage.optionalSectionTitle

  function runOnboardingAction(action: OnboardingAction) {
    if (action.runAction) {
      runStipeAction(action.runAction)
    }
  }

  function actionRecentlyRan(action: OnboardingAction) {
    return actionWasLastRun(action.runAction)
  }

  function actionIsPending(action: OnboardingAction) {
    return actionIsRunning(action.runAction)
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <div>
          <Title order={2}>Onboarding</Title>
          <Text
            c='dimmed'
            size='sm'
          >
            {summary}
          </Text>
        </div>
        <Group>
          <Button
            component={Link}
            leftSection={<IconArrowLeft size={14} />}
            to='/status'
            variant='subtle'
          >
            Back to status
          </Button>
          <Button
            leftSection={<IconRefresh size={14} />}
            onClick={refreshAll}
            variant='subtle'
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <OnboardCoverageSection
        actionIsRunning={actionIsRunning}
        codexGuidance={codexGuidance.detail}
        hostCoverageMode={hostCoverageMode}
        lifecycleGaps={lifecycleGaps}
        onModeChange={setHostCoverageMode}
        onRefresh={refreshAll}
        onRun={runStipeAction}
        readiness={readiness}
        repairPlanUnavailable={repairPlanQuery.isError}
        status={status}
      />

      <OnboardDetectedIssuesSection checks={failingChecks} />

      <OnboardInitPlanSection steps={steps} />

      <OnboardingActionsLayout
        groups={readiness.groups}
        onRun={runOnboardingAction}
        optionalCoverageTitle={optionalCoverageTitle}
        recentlyRan={actionRecentlyRan}
        requiredCoverageTitle={requiredCoverageTitle}
        running={actionIsPending}
      />

      <StipeActionFeedback
        mutation={runStipe}
        showOutput
      />
    </Stack>
  )
}
