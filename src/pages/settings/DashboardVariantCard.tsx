import { Card, Radio, Stack, Text, Title } from '@mantine/core'

import type { DashboardVariant } from '../../stores/dashboard-variant-store'
import { useDashboardVariantStore } from '../../stores/dashboard-variant-store'

const VARIANTS = [
  { description: 'Dense KPIs, anomaly board — Grafana/Datadog style', label: 'Operator', value: 'operator' },
  { description: 'Hero numbers, generous spacing — Stripe style', label: 'Confident', value: 'confident' },
  { description: 'Command bar, mono accent — Raycast/biological style', label: 'Field Lab', value: 'fieldlab' },
]

export function DashboardVariantCard() {
  const { variant, setVariant } = useDashboardVariantStore()

  return (
    <Card
      padding='lg'
      radius='md'
      shadow='sm'
      withBorder
    >
      <Title
        mb='md'
        order={4}
      >
        Dashboard Layout
      </Title>
      <Radio.Group
        onChange={(v) => setVariant(v as DashboardVariant)}
        value={variant}
      >
        <Stack gap='sm'>
          {VARIANTS.map((v) => (
            <Radio.Card
              key={v.value}
              p='sm'
              radius='md'
              value={v.value}
            >
              <div style={{ alignItems: 'flex-start', display: 'flex', gap: '12px' }}>
                <Radio.Indicator />
                <div>
                  <Text
                    fw={500}
                    size='sm'
                  >
                    {v.label}
                  </Text>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    {v.description}
                  </Text>
                </div>
              </div>
            </Radio.Card>
          ))}
        </Stack>
      </Radio.Group>
    </Card>
  )
}
