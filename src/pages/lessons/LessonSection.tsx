import { Stack, Text } from '@mantine/core'

import type { Lesson } from '../../lib/types'
import { SectionCard } from '../../components/SectionCard'
import { LessonCard } from './LessonCard'

export function LessonSection({ description, lessons, title }: { description: string; lessons: Lesson[]; title: string }) {
  if (lessons.length === 0) return null

  return (
    <SectionCard title={`${title} (${lessons.length})`}>
      <Stack gap='sm'>
        <Text
          c='dimmed'
          size='sm'
        >
          {description}
        </Text>
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
          />
        ))}
      </Stack>
    </SectionCard>
  )
}
