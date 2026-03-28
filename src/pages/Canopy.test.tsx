import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CanopySnapshot, CanopyTaskDetail, ProjectInfo } from '../lib/api'
import { renderWithProviders } from '../test/render'
import { Canopy } from './Canopy'

let mockProject: ProjectInfo | null = {
  active: '/workspace/cap',
  recent: ['/workspace/cap'],
}
let mockTaskDetailError: Error | null = null

const mockSnapshot: CanopySnapshot = {
  agent_attention: [
    {
      agent_id: 'agent-2',
      current_task_id: 'task-2',
      freshness: 'stale',
      last_heartbeat_at: '2026-03-27T10:05:00Z',
      level: 'critical',
      reasons: ['blocked_status', 'stale_heartbeat'],
    },
    {
      agent_id: 'agent-1',
      current_task_id: 'task-1',
      freshness: 'fresh',
      last_heartbeat_at: '2026-03-28T12:00:00Z',
      level: 'normal',
      reasons: [],
    },
  ],
  agent_heartbeat_summaries: [
    {
      agent_id: 'agent-2',
      current_task_id: 'task-2',
      freshness: 'stale',
      heartbeat_count: 1,
      last_heartbeat_at: '2026-03-27T10:05:00Z',
      last_status: 'blocked',
    },
    {
      agent_id: 'agent-1',
      current_task_id: 'task-1',
      freshness: 'fresh',
      heartbeat_count: 3,
      last_heartbeat_at: '2026-03-28T12:06:00Z',
      last_status: 'in_progress',
    },
  ],
  agents: [
    {
      agent_id: 'agent-2',
      current_task_id: 'task-2',
      heartbeat_at: '2026-03-27T10:05:00Z',
      host_id: 'claude',
      host_instance: 'claude-review',
      host_type: 'claude_code',
      model: 'gpt-5.4',
      project_root: '/workspace/cap',
      status: 'blocked',
      worktree_id: 'wt-2',
    },
    {
      agent_id: 'agent-1',
      current_task_id: 'task-1',
      heartbeat_at: '2026-03-28T12:00:00Z',
      host_id: 'claude',
      host_instance: 'claude-main',
      host_type: 'claude_code',
      model: 'gpt-5.4',
      project_root: '/workspace/cap',
      status: 'in_progress',
      worktree_id: 'wt-1',
    },
  ],
  attention: {
    agents_needing_attention: 1,
    critical_tasks: 1,
    handoffs_needing_attention: 1,
    stale_agents: 1,
    stale_handoffs: 0,
    tasks_needing_attention: 2,
  },
  evidence: [],
  handoff_attention: [
    {
      freshness: 'aging',
      handoff_id: 'handoff-1',
      level: 'needs_attention',
      reasons: ['aging_open_handoff'],
      task_id: 'task-1',
    },
  ],
  handoffs: [
    {
      created_at: '2026-03-28T12:08:00Z',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      from_agent_id: 'agent-1',
      handoff_id: 'handoff-1',
      handoff_type: 'request_review',
      requested_action: 'Review the final patch',
      resolved_at: null,
      status: 'open',
      summary: 'Need review before closing',
      task_id: 'task-1',
      to_agent_id: 'agent-2',
      updated_at: '2026-03-28T12:08:00Z',
    },
  ],
  heartbeats: [
    {
      agent_id: 'agent-1',
      created_at: '2026-03-28T12:06:00Z',
      current_task_id: 'task-1',
      heartbeat_id: 'hb-1',
      related_task_id: 'task-1',
      source: 'heartbeat',
      status: 'in_progress',
    },
  ],
  operator_actions: [
    {
      action_id: 'action-1',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'verify_task',
      level: 'needs_attention',
      summary: 'Verify the UI changes before closing the task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Verify pending review',
    },
    {
      action_id: 'action-2',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'follow_up_handoff',
      level: 'needs_attention',
      summary: 'Follow up on the open review handoff before it expires.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Review handoff aging',
    },
    {
      action_id: 'action-3',
      agent_id: 'agent-2',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'acknowledge_task',
      level: 'critical',
      summary: 'Acknowledge the blocked task before triage continues.',
      target_kind: 'task',
      task_id: 'task-2',
      title: 'Acknowledge blocked task',
    },
  ],
  ownership: [
    {
      assignment_count: 1,
      current_owner_agent_id: 'agent-2',
      last_assigned_at: '2026-03-27T10:00:00Z',
      last_assigned_by: 'operator',
      last_assigned_to: 'agent-2',
      last_assignment_reason: 'adapter recovery owner',
      reassignment_count: 0,
      task_id: 'task-2',
    },
    {
      assignment_count: 2,
      current_owner_agent_id: 'agent-1',
      last_assigned_at: '2026-03-28T12:04:00Z',
      last_assigned_by: 'operator',
      last_assigned_to: 'agent-1',
      last_assignment_reason: 'handoff to strongest verifier',
      reassignment_count: 1,
      task_id: 'task-1',
    },
  ],
  task_attention: [
    {
      acknowledged: false,
      freshness: 'stale',
      level: 'critical',
      open_handoff_freshness: null,
      owner_heartbeat_freshness: 'stale',
      reasons: ['blocked', 'verification_failed', 'critical_severity', 'stale_owner_heartbeat', 'unacknowledged'],
      task_id: 'task-2',
    },
    {
      acknowledged: true,
      freshness: 'fresh',
      level: 'needs_attention',
      open_handoff_freshness: 'aging',
      owner_heartbeat_freshness: 'fresh',
      reasons: ['review_required', 'aging_open_handoff'],
      task_id: 'task-1',
    },
  ],
  task_heartbeat_summaries: [
    {
      aging_agents: 0,
      fresh_agents: 0,
      heartbeat_count: 1,
      last_heartbeat_at: '2026-03-27T10:05:00Z',
      missing_agents: 0,
      related_agent_count: 1,
      stale_agents: 1,
      task_id: 'task-2',
    },
    {
      aging_agents: 1,
      fresh_agents: 1,
      heartbeat_count: 3,
      last_heartbeat_at: '2026-03-28T12:06:00Z',
      missing_agents: 0,
      related_agent_count: 2,
      stale_agents: 0,
      task_id: 'task-1',
    },
  ],
  tasks: [
    {
      acknowledged_at: null,
      acknowledged_by: null,
      blocked_reason: 'waiting on host repair',
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-27T10:00:00Z',
      description: 'Repair a broken adapter',
      owner_agent_id: 'agent-2',
      owner_note: 'Waiting on a host-level fix before retrying.',
      priority: 'critical',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'critical',
      status: 'blocked',
      task_id: 'task-2',
      title: 'Fix lifecycle adapter',
      updated_at: '2026-03-27T10:00:00Z',
      verification_state: 'failed',
      verified_at: null,
      verified_by: null,
    },
    {
      acknowledged_at: '2026-03-28T12:07:00Z',
      acknowledged_by: 'operator',
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-28T11:55:00Z',
      description: 'Wire the first Cap integration path.',
      owner_agent_id: 'agent-1',
      owner_note: 'Close after UI review.',
      priority: 'high',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'medium',
      status: 'review_required',
      task_id: 'task-1',
      title: 'Add Cap Canopy page',
      updated_at: '2026-03-28T12:10:00Z',
      verification_state: 'pending',
      verified_at: '2026-03-28T12:05:00Z',
      verified_by: 'operator',
    },
  ],
}

