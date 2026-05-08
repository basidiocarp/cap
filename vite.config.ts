import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: 'src/routes', generatedRouteTree: 'src/routeTree.gen.ts' }),
    react(),
    tsConfigPaths(),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@mantine/core') || id.includes('@mantine/hooks') || id.includes('@mantine/notifications')) {
            return 'mantine'
          }
          if (id.includes('@mantine/charts')) {
            return 'mantine-charts'
          }
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'recharts'
          }
          if (id.includes('@xyflow/react')) {
            return 'flow'
          }
          if (id.includes('react-force-graph-2d') || id.includes('force-graph')) {
            return 'force-graph'
          }
          if (
            id.includes('react-dom') ||
            id.includes('@tanstack/react-router') ||
            id.includes('@tanstack/react-query') ||
            (id.includes('/react/') && id.includes('node_modules'))
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:3001',
      },
    },
  },
})
