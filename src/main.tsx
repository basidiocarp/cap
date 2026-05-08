import '@mantine/core/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/notifications/styles.css'
import '@fontsource-variable/inter/index.css'

import { MantineProvider, mergeThemeOverrides } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { queryClient } from './lib/queryClient'
import { router } from './router'
import { useDashboardVariantStore } from './stores/dashboard-variant-store'
import { theme } from './theme'

function ThemedApp() {
  const accentColor = useDashboardVariantStore((s) => s.accentColor)
  const dynamicTheme = mergeThemeOverrides(theme, { primaryColor: accentColor })
  return (
    <MantineProvider defaultColorScheme='dark' theme={dynamicTheme}>
      <Notifications />
      <RouterProvider router={router} />
    </MantineProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
    </QueryClientProvider>
  </StrictMode>
)