const mockTaskDetail: CanopyTaskDetail = {
  agent_attention: [mockSnapshot.agent_attention[1]],
  agent_heartbeat_summaries: [mockSnapshot.agent_heartbeat_summaries[1]],
  assignments: [
    {
      assigned_at: '2026-03-28T12:01:00Z',
      assigned_by: 'operator',
      assigned_to: 'agent-2',
      assignment_id: 'assign-1',
      reason: 'initial UI pass',
      task_id: 'task-1',
    },
    {
      assigned_at: '2026-03-28T12:04:00Z',
      assigned_by: 'operator',
      assigned_to: 'agent-1',
      assignment_id: 'assign-2',
      reason: 'handoff to strongest verifier',
      task_id: 'task-1',
    },
  ],
  attention: mockSnapshot.task_attention[1],
  events: [
    {
      actor: 'operator',
      created_at: '2026-03-28T12:00:00Z',
      event_id: 'evt-1',
      event_type: 'created',
      from_status: null,
      note: 'Wire the first Cap integration path.',
      owner_agent_id: null,
      task_id: 'task-1',
      to_status: 'open',
      verification_state: 'unknown',
    },
    {
      actor: 'operator',
      created_at: '2026-03-28T12:05:00Z',
      event_id: 'evt-2',
      event_type: 'status_changed',
      from_status: 'assigned',
      note: 'Ready for UI review',
      owner_agent_id: 'agent-1',
      task_id: 'task-1',
      to_status: 'review_required',
      verification_state: 'pending',
    },
    {
      actor: 'operator',
      created_at: '2026-03-28T12:07:00Z',
      event_id: 'evt-3',
      event_type: 'triage_updated',
      from_status: 'review_required',
      note: 'priority=high; acknowledged=true; owner_note_updated=true',
      owner_agent_id: 'agent-1',
      task_id: 'task-1',
      to_status: 'review_required',
      verification_state: 'pending',
    },
  ],
  evidence: [
    {
      evidence_id: 'evidence-1',
      label: 'Hyphae session',
      related_file: null,
      related_handoff_id: null,
      related_memory_query: null,
      related_session_id: 'ses_123',
      related_symbol: null,
      source_kind: 'hyphae_session',
      source_ref: 'ses_123',
      summary: 'Task work linked to a Hyphae session.',
      task_id: 'task-1',
    },
    {
      evidence_id: 'evidence-2',
      label: 'Recall signal',
      related_file: null,
      related_handoff_id: null,
      related_memory_query: 'task:cap-canopy',
      related_session_id: null,
      related_symbol: null,
      source_kind: 'hyphae_recall',
      source_ref: 'memory-topic',
      summary: 'Recall evidence for the task.',
      task_id: 'task-1',
    },
    {
      evidence_id: 'evidence-3',
      label: 'Rhizome impact',
      related_file: '/workspace/cap/src/pages/Canopy.tsx',
      related_handoff_id: null,
      related_memory_query: null,
      related_session_id: null,
      related_symbol: 'Canopy',
      source_kind: 'rhizome_impact',
      source_ref: 'AddCapCanopyPage',
      summary: 'Impact analysis captured in Rhizome.',
      task_id: 'task-1',
    },
  ],
  handoff_attention: mockSnapshot.handoff_attention,
  handoffs: mockSnapshot.handoffs,
  heartbeat_summary: mockSnapshot.task_heartbeat_summaries[1],
  heartbeats: mockSnapshot.heartbeats,
  messages: [
    {
      author_agent_id: 'agent-1',
      body: 'Ready for review.',
      message_id: 'msg-1',
      message_type: 'status',
      task_id: 'task-1',
    },
  ],
  operator_actions: mockSnapshot.operator_actions.filter((action) => action.task_id === 'task-1'),
  ownership: mockSnapshot.ownership[1],
  task: mockSnapshot.tasks[1],
}

