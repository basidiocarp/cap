import { Alert, Badge, Button, Card, CopyButton, Grid, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconAlertCircle, IconArrowRight, IconCopy, IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { StipeDoctorCheck, StipeInitStep } from '../lib/api'
import { CodexModeChecklist } from '../components/CodexModeChecklist'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { ProjectSelector } from '../components/ProjectSelector'
import { SectionCard } from '../components/SectionCard'
import { getCodexPresentationModel } from '../lib/codex'
import {
  buildOnboardingActions,
  failingDoctorChecks,
  getOnboardingActionGroups,
  initPlanSteps,
  missingLifecycleHooks,
  summarizeOnboarding,
} from '../lib/onboarding'
import { useEcosystemStatus, useRunStipeAction, useStipeRepairPlan } from '../lib/queries'

function CommandCard({
  command,
  description,
  label,
  onRun,
  recentlyRan = false,
  running = false,
  tier,
}: {
  command: string
  description: string
  label: string
  onRun?: () => void
  recentlyRan?: boolean
  running?: boolean
  tier: 'manual' | 'primary' | 'secondary'
}) {
  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Group justify='space-between'>
          <div>
            <Group gap='xs'>
              <Text fw={600}>{label}</Text>
              {recentlyRan && (
                <Badge
                  color='green'
                  size='xs'
                  variant='light'
                >
                  last run
                </Badge>
              )}
              <Badge
                color={tier === 'primary' ? 'mycelium' : tier === 'secondary' ? 'substrate' : 'gray'}
                size='xs'
                variant='light'
              >
                {tier}
              </Badge>
            </Group>
            <Text
              c='dimmed'
              size='sm'
            >
              {description}
            </Text>
          </div>

          {onRun && (
            <Button
              disabled={running}
              leftSection={<IconPlayerPlay size={14} />}
              onClick={onRun}
              size='xs'
              variant='light'
            >
              {running ? 'Running...' : 'Run via Stipe'}
            </Button>
          )}
        </Group>

        <Group justify='space-between'>
          <Text
            ff='monospace'
            size='sm'
          >
            {command}
          </Text>
          <CopyButton value={command}>
            {({ copied, copy }) => (
              <Button
                leftSection={<IconCopy size={14} />}
                onClick={copy}
                size='xs'
                variant='subtle'
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Stack>
    </Card>
  )
}

function IssueCard({ check }: { check: StipeDoctorCheck }) {
  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Group gap='xs'>
          <ThemeIcon
            color='orange'
            size='sm'
            variant='light'
          >
            <IconAlertCircle size={14} />
          </ThemeIcon>
          <Text fw={600}>{check.name}</Text>
        </Group>
        <Text size='sm'>{check.message}</Text>
        {!!check.repair_actions?.length && (
          <Group gap='xs'>
            {check.repair_actions.map((action) => (
              <Badge
                color='orange'
                key={`${check.name}-${action.command}`}
                size='sm'
                variant='light'
              >
                {action.command}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  )
}

function InitStepCard({ step }: { step: StipeInitStep }) {
  const color = step.status === 'planned' ? 'mycelium' : step.status === 'already-ok' ? 'green' : 'gray'

  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Group gap='xs'>
          <Badge
            color={color}
            size='xs'
            variant='light'
          >
            {step.status}
          </Badge>
          <Text fw={600}>{step.title}</Text>
        </Group>
        <Text
          c='dimmed'
          size='sm'
        >
          {step.detail}
        </Text>
      </Stack>
    </Card>
  )
}

export function Onboard() {
  const { data: status, error, isLoading, refetch } = useEcosystemStatus()
  const repairPlanQuery = useStipeRepairPlan()
  const runStipe = useRunStipeAction()

  if (isLoading || repairPlanQuery.isLoading) {
    return <PageLoader mt='xl' />
  }

  if (!status) {
    return <ErrorAlert error={error ?? new Error('No status data available')} />
  }

  const actions = buildOnboardingActions(status, repairPlanQuery.data)
  const {
    manual: manualActions,
    optionalClaude: optionalClaudeActions,
    optionalCore: otherOptionalActions,
    primary: primaryActions,
    secondary: secondaryActions,
  } = getOnboardingActionGroups(actions)
  const failingChecks = failingDoctorChecks(repairPlanQuery.data)
  const lifecycleGaps = missingLifecycleHooks(status)
  const steps = initPlanSteps(repairPlanQuery.data)
  const codex = getCodexPresentationModel(status)
  const recommendedAction = primaryActions[0] ?? secondaryActions[0] ?? manualActions[0] ?? null
  const recommendedRunAction = recommendedAction?.runAction

  function actionIsRunning(actionKey?: string) {
    return Boolean(runStipe.isPending && actionKey && runStipe.variables === actionKey)
  }

  function actionWasLastRun(actionKey?: string) {
    return Boolean(runStipe.isSuccess && actionKey && runStipe.data.action === actionKey)
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
            {summarizeOnboarding(status, repairPlanQuery.data)}
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
            onClick={() => {
              refetch()
              repairPlanQuery.refetch()
            }}
            variant='subtle'
          >
            Refresh
          </Button>
        </Group>
      </Group>

      <SectionCard title='Codex mode'>
        <Stack gap='sm'>
          <Text size='sm'>
            Use this page when you want the shortest path to a working Codex setup. Mycelium, Hyphae, Rhizome, Codex MCP, and Codex notify
            are required in the same flow; Claude lifecycle capture stays optional unless you also want Claude Code coverage.
          </Text>
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

          <CodexModeChecklist status={status} />

          <Alert
            color={codex.adapter.color}
            title='Codex adapter health'
          >
            {codex.adapter.detail}
          </Alert>

          {recommendedAction && (
            <Alert
              color='mycelium'
              title='Recommended next step'
            >
              <Stack gap='sm'>
                <Text size='sm'>{recommendedAction.label}</Text>
                <Text
                  c='dimmed'
                  ff='monospace'
                  size='xs'
                >
                  {recommendedAction.command}
                </Text>
                <Group gap='xs'>
                  {recommendedRunAction && (
                    <Button
                      disabled={actionIsRunning(recommendedRunAction)}
                      leftSection={<IconPlayerPlay size={14} />}
                      onClick={() => runStipe.mutate(recommendedRunAction)}
                      size='xs'
                      variant='light'
                    >
                      {actionIsRunning(recommendedRunAction) ? 'Running...' : 'Run recommended step'}
                    </Button>
                  )}
                  <Button
                    component={Link}
                    size='xs'
                    to='/status'
                    variant='subtle'
                  >
                    View full status
                  </Button>
                </Group>
              </Stack>
            </Alert>
          )}

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
        <SectionCard title='Required Codex steps'>
          <Stack gap='md'>
            {primaryActions.map((action) => {
              const { runAction } = action
              return (
                <CommandCard
                  command={action.command}
                  description={action.description}
                  key={action.command}
                  label={action.label}
                  onRun={runAction ? () => runStipe.mutate(runAction) : undefined}
                  recentlyRan={actionWasLastRun(runAction)}
                  running={actionIsRunning(runAction)}
                  tier={action.tier}
                />
              )
            })}
          </Stack>
        </SectionCard>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Optional Claude steps'>
            <Stack gap='md'>
              {optionalClaudeActions.map((action) => {
                const { runAction } = action
                return (
                  <CommandCard
                    command={action.command}
                    description={action.description}
                    key={action.command}
                    label={action.label}
                    onRun={runAction ? () => runStipe.mutate(runAction) : undefined}
                    recentlyRan={actionWasLastRun(runAction)}
                    running={actionIsRunning(runAction)}
                    tier={action.tier}
                  />
                )
              })}
              {optionalClaudeActions.length === 0 && (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No Claude-specific steps are needed right now.
                </Text>
              )}
            </Stack>
          </SectionCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Other optional profiles'>
            <Stack gap='md'>
              {otherOptionalActions.length > 0 ? (
                otherOptionalActions.map((action) => {
                  const { runAction } = action
                  return (
                    <CommandCard
                      command={action.command}
                      description={action.description}
                      key={action.command}
                      label={action.label}
                      onRun={runAction ? () => runStipe.mutate(runAction) : undefined}
                      recentlyRan={actionWasLastRun(runAction)}
                      running={actionIsRunning(runAction)}
                      tier={action.tier}
                    />
                  )
                })
              ) : (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No extra profiles are needed right now.
                </Text>
              )}
            </Stack>
          </SectionCard>
        </Grid.Col>
      </Grid>

      <SectionCard title='Required tool installs'>
        <Stack gap='md'>
          {manualActions.length > 0 ? (
            manualActions.map((action) => (
              <CommandCard
                command={action.command}
                description={action.description}
                key={action.command}
                label={action.label}
                recentlyRan={actionWasLastRun(action.runAction)}
                running={actionIsRunning(action.runAction)}
                tier={action.tier}
              />
            ))
          ) : (
            <Text
              c='dimmed'
              size='sm'
            >
              No direct tool installs are needed right now.
            </Text>
          )}
        </Stack>
      </SectionCard>

      {runStipe.isError && (
        <ErrorAlert
          error={runStipe.error}
          title='Stipe action failed'
        />
      )}

      {runStipe.isSuccess && (
        <Alert
          color='mycelium'
          title={`Ran ${runStipe.data.action}`}
        >
          <Stack gap={4}>
            <Text size='sm'>{runStipe.data.command}</Text>
            {runStipe.data.output && (
              <Text
                ff='monospace'
                size='xs'
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {runStipe.data.output}
              </Text>
            )}
          </Stack>
        </Alert>
      )}
    </Stack>
  )
}
