import type { ReactNode } from 'react'
import { Card, Text, Title } from '@mantine/core'

export function KpiCard({ accent, children, label, value }: { accent: string; children?: ReactNode; label: string; value: string }) {
  return (
    <Card
      h='100%'
      padding='lg'
      radius='md'
      shadow='sm'
      styles={{ root: { overflow: 'visible' } }}
      withBorder
    >
      <Text
        c='dimmed'
        size='xs'
      >
        {label}
      </Text>
      <Title
        c={accent}
        order={3}
      >
        {value}
      </Title>
      {children}
    </Card>
  )
}
