import type { CardProps } from '@mantine/core'
import type { ReactNode } from 'react'
import { Card, Title } from '@mantine/core'

export function SectionCard({
  children,
  title,
  titleOrder = 4,
  ...rest
}: {
  children: ReactNode
  title?: string
  titleOrder?: 1 | 2 | 3 | 4 | 5 | 6
} & Omit<CardProps, 'children'>) {
  return (
    <Card
      padding='lg'
      shadow='sm'
      withBorder
      {...rest}
    >
      {title && (
        <Title
          mb='md'
          order={titleOrder}
        >
          {title}
        </Title>
      )}
      {children}
    </Card>
  )
}
