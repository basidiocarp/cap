import { Stack, Text, Title } from '@mantine/core'

import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { useLessons } from '../../lib/queries'
import { LessonSection } from './LessonSection'

export function LessonsPage() {
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
  const correctionLessons = lessons.filter((lesson) => lesson.category === 'corrections')
  const errorLessons = lessons.filter((lesson) => lesson.category === 'errors')
  const testLessons = lessons.filter((lesson) => lesson.category === 'tests')

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
          <LessonSection
            description='Patterns from self-corrections and iterative refinements'
            lessons={correctionLessons}
            title='Corrections'
          />
          <LessonSection
            description='Error patterns that have been identified and fixed'
            lessons={errorLessons}
            title='Errors Resolved'
          />
          <LessonSection
            description='Test failures that have been resolved'
            lessons={testLessons}
            title='Tests Fixed'
          />
        </>
      )}
    </Stack>
  )
}
