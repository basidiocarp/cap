import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CommandHistory, EcosystemStatus, ProjectInfo, RhizomeStatus, SessionTimelineRecord } from '../lib/api'
import { renderWithProviders } from '../test/render'
import { Sessions } from './Sessions'

let mockProject: ProjectInfo | null = {
  active: '/workspace/cap',
  recent: ['/workspace/cap', '/workspace/hyphae'],
}
let mockTimeline: SessionTimelineRecord[] = []
let mockCommandHistory: CommandHistory = { commands: [], total: 0 }
let mockRhizomeStatus: RhizomeStatus = { available: true, backend: 'lsp', languages: ['typescript'] }
let mockStatus: EcosystemStatus = {
  agents: {
    claude_code: {
      adapter: { configured: false, detected: false, kind: 'hooks', label: 'Claude Code' },
      config_path: null,
      configured: false,
      detected: false,
      integration: 'hooks',
      resolved_config_path: '~/.claude/settings.json',
      resolved_config_source: 'platform_default',
    },
    codex: {
      adapter: { configured: false, detected: false, kind: 'mcp', label: 'Codex' },
      config_path: null,
      configured: false,
      detected: false,
      integration: 'mcp',
      resolved_config_path: '~/.codex/config.toml',
      resolved_config_source: 'platform_default',
    },
  },
  hooks: {
    error_count: 0,
    installed_hooks: [],
    lifecycle: [],
    recent_errors: [],
  },
  hyphae: {
    activity: {
      codex_memory_count: 0,
      last_codex_memory_at: null,
      last_session_memory_at: null,
      last_session_topic: null,
      recent_session_memory_count: 0,
    },
    available: true,
    memoirs: 0,
    memories: 0,
    version: '0.9.5',
  },
  lsps: [],
  mycelium: { available: true, version: '0.7.2' },
  project: {
    active: '/workspace/cap',
    recent: ['/workspace/cap', '/workspace/hyphae'],
  },
  rhizome: { available: true, backend: 'lsp', languages: ['typescript'] },
}
let mockError: Error | null = null
const mockRefetch = vi.fn()
const mockRunAction = vi.fn()
const mockMutation = {
  data: undefined,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
}

vi.mock('../lib/queries', () => ({
  useCommandHistory: () => ({
    data: mockCommandHistory,
    isLoading: false,
  }),
  useProject: () => ({
    data: mockProject,
    isLoading: false,
  }),
  useRhizomeStatus: () => ({
    data: mockRhizomeStatus,
    isLoading: false,
  }),
  useSessionTimeline: () => ({
    data: mockTimeline,
    error: mockError,
    isLoading: false,
  }),
}))

vi.mock('../lib/ecosystem-status', () => ({
  useEcosystemStatusController: () => ({
    refreshAll: mockRefetch,
    repairPlanQuery: { data: undefined, isLoading: false },
    statusQuery: { data: mockStatus, isLoading: false },
  }),
}))

vi.mock('../lib/stipe-actions', () => ({
  useStipeActionController: () => ({
    actionIsRunning: () => false,
    runAction: mockRunAction,
    runStipe: mockMutation,
  }),
}))

vi.mock('../components/ProjectContextSummary', () => ({
  ProjectContextSummary: ({ note }: { note?: string }) => <div>{note}</div>,
}))

