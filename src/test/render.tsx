import type { ReactElement, ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

interface RenderWithProvidersOptions {
  route?: string
}

function Providers({ children, route = '/' }: { children: ReactNode; route?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return (
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{children}</MantineProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

export function renderWithProviders(ui: ReactElement, options?: RenderWithProvidersOptions) {
  return render(ui, {
    wrapper: ({ children }) => <Providers route={options?.route}>{children}</Providers>,
  })
}
