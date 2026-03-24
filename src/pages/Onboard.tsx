import { Alert, Button, Grid, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { OnboardingAction } from '../lib/onboarding'
import { EcosystemReadinessPanels } from '../components/EcosystemReadinessPanels'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { ProjectSelector } from '../components/ProjectSelector'
import { SectionCard } from '../components/SectionCard'
import { StipeActionFeedback } from '../components/StipeActionFeedback'
import { useEcosystemStatusController } from '../lib/ecosystem-status'
import { getCodexModeGuidance } from '../lib/host-guidance'
import { failingDoctorChecks, initPlanSteps, missingLifecycleHooks } from '../lib/onboarding'
import { getEcosystemReadinessModel } from '../lib/readiness'
import { useStipeActionController } from '../lib/stipe-actions'
import { InitStepCard } from './onboard/InitStepCard'
import { IssueCard } from './onboard/IssueCard'
import { OnboardingActionSection } from './onboard/OnboardingActionSection'

export function Onboard() {
  const { refreshAll, repairPlanQuery, statusQuery } = useEcosystemStatusController()
  const { data: status, error, isLoading } = statusQuery
  const { actionIsRunning, actionWasLastRun, runAction: runStipeAction, runStipe } = useStipeActionController()

  if (isLoading || repairPlanQuery.isLoading) {
    return <PageLoader mt='xl' />
  }

  if (!status) {
    return <ErrorAlert error={error ?? new Error('No status data available')} />
  }

  const readiness = getEcosystemReadinessModel(status, repairPlanQuery.data)
  const {
    manual: manualActions,
    optionalClaude: optionalClaudeActions,
    optionalCore: otherOptionalActions,
    primary: primaryActions,
  } = readiness.groups
  const failingChecks = failingDoctorChecks(repairPlanQuery.data)
  const lifecycleGaps = missingLifecycleHooks(status)
  const steps = initPlanSteps(repairPlanQuery.data)
  const codexGuidance = getCodexModeGuidance()
  const { summary } = readiness

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
            leftSection={<IconArrowRight size={14} />}
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

      <SectionCard title='Codex mode'>
        <Stack gap='sm'>
          <Text size='sm'>{codexGuidance.detail}</Text>
          <Group
            align='start'
            justify='space-between'
          >
            <Text
              c='dimmed'
              ff='monospace'
              size='xs'
            >
              Active project: {status.project.active}
            </Text>
            <ProjectSelector variant='button' />
          </Group>

          <EcosystemReadinessPanels
            actionIsRunning={actionIsRunning}
            onRefresh={refreshAll}
            onRun={runStipeAction}
            readiness={readiness}
            status={status}
          />

          {status.agents.claude_code.adapter.configured && lifecycleGaps.length > 0 && (
            <Alert
              color='gray'
              title='Optional Claude coverage is incomplete'
            >
              Missing recommended lifecycle events: {lifecycleGaps.join(', ')}
            </Alert>
          )}

          {repairPlanQuery.isError && (
            <Alert
              color='orange'
              title='Using fallback onboarding guidance'
            >
              Structured Stipe repair data was unavailable, so this page is using status-based suggestions only.
            </Alert>
          )}
        </Stack>
      </SectionCard>

      {failingChecks.length > 0 && (
        <SectionCard title='Detected issues'>
          <Stack gap='md'>
            {failingChecks.map((check) => (
              <IssueCard
                check={check}
                key={check.name}
              />
            ))}
          </Stack>
        </SectionCard>
      )}

      {steps.length > 0 && (
        <SectionCard title='What stipe init will do'>
          <Stack gap='md'>
            {steps.map((step) => (
              <InitStepCard
                key={`${step.status}-${step.title}`}
                step={step}
              />
            ))}
          </Stack>
        </SectionCard>
      )}

      {primaryActions.length > 0 && (
        <OnboardingActionSection
          actions={primaryActions}
          emptyMessage='No required Codex steps are needed right now.'
          onRun={runOnboardingAction}
          recentlyRan={actionRecentlyRan}
          running={actionIsPending}
          title='Required Codex steps'
        />
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <OnboardingActionSection
            actions={optionalClaudeActions}
            emptyMessage='No Claude-specific steps are needed right now.'
            onRun={runOnboardingAction}
            recentlyRan={actionRecentlyRan}
            running={actionIsPending}
            title='Optional Claude steps'
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <OnboardingActionSection
            actions={otherOptionalActions}
            emptyMessage='No extra profiles are needed right now.'
            onRun={runOnboardingAction}
            recentlyRan={actionRecentlyRan}
            running={actionIsPending}
            title='Other optional profiles'
          />
        </Grid.Col>
      </Grid>

      <OnboardingActionSection
        actions={manualActions}
        emptyMessage='No direct tool installs are needed right now.'
        onRun={runOnboardingAction}
        recentlyRan={actionRecentlyRan}
        running={actionIsPending}
        title='Required tool installs'
      />

      <StipeActionFeedback
        mutation={runStipe}
        showOutput
      />
    </Stack>
  )
}
