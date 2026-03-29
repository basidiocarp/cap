import { createCliRunner } from './lib/cli.ts'
import { CANOPY_BIN } from './lib/config.ts'

const run = createCliRunner(CANOPY_BIN, 'canopy')
const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification', 'priority', 'severity', 'attention'])
const ALLOWED_VIEWS = new Set(['all', 'active', 'blocked', 'review', 'handoffs', 'attention'])
const ALLOWED_PRESETS = new Set(['default', 'attention', 'review_queue', 'blocked', 'handoffs', 'critical', 'unacknowledged'])
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
const ALLOWED_SEVERITIES = new Set(['none', 'low', 'medium', 'high', 'critical'])
const ALLOWED_ATTENTION_LEVELS = new Set(['normal', 'needs_attention', 'critical'])
const ALLOWED_ACKNOWLEDGED = new Set(['true', 'false'])
const ALLOWED_TASK_ACTIONS = new Set([
  'acknowledge_task',
  'unacknowledge_task',
  'reassign_task',
  'set_task_priority',
  'set_task_severity',
  'block_task',
  'unblock_task',
  'update_task_note',
])
const ALLOWED_HANDOFF_ACTIONS = new Set(['follow_up_handoff', 'expire_handoff'])

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Invalid JSON from ${label}`)
  }
}

export async function getSnapshot<T = unknown>(options?: {
  acknowledged?: string
  attentionAtLeast?: string
  preset?: string
  priorityAtLeast?: string
  projectRoot?: string
  severityAtLeast?: string
  sort?: string
  view?: string
}): Promise<T> {
  const args = ['api', 'snapshot']
  if (options?.projectRoot) args.push('--project-root', options.projectRoot)

  const view = options?.view && ALLOWED_VIEWS.has(options.view) ? options.view : undefined
  const sort = options?.sort && ALLOWED_SORTS.has(options.sort) ? options.sort : undefined
  const preset = options?.preset && ALLOWED_PRESETS.has(options.preset) ? options.preset : undefined
  const priorityAtLeast = options?.priorityAtLeast && ALLOWED_PRIORITIES.has(options.priorityAtLeast) ? options.priorityAtLeast : undefined
  const severityAtLeast = options?.severityAtLeast && ALLOWED_SEVERITIES.has(options.severityAtLeast) ? options.severityAtLeast : undefined
  const attentionAtLeast =
    options?.attentionAtLeast && ALLOWED_ATTENTION_LEVELS.has(options.attentionAtLeast) ? options.attentionAtLeast : undefined
  const acknowledged = options?.acknowledged && ALLOWED_ACKNOWLEDGED.has(options.acknowledged) ? options.acknowledged : undefined

  if (preset && preset !== 'default') args.push('--preset', preset)
  if (view && view !== 'all') args.push('--view', view)
  if (sort && sort !== 'status') args.push('--sort', sort)
  if (priorityAtLeast) args.push('--priority-at-least', priorityAtLeast)
  if (severityAtLeast) args.push('--severity-at-least', severityAtLeast)
  if (attentionAtLeast) args.push('--attention-at-least', attentionAtLeast)
  if (acknowledged) args.push('--acknowledged', acknowledged)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy api snapshot')
}

export async function getTaskDetail<T = unknown>(taskId: string): Promise<T> {
  const raw = await run(['api', 'task', '--task-id', taskId])
  return parseJson<T>(raw, 'canopy api task')
}

export async function applyTaskAction<T = unknown>(
  taskId: string,
  input: {
    action: string
    assignedTo?: string
    blockedReason?: string
    changedBy: string
    clearOwnerNote?: boolean
    note?: string
    ownerNote?: string
    priority?: string
    severity?: string
  }
): Promise<T> {
  if (!ALLOWED_TASK_ACTIONS.has(input.action)) {
    throw new Error(`Unsupported Canopy task action: ${input.action}`)
  }

  const args = ['task', 'action', '--task-id', taskId, '--action', input.action, '--changed-by', input.changedBy]
  if (input.assignedTo) args.push('--assigned-to', input.assignedTo)
  if (input.priority && ALLOWED_PRIORITIES.has(input.priority)) args.push('--priority', input.priority)
  if (input.severity && ALLOWED_SEVERITIES.has(input.severity)) args.push('--severity', input.severity)
  if (input.blockedReason) args.push('--blocked-reason', input.blockedReason)
  if (input.ownerNote) args.push('--owner-note', input.ownerNote)
  if (input.clearOwnerNote) args.push('--clear-owner-note')
  if (input.note) args.push('--note', input.note)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy task action')
}

export async function applyHandoffAction<T = unknown>(
  handoffId: string,
  input: {
    action: string
    changedBy: string
    note?: string
  }
): Promise<T> {
  if (!ALLOWED_HANDOFF_ACTIONS.has(input.action)) {
    throw new Error(`Unsupported Canopy handoff action: ${input.action}`)
  }

  const args = ['handoff', 'action', '--handoff-id', handoffId, '--action', input.action, '--changed-by', input.changedBy]
  if (input.note) args.push('--note', input.note)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy handoff action')
}