function snapshotForTaskIds(taskIds: string[]): CanopySnapshot {
  const allowedTaskIds = new Set(taskIds)
  const allowedAgentIds = new Set(
    mockSnapshot.tasks
      .filter((task) => allowedTaskIds.has(task.task_id))
      .map((task) => task.owner_agent_id)
      .filter(Boolean)
  )
  const orderedTasks = taskIds
    .map((taskId) => mockSnapshot.tasks.find((task) => task.task_id === taskId))
    .filter((task): task is CanopySnapshot['tasks'][number] => Boolean(task))

  return {
    ...mockSnapshot,
    agent_attention: mockSnapshot.agent_attention.filter((attention) => {
      const taskMatch = attention.current_task_id ? allowedTaskIds.has(attention.current_task_id) : false
      return taskMatch || allowedAgentIds.has(attention.agent_id)
    }),
    agent_heartbeat_summaries: mockSnapshot.agent_heartbeat_summaries.filter((summary) => {
      const taskMatch = summary.current_task_id ? allowedTaskIds.has(summary.current_task_id) : false
      return taskMatch || allowedAgentIds.has(summary.agent_id)
    }),
    evidence: mockSnapshot.evidence.filter((item) => allowedTaskIds.has(item.task_id)),
    handoff_attention: mockSnapshot.handoff_attention.filter((attention) => allowedTaskIds.has(attention.task_id)),
    handoffs: mockSnapshot.handoffs.filter((handoff) => allowedTaskIds.has(handoff.task_id)),
    heartbeats: mockSnapshot.heartbeats.filter((heartbeat) => {
      const currentMatches = heartbeat.current_task_id ? allowedTaskIds.has(heartbeat.current_task_id) : false
      const relatedMatches = heartbeat.related_task_id ? allowedTaskIds.has(heartbeat.related_task_id) : false
      return currentMatches || relatedMatches
    }),
    operator_actions: mockSnapshot.operator_actions.filter((action) => (action.task_id ? allowedTaskIds.has(action.task_id) : false)),
    ownership: mockSnapshot.ownership.filter((ownership) => allowedTaskIds.has(ownership.task_id)),
    task_attention: mockSnapshot.task_attention.filter((attention) => allowedTaskIds.has(attention.task_id)),
    task_heartbeat_summaries: mockSnapshot.task_heartbeat_summaries.filter((summary) => allowedTaskIds.has(summary.task_id)),
    tasks: orderedTasks,
  }
}

