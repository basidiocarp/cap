import { Badge, Card, Group, Stack, Text } from '@mantine/core'

import type { Lesson } from '../../lib/types'
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from './lesson-meta'

export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Card
      p='md'
      withBorder
    >
      <Stack gap='sm'>
        <Group
          align='flex-start'
          justify='space-between'
        >
          <Group gap='sm'>
            {getCategoryIcon(lesson.category)}
            <Stack gap={2}>
              <Text
                fw={600}
                size='sm'
              >
                {lesson.description.length > 80 ? `${lesson.description.slice(0, 80)}...` : lesson.description}
              </Text>
              <Badge
                color={getCategoryColor(lesson.category)}
                leftSection={getCategoryIcon(lesson.category)}
                size='xs'
                variant='light'
              >
                {getCategoryLabel(lesson.category)}
              </Badge>
            </Stack>
          </Group>

          <Badge
            color='substrate'
            size='sm'
            variant='dot'
          >
            {lesson.frequency}x
          </Badge>
        </Group>

        {lesson.keywords && lesson.keywords.length > 0 && (
          <Group gap={4}>
            {lesson.keywords.slice(0, 3).map((keyword) => (
              <Badge
                color='lichen'
                key={keyword}
                size='xs'
                variant='light'
              >
                {keyword}
              </Badge>
            ))}
            {lesson.keywords.length > 3 && (
              <Text
                c='dimmed'
                size='xs'
              >
                +{lesson.keywords.length - 3} more
              </Text>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  )
}
