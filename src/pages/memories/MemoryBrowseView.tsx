import { Badge, Button, Card, Group, Progress, SimpleGrid, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { TopicSummary } from '../../lib/api'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { PageLoader } from '../../components/PageLoader'
import { timeAgo } from '../../lib/time'
import { DocumentsSection } from './DocumentsSection'
import { topicColor, topicIcon, weightColor } from './memory-utils'

export function MemoryBrowseView({
  onTopicClick,
  topics,
  topicsLoading,
}: {
  onTopicClick: (topic: string) => void
  topics: TopicSummary[]
  topicsLoading: boolean
}) {
  return (
    <>
      {topicsLoading ? <PageLoader size='sm' /> : null}

      {!topicsLoading && topics.length === 0 ? (
        <ActionEmptyState
          actions={
            <>
              <Button
                component={Link}
                size='xs'
                to='/status'
                variant='light'
              >
                Check status
              </Button>
              <Button
                component={Link}
                size='xs'
                to='/onboard'
                variant='subtle'
              >
                Open onboarding
              </Button>
            </>
          }
          description='No memories have been stored for this project yet.'
          hint='Memories are created automatically during agent sessions. If you expected memories already, check Status to confirm Hyphae flow is healthy for the host you are using.'
          mt='md'
          title='No memories yet'
        />
      ) : null}

      {!topicsLoading && topics.length > 0 ? (
        <SimpleGrid cols={{ base: 2, lg: 4, md: 3 }}>
          {topics.map((topic) => (
            <UnstyledButton
              key={topic.topic}
              onClick={() => onTopicClick(topic.topic)}
              style={{ width: '100%' }}
            >
              <Card
                padding='md'
                radius='md'
                shadow='sm'
                withBorder
              >
                <Group
                  gap='sm'
                  mb='xs'
                >
                  <Badge
                    color={topicColor(topic.topic)}
                    size='lg'
                    variant='light'
                    w={36}
                  >
                    {topicIcon(topic.topic)}
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      fw={500}
                      lineClamp={1}
                      size='sm'
                    >
                      {topic.topic}
                    </Text>
                  </div>
                </Group>
                <Group justify='space-between'>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    {topic.count} {topic.count === 1 ? 'memory' : 'memories'}
                  </Text>
                  <Tooltip label={`Avg weight: ${topic.avg_weight.toFixed(2)}`}>
                    <Progress
                      color={weightColor(topic.avg_weight)}
                      size='xs'
                      value={topic.avg_weight * 100}
                      w={50}
                    />
                  </Tooltip>
                </Group>
                <Text
                  c='dimmed'
                  mt={4}
                  size='xs'
                >
                  Latest: {timeAgo(topic.newest)}
                </Text>
              </Card>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      ) : null}

      {!topicsLoading && topics.length > 0 ? <DocumentsSection /> : null}
    </>
  )
}
