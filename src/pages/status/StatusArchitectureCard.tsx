import { Card, Title } from '@mantine/core'
import { lazy, Suspense } from 'react'

import { PageLoader } from '../../components/PageLoader'

const EcosystemFlow = lazy(() => import('../../components/EcosystemFlow').then((m) => ({ default: m.EcosystemFlow })))

export function StatusArchitectureCard() {
  return (
    <Card
      p='md'
      shadow='sm'
      withBorder
    >
      <Title
        mb='sm'
        order={4}
      >
        Ecosystem Architecture
      </Title>
      <div style={{ height: 400 }}>
        <Suspense fallback={<PageLoader mt='md' />}>
          <EcosystemFlow />
        </Suspense>
      </div>
    </Card>
  )
}