function responseKey(options?: {
  acknowledged?: string
  preset?: string
  priorityAtLeast?: string
  project?: string
  severityAtLeast?: string
  sort?: string
  view?: string
}): string {
  return JSON.stringify({
    acknowledged: options?.acknowledged ?? null,
    preset: options?.preset ?? options?.view ?? 'default',
    priorityAtLeast: options?.priorityAtLeast ?? null,
    project: options?.project ?? null,
    severityAtLeast: options?.severityAtLeast ?? null,
    sort: options?.sort ?? null,
  })
}

const SNAPSHOT_RESPONSES = new Map<string, CanopySnapshot>([
  [responseKey({ preset: 'critical', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'unacknowledged', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'unacknowledged', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'blocked', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'handoffs', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'handoffs', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_queue', project: '/workspace/cap', sort: 'updated_at' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'critical', project: '/workspace/cap', sort: 'attention' }), snapshotForTaskIds(['task-2'])],
  [
    responseKey({
      acknowledged: 'true',
      preset: 'default',
      priorityAtLeast: 'critical',
      project: '/workspace/cap',
      severityAtLeast: 'critical',
      sort: 'updated_at',
    }),
    snapshotForTaskIds(['task-1']),
  ],
  [
    responseKey({
      acknowledged: 'false',
      preset: 'default',
      priorityAtLeast: 'high',
      project: '/workspace/cap',
      severityAtLeast: 'critical',
      sort: 'status',
    }),
    snapshotForTaskIds(['task-2']),
  ],
  [
    responseKey({
      preset: 'default',
      priorityAtLeast: 'critical',
      project: '/workspace/cap',
      sort: 'status',
    }),
    snapshotForTaskIds(['task-2']),
  ],
  [responseKey({ preset: 'default', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-2', 'task-1'])],
  [responseKey({ preset: 'default', project: '/workspace/cap', sort: 'updated_at' }), snapshotForTaskIds(['task-1', 'task-2'])],
  [responseKey({ project: '/workspace/cap', sort: 'updated_at' }), snapshotForTaskIds(['task-1', 'task-2'])],
])

const useCanopySnapshotMock = vi.fn(
  (options?: {
    acknowledged?: string
    preset?: string
    priorityAtLeast?: string
    project?: string
    severityAtLeast?: string
    sort?: string
    view?: string
  }) => {
    const key = responseKey(options)
    const data = SNAPSHOT_RESPONSES.get(key)

    if (!data) {
      throw new Error(`Unhandled Canopy snapshot test query: ${key}`)
    }

    return {
      data,
      error: null,
      isLoading: false,
    }
  }
)

vi.mock('../lib/queries', () => ({
  useCanopySnapshot: (options?: {
    acknowledged?: string
    preset?: string
    priorityAtLeast?: string
    project?: string
    severityAtLeast?: string
    sort?: string
    view?: string
  }) => useCanopySnapshotMock(options),
  useCanopyTaskDetail: (taskId: string) => ({
    data: taskId && !mockTaskDetailError ? mockTaskDetail : undefined,
    error: mockTaskDetailError,
    isLoading: false,
  }),
  useProjectContextController: () => ({
    data: mockProject,
    isLoading: false,
  }),
}))

describe('Canopy page', () => {
  beforeEach(() => {
    mockProject = { active: '/workspace/cap', recent: ['/workspace/cap'] }
    mockTaskDetailError = null
    useCanopySnapshotMock.mockClear()
  })

  it('renders a project-scoped operator board from the Canopy snapshot', () => {
    renderWithProviders(<Canopy />, { route: '/canopy' })

    expect(screen.getByRole('heading', { name: 'Canopy' })).toBeInTheDocument()
    expect(screen.getByText('Showing Canopy coordination state for /workspace/cap.')).toBeInTheDocument()
    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.getByText('1 critical tasks')).toBeInTheDocument()
    expect(screen.getByText('2 need attention')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Critical · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unacknowledged · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open handoffs · 1' })).toBeInTheDocument()
    expect(screen.getByText(/Assignments 2 · reassignments 1/)).toBeInTheDocument()
    expect(screen.getByText('verify task')).toBeInTheDocument()
  })

  it('filters tasks by query and status from the URL', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?q=lifecycle&status=blocked' })

    expect(screen.getByDisplayValue('lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
  })

  it('applies saved views and sorting from the URL', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?preset=review_queue&sort=updated_at' })

    expect(screen.getByDisplayValue('updated_at')).toBeInTheDocument()
    expect(screen.getByText('Review queue')).toBeInTheDocument()
    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.queryByText('Fix lifecycle adapter')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_queue',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'updated_at',
    })
  })

  it('supports the runtime critical queue', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?preset=critical&sort=attention' })

    expect(screen.getByText('Critical queue')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'critical',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'attention',
    })
  })

  it('opens the runtime unacknowledged queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, {
      route: '/canopy?priority=critical&severity=critical&ack=true&status=review_required&q=cap&sort=updated_at',
    })

    await user.click(screen.getByRole('button', { name: 'Unacknowledged · 1' }))

    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'unacknowledged',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime handoff queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy?priority=critical&status=blocked&q=adapter' })

    await user.click(screen.getByRole('button', { name: 'Open handoffs · 1' }))

    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.queryByText('Fix lifecycle adapter')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'handoffs',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('supports runtime triage filters', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?priority=high&severity=critical&ack=false' })

    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: 'false',
      preset: 'default',
      priorityAtLeast: 'high',
      project: '/workspace/cap',
      severityAtLeast: 'critical',
      sort: 'status',
    })
  })

  it('renders non-status sorts as a flat ordered list', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?sort=updated_at' })

    const taskTitles = screen.getAllByText(/Add Cap Canopy page|Fix lifecycle adapter/).map((node) => node.textContent)
    expect(taskTitles).toEqual(['Add Cap Canopy page', 'Fix lifecycle adapter'])
  })

  it('falls back to default query-state when URL values are invalid', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?preset=bogus&priority=nope&severity=nope&ack=nope&sort=bogus&status=nope' })

    expect(screen.getByDisplayValue('status')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('all').length).toBeGreaterThan(0)
    expect(screen.getByText('All tasks')).toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'default',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'status',
    })
  })

  it('scopes active agents to the visible task slice', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?status=blocked' })

    const activeAgentsCard = screen.getByRole('heading', { name: 'Active Agents' }).closest('div')
    expect(activeAgentsCard?.textContent).toContain('1')
    expect(screen.getByText('1 stale agents')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
  })

  it('opens task detail drilldown from the board', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    const [openTaskButton] = screen.getAllByRole('button', { name: 'Open task detail' })
    expect(openTaskButton).toBeDefined()

    await user.click(openTaskButton)

    expect(await screen.findByText(/Task ID:/)).toBeInTheDocument()
    expect(screen.getAllByText('needs attention').length).toBeGreaterThan(0)
    expect(screen.getByText(/Attention reasons:/)).toBeInTheDocument()
    expect(screen.getAllByText('priority high').length).toBeGreaterThan(0)
    expect(screen.getAllByText('severity medium').length).toBeGreaterThan(0)
    expect(screen.getAllByText('acknowledged').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Operator note:/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Owner heartbeat freshness:/)).toBeInTheDocument()
    expect(screen.getByText('Runtime Summary')).toBeInTheDocument()
    expect(screen.getByText('Current owner: agent-1')).toBeInTheDocument()
    expect(screen.getByText('Assignments: 2')).toBeInTheDocument()
    expect(screen.getByText(/Freshness: 1 fresh · 1 aging · 0 stale · 0 missing/)).toBeInTheDocument()
    expect(screen.getByText('Verify pending review')).toBeInTheDocument()
    expect(screen.getByText('Review handoff aging')).toBeInTheDocument()
    expect(await screen.findByText('Task created')).toBeInTheDocument()
    expect(screen.getByText('Triage updated')).toBeInTheDocument()
    expect(screen.getByText('Heartbeats')).toBeInTheDocument()
    expect(screen.getByText('Agent Attention')).toBeInTheDocument()
    expect(screen.getAllByText('Agent: agent-1').length).toBeGreaterThan(0)
    expect(screen.getByText(/Heartbeats 3 · latest status in_progress/)).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByText('operator → agent-1')).toBeInTheDocument()
    expect(screen.getAllByText('Reason: handoff to strongest verifier').length).toBeGreaterThan(0)
    expect(screen.getByText('Status changed to review_required')).toBeInTheDocument()
    expect(screen.getByText('Need review before closing')).toBeInTheDocument()
    expect(screen.getAllByText(/Due /).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Expires /).length).toBeGreaterThan(0)
    expect(screen.getByText('Ready for review.')).toBeInTheDocument()
    expect(screen.getByText('Hyphae session')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open session' })).toHaveAttribute('href', '/sessions?session=ses_123')
    expect(screen.getByRole('link', { name: 'Search memories' })).toHaveAttribute('href', '/memories?q=task%3Acap-canopy')
    expect(screen.getByRole('link', { name: 'Open code explorer' })).toHaveAttribute(
      'href',
      '/code?file=%2Fworkspace%2Fcap%2Fsrc%2Fpages%2FCanopy.tsx&symbol=Canopy'
    )
  })

  it('shows a modal-local error state when task detail cannot be loaded', async () => {
    const user = userEvent.setup()
    mockTaskDetailError = new Error('task detail failed')

    renderWithProviders(<Canopy />, { route: '/canopy' })

    const [openTaskButton] = screen.getAllByRole('button', { name: 'Open task detail' })
    await user.click(openTaskButton)

    expect(await screen.findByText('Could not load task detail for the selected Canopy task.')).toBeInTheDocument()
    expect(screen.getAllByText('task detail failed').length).toBeGreaterThan(0)
  })
})
