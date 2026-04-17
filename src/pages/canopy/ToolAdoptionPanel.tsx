import { Badge, Group, Progress, Stack, Text } from '@mantine/core'

import type { ToolAdoptionScore } from '../../lib/types'

export function ToolAdoptionPanel({ score }: { score: ToolAdoptionScore }) {
  if (typeof score.score !== 'number' || !Array.isArray(score.tools_used) || !Array.isArray(score.tools_relevant)) {
    return null
  }

  const pct = Math.round(score.score * 100)
  const unused = score.tools_relevant.filter((t) => !score.tools_used.includes(t))
  const evaluatedAt = new Date(score.evaluated_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <Stack gap='xs'>
      <Group justify='space-between'>
        <Text
          fw={500}
          size='sm'
        >
          Tool adoption
        </Text>
        <Text
          c='dimmed'
          size='sm'
        >
          {pct}%
        </Text>
      </Group>

      <Progress value={pct} />

      {score.tools_used.length > 0 && (
        <Group
          gap='xs'
          wrap='wrap'
        >
          <Text
            c='dimmed'
            size='xs'
            w={60}
          >
            Used
          </Text>
          {score.tools_used.map((t) => (
            <Badge
              key={t}
              size='xs'
              variant='light'
            >
              {t}
            </Badge>
          ))}
        </Group>
      )}

      {unused.length > 0 && (
        <Group
          gap='xs'
          wrap='wrap'
        >
          <Text
            c='dimmed'
            size='xs'
            w={60}
          >
            Unused
          </Text>
          {unused.map((t) => (
            <Badge
              color='gray'
              key={t}
              size='xs'
              variant='outline'
            >
              {t}
            </Badge>
          ))}
        </Group>
      )}

      <Text
        c='dimmed'
        size='xs'
      >
        Evaluated {evaluatedAt}
      </Text>
    </Stack>
  )
}
