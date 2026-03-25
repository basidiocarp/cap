import { Badge, Grid, Group, List, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../lib/api'
import type { CodexModeStep } from '../lib/codex'
import { getCodexPresentationModel } from '../lib/codex'
import { getHostCoverageView } from '../lib/readiness'
import { useHostCoverageStore } from '../store/host-coverage'

function getStepColor(step: CodexModeStep): string {
  switch (step.status) {
    case 'ready':
      return 'mycelium'
    case 'repair':
    case 'required':
      return 'orange'
    default:
      return 'gray'
  }
}

function StepItem({ step }: { step: CodexModeStep }) {
  return (
    <Stack gap={4}>
      <Group
        gap='xs'
        wrap='wrap'
      >
        <Text
          fw={600}
          size='sm'
        >
          {step.label}
        </Text>
        <Badge
          color={getStepColor(step)}
          size='xs'
          variant='light'
        >
          {step.status}
        </Badge>
      </Group>
      <Text
        c='dimmed'
        size='sm'
      >
        {step.detail}
      </Text>
    </Stack>
  )
}

function StepSection({ emptyText, steps, title }: { emptyText: string; steps: CodexModeStep[]; title: string }) {
  return (
    <Stack gap='xs'>
      <Text
        fw={600}
        size='sm'
      >
        {title}
      </Text>
      {steps.length > 0 ? (
        <List
          size='sm'
          spacing='sm'
        >
          {steps.map((step) => (
            <List.Item key={step.key}>
              <StepItem step={step} />
            </List.Item>
          ))}
        </List>
      ) : (
        <Text
          c='dimmed'
          size='sm'
        >
          {emptyText}
        </Text>
      )}
    </Stack>
  )
}

export function CodexModeChecklist({ status }: { status: EcosystemStatus }) {
  const hostCoveragePreference = useHostCoverageStore((state) => state.mode)
  const { mode, sections } = getCodexPresentationModel(status)
  const { optional, required } = sections
  const hostCoverageView = getHostCoverageView(status, hostCoveragePreference)

  return (
    <Stack gap='sm'>
      <Group gap='xs'>
        <Badge
          color={mode.color}
          size='sm'
          variant='light'
        >
          {mode.label}
        </Badge>
        <Text
          c='dimmed'
          size='sm'
        >
          {mode.detail}
        </Text>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <StepSection
            emptyText='No required coverage steps are missing right now. If this looks blank, the required adapter has not been detected yet.'
            steps={required}
            title={hostCoverageView.requiredSectionTitle}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <StepSection
            emptyText='Optional coverage is already configured, or Claude Code is not installed on this host.'
            steps={optional}
            title={hostCoverageView.optionalSectionTitle}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
