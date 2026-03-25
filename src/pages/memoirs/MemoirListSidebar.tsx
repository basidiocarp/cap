import { ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core'

import type { Memoir } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'

interface MemoirListSidebarProps {
  memoirs: Memoir[]
  onSelect: (name: string) => void
  selected: string | null
}

export function MemoirListSidebar({ memoirs, onSelect, selected }: MemoirListSidebarProps) {
  return (
    <SectionCard
      title='Knowledge Graphs'
      titleOrder={5}
    >
      <ScrollArea h={600}>
        {memoirs.length > 0 ? (
          <Stack gap='xs'>
            {memoirs.map((memoir) => (
              <UnstyledButton
                aria-current={selected === memoir.name ? 'true' : undefined}
                aria-label={`Open memoir ${memoir.name}`}
                key={memoir.id}
                onClick={() => onSelect(memoir.name)}
                style={(theme) => ({
                  background: selected === memoir.name ? 'var(--mantine-color-mycelium-light)' : undefined,
                  borderRadius: theme.radius.sm,
                  display: 'block',
                  padding: '6px 10px',
                  textAlign: 'left',
                  width: '100%',
                })}
              >
                <Text
                  fw={selected === memoir.name ? 700 : 400}
                  size='sm'
                >
                  {memoir.name}
                </Text>
                <Text
                  c='dimmed'
                  lineClamp={1}
                  size='xs'
                >
                  {memoir.description}
                </Text>
              </UnstyledButton>
            ))}
          </Stack>
        ) : (
          <EmptyState>No memoirs found</EmptyState>
        )}
      </ScrollArea>
    </SectionCard>
  )
}
