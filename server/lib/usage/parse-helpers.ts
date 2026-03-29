import type { SessionProvider } from './types.ts'

export function normalizeProvider(value: unknown): SessionProvider {
  if (value === 'anthropic' || value === 'openai') {
    return value
  }

  return 'unknown'
}
