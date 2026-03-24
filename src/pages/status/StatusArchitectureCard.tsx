import { Card, Title } from '@mantine/core'

import { EcosystemFlow } from '../../components/EcosystemFlow'

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
        <EcosystemFlow />
      </div>
    </Card>
  )
}
