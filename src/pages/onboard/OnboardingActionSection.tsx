import { Stack, Text } from '@mantine/core'

import type { OnboardingAction } from '../../lib/onboarding'
import { SectionCard } from '../../components/SectionCard'
import { CommandCard } from './CommandCard'

export function OnboardingActionSection({
  actions,
  emptyMessage,
  onRun,
  recentlyRan,
  running,
  title,
}: {
  actions: OnboardingAction[]
  emptyMessage: string
  onRun: (action: OnboardingAction) => void
  recentlyRan: (action: OnboardingAction) => boolean
  running: (action: OnboardingAction) => boolean
  title: string
}) {
  return (
    <SectionCard title={title}>
      <Stack gap='md'>
        {actions.length > 0 ? (
          actions.map((action) => (
            <CommandCard
              command={action.command}
              description={action.description}
              key={action.command}
              label={action.label}
              onRun={action.runAction ? () => onRun(action) : undefined}
              recentlyRan={recentlyRan(action)}
              running={running(action)}
              tier={action.tier}
            />
          ))
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            {emptyMessage}
          </Text>
        )}
      </Stack>
    </SectionCard>
  )
}
