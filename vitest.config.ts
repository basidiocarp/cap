import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  test: {
    environment: 'node',
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    globals: true,
    include: ['server/__tests__/**/*.test.ts'],
    server: {
      deps: {
        // Allow .ts extension imports in server code
        inline: [/\.ts$/],
      },
    },
  },
})
