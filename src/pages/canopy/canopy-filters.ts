import type { CanopyOperatorAction, CanopySnapshot, CanopyTask, CanopyTaskStatus } from '../../lib/api'

export const STATUS_ORDER: CanopyTaskStatus[] = [
  'in_progress',
  'review_required',
  'blocked',
  'assigned',
  'open',
  'completed',
  'closed',
  'cancelled',
]

export const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  ...STATUS_ORDER.map((status) => ({
    label: status.replaceAll('_', ' '),
    value: status,
  })),
]

export const SAVED_VIEW_OPTIONS = [
  { description: 'Everything in the active project', label: 'All tasks', value: 'default' },
  { description: 'Tasks Canopy already marks as needing attention', label: 'Needs attention', value: 'attention' },
  { description: 'Review-required or pending verification', label: 'Review queue', value: 'review_queue' },
  {
    description: 'Review tasks still carrying unresolved blockers or open follow-up pressure',
    label: 'Review / graph pressure',
    value: 'review_with_graph_pressure',
  },
  {
    description: 'Review tasks waiting on review or verification handoff acceptance or completion',
    label: 'Review / handoff follow-through',
    value: 'review_handoff_follow_through',
  },
  {
    description: 'Review tasks waiting on a decision-recording or closeout handoff to resolve',
    label: 'Review / decision or closeout',
    value: 'review_decision_follow_through',
  },
  {
    description: 'Review tasks still waiting on supporting evidence or a council decision',
    label: 'Review / awaiting support',
    value: 'review_awaiting_support',
  },
  {
    description: 'Review tasks with support context in place and ready for an operator review decision',
    label: 'Review / ready for decision',
    value: 'review_ready_for_decision',
  },
  {
    description: 'Review tasks with explicit decision context in place and ready for final closeout',
    label: 'Review / ready for closeout',
    value: 'review_ready_for_closeout',
  },
  { description: 'Blocked tasks and failed verification', label: 'Blocked focus', value: 'blocked' },
  { description: 'Blocked tasks with explicit dependency blockers', label: 'Dependency blocked', value: 'blocked_by_dependencies' },
  { description: 'Tasks with open handoffs', label: 'Open handoffs', value: 'handoffs' },
  { description: 'Tasks participating in follow-up chains', label: 'Follow-up chains', value: 'follow_up_chains' },
  { description: 'Open tasks with no current owner', label: 'Unclaimed', value: 'unclaimed' },
  {
    description: 'Operator-assigned work where the current owner has not claimed the task yet',
    label: 'Assigned / awaiting claim',
    value: 'assigned_awaiting_claim',
  },
  {
    description: 'Claimed work that has an owner but has not started execution yet',
    label: 'Claimed / not started',
    value: 'claimed_not_started',
  },
  { description: 'Tasks actively being worked right now', label: 'In progress', value: 'in_progress' },
  { description: 'Owned work with stale or missing execution signals', label: 'Stalled', value: 'stalled' },
  { description: 'Assigned tasks paused mid-execution and ready to resume', label: 'Paused / resumable', value: 'paused_resumable' },
  { description: 'Tasks with execution or review deadlines approaching within the next day', label: 'Due soon', value: 'due_soon' },
  {
    description: 'Tasks with execution deadlines approaching within the next day',
    label: 'Due soon / execution',
    value: 'due_soon_execution',
  },
  {
    description: 'Review-required tasks with review deadlines approaching within the next day',
    label: 'Due soon / review',
    value: 'due_soon_review',
  },
  { description: 'Tasks whose execution deadline has already passed', label: 'Overdue execution', value: 'overdue_execution' },
  {
    description: 'Execution-overdue tasks that already have an owner and need recovery follow-through',
    label: 'Overdue execution / owned',
    value: 'overdue_execution_owned',
  },
  {
    description: 'Execution-overdue tasks that still need an owner or fresh claim before work can resume',
    label: 'Overdue execution / unclaimed',
    value: 'overdue_execution_unclaimed',
  },
  { description: 'Review-required tasks whose review deadline has already passed', label: 'Overdue review', value: 'overdue_review' },
  {
    description: 'Tasks waiting for the target agent to accept an open handoff',
    label: 'Awaiting handoff acceptance',
    value: 'awaiting_handoff_acceptance',
  },
  {
    description: 'Tasks with an open handoff acceptance window that is approaching and needs prompt uptake',
    label: 'Handoff acceptance / due soon',
    value: 'due_soon_handoff_acceptance',
  },
  {
    description: 'Tasks with an open handoff acceptance window that is already overdue but not yet expired',
    label: 'Handoff acceptance / overdue',
    value: 'overdue_handoff_acceptance',
  },
  {
    description: 'Tasks with an accepted ownership handoff that have not resumed execution yet',
    label: 'Accepted handoff follow-through',
    value: 'accepted_handoff_follow_through',
  },
  { description: 'Critical tasks from the runtime attention model', label: 'Critical queue', value: 'critical' },
  { description: 'Attention tasks that have not been acknowledged yet', label: 'Unacknowledged', value: 'unacknowledged' },
] as const

