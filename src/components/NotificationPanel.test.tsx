import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CanopyNotification } from '../lib/types'
import * as queries from '../lib/queries'
import { renderWithProviders } from '../test/render'
import { NotificationPanel } from './NotificationPanel'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type MockNotificationsHook = ReturnType<typeof queries.useCanopyNotifications>

function makeNotification(overrides: Partial<CanopyNotification> = {}): CanopyNotification {
  return {
    agent_id: null,
    created_at: new Date(Date.now() - 120_000).toISOString(),
    event_type: 'task_assigned',
    notification_id: 'notif-1',
    payload: {},
    seen: false,
    task_id: 'task-abc123def456',
    ...overrides,
  }
}

function mockNotificationsHook(notifications: CanopyNotification[]) {
  vi.spyOn(queries, 'useCanopyNotifications').mockReturnValue({
    data: { notifications },
  } as unknown as MockNotificationsHook)
}

function mockMutationHooks(markMutate = vi.fn(), markAllMutate = vi.fn()) {
  vi.spyOn(queries, 'useMarkNotificationRead').mockReturnValue({
    mutate: markMutate,
  } as unknown as ReturnType<typeof queries.useMarkNotificationRead>)
  vi.spyOn(queries, 'useMarkAllNotificationsRead').mockReturnValue({
    mutate: markAllMutate,
  } as unknown as ReturnType<typeof queries.useMarkAllNotificationsRead>)
  return { markAllMutate, markMutate }
}

const twoNotifications: CanopyNotification[] = [
  makeNotification(),
  makeNotification({ event_type: 'task_completed', notification_id: 'notif-2', seen: true, task_id: null }),
]

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a bell icon with unread badge when there are unread notifications', () => {
    mockNotificationsHook(twoNotifications)
    mockMutationHooks()

    renderWithProviders(<NotificationPanel />)

    expect(screen.getByRole('button', { name: /notifications.*1 unread/i })).toBeInTheDocument()
  })

  it('shows no unread indicator when all notifications are read', () => {
    const allRead: CanopyNotification[] = twoNotifications.map((n) => ({ ...n, seen: true }))
    mockNotificationsHook(allRead)
    mockMutationHooks()

    renderWithProviders(<NotificationPanel />)

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('opens popover with notifications on bell click', async () => {
    const user = userEvent.setup()
    mockNotificationsHook(twoNotifications)
    mockMutationHooks()

    renderWithProviders(<NotificationPanel />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument()
      expect(screen.getByText('Task Completed')).toBeInTheDocument()
    })
  })

  it('shows empty state when there are no notifications', async () => {
    const user = userEvent.setup()
    mockNotificationsHook([])
    mockMutationHooks()

    renderWithProviders(<NotificationPanel />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument()
    })
  })

  it('calls mark-all-read mutate when "Mark all read" is clicked', async () => {
    const user = userEvent.setup()
    mockNotificationsHook(twoNotifications)
    const { markAllMutate } = mockMutationHooks()

    renderWithProviders(<NotificationPanel />)

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    await waitFor(() => screen.getByText('Mark all read'))
    await user.click(screen.getByRole('button', { hidden: true, name: 'Mark all read' }))

    expect(markAllMutate).toHaveBeenCalledTimes(1)
  })

  it('disables "Mark all read" when all notifications are already read', async () => {
    const user = userEvent.setup()
    const allRead: CanopyNotification[] = twoNotifications.map((n) => ({ ...n, seen: true }))
    mockNotificationsHook(allRead)
    mockMutationHooks()

    renderWithProviders(<NotificationPanel />)

    await user.click(screen.getByRole('button', { name: 'Notifications' }))
    await waitFor(() => screen.getByText('Mark all read'))

    expect(screen.getByRole('button', { hidden: true, name: 'Mark all read' })).toBeDisabled()
  })

  it('shows truncated task ID when present', async () => {
    const user = userEvent.setup()
    mockNotificationsHook([makeNotification({ task_id: 'task-abc123def456' })])
    mockMutationHooks()

    renderWithProviders(<NotificationPanel />)
    await user.click(screen.getByRole('button', { name: /notifications/i }))

    await waitFor(() => {
      // 'task-abc123def456' is 18 chars, truncated to 12 + ellipsis
      expect(screen.getByText('task-abc123d…')).toBeInTheDocument()
    })
  })
})
