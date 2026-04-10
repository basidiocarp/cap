import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CanopyTaskDetail } from '../../lib/api'
import { renderWithProviders } from '../../test/render'
import { TaskCouncilSection } from './activity/TaskCouncilSection'
import { buildCouncilSessionViewModel } from './council-session'

describe('buildCouncilSessionViewModel', () => {
  it('normalizes backend council sessions with role-based roster ordering', () => {
    const detail = {
      council_session: {
        council_session_id: 'council-1',
        created_at: '2026-04-09T12:00:00Z',
        participants: [
          { agent_id: 'architect-9', role: 'architect', status: 'accepted' },
          { agent_id: 'reviewer-3', role: 'reviewer', status: 'completed' },
        ],
        session_summary: 'Task-linked council session',
        state: 'open',
        task_id: 'task-1',
        timeline: [
          {
            body: 'Summoned reviewers',
            created_at: '2026-04-09T12:01:00Z',
            kind: 'summon',
            title: 'Summon reviewers',
          },
          {
            actor_agent_id: 'reviewer-3',
            body: 'Approved the task plan',
            created_at: '2026-04-09T12:03:00Z',
            kind: 'decision',
            title: 'Decision recorded',
          },
        ],
        transcript_ref: 'transcript-1',
        updated_at: '2026-04-09T12:04:00Z',
        worktree_id: 'wt-1',
      },
      messages: [],
      task: { task_id: 'task-1' },
    } as unknown as Pick<CanopyTaskDetail, 'council_session' | 'messages' | 'task'>

    const viewModel = buildCouncilSessionViewModel(detail)

    expect(viewModel).toMatchObject({
      council_session_id: 'council-1',
      source: 'backend',
      state: 'open',
      summary: 'Task-linked council session',
      task_id: 'task-1',
      transcript_ref: 'transcript-1',
      worktree_id: 'wt-1',
    })
    expect(viewModel?.roster).toEqual([
      { agent_id: 'reviewer-3', role: 'reviewer', status: 'completed' },
      { agent_id: 'architect-9', role: 'architect', status: 'accepted' },
    ])
    expect(viewModel?.timeline[0]).toMatchObject({
      kind: 'summon',
      title: 'Summon reviewers',
    })
  })

  it('derives a council session from council messages when no session is attached', () => {
    const detail = {
      messages: [
        {
          author_agent_id: 'architect-2',
          body: 'Architect notes',
          created_at: '2026-04-09T12:05:00Z',
          message_id: 'message-1',
          message_type: 'proposal',
          task_id: 'task-2',
        },
        {
          author_agent_id: 'reviewer-7',
          body: 'Reviewer agrees',
          created_at: '2026-04-09T12:06:00Z',
          message_id: 'message-2',
          message_type: 'decision',
          task_id: 'task-2',
        },
      ],
      task: { task_id: 'task-2' },
    } as Pick<CanopyTaskDetail, 'messages' | 'task'>

    const viewModel = buildCouncilSessionViewModel(detail)

    expect(viewModel).toMatchObject({
      council_session_id: null,
      source: 'derived',
      state: 'open',
      task_id: 'task-2',
    })
    expect(viewModel?.roster).toEqual([
      { agent_id: null, role: 'reviewer', status: 'pending' },
      { agent_id: null, role: 'architect', status: 'pending' },
    ])
    expect(viewModel?.timeline[0]).toMatchObject({
      kind: 'message',
      title: 'proposal',
    })
  })
})

describe('TaskCouncilSection', () => {
  it('renders the task-linked council session surface without a composer', () => {
    const detail = {
      council_session: {
        council_session_id: 'council-1',
        created_at: '2026-04-09T12:00:00Z',
        participants: [
          { agent_id: 'architect-9', role: 'architect', status: 'accepted' },
          { agent_id: 'reviewer-3', role: 'reviewer', status: 'completed' },
        ],
        session_summary: 'Task-linked council session',
        state: 'closed',
        task_id: 'task-1',
        timeline: [
          {
            body: 'Summoned reviewers',
            created_at: '2026-04-09T12:01:00Z',
            kind: 'summon',
            title: 'Summon reviewers',
          },
        ],
        transcript_ref: 'transcript-1',
        updated_at: '2026-04-09T12:04:00Z',
        worktree_id: 'wt-1',
      },
      messages: [],
      task: { task_id: 'task-1' },
    } as unknown as CanopyTaskDetail

    renderWithProviders(<TaskCouncilSection detail={detail} />)

    expect(screen.getByText('task-linked')).toBeInTheDocument()
    expect(screen.getByText('reviewer')).toBeInTheDocument()
    expect(screen.getByText('architect')).toBeInTheDocument()
    expect(screen.getByText('Summoned reviewers')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders the derived council session fallback from messages', () => {
    const detail = {
      messages: [
        {
          author_agent_id: 'agent-1',
          body: 'Draft response',
          created_at: '2026-04-09T12:07:00Z',
          message_id: 'message-1',
          message_type: 'proposal',
          task_id: 'task-2',
        },
      ],
      task: { task_id: 'task-2' },
    } as unknown as CanopyTaskDetail

    renderWithProviders(<TaskCouncilSection detail={detail} />)

    expect(screen.getByText('derived')).toBeInTheDocument()
    expect(screen.getByText('Draft response')).toBeInTheDocument()
    expect(screen.queryByText('No council session is attached to this task yet.')).not.toBeInTheDocument()
  })
})