export const SORT_OPTIONS = [
  { label: 'Status order', value: 'status' },
  { label: 'Title', value: 'title' },
  { label: 'Last updated', value: 'updated_at' },
  { label: 'Created at', value: 'created_at' },
  { label: 'Verification state', value: 'verification' },
  { label: 'Priority', value: 'priority' },
  { label: 'Severity', value: 'severity' },
  { label: 'Attention', value: 'attention' },
] as const

export const PRIORITY_FILTER_OPTIONS = [
  { label: 'Any priority', value: 'all' },
  { label: 'Medium+', value: 'medium' },
  { label: 'High+', value: 'high' },
  { label: 'Critical only', value: 'critical' },
] as const

export const SEVERITY_FILTER_OPTIONS = [
  { label: 'Any severity', value: 'all' },
  { label: 'Low+', value: 'low' },
  { label: 'Medium+', value: 'medium' },
  { label: 'High+', value: 'high' },
  { label: 'Critical only', value: 'critical' },
] as const

export const ACK_FILTER_OPTIONS = [
  { label: 'All acknowledgment', value: 'all' },
  { label: 'Acknowledged', value: 'true' },
  { label: 'Unacknowledged', value: 'false' },
] as const

export type CanopySavedView = (typeof SAVED_VIEW_OPTIONS)[number]['value']
export type CanopySortMode = (typeof SORT_OPTIONS)[number]['value']
export type CanopyPriorityFilter = (typeof PRIORITY_FILTER_OPTIONS)[number]['value']
export type CanopySeverityFilter = (typeof SEVERITY_FILTER_OPTIONS)[number]['value']
export type CanopyAcknowledgedFilter = (typeof ACK_FILTER_OPTIONS)[number]['value']
export type CanopyStatusFilter = 'all' | CanopyTaskStatus

export interface CanopySearchParamUpdates {
  ack?: CanopyAcknowledgedFilter | null
  preset?: CanopySavedView | null
  priority?: CanopyPriorityFilter | null
  q?: string | null
  severity?: CanopySeverityFilter | null
  sort?: CanopySortMode | null
  status?: CanopyStatusFilter | null
  task?: string | null
}

const SAVED_VIEW_VALUES = new Set<CanopySavedView>(SAVED_VIEW_OPTIONS.map((option) => option.value))
const SORT_VALUES = new Set<CanopySortMode>(SORT_OPTIONS.map((option) => option.value))
const STATUS_FILTER_VALUES = new Set<string>(STATUS_FILTER_OPTIONS.map((option) => option.value))
const PRIORITY_FILTER_VALUES = new Set<CanopyPriorityFilter>(PRIORITY_FILTER_OPTIONS.map((option) => option.value))
const SEVERITY_FILTER_VALUES = new Set<CanopySeverityFilter>(SEVERITY_FILTER_OPTIONS.map((option) => option.value))
const ACK_FILTER_VALUES = new Set<CanopyAcknowledgedFilter>(ACK_FILTER_OPTIONS.map((option) => option.value))

