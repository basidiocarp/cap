import { Alert, Badge, Button, Card, CopyButton, Grid, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconAlertCircle, IconArrowRight, IconCheck, IconCopy, IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { StipeDoctorCheck, StipeInitStep } from '../lib/api'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useEcosystemStatus, useRunStipeAction, useStipeRepairPlan } from '../lib/queries'
import { buildOnboardingActions, failingDoctorChecks, initPlanSteps, summarizeOnboarding } from '../lib/onboarding'

function StatusChip({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: string
}) {
  return (
    <Badge
      color={color}
      leftSection={<IconCheck size={12} />}
      size='sm'
      variant='light'
    >
      {label}: {value}
    </Badge>
  )
}

function CommandCard({
  command,
  description,
  label,
  onRun,
  tier,
}: {
  command: string
  description: string
  label: string
  onRun?: () => void
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
              leftSection={<IconPlayerPlay size={14} />}
              onClick={onRun}
              size='xs'
              variant='light'
            >
              Run via Stipe
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
  const primaryActions = actions.filter((action) => action.tier === 'primary')
  const secondaryActions = actions.filter((action) => action.tier === 'secondary')
  const manualActions = actions.filter((action) => action.tier === 'manual')
  const failingChecks = failingDoctorChecks(repairPlanQuery.data)
  const steps = initPlanSteps(repairPlanQuery.data)

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

      <SectionCard title='Current state'>
        <Stack gap='sm'>
          <Text size='sm'>
            Use this page when the ecosystem is partly installed or you want the shortest path to a working setup.
          </Text>
          <Group gap='xs'>
            <StatusChip
              color={status.mycelium.available ? 'mycelium' : 'red'}
              label='Mycelium'
              value={status.mycelium.available ? 'available' : 'missing'}
            />
            <StatusChip
              color={status.hyphae.available ? 'spore' : 'red'}
              label='Hyphae'
              value={status.hyphae.available ? 'available' : 'missing'}
            />
            <StatusChip
              color={status.rhizome.available ? 'lichen' : 'red'}
              label='Rhizome'
              value={status.rhizome.available ? 'available' : 'missing'}
            />
            <StatusChip
              color={status.hooks.error_count > 0 || status.hooks.installed_hooks.length === 0 ? 'orange' : 'mycelium'}
              label='Hooks'
              value={status.hooks.error_count > 0 || status.hooks.installed_hooks.length === 0 ? 'needs attention' : 'healthy'}
            />
          </Group>

          {status.hooks.error_count > 0 && (
            <Alert color='orange' title='Hook errors detected'>
              `stipe doctor` will check the most common local drift cases first.
            </Alert>
          )}

          {repairPlanQuery.isError && (
            <Alert color='orange' title='Using fallback onboarding guidance'>
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
        <SectionCard title='Primary fixes'>
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
                  tier={action.tier}
                />
              )
            })}
          </Stack>
        </SectionCard>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Optional profiles'>
            <Stack gap='md'>
              {secondaryActions.map((action) => {
                const { runAction } = action
                return (
                  <CommandCard
                    command={action.command}
                    description={action.description}
                    key={action.command}
                    label={action.label}
                    onRun={runAction ? () => runStipe.mutate(runAction) : undefined}
                    tier={action.tier}
                  />
                )
              })}
            </Stack>
          </SectionCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Manual installs'>
            <Stack gap='md'>
              {manualActions.length > 0 ? (
                manualActions.map((action) => (
                  <CommandCard
                    command={action.command}
                    description={action.description}
                    key={action.command}
                    label={action.label}
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
        </Grid.Col>
      </Grid>

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
