import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

export function ChartBox({ children }: { children: ReactNode }) {
  return <Box py='xs'>{children}</Box>
}
