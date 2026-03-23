import { Alert, Badge, Grid, Group, List, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../lib/api'
import type { CodexModeStep } from '../lib/codex'
import { getCodexPresentationModel } from '../lib/codex'

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
  const { mode, sections } = getCodexPresentationModel(status)
  const { optional, required } = sections

  return (
    <Stack gap='sm'>
      <Alert
        color={mode.color}
        title={mode.label}
      >
        <Text size='sm'>{mode.detail}</Text>
      </Alert>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <StepSection
            emptyText='All required Codex steps are already configured.'
            steps={required}
            title='Required for Codex mode'
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <StepSection
            emptyText='No Claude-specific steps are needed right now.'
            steps={optional}
            title='Optional Claude coverage'
          />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
