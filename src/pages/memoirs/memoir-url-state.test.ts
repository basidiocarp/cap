import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MEMOIR_DEPTH,
  DEFAULT_MEMOIR_PAGE,
  memoirUrlStatesEqual,
  readMemoirUrlState,
  writeMemoirUrlState,
} from './memoir-url-state'

describe('memoir url state', () => {
  it('reads defaults when no params are present', () => {
    const state = readMemoirUrlState(new URLSearchParams())

    expect(state).toEqual({
      concept: '',
      depth: DEFAULT_MEMOIR_DEPTH,
      filter: '',
      memoir: '',
      page: DEFAULT_MEMOIR_PAGE,
    })
  })

  it('round-trips selected memoir, inspect concept, page, filter, and depth', () => {
    const current = new URLSearchParams('memoir=code:william&concept=alpha&page=3&filter=foo&depth=4')
    const state = readMemoirUrlState(current)

    expect(state).toEqual({
      concept: 'alpha',
      depth: '4',
      filter: 'foo',
      memoir: 'code:william',
      page: 3,
    })

    expect(Object.fromEntries(writeMemoirUrlState(new URLSearchParams(), state).entries())).toEqual(Object.fromEntries(current.entries()))
  })

  it('removes defaults from the query string', () => {
    const next = writeMemoirUrlState(new URLSearchParams('memoir=code:william&concept=alpha&page=3&filter=foo&depth=4'), {
      concept: '',
      depth: DEFAULT_MEMOIR_DEPTH,
      filter: '',
      memoir: 'code:william',
      page: DEFAULT_MEMOIR_PAGE,
    })

    expect(next.toString()).toBe('memoir=code%3Awilliam')
  })

  it('preserves unrelated query params when serializing', () => {
    const next = writeMemoirUrlState(new URLSearchParams('tab=graph&sort=recent'), {
      concept: 'alpha',
      depth: '3',
      filter: 'foo',
      memoir: 'code:william',
      page: 2,
    })

    expect(next.toString()).toBe('tab=graph&sort=recent&memoir=code%3Awilliam&concept=alpha&filter=foo&page=2&depth=3')
  })

  it('normalizes invalid page values to the default', () => {
    const state = readMemoirUrlState(new URLSearchParams('page=bogus'))

    expect(state.page).toBe(DEFAULT_MEMOIR_PAGE)
  })

  it('compares states structurally', () => {
    expect(
      memoirUrlStatesEqual(
        { concept: '', depth: '2', filter: '', memoir: 'a', page: 1 },
        { concept: '', depth: '2', filter: '', memoir: 'a', page: 1 }
      )
    ).toBe(true)
  })
})
