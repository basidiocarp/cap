import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle, IconBulb, IconCheck, IconRepeat } from '@tabler/icons-react'

import type { Lesson } from '../lib/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useLessons } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCategoryIcon(category: string) {
  switch (category) {
    case 'corrections':
      return <IconRepeat size={18} />
    case 'errors':
      return <IconAlertTriangle size={18} />
    case 'tests':
      return <IconCheck size={18} />
    default:
      return <IconBulb size={18} />
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'corrections':
      return 'orange'
    case 'errors':
      return 'red'
    case 'tests':
      return 'mycelium'
    default:
      return 'gray'
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'corrections':
      return 'Correction'
    case 'errors':
      return 'Error Resolved'
    case 'tests':
      return 'Test Fixed'
    default:
      return 'Lesson'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Card
// ─────────────────────────────────────────────────────────────────────────────

function LessonCard({ lesson }: { lesson: Lesson }) {
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

          <Group gap='xs'>
            <Badge
              color='substrate'
              size='sm'
              variant='dot'
            >
              {lesson.frequency}x
            </Badge>
          </Group>
        </Group>

        {lesson.keywords && lesson.keywords.length > 0 && (
          <Group gap={4}>
            {lesson.keywords.slice(0, 3).map((kw: string) => (
              <Badge
                color='lichen'
                key={kw}
                size='xs'
                variant='light'
              >
                {kw}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function Lessons() {
  const lessonsQuery = useLessons()

  if (lessonsQuery.isLoading) {
    return <PageLoader />
  }

  if (lessonsQuery.error) {
    return (
      <ErrorAlert
        error={lessonsQuery.error}
        title='Failed to load lessons'
      />
    )
  }

  const lessons = lessonsQuery.data ?? []

  // Group by category
  const correctionLessons = lessons.filter((l) => l.category === 'corrections')
  const errorLessons = lessons.filter((l) => l.category === 'errors')
  const testLessons = lessons.filter((l) => l.category === 'tests')

  return (
    <Stack gap='lg'>
      <Title order={2}>Lessons</Title>

      {lessons.length === 0 ? (
        <SectionCard title='Extracted Lessons'>
          <Stack gap='sm'>
            <Text
              c='dimmed'
              size='sm'
            >
              No lessons yet. Lessons are extracted from corrections and resolved errors captured during sessions.
            </Text>
          </Stack>
        </SectionCard>
      ) : (
        <>
          {correctionLessons.length > 0 && (
            <SectionCard title={`Corrections (${correctionLessons.length})`}>
              <Stack gap='sm'>
                <Text
                  c='dimmed'
                  size='sm'
                >
                  Patterns from self-corrections and iterative refinements
                </Text>
                {correctionLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                  />
                ))}
              </Stack>
            </SectionCard>
          )}

          {errorLessons.length > 0 && (
            <SectionCard title={`Errors Resolved (${errorLessons.length})`}>
              <Stack gap='sm'>
                <Text
                  c='dimmed'
                  size='sm'
                >
                  Error patterns that have been identified and fixed
                </Text>
                {errorLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                  />
                ))}
              </Stack>
            </SectionCard>
          )}

          {testLessons.length > 0 && (
            <SectionCard title={`Tests Fixed (${testLessons.length})`}>
              <Stack gap='sm'>
                <Text
                  c='dimmed'
                  size='sm'
                >
                  Test failures that have been resolved
                </Text>
                {testLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                  />
                ))}
              </Stack>
            </SectionCard>
          )}
        </>
      )}
    </Stack>
  )
}
