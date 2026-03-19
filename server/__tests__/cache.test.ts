import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cached, cachedAsync } from '../lib/cache'

// ─────────────────────────────────────────────────────────────────────────────
// Cache Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('cached()', () => {
  let callCount: number
  let testFn: () => string

  beforeEach(() => {
    callCount = 0
    testFn = () => {
      callCount++
      return `result-${callCount}`
    }
  })

  it('returns the same value within TTL', () => {
    const cachedFn = cached(testFn, 1000)
    const result1 = cachedFn()
    const result2 = cachedFn()
    expect(result1).toBe(result2)
    expect(callCount).toBe(1)
  })

  it('refreshes after TTL expires', async () => {
    const cachedFn = cached(testFn, 50)
    const result1 = cachedFn()
    expect(result1).toBe('result-1')

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 100))

    const result2 = cachedFn()
    expect(result2).toBe('result-2')
    expect(callCount).toBe(2)
  })

  it('handles different return types', () => {
    const objFn = cached(() => ({ value: 42 }), 1000)
    const result1 = objFn()
    const result2 = objFn()
    expect(result1).toBe(result2)
    expect(result1.value).toBe(42)
  })

  it('maintains separate caches for different instances', () => {
    const cachedFn1 = cached(testFn, 1000)
    const cachedFn2 = cached(testFn, 1000)

    const result1 = cachedFn1()
    const result2 = cachedFn2()

    expect(result1).not.toBe(result2)
    expect(callCount).toBe(2)
  })
})

describe('cachedAsync()', () => {
  let callCount: number
  let testFn: () => Promise<string>

  beforeEach(() => {
    callCount = 0
    testFn = async () => {
      callCount++
      return `result-${callCount}`
    }
  })

  it('returns the same value within TTL', async () => {
    const cachedFn = cachedAsync(testFn, 1000)
    const result1 = await cachedFn()
    const result2 = await cachedFn()
    expect(result1).toBe(result2)
    expect(callCount).toBe(1)
  })

  it('refreshes after TTL expires', async () => {
    const cachedFn = cachedAsync(testFn, 50)
    const result1 = await cachedFn()
    expect(result1).toBe('result-1')

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 100))

    const result2 = await cachedFn()
    expect(result2).toBe('result-2')
    expect(callCount).toBe(2)
  })

  it('deduplicates concurrent requests', async () => {
    const cachedFn = cachedAsync(testFn, 1000)
    const promise1 = cachedFn()
    const promise2 = cachedFn()

    const [result1, result2] = await Promise.all([promise1, promise2])

    expect(result1).toBe(result2)
    expect(callCount).toBe(1)
  })

  it('handles errors correctly', async () => {
    const errorFn = cachedAsync(async () => {
      throw new Error('Test error')
    }, 1000)

    await expect(errorFn()).rejects.toThrow('Test error')
  })

  it('retries after error (does not cache errors)', async () => {
    let shouldError = true
    const conditionalFn = cachedAsync(async () => {
      if (shouldError) {
        throw new Error('Temporary error')
      }
      return 'success'
    }, 1000)

    // First call fails
    await expect(conditionalFn()).rejects.toThrow('Temporary error')

    // Second call succeeds
    shouldError = false
    const result = await conditionalFn()
    expect(result).toBe('success')
  })

  it('maintains separate caches for different instances', async () => {
    const cachedFn1 = cachedAsync(testFn, 1000)
    const cachedFn2 = cachedAsync(testFn, 1000)

    const result1 = await cachedFn1()
    const result2 = await cachedFn2()

    expect(result1).not.toBe(result2)
    expect(callCount).toBe(2)
  })

  it('handles async functions with complex return types', async () => {
    const complexFn = cachedAsync(
      async () => ({
        data: [1, 2, 3],
        nested: { value: 'test' },
      }),
      1000
    )

    const result1 = await complexFn()
    const result2 = await complexFn()
    expect(result1).toBe(result2)
    expect(result1.nested.value).toBe('test')
  })
})
