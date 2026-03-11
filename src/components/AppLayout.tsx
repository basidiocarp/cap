import { AppShell, Group, NavLink, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconBrain, IconChartBar, IconDashboard, IconNetwork } from '@tabler/icons-react'
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: IconDashboard },
  { label: 'Memories', path: '/memories', icon: IconBrain },
  { label: 'Memoirs', path: '/memoirs', icon: IconNetwork },
  { label: 'Analytics', path: '/analytics', icon: IconChartBar },
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
            order={3}
            onClick={toggle}
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
