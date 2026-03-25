import { describe, expect, it } from 'vitest'

import {
  DEFAULT_CODE_EXPLORER_MODE,
  parseCodeExplorerUrlState,
  toDisplaySymbols,
  writeCodeExplorerUrlState,
} from '../../src/pages/code-explorer/code-explorer-url-state'

describe('code explorer url state', () => {
  it('reads defaults and ignores invalid mode values', () => {
    const state = parseCodeExplorerUrlState(new URLSearchParams('file=src/app.ts&symbol=run&filter=query&mode=bogus'))

    expect(state).toEqual({
      file: 'src/app.ts',
      filter: 'query',
      mode: DEFAULT_CODE_EXPLORER_MODE,
      symbol: 'run',
    })
  })

  it('serializes defaults out of the query string', () => {
    const current = new URLSearchParams('file=src/app.ts&symbol=run&filter=query&mode=exports')
    const next = writeCodeExplorerUrlState(current, {
      file: 'src/app.ts',
      filter: '',
      mode: DEFAULT_CODE_EXPLORER_MODE,
      symbol: '',
    })

    expect(next.toString()).toBe('file=src%2Fapp.ts')
  })

  it('maps exported symbols into display rows', () => {
    const symbols = [
      {
        doc_comment: null,
        kind: 'function',
        location: {
          column_end: 8,
          column_start: 0,
          file_path: 'src/app.ts',
          line_end: 12,
          line_start: 12,
        },
        name: 'run',
        signature: 'run()',
      },
    ]

    const display = toDisplaySymbols(
      symbols,
      [
        {
          kind: 'const',
          line: 20,
          name: 'APP_NAME',
          signature: 'APP_NAME: string',
        },
      ],
      'src/app.ts',
      'exports'
    )

    expect(display).toEqual([
      {
        doc_comment: null,
        kind: 'const',
        location: {
          column_end: 0,
          column_start: 0,
          file_path: 'src/app.ts',
          line_end: 20,
          line_start: 20,
        },
        name: 'APP_NAME',
        signature: 'APP_NAME: string',
      },
    ])
  })
})
