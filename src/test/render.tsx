import type { ReactElement, ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterContextProvider, createMemoryHistory, createRootRoute, createRouter, parseSearchWith, stringifySearchWith } from '@tanstack/react-router'
import { render } from '@testing-library/react'

interface RenderWithProvidersOptions {
  route?: string
}

// RouterContextProvider places the router in context synchronously (no async load),
// so components that use useNavigate / useRouterState can render immediately in tests.
function Providers({ children, route = '/' }: { children: ReactNode; route?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [route] }),
    parseSearch: parseSearchWith((v) => v),
    routeTree: createRootRoute(),
    stringifySearch: stringifySearchWith((v) => v),
  })

  return (
    <RouterContextProvider router={router}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{children}</MantineProvider>
      </QueryClientProvider>
    </RouterContextProvider>
  )
}

export function renderWithProviders(ui: ReactElement, options?: RenderWithProvidersOptions) {
  return render(ui, {
    wrapper: ({ children }) => <Providers route={options?.route}>{children}</Providers>,
  })
}
