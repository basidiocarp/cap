import type { ReactNode } from 'react'
import { Group, Text } from '@mantine/core'

import { SectionCard } from '../../components/SectionCard'
import { AvailabilityBadge } from './statusHelpers'

export interface StatusToolCardProps {
  available: boolean
  children?: ReactNode
  description: string
  title: string
}

export function StatusToolCard({ available, children, description, title }: StatusToolCardProps) {
  return (
    <SectionCard h='100%'>
      <Group
        justify='space-between'
        mb='md'
      >
        <Text
          fw={600}
          size='sm'
        >
          {title}
        </Text>
        <AvailabilityBadge available={available} />
      </Group>
      <Text
        c='dimmed'
        mb='sm'
        size='sm'
      >
        {description}
      </Text>
      {children}
    </SectionCard>
  )
}
