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
  task: mockSnapshot.tasks[1],
}

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
    let tasks = [...mockSnapshot.tasks]

    if (options?.project) {
      tasks = tasks.filter((task) => task.project_root === options.project)
    }

    const preset = options?.preset ?? options?.view

    if (preset === 'review_queue' || preset === 'review') {
      tasks = tasks.filter((task) => task.status === 'review_required' || task.verification_state === 'pending')
    }

    if (preset === 'blocked') {
      tasks = tasks.filter((task) => task.status === 'blocked' || task.verification_state === 'failed')
    }

    if (preset === 'active') {
      tasks = tasks.filter((task) => ['open', 'assigned', 'in_progress'].includes(task.status))
    }

    if (preset === 'handoffs') {
      const openTaskIds = new Set(mockSnapshot.handoffs.filter((handoff) => handoff.status === 'open').map((handoff) => handoff.task_id))
      tasks = tasks.filter((task) => openTaskIds.has(task.task_id))
    }

    if (preset === 'attention') {
      const attentionTaskIds = new Set(
        mockSnapshot.task_attention.filter((attention) => attention.level !== 'normal').map((attention) => attention.task_id)
      )
      tasks = tasks.filter((task) => attentionTaskIds.has(task.task_id))
    }

    if (preset === 'critical') {
      const criticalTaskIds = new Set(
        mockSnapshot.task_attention.filter((attention) => attention.level === 'critical').map((attention) => attention.task_id)
      )
      tasks = tasks.filter((task) => criticalTaskIds.has(task.task_id))
    }

    if (preset === 'unacknowledged') {
      const unacknowledgedTaskIds = new Set(
        mockSnapshot.task_attention.filter((attention) => !attention.acknowledged).map((attention) => attention.task_id)
      )
      tasks = tasks.filter((task) => unacknowledgedTaskIds.has(task.task_id))
    }

    if (options?.priorityAtLeast) {
      const priorityRank = { critical: 3, high: 2, low: 0, medium: 1 }
      tasks = tasks.filter((task) => priorityRank[task.priority] >= priorityRank[options.priorityAtLeast as keyof typeof priorityRank])
    }

    if (options?.severityAtLeast) {
      const severityRank = { critical: 4, high: 3, low: 1, medium: 2, none: 0 }
      tasks = tasks.filter((task) => severityRank[task.severity] >= severityRank[options.severityAtLeast as keyof typeof severityRank])
    }

    if (options?.acknowledged === 'true') {
      tasks = tasks.filter((task) => task.acknowledged_at)
    }

    if (options?.acknowledged === 'false') {
      tasks = tasks.filter((task) => !task.acknowledged_at)
    }

    if (options?.sort === 'updated_at') {
      tasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    } else if (options?.sort === 'created_at') {
      tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (options?.sort === 'title') {
      tasks.sort((a, b) => a.title.localeCompare(b.title))
    } else if (options?.sort === 'priority') {
      const priorityRank = { critical: 3, high: 2, low: 0, medium: 1 }
      tasks.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])
    } else if (options?.sort === 'severity') {
      const severityRank = { critical: 4, high: 3, low: 1, medium: 2, none: 0 }
      tasks.sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    } else if (options?.sort === 'attention') {
      const attentionMap = new Map(mockSnapshot.task_attention.map((attention) => [attention.task_id, attention]))
      tasks.sort((a, b) => {
        const rank = { critical: 2, needs_attention: 1, normal: 0 }
        return rank[attentionMap.get(b.task_id)?.level ?? 'normal'] - rank[attentionMap.get(a.task_id)?.level ?? 'normal']
      })
    }

    const taskIds = new Set(tasks.map((task) => task.task_id))

    return {
      data: {
        ...mockSnapshot,
        agent_attention: mockSnapshot.agent_attention.filter((attention) => {
          const taskMatch = attention.current_task_id ? taskIds.has(attention.current_task_id) : false
          return taskMatch
        }),
        evidence: mockSnapshot.evidence.filter((item) => taskIds.has(item.task_id)),
        handoff_attention: mockSnapshot.handoff_attention.filter((attention) => taskIds.has(attention.task_id)),
        handoffs: mockSnapshot.handoffs.filter((handoff) => taskIds.has(handoff.task_id)),
        heartbeats: mockSnapshot.heartbeats.filter((heartbeat) => {
          const currentMatches = heartbeat.current_task_id ? taskIds.has(heartbeat.current_task_id) : false
          const relatedMatches = heartbeat.related_task_id ? taskIds.has(heartbeat.related_task_id) : false
          return currentMatches || relatedMatches
        }),
        task_attention: mockSnapshot.task_attention.filter((attention) => taskIds.has(attention.task_id)),
        tasks,
      },
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
  useProject: () => ({
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
    expect(await screen.findByText('Task created')).toBeInTheDocument()
    expect(screen.getByText('Triage updated')).toBeInTheDocument()
    expect(screen.getByText('Heartbeats')).toBeInTheDocument()
    expect(screen.getByText('Agent Attention')).toBeInTheDocument()
    expect(screen.getAllByText('Agent: agent-1').length).toBeGreaterThan(0)
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
