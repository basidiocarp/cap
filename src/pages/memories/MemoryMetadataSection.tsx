import { Alert, Badge, Code, Grid, Group, Progress, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import type { Memory } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { getMemoryReviewState } from '../../lib/memory-review'
import { timeAgo } from '../../lib/time'
import { getKeywords, getRelatedIds, reviewColor, reviewLabel, topicColor, weightColor } from './memory-utils'

export function MemoryMetadataSection({ detail }: { detail: Memory }) {
  const review = getMemoryReviewState(detail)

  return (
    <>
      <Alert
        color={reviewColor(review.kind)}
        icon={<IconAlertCircle size={16} />}
        title={`${reviewLabel(review.kind)} memory`}
      >
        <Stack gap={4}>
          <Text size='sm'>{review.description}</Text>
          {detail.invalidated_at ? (
            <Text size='xs'>
              Invalidated {timeAgo(detail.invalidated_at)} on {new Date(detail.invalidated_at).toLocaleString()}
            </Text>
          ) : null}
          {detail.invalidated_by ? <Text size='xs'>Invalidated by {detail.invalidated_by}</Text> : null}
          {detail.superseded_by_memory_id ? <Text size='xs'>Superseded by memory {detail.superseded_by_memory_id.slice(0, 8)}</Text> : null}
        </Stack>
      </Alert>

      <SectionCard
        bg='chitin.9'
        padding='sm'
      >
        <Text
          c='gray.2'
          size='sm'
        >
          {detail.summary}
        </Text>
      </SectionCard>

      {detail.raw_excerpt ? (
        <div>
          <Text
            c='dimmed'
            mb={4}
            size='xs'
          >
            Raw Excerpt
          </Text>
          <Code
            block
            style={{ maxHeight: 200, overflow: 'auto' }}
          >
            {detail.raw_excerpt}
          </Code>
        </div>
      ) : null}

      <Grid>
        <Grid.Col span={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            Topic
          </Text>
          <Badge
            color={topicColor(detail.topic)}
            mt={4}
            size='sm'
            variant='light'
          >
            {detail.topic}
          </Badge>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            Weight
          </Text>
          <Group
            gap='xs'
            mt={4}
          >
            <Progress
              color={weightColor(detail.weight)}
              size='sm'
              style={{ flex: 1 }}
              value={detail.weight * 100}
            />
            <Text size='xs'>{detail.weight.toFixed(3)}</Text>
          </Group>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            Accessed
          </Text>
          <Text
            mt={4}
            size='sm'
          >
            {detail.access_count}x
          </Text>
        </Grid.Col>
      </Grid>

      {getKeywords(detail.keywords).length > 0 ? (
        <div>
          <Text
            c='dimmed'
            mb={4}
            size='xs'
          >
            Keywords
          </Text>
          <Group gap={4}>
            {getKeywords(detail.keywords).map((keyword) => (
              <Badge
                key={keyword}
                size='sm'
                variant='outline'
              >
                {keyword}
              </Badge>
            ))}
          </Group>
        </div>
      ) : null}

      <Grid>
        <Grid.Col span={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            Created
          </Text>
          <Text size='xs'>{timeAgo(detail.created_at)}</Text>
          <Text
            c='dimmed'
            size='xs'
          >
            {new Date(detail.created_at).toLocaleString()}
          </Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            Updated
          </Text>
          <Text size='xs'>{timeAgo(detail.updated_at)}</Text>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text
            c='dimmed'
            size='xs'
          >
            Last Accessed
          </Text>
          <Text size='xs'>{timeAgo(detail.last_accessed)}</Text>
        </Grid.Col>
      </Grid>

      {detail.source_type ? (
        <div>
          <Text
            c='dimmed'
            size='xs'
          >
            Source
          </Text>
          <Badge
            mt={4}
            size='xs'
            variant='outline'
          >
            {detail.source_type}
          </Badge>
        </div>
      ) : null}

      {getRelatedIds(detail.related_ids).length > 0 ? (
        <div>
          <Text
            c='dimmed'
            mb={4}
            size='xs'
          >
            Related Memories
          </Text>
          <Group gap={4}>
            {getRelatedIds(detail.related_ids).map((id) => (
              <Badge
                ff='monospace'
                key={id}
                size='xs'
                variant='outline'
              >
                {id.slice(0, 8)}
              </Badge>
            ))}
          </Group>
        </div>
      ) : null}
    </>
  )
}
