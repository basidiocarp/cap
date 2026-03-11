import { AppShell, Group, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconBrain, IconChartBar, IconDashboard, IconNetwork } from '@tabler/icons-react'
import { Outlet, NavLink as RouterNavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { icon: IconDashboard, label: 'Dashboard', path: '/' },
  { icon: IconBrain, label: 'Memories', path: '/memories' },
  { icon: IconNetwork, label: 'Memoirs', path: '/memoirs' },
  { icon: IconChartBar, label: 'Analytics', path: '/analytics' },
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
            memory dashboard
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p='xs'>
        {NAV_ITEMS.map((item) => (
          <NavLink
            active={location.pathname === item.path}
            component={RouterNavLink}
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={18} />}
            to={item.path}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
