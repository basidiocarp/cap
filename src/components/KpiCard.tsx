import type { ReactNode } from 'react'
import { Box, Card, Group, Paper, Text, Title } from '@mantine/core'
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { Sparkline } from './Sparkline'

interface KpiCardProps {
  accent?: string
  children?: ReactNode
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  sparkData?: number[]
  color?: string
  featured?: boolean
}

export function KpiCard({
  accent,
  children,
  label,
  value,
  delta,
  deltaLabel,
  sparkData,
  color,
  featured,
}: KpiCardProps) {
  const cardContent = (
    <Card
      h='100%'
      padding='lg'
      radius='md'
      shadow='sm'
      styles={{ root: { overflow: 'visible', display: 'flex', flexDirection: 'column' } }}
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
      {delta !== undefined && (
        <Group gap={4} mt={4}>
          {delta >= 0
            ? <IconTrendingUp color='var(--mantine-color-mycelium-5)' size={14} />
            : <IconTrendingDown color='var(--mantine-color-gill-5)' size={14} />
          }
          <Text c={delta >= 0 ? 'mycelium' : 'gill'} size='xs'>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
            {deltaLabel && <Text c='dimmed' component='span' size='xs'> {deltaLabel}</Text>}
          </Text>
        </Group>
      )}
      {children}
      {sparkData && sparkData.length >= 2 && (
        <Box mt='xs' mx={-12} mb={-12}>
          <Sparkline color={color ?? 'var(--mantine-color-mycelium-5)'} data={sparkData} height={32} />
        </Box>
      )}
    </Card>
  )

  if (featured) {
    return (
      <Paper
        p={0}
        radius='md'
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, var(--mantine-color-mycelium-5), var(--mantine-color-spore-5))',
        }}
      >
        {cardContent}
      </Paper>
    )
  }

  return cardContent
}
