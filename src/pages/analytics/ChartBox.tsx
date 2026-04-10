import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

export function ChartBox({ children, mih = 200 }: { children: ReactNode; mih?: number }) {
  return (
    <Box
      mih={mih}
      py='xs'
      w='100%'
    >
      {children}
    </Box>
  )
}
