import { describe, expect, it } from 'vitest'

import { cursorAdapterStatusFromConfig } from '../routes/status/checks.ts'

describe('cursor adapter status', () => {
  const resolveKnownCommand = (command: string): string | null => {
    if (command === 'hyphae' || command === 'rhizome') {
      return `/usr/local/bin/${command}`
    }
    return null
  }

  it('keeps placeholder server entries at partial status', () => {
    const status = cursorAdapterStatusFromConfig(
      {
        mcpServers: {
          hyphae: {},
          rhizome: {},
        },
      },
      resolveKnownCommand
    )

    expect(status).toBe('partial')
  })

  it('requires both hyphae and rhizome Cursor servers for connected status', () => {
    const status = cursorAdapterStatusFromConfig(
      {
        mcpServers: {
          hyphae: { args: ['serve'], command: 'hyphae' },
          rhizome: { args: ['serve', '--expanded'], command: 'rhizome' },
        },
      },
      resolveKnownCommand
    )

    expect(status).toBe('connected')
  })

  it('downgrades to partial when one expected Cursor server is missing or invalid', () => {
    const status = cursorAdapterStatusFromConfig(
      {
        mcpServers: {
          hyphae: { args: ['serve'], command: 'hyphae' },
          rhizome: { args: ['serve'], command: 'rhizome' },
        },
      },
      resolveKnownCommand
    )

    expect(status).toBe('partial')
  })
})
