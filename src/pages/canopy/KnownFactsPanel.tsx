import { Badge, Code, Group, Stack, Text } from '@mantine/core'

import type { CanopyFactType, CanopyKnownFact } from '../../lib/types'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'

const FACT_TYPE_COLOR: Record<CanopyFactType, string> = {
  constraint: 'orange',
  decision: 'blue',
  error_resolution: 'red',
  invariant: 'violet',
  other: 'gray',
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color = pct >= 90 ? 'green' : pct >= 70 ? 'yellow' : 'red'
  return (
    <Badge
      color={color}
      size='xs'
      variant='outline'
    >
      {pct}%
    </Badge>
  )
}

function KnownFactCard({ fact }: { fact: CanopyKnownFact }) {
  return (
    <SectionCard p='sm'>
      <Stack gap={4}>
        <Group gap='xs'>
          <Badge
            color={FACT_TYPE_COLOR[fact.fact_type]}
            size='xs'
            variant='light'
          >
            {fact.fact_type}
          </Badge>
          <Badge
            color='gray'
            size='xs'
            variant='outline'
          >
            {fact.scope}
          </Badge>
          <ConfidenceBadge confidence={fact.confidence} />
          <Code fz='xs'>{fact.key}</Code>
        </Group>
        <Text size='sm'>{fact.summary}</Text>
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='xs'
          >
            by {fact.established_by}
          </Text>
          {fact.hyphae_id ? (
            <Text
              c='dimmed'
              size='xs'
            >
              · hyphae: {fact.hyphae_id}
            </Text>
          ) : null}
        </Group>
      </Stack>
    </SectionCard>
  )
}

export function KnownFactsPanel({ facts }: { facts: CanopyKnownFact[] }) {
  if (facts.length === 0) {
    return <EmptyState>No known facts established yet. Agents establish facts via canopy_known_facts_add.</EmptyState>
  }

  return (
    <Stack gap='xs'>
      {facts.map((fact) => (
        <KnownFactCard
          fact={fact}
          key={fact.fact_id}
        />
      ))}
    </Stack>
  )
}
