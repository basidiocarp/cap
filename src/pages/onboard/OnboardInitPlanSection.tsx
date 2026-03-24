import { Stack } from '@mantine/core'

import type { StipeInitStep } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { InitStepCard } from './InitStepCard'

export function OnboardInitPlanSection({ steps }: { steps: StipeInitStep[] }) {
  if (steps.length === 0) {
    return null
  }

  return (
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
  )
}
