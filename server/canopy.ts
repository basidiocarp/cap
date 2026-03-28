import { createCliRunner } from './lib/cli.ts'
import { CANOPY_BIN } from './lib/config.ts'

const run = createCliRunner(CANOPY_BIN, 'canopy')
const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification'])
const ALLOWED_VIEWS = new Set(['all', 'active', 'blocked', 'review', 'handoffs', 'attention'])

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Invalid JSON from ${label}`)
  }
}

export async function getSnapshot<T = unknown>(options?: { projectRoot?: string; sort?: string; view?: string }): Promise<T> {
  const args = ['api', 'snapshot']
  if (options?.projectRoot) args.push('--project-root', options.projectRoot)

  const view = options?.view && ALLOWED_VIEWS.has(options.view) ? options.view : undefined
  const sort = options?.sort && ALLOWED_SORTS.has(options.sort) ? options.sort : undefined

  if (view && view !== 'all') args.push('--view', view)
  if (sort && sort !== 'status') args.push('--sort', sort)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy api snapshot')
}

export async function getTaskDetail<T = unknown>(taskId: string): Promise<T> {
  const raw = await run(['api', 'task', '--task-id', taskId])
  return parseJson<T>(raw, 'canopy api task')
}