export interface CanopyViewState {
  acknowledgedFilter: CanopyAcknowledgedFilter
  priorityFilter: CanopyPriorityFilter
  savedView: CanopySavedView
  searchQuery: string
  selectedTaskId: string
  severityFilter: CanopySeverityFilter
  sortMode: CanopySortMode
  statusFilter: CanopyStatusFilter
}

export function resolveCanopyViewState(searchParams: URLSearchParams): CanopyViewState {
  const selectedTaskId = searchParams.get('task') ?? ''
  const searchQuery = searchParams.get('q') ?? ''
  const presetParam = searchParams.get('preset')
  const priorityParam = searchParams.get('priority')
  const severityParam = searchParams.get('severity')
  const acknowledgedParam = searchParams.get('ack')
  const sortParam = searchParams.get('sort')
  const statusParam = searchParams.get('status')
  const viewParam = searchParams.get('view')

  const sortMode: CanopySortMode = sortParam && SORT_VALUES.has(sortParam as CanopySortMode) ? (sortParam as CanopySortMode) : 'status'
  const statusFilter: CanopyStatusFilter =
    statusParam && STATUS_FILTER_VALUES.has(statusParam) ? (statusParam as CanopyStatusFilter) : 'all'
  const legacyPreset = viewParam && SAVED_VIEW_VALUES.has(viewParam as CanopySavedView) ? (viewParam as CanopySavedView) : undefined
  const savedView: CanopySavedView =
    presetParam && SAVED_VIEW_VALUES.has(presetParam as CanopySavedView) ? (presetParam as CanopySavedView) : (legacyPreset ?? 'default')
  const priorityFilter: CanopyPriorityFilter =
    priorityParam && PRIORITY_FILTER_VALUES.has(priorityParam as CanopyPriorityFilter) ? (priorityParam as CanopyPriorityFilter) : 'all'
  const severityFilter: CanopySeverityFilter =
    severityParam && SEVERITY_FILTER_VALUES.has(severityParam as CanopySeverityFilter) ? (severityParam as CanopySeverityFilter) : 'all'
  const acknowledgedFilter: CanopyAcknowledgedFilter =
    acknowledgedParam && ACK_FILTER_VALUES.has(acknowledgedParam as CanopyAcknowledgedFilter)
      ? (acknowledgedParam as CanopyAcknowledgedFilter)
      : 'all'

  return {
    acknowledgedFilter,
    priorityFilter,
    savedView,
    searchQuery,
    selectedTaskId,
    severityFilter,
    sortMode,
    statusFilter,
  }
}

export function filterCanopyTasks(
  snapshot: CanopySnapshot | undefined,
  searchQuery: string,
  statusFilter: CanopyStatusFilter
): CanopyTask[] {
  if (!snapshot) return []
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return snapshot.tasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesQuery =
      normalizedQuery.length === 0 ||
      task.title.toLowerCase().includes(normalizedQuery) ||
      (task.description?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (task.owner_note?.toLowerCase().includes(normalizedQuery) ?? false) ||
      task.task_id.toLowerCase().includes(normalizedQuery) ||
      (task.owner_agent_id?.toLowerCase().includes(normalizedQuery) ?? false)

    return matchesStatus && matchesQuery
  })
}

export function groupOperatorActionsByTask(actions: CanopyOperatorAction[] | undefined): Map<string, CanopyOperatorAction[]> {
  const grouped = new Map<string, CanopyOperatorAction[]>()

  for (const action of actions ?? []) {
    if (!action.task_id) continue
    const existing = grouped.get(action.task_id)

    if (existing) {
      existing.push(action)
    } else {
      grouped.set(action.task_id, [action])
    }
  }

  return grouped
}

export function groupTasksByStatus(tasks: CanopyTask[]): Array<{ status: CanopyTaskStatus; tasks: CanopyTask[] }> {
  return STATUS_ORDER.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  })).filter((group) => group.tasks.length > 0)
}
