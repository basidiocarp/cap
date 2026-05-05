import type { Lesson } from '../types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { callLocalService } from '../lib/local-service.ts'
import { logger } from '../logger.ts'

const LESSON_LIMIT = 50
const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const LESSONS_SCHEMA_VERSION = '1.0'

export class HyphaeLessonsCliError extends Error {
  kind: 'invalid_payload' | 'unavailable'

  constructor(message: string, kind: 'invalid_payload' | 'unavailable', options?: { cause?: unknown }) {
    super(message, options)
    this.kind = kind
    this.name = 'HyphaeLessonsCliError'
  }
}

function isLessonCategory(value: unknown): value is Lesson['category'] {
  return value === 'corrections' || value === 'errors' || value === 'tests'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isLesson(value: unknown): value is Lesson {
  if (!value || typeof value !== 'object') return false
  const lesson = value as Record<string, unknown>
  return (
    typeof lesson.id === 'string' &&
    isLessonCategory(lesson.category) &&
    typeof lesson.description === 'string' &&
    typeof lesson.frequency === 'number' &&
    isStringArray(lesson.source_topics) &&
    isStringArray(lesson.keywords)
  )
}

function parseLessons(stdout: string): Lesson[] {
  try {
    const parsed = JSON.parse(stdout) as unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('schema_version' in parsed) ||
      (parsed as { schema_version?: string }).schema_version !== LESSONS_SCHEMA_VERSION ||
      !('lessons' in parsed)
    ) {
      throw new HyphaeLessonsCliError('Hyphae lessons returned an invalid payload', 'invalid_payload')
    }

    const lessons = (parsed as { lessons?: unknown }).lessons
    if (!Array.isArray(lessons) || !lessons.every(isLesson)) {
      throw new HyphaeLessonsCliError('Hyphae lessons returned an invalid payload', 'invalid_payload')
    }

    return lessons
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Hyphae lessons CLI output')
    if (err instanceof HyphaeLessonsCliError) throw err
    throw new HyphaeLessonsCliError('Failed to parse Hyphae lessons CLI output', 'invalid_payload', { cause: err })
  }
}

async function runLessonsCli(): Promise<Lesson[]> {
  try {
    const stdout = await runCli(['--all-projects', 'lessons', '--limit', String(LESSON_LIMIT)])
    return parseLessons(stdout)
  } catch (err) {
    if (err instanceof HyphaeLessonsCliError) throw err
    logger.debug({ err }, 'Failed to load Hyphae lessons from CLI')
    throw new HyphaeLessonsCliError('Failed to load Hyphae lessons from CLI', 'unavailable', { cause: err })
  }
}

export async function getLessons(): Promise<Lesson[]> {
  try {
    const raw = await callLocalService('hyphae', 'cap_lessons', {})
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (
        parsed &&
        typeof parsed === 'object' &&
        'schema_version' in parsed &&
        (parsed as { schema_version?: string }).schema_version === LESSONS_SCHEMA_VERSION &&
        'lessons' in parsed
      ) {
        const lessons = (parsed as { lessons?: unknown }).lessons
        if (Array.isArray(lessons) && lessons.every(isLesson)) {
          return lessons
        }
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for getLessons, falling back to CLI')
  }
  return runLessonsCli()
}
