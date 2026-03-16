import { AppShell, Group, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconBrain, IconBug, IconChartBar, IconCode, IconDashboard, IconHeartbeat, IconNetwork, IconSearch } from '@tabler/icons-react'
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    items: [
      { icon: IconDashboard, label: 'Dashboard', path: '/' },
      { icon: IconBrain, label: 'Memories', path: '/memories' },
      { icon: IconNetwork, label: 'Memoirs', path: '/memoirs' },
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
      { icon: IconChartBar, label: 'Analytics', path: '/analytics' },
      { icon: IconHeartbeat, label: 'Status', path: '/status' },
    ],
    label: 'System',
  },
]

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()
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
          px='md'
        >
          <Title
            onClick={toggle}
            order={3}
            style={{ cursor: 'pointer' }}
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
      </AppShell.Header>

      <AppShell.Navbar p='xs'>
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
                active={location.pathname === item.path}
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
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