describe('Sessions page', () => {
  beforeEach(() => {
    mockProject = {
      active: '/workspace/cap',
      recent: ['/workspace/cap', '/workspace/hyphae'],
    }
    mockError = null
    mockCommandHistory = { commands: [], total: 0 }
    mockRhizomeStatus = { available: true, backend: 'lsp', languages: ['typescript'] }
    mockStatus = {
      ...mockStatus,
      hyphae: { ...mockStatus.hyphae, available: true },
      mycelium: { ...mockStatus.mycelium, available: true },
      rhizome: { ...mockStatus.rhizome, available: true, backend: 'lsp', languages: ['typescript'] },
    }
    mockTimeline = []
    mockRefetch.mockReset()
    mockRunAction.mockReset()
  })

  it('renders a joined session timeline with recall and outcome events', () => {
    mockTimeline = [
      {
        ended_at: '2026-03-27T12:10:00Z',
        errors: '2',
        events: [
          {
            detail: 'session attribution bridge',
            id: 'rec_1',
            kind: 'recall',
            memory_count: 3,
            occurred_at: '2026-03-27T12:02:00Z',
            recall_event_id: 'rec_1',
            signal_type: null,
            signal_value: null,
            source: null,
            title: 'Recalled 3 memories',
          },
          {
            detail: 'session attribution bridge · cortina.post_tool_use.test',
            id: 'sig_1',
            kind: 'outcome',
            memory_count: 3,
            occurred_at: '2026-03-27T12:08:00Z',
            recall_event_id: 'rec_1',
            signal_type: 'test_passed',
            signal_value: 1,
            source: 'cortina.post_tool_use.test',
            title: 'Tests passed',
          },
        ],
        files_modified: '["src/pages/Sessions.tsx","server/hyphae.ts"]',
        id: 'ses_1',
        last_activity_at: '2026-03-27T12:10:00Z',
        outcome_count: 1,
        project: 'cap',
        recall_count: 1,
        scope: 'worker-a',
        started_at: '2026-03-27T12:00:00Z',
        status: 'completed',
        summary: 'Connected session recall and outcome signals.',
        task: 'build session timeline',
      },
    ]
    mockCommandHistory = {
      commands: [
        {
          command: 'mycelium cargo test',
          filtered_tokens: 200,
          original_tokens: 1000,
          project_path: '/workspace/cap',
          saved_tokens: 800,
          savings_pct: 80,
          timestamp: '2026-03-27T12:04:00Z',
        },
      ],
      total: 1,
    }

    renderWithProviders(<Sessions />, { route: '/sessions' })

    expect(screen.getByRole('heading', { name: 'Sessions Timeline' })).toBeInTheDocument()
    expect(screen.getByText(/structured Hyphae session activity for the active project context: cap/i)).toBeInTheDocument()
    expect(screen.getByText('1 Mycelium commands in scope')).toBeInTheDocument()
    expect(screen.getByText('Rhizome lsp')).toBeInTheDocument()
    expect(screen.getByText('build session timeline')).toBeInTheDocument()
    expect(screen.getByText('worker-a')).toBeInTheDocument()
    expect(screen.getByText('2 files modified')).toBeInTheDocument()
    expect(screen.getByText('2 errors')).toBeInTheDocument()
    expect(screen.getByText('Recalled 3 memories')).toBeInTheDocument()
    expect(screen.getByText('Tests passed')).toBeInTheDocument()
    expect(screen.getByText('mycelium cargo test')).toBeInTheDocument()
    expect(screen.getByText('800 tokens saved')).toBeInTheDocument()
  })

  it('shows repair guidance when core tool coverage is missing', () => {
    mockStatus = {
      ...mockStatus,
      hyphae: { ...mockStatus.hyphae, available: false },
      mycelium: { ...mockStatus.mycelium, available: false },
      rhizome: { ...mockStatus.rhizome, available: false, backend: null, languages: [] },
    }

    renderWithProviders(<Sessions />, { route: '/sessions' })

    expect(screen.getByText('Hyphae coverage needs attention')).toBeInTheDocument()
    expect(screen.getByText('Mycelium coverage needs attention')).toBeInTheDocument()
    expect(screen.getByText('Rhizome coverage needs attention')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Run recommended step' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Open onboarding' }).length).toBeGreaterThan(0)
  })

  it('renders an explicit unavailable state when the timeline cannot load', () => {
    mockTimeline = []
    mockError = new Error('Timeline backend unavailable')

    renderWithProviders(<Sessions />, { route: '/sessions' })

    expect(screen.getByText('Failed to load session timeline')).toBeInTheDocument()
    expect(screen.getByText('Timeline backend unavailable')).toBeInTheDocument()
  })
})
