import { ActionIcon, Badge, Box, Button, Group, Indicator, Popover, ScrollArea, Stack, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconBell, IconCircleFilled } from '@tabler/icons-react'
import { useCallback } from 'react'

import type { CanopyNotification } from '../lib/types'
import { useCanopyNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function truncateId(id: string | null): string | null {
  if (!id) return null
  return id.length > 12 ? `${id.slice(0, 12)}…` : id
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification item
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: CanopyNotification
  onMarkRead: (id: string) => void
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const shortTaskId = truncateId(notification.task_id)

  return (
    <Group
      align='flex-start'
      gap='xs'
      px='xs'
      py={6}
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        opacity: notification.seen ? 0.6 : 1,
      }}
    >
      <Box pt={4}>
        <Tooltip label={notification.seen ? 'Already read' : 'Mark as read'}>
          <ActionIcon
            aria-label={notification.seen ? 'Notification read' : 'Mark notification as read'}
            color={notification.seen ? 'gray' : 'blue'}
            disabled={notification.seen}
            onClick={() => onMarkRead(notification.notification_id)}
            size='xs'
            variant='transparent'
          >
            <IconCircleFilled size={10} />
          </ActionIcon>
        </Tooltip>
      </Box>

      <Stack
        gap={2}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Text
          fw={notification.seen ? 400 : 600}
          size='sm'
        >
          {formatEventType(notification.event_type)}
        </Text>
        {shortTaskId && (
          <Text
            c='dimmed'
            ff='monospace'
            size='xs'
          >
            {shortTaskId}
          </Text>
        )}
        <Text
          c='dimmed'
          size='xs'
        >
          {formatRelativeTime(notification.created_at)}
        </Text>
      </Stack>
    </Group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationPanel
// ─────────────────────────────────────────────────────────────────────────────

export function NotificationPanel() {
  const [opened, { toggle, close }] = useDisclosure(false)
  const { data } = useCanopyNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.seen).length
  const allRead = unreadCount === 0

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead.mutate(id)
    },
    [markRead]
  )

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate()
  }, [markAllRead])

  return (
    <Popover
      onClose={close}
      opened={opened}
      position='bottom-end'
      shadow='md'
      width={320}
      withArrow
    >
      <Popover.Target>
        <Indicator
          color='red'
          disabled={unreadCount === 0}
          label={unreadCount > 99 ? '99+' : unreadCount}
          offset={4}
          processing={unreadCount > 0}
          size={16}
        >
          <ActionIcon
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            onClick={toggle}
            size='lg'
            variant='subtle'
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Group
          justify='space-between'
          px='sm'
          py='xs'
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <Group gap='xs'>
            <Text fw={600}>Notifications</Text>
            {unreadCount > 0 && (
              <Badge
                color='blue'
                size='sm'
                variant='light'
              >
                {unreadCount}
              </Badge>
            )}
          </Group>
          <Button
            disabled={allRead}
            onClick={handleMarkAllRead}
            size='compact-xs'
            variant='subtle'
          >
            Mark all read
          </Button>
        </Group>

        <ScrollArea.Autosize mah={400}>
          {notifications.length === 0 ? (
            <Text
              c='dimmed'
              p='md'
              size='sm'
              ta='center'
            >
              No notifications
            </Text>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  )
}
