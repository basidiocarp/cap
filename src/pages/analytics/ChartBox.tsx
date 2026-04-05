import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

export function ChartBox({ children, mih = 200 }: { children: ReactNode; mih?: number }) {
  return (
    <Box
      w='100%'
      mih={mih}
      py='xs'
    >
      {children}
    </Box>
  )
}
