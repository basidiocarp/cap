import { Card, Group, SimpleGrid, Text, UnstyledButton } from '@mantine/core'
import { IconCode } from '@tabler/icons-react'

import { SEARCH_EXAMPLES } from './useSymbolSearchPageState'

export function SymbolSearchExamples({ onExampleClick }: { onExampleClick: (pattern: string) => void }) {
  return (
    <SimpleGrid cols={{ base: 2, md: 3 }}>
      {SEARCH_EXAMPLES.map((example) => (
        <UnstyledButton
          aria-label={`Search example: ${example.pattern}`}
          key={example.pattern}
          onClick={() => onExampleClick(example.pattern)}
          style={{ display: 'block', width: '100%' }}
        >
          <Card
            padding='sm'
            radius='md'
            shadow='xs'
            style={{ cursor: 'pointer' }}
            withBorder
          >
            <Group gap='sm'>
              <IconCode
                color='var(--mantine-color-mycelium-6)'
                size={16}
              />
              <div>
                <Text
                  ff='monospace'
                  fw={500}
                  size='sm'
                >
                  {example.pattern}
                </Text>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {example.description}
                </Text>
              </div>
            </Group>
          </Card>
        </UnstyledButton>
      ))}
    </SimpleGrid>
  )
}
