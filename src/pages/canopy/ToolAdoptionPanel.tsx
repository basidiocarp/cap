import { Badge, Group, Progress, Stack, Text } from '@mantine/core'

import type { ToolAdoptionDetail, ToolAdoptionScore } from '../../lib/types'

function statusColor(detail: ToolAdoptionDetail): string {
  switch (detail.status) {
    case 'used':
      return 'green'
    case 'relevant_unused':
      return 'orange'
    default:
      return 'gray'
  }
}

export function ToolAdoptionPanel({ score }: { score: ToolAdoptionScore }) {
  const pct = Math.round(score.score * 100)

  const usedTools = score.details.filter((d) => d.status === 'used')
  // relevant-but-unused tools are surfaced with reasons for operator review
  const relevantUnused = score.details.filter((d) => d.status === 'relevant_unused')

  return (
    <Stack gap='xs'>
      <Group justify='space-between'>
        <Text
          fw={500}
          size='sm'
        >
          {/* adoption score label */}
          Tool Usage
        </Text>
        <Badge
          color={pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red'}
          variant='light'
        >
          adoption score {pct}%
        </Badge>
      </Group>

      <Progress
        color={pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red'}
        value={pct}
      />

      <Text
        c='dimmed'
        size='xs'
      >
        {score.tools_used} of {score.tools_relevant} relevant tools used
      </Text>

      {usedTools.length > 0 && (
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
          {usedTools.map((d) => (
            <Badge
              color={statusColor(d)}
              key={d.tool_name}
              size='xs'
              variant='light'
            >
              {d.tool_name}
            </Badge>
          ))}
        </Group>
      )}

      {relevantUnused.length > 0 && (
        <Stack gap={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            relevant-but-unused
          </Text>
          <Group
            gap='xs'
            wrap='wrap'
          >
            {relevantUnused.map((d) => (
              <Badge
                color='orange'
                key={d.tool_name}
                size='xs'
                variant='outline'
              >
                {d.tool_name}
              </Badge>
            ))}
          </Group>
        </Stack>
      )}
    </Stack>
  )
}
