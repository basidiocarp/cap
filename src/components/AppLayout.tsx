import { AppShell, Group, NavLink, Text, Title } from '@mantine/core'
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
} from '@tabler/icons-react'
import { useId } from 'react'
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom'

import { NotificationPanel } from './NotificationPanel'
import { ServiceHealthPanel } from './ServiceHealthPanel'

const NAV_SECTIONS = [
  {
    items: [
      { icon: IconDashboard, label: 'Dashboard', path: '/' },
      { icon: IconBrain, label: 'Memories', path: '/memories' },
      { icon: IconNetwork, label: 'Memoirs', path: '/memoirs' },
      { icon: IconHierarchy2, label: 'Memoir Graph', path: '/memoir-graph' },
      { icon: IconHistory, label: 'Sessions', path: '/sessions' },
      { icon: IconBulb, label: 'Lessons', path: '/lessons' },
    ],
    label: 'Memory',
  },
  {
    items: [
      { icon: IconCode, label: 'Code Explorer', path: '/code' },
      { icon: IconSearch, label: 'Symbols', path: '/symbols' },
      { icon: IconBug, label: 'Diagnostics', path: '/diagnostics' },
    ],
    label: 'Code',
  },
  {
    items: [
      { icon: IconCompass, label: 'Onboarding', path: '/onboard' },
      { icon: IconGitBranch, label: 'Canopy', path: '/canopy' },
      { icon: IconChartBar, label: 'Analytics', path: '/analytics' },
      { icon: IconHeartbeat, label: 'Status', path: '/status' },
      { icon: IconSettings, label: 'Settings', path: '/settings' },
    ],
    label: 'System',
  },
]

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()
  const navbarId = useId()
  const location = useLocation()

  return (
    <AppShell
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
          <Group>
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
      >
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
                active={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
                component={RouterNavLink}
                key={item.path}
                label={item.label}
                leftSection={<item.icon size={18} />}
                to={item.path}
              />
            ))}
          </div>
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <ServiceHealthPanel />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
