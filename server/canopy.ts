import { createCliRunner } from './lib/cli.ts'
import { CANOPY_BIN } from './lib/config.ts'

const run = createCliRunner(CANOPY_BIN, 'canopy')

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Invalid JSON from ${label}`)
  }
}

export async function getSnapshot<T = unknown>(): Promise<T> {
  const raw = await run(['api', 'snapshot'])
  return parseJson<T>(raw, 'canopy api snapshot')
}

export async function getTaskDetail<T = unknown>(taskId: string): Promise<T> {
  const raw = await run(['api', 'task', '--task-id', taskId])
  return parseJson<T>(raw, 'canopy api task')
}
