import { AppShell, Avatar, Badge, Box, Group, Indicator, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBrain,
  IconBug,
  IconBulb,
  IconChartBar,
  IconCode,
  IconCompass,
  IconDashboard,
  IconGitBranch,
  IconHeartbeat,
  IconHierarchy2,
  IconHistory,
  IconNetwork,
  IconSearch,
  IconSettings,
  IconSitemap,
  IconTerminal,
} from '@tabler/icons-react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useId } from 'react'

import { ActivityRail } from './ActivityRail'
import { BrandMark } from './BrandMark'
import { NotificationPanel } from './NotificationPanel'
import { ServiceHealthPanel } from './ServiceHealthPanel'

interface NavItem {
  icon: React.ComponentType<any>
  label: string
  path: string
  badge?: boolean
  alert?: boolean
}

const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    items: [
      { icon: IconDashboard, label: 'Dashboard', path: '/' },
      { icon: IconBrain, label: 'Memories', path: '/memories' },
      { badge: true, icon: IconNetwork, label: 'Memoirs', path: '/memoirs' },
      { icon: IconHierarchy2, label: 'Memoir Graph', path: '/memoir-graph' },
      { badge: true, icon: IconHistory, label: 'Sessions', path: '/sessions' },
      { icon: IconBulb, label: 'Lessons', path: '/lessons' },
    ],
    label: 'Memory',
  },
  {
    items: [
      { icon: IconCode, label: 'Code Explorer', path: '/code' },
      { icon: IconSearch, label: 'Symbols', path: '/symbols' },
      { alert: true, icon: IconBug, label: 'Diagnostics', path: '/diagnostics' },
    ],
    label: 'Code',
  },
  {
    items: [
      { icon: IconCompass, label: 'Onboarding', path: '/onboard' },
      { icon: IconGitBranch, label: 'Canopy', path: '/canopy' },
      { icon: IconSitemap, label: 'Workflows', path: '/workflows' },
      { icon: IconChartBar, label: 'Analytics', path: '/analytics' },
      { icon: IconHeartbeat, label: 'Status', path: '/status' },
      { icon: IconTerminal, label: 'Statusline', path: '/statusline' },
      { icon: IconSettings, label: 'Settings', path: '/settings' },
    ],
    label: 'System',
  },
]

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()
  const navbarId = useId()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <AppShell
      aside={{ breakpoint: 'lg', collapsed: { mobile: true }, width: 240 }}
      header={{ height: 56 }}
      navbar={{ breakpoint: 'sm', collapsed: { mobile: !opened }, width: 220 }}
      padding='md'
    >
      <AppShell.Header>
        <Group
          h='100%'
          justify='space-between'
          px='md'
        >
          <Group gap='xs'>
            <BrandMark />
            <Title
              aria-controls={navbarId}
              aria-expanded={opened}
              aria-label='Toggle mobile navigation'
              component='button'
              onClick={toggle}
              order={3}
              style={{
                background: 'none',
                border: 0,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              cap
            </Title>
            <Indicator
              color='green'
              position='middle-end'
              size={7}
            />
            <Text
              c='dimmed'
              size='sm'
            >
              ecosystem dashboard
            </Text>
          </Group>
          <NotificationPanel />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        id={navbarId}
        p='xs'
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <Text
                c='dimmed'
                fw={700}
                mb={4}
                ml='sm'
                mt='md'
                size='xs'
                tt='uppercase'
              >
                {section.label}
              </Text>
              {section.items.map((item) => (
                <NavLink
                  active={item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)}
                  component={Link}
                  key={item.path}
                  label={item.label}
                  leftSection={
                    item.alert ? (
                      <Indicator
                        color='red'
                        size={6}
                      >
                        <item.icon size={18} />
                      </Indicator>
                    ) : (
                      <item.icon size={18} />
                    )
                  }
                  rightSection={
                    item.badge ? (
                      <Badge
                        size='xs'
                        variant='light'
                      >
                        —
                      </Badge>
                    ) : undefined
                  }
                  to={item.path}
                />
              ))}
            </div>
          ))}
        </div>
        <Box
          p='xs'
          style={{ borderTop: '1px solid var(--mantine-color-dark-4)' }}
        >
          <Group
            gap='xs'
            wrap='nowrap'
          >
            <Avatar
              color='mycelium'
              radius='xl'
              size='sm'
            >
              A
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                fw={500}
                size='xs'
                truncate
              >
                Claude Sonnet
              </Text>
              <Text
                c='dimmed'
                size='xs'
              >
                session · —
              </Text>
            </div>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <ServiceHealthPanel />
        <Outlet />
      </AppShell.Main>

      <AppShell.Aside>
        <ActivityRail />
      </AppShell.Aside>
    </AppShell>
  )
}
