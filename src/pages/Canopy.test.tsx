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

const mockSnapshot: CanopySnapshot = {
  agents: [
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
  evidence: [],
  handoffs: [
    {
      from_agent_id: 'agent-1',
      handoff_id: 'handoff-1',
      handoff_type: 'request_review',
      requested_action: 'Review the final patch',
      status: 'open',
      summary: 'Need review before closing',
      task_id: 'task-1',
      to_agent_id: 'agent-2',
    },
  ],
  tasks: [
    {
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      description: 'Wire the first Cap integration path.',
      owner_agent_id: 'agent-1',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      status: 'review_required',
      task_id: 'task-1',
      title: 'Add Cap Canopy page',
      verification_state: 'pending',
      verified_at: '2026-03-28T12:05:00Z',
      verified_by: 'operator',
    },
    {
      blocked_reason: 'waiting on host repair',
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      description: 'Repair a broken adapter',
      owner_agent_id: 'agent-2',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      status: 'blocked',
      task_id: 'task-2',
      title: 'Fix lifecycle adapter',
      verification_state: 'failed',
      verified_at: null,
      verified_by: null,
    },
  ],
}

const mockTaskDetail: CanopyTaskDetail = {
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
  ],
  evidence: [
    {
      evidence_id: 'evidence-1',
      label: 'Hyphae session',
      related_handoff_id: null,
      source_kind: 'hyphae_session',
      source_ref: 'ses_123',
      summary: 'Task work linked to a Hyphae session.',
      task_id: 'task-1',
    },
    {
      evidence_id: 'evidence-2',
      label: 'Recall signal',
      related_handoff_id: null,
      source_kind: 'hyphae_recall',
      source_ref: 'memory-topic',
      summary: 'Recall evidence for the task.',
      task_id: 'task-1',
    },
    {
      evidence_id: 'evidence-3',
      label: 'Rhizome impact',
      related_handoff_id: null,
      source_kind: 'rhizome_impact',
      source_ref: 'AddCapCanopyPage',
      summary: 'Impact analysis captured in Rhizome.',
      task_id: 'task-1',
    },
  ],
  handoffs: mockSnapshot.handoffs,
  messages: [
    {
      author_agent_id: 'agent-1',
      body: 'Ready for review.',
      message_id: 'msg-1',
      message_type: 'status',
      task_id: 'task-1',
    },
  ],
  task: mockSnapshot.tasks[0],
}

vi.mock('../lib/queries', () => ({
  useCanopySnapshot: () => ({
    data: mockSnapshot,
    error: null,
    isLoading: false,
  }),
  useCanopyTaskDetail: (taskId: string) => ({
    data: taskId ? mockTaskDetail : undefined,
    error: null,
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
  })

  it('renders a project-scoped operator board from the Canopy snapshot', () => {
    renderWithProviders(<Canopy />, { route: '/canopy' })

    expect(screen.getByRole('heading', { name: 'Canopy' })).toBeInTheDocument()
    expect(screen.getByText('Showing Canopy coordination state for /workspace/cap.')).toBeInTheDocument()
    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.getByText('1 review required')).toBeInTheDocument()
    expect(screen.getByText('1 verification failed')).toBeInTheDocument()
  })

  it('filters tasks by query and status from the URL', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?q=lifecycle&status=blocked' })

    expect(screen.getByDisplayValue('lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
  })

  it('applies saved views and sorting from the URL', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?view=review&sort=owner' })

    expect(screen.getByDisplayValue('owner')).toBeInTheDocument()
    expect(screen.getByText('Review queue')).toBeInTheDocument()
    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.queryByText('Fix lifecycle adapter')).not.toBeInTheDocument()
  })

  it('opens task detail drilldown from the board', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    const [openTaskButton] = screen.getAllByRole('button', { name: 'Open task detail' })
    expect(openTaskButton).toBeDefined()

    await user.click(openTaskButton)

    expect(await screen.findByText(/Task ID:/)).toBeInTheDocument()
    expect(await screen.findByText('Task created')).toBeInTheDocument()
    expect(screen.getByText('Status changed to review_required')).toBeInTheDocument()
    expect(screen.getByText('Need review before closing')).toBeInTheDocument()
    expect(screen.getByText('Ready for review.')).toBeInTheDocument()
    expect(screen.getByText('Hyphae session')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open session' })).toHaveAttribute('href', '/sessions?session=ses_123')
    expect(screen.getByRole('link', { name: 'Search session memories' })).toHaveAttribute('href', '/memories?q=ses_123')
    expect(screen.getByRole('link', { name: 'Search memories' })).toHaveAttribute('href', '/memories?q=memory-topic')
    expect(screen.getByRole('link', { name: 'Open code explorer' })).toHaveAttribute('href', '/code?filter=AddCapCanopyPage')
  })
})
