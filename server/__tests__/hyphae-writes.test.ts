import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

const storeCliMock = vi.fn()
const forgetCliMock = vi.fn()
const updateImportanceCliMock = vi.fn()
const invalidateMemoryCliMock = vi.fn()
const consolidateCliMock = vi.fn()

vi.mock('../hyphae/writes.ts', () => ({
  store: storeCliMock,
  forget: forgetCliMock,
  updateImportance: updateImportanceCliMock,
  invalidateMemory: invalidateMemoryCliMock,
  consolidate: consolidateCliMock,
}))

function createApp() {
  const app = new Hono()
  // Dynamically import to apply mocks
  return import('../routes/hyphae/writes.ts').then((m) => {
    app.route('/', m.default)
    return app
  })
}

async function postJson(app: Hono, path: string, body: unknown) {
  return app.fetch(
    new Request(`http://localhost${path}`, {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  )
}

async function putJson(app: Hono, path: string, body: unknown) {
  return app.fetch(
    new Request(`http://localhost${path}`, {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
  )
}

async function deleteRequest(app: Hono, path: string) {
  return app.fetch(
    new Request(`http://localhost${path}`, {
      method: 'DELETE',
    })
  )
}

async function postInvalidJson(app: Hono, path: string, body: string) {
  return app.fetch(
    new Request(`http://localhost${path}`, {
      body,
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  )
}

async function putInvalidJson(app: Hono, path: string, body: string) {
  return app.fetch(
    new Request(`http://localhost${path}`, {
      body,
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
  )
}

describe('Hyphae write routes', () => {
  describe('POST /store', () => {
    it('rejects missing topic', async () => {
      storeCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/store', {
        summary: 'test summary',
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'topic and summary are required' })
      expect(storeCliMock).not.toHaveBeenCalled()
    })

    it('rejects missing summary', async () => {
      storeCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: 'decisions/api',
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'topic and summary are required' })
      expect(storeCliMock).not.toHaveBeenCalled()
    })

    it('rejects empty topic string', async () => {
      storeCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: '   ',
        summary: 'test summary',
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'topic and summary are required' })
      expect(storeCliMock).not.toHaveBeenCalled()
    })

    it('rejects invalid importance value', async () => {
      storeCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: 'decisions/api',
        summary: 'test summary',
        importance: 'bogus',
      })

      expect(res.status).toBe(400)
      const json = await res.json() as Record<string, unknown>
      expect(json.error).toContain('Invalid importance')
      expect(storeCliMock).not.toHaveBeenCalled()
    })

    it('accepts valid importance values', async () => {
      for (const importance of ['critical', 'high', 'medium', 'low', 'ephemeral']) {
        storeCliMock.mockClear()
        storeCliMock.mockResolvedValue('mem_123')
        const app = await createApp()

        const res = await postJson(app, '/store', {
          topic: 'decisions/api',
          summary: 'test summary',
          importance,
        })

        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ result: 'mem_123' })
      }
    })

    it('rejects malformed JSON body', async () => {
      storeCliMock.mockClear()
      const app = await createApp()

      const res = await postInvalidJson(app, '/store', 'not json')

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'Invalid JSON body' })
      expect(storeCliMock).not.toHaveBeenCalled()
    })

    it('rejects keywords that are not an array', async () => {
      storeCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: 'decisions/api',
        summary: 'test summary',
        keywords: 'not-an-array',
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'keywords must be an array' })
      expect(storeCliMock).not.toHaveBeenCalled()
    })

    it('returns 502 when CLI fails', async () => {
      storeCliMock.mockRejectedValue(new Error('CLI failed'))
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: 'decisions/api',
        summary: 'test summary',
      })

      expect(res.status).toBe(502)
      const json = await res.json() as Record<string, unknown>
      expect(json.error).toBe('hyphae operation failed')
      expect(json.detail).toBe('CLI failed')
    })

    it('returns 200 on valid input with optional fields', async () => {
      storeCliMock.mockResolvedValue('mem_456')
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: 'decisions/api',
        summary: 'test summary',
        importance: 'high',
        keywords: ['rust', 'storage'],
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'mem_456' })
    })

    it('handles case-insensitive importance validation', async () => {
      storeCliMock.mockResolvedValue('mem_789')
      const app = await createApp()

      const res = await postJson(app, '/store', {
        topic: 'decisions/api',
        summary: 'test summary',
        importance: 'CRITICAL',
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'mem_789' })
    })
  })

  describe('DELETE /memories/:id', () => {
    it('returns 200 on successful forget', async () => {
      forgetCliMock.mockResolvedValue('mem_123 forgotten')
      const app = await createApp()

      const res = await deleteRequest(app, '/memories/mem_123')

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'mem_123 forgotten' })
      expect(forgetCliMock).toHaveBeenCalledWith('mem_123')
    })

    it('returns 502 when CLI fails', async () => {
      forgetCliMock.mockRejectedValue(new Error('Memory not found'))
      const app = await createApp()

      const res = await deleteRequest(app, '/memories/mem_missing')

      expect(res.status).toBe(502)
      const json = await res.json() as Record<string, unknown>
      expect(json.error).toBe('hyphae operation failed')
      expect(json.detail).toBe('Memory not found')
    })
  })

  describe('PUT /memories/:id/importance', () => {
    it('rejects missing importance field', async () => {
      updateImportanceCliMock.mockClear()
      const app = await createApp()

      const res = await putJson(app, '/memories/mem_123/importance', {})

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'importance is required' })
      expect(updateImportanceCliMock).not.toHaveBeenCalled()
    })

    it('rejects empty importance string', async () => {
      updateImportanceCliMock.mockClear()
      const app = await createApp()

      const res = await putJson(app, '/memories/mem_123/importance', {
        importance: '   ',
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'importance is required' })
      expect(updateImportanceCliMock).not.toHaveBeenCalled()
    })

    it('rejects invalid importance value', async () => {
      updateImportanceCliMock.mockClear()
      const app = await createApp()

      const res = await putJson(app, '/memories/mem_123/importance', {
        importance: 'invalid',
      })

      expect(res.status).toBe(400)
      const json = await res.json() as Record<string, unknown>
      expect(json.error).toContain('Invalid importance')
      expect(updateImportanceCliMock).not.toHaveBeenCalled()
    })

    it('rejects malformed JSON body', async () => {
      updateImportanceCliMock.mockClear()
      const app = await createApp()

      const res = await putInvalidJson(app, '/memories/mem_123/importance', 'not json')

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'Invalid JSON body' })
      expect(updateImportanceCliMock).not.toHaveBeenCalled()
    })

    it('returns 200 on valid importance update', async () => {
      updateImportanceCliMock.mockResolvedValue('updated')
      const app = await createApp()

      const res = await putJson(app, '/memories/mem_123/importance', {
        importance: 'critical',
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'updated' })
      expect(updateImportanceCliMock).toHaveBeenCalledWith('mem_123', 'critical')
    })

    it('returns 502 when CLI fails', async () => {
      updateImportanceCliMock.mockRejectedValue(new Error('Update failed'))
      const app = await createApp()

      const res = await putJson(app, '/memories/mem_123/importance', {
        importance: 'high',
      })

      expect(res.status).toBe(502)
      const json = await res.json() as Record<string, unknown>
      expect(json.error).toBe('hyphae operation failed')
      expect(json.detail).toBe('Update failed')
    })

    it('handles case-insensitive importance validation', async () => {
      updateImportanceCliMock.mockResolvedValue('updated')
      const app = await createApp()

      const res = await putJson(app, '/memories/mem_123/importance', {
        importance: 'LOW',
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'updated' })
    })
  })

  describe('POST /memories/:id/invalidate', () => {
    it('returns 200 without reason', async () => {
      invalidateMemoryCliMock.mockResolvedValue('invalidated')
      const app = await createApp()

      const res = await postJson(app, '/memories/mem_123/invalidate', {})

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'invalidated' })
      expect(invalidateMemoryCliMock).toHaveBeenCalledWith('mem_123', undefined)
    })

    it('returns 200 with reason', async () => {
      invalidateMemoryCliMock.mockResolvedValue('invalidated')
      const app = await createApp()

      const res = await postJson(app, '/memories/mem_123/invalidate', {
        reason: 'outdated information',
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'invalidated' })
      expect(invalidateMemoryCliMock).toHaveBeenCalledWith('mem_123', 'outdated information')
    })

    it('rejects reason that is not a string', async () => {
      invalidateMemoryCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/memories/mem_123/invalidate', {
        reason: { text: 'invalid' },
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'reason must be a string' })
      expect(invalidateMemoryCliMock).not.toHaveBeenCalled()
    })

    it('trims whitespace from reason', async () => {
      invalidateMemoryCliMock.mockResolvedValue('invalidated')
      const app = await createApp()

      const res = await postJson(app, '/memories/mem_123/invalidate', {
        reason: '   whitespace   ',
      })

      expect(res.status).toBe(200)
      expect(invalidateMemoryCliMock).toHaveBeenCalledWith('mem_123', 'whitespace')
    })

    it('treats empty reason string as undefined', async () => {
      invalidateMemoryCliMock.mockResolvedValue('invalidated')
      const app = await createApp()

      const res = await postJson(app, '/memories/mem_123/invalidate', {
        reason: '   ',
      })

      expect(res.status).toBe(200)
      expect(invalidateMemoryCliMock).toHaveBeenCalledWith('mem_123', undefined)
    })
  })

  describe('POST /consolidate', () => {
    it('rejects missing topic', async () => {
      consolidateCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/consolidate', {})

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'topic is required' })
      expect(consolidateCliMock).not.toHaveBeenCalled()
    })

    it('rejects empty topic string', async () => {
      consolidateCliMock.mockClear()
      const app = await createApp()

      const res = await postJson(app, '/consolidate', {
        topic: '   ',
      })

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'topic is required' })
      expect(consolidateCliMock).not.toHaveBeenCalled()
    })

    it('rejects malformed JSON body', async () => {
      consolidateCliMock.mockClear()
      const app = await createApp()

      const res = await postInvalidJson(app, '/consolidate', 'not json')

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'Invalid JSON body' })
      expect(consolidateCliMock).not.toHaveBeenCalled()
    })

    it('returns 200 on valid consolidate without keep_originals', async () => {
      consolidateCliMock.mockResolvedValue('consolidated 5 memories')
      const app = await createApp()

      const res = await postJson(app, '/consolidate', {
        topic: 'decisions/api',
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'consolidated 5 memories' })
      expect(consolidateCliMock).toHaveBeenCalledWith('decisions/api', undefined)
    })

    it('returns 200 on valid consolidate with keep_originals false', async () => {
      consolidateCliMock.mockResolvedValue('consolidated')
      const app = await createApp()

      const res = await postJson(app, '/consolidate', {
        topic: 'decisions/api',
        keep_originals: false,
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'consolidated' })
      expect(consolidateCliMock).toHaveBeenCalledWith('decisions/api', false)
    })

    it('returns 200 on valid consolidate with keep_originals true', async () => {
      consolidateCliMock.mockResolvedValue('consolidated with originals')
      const app = await createApp()

      const res = await postJson(app, '/consolidate', {
        topic: 'decisions/api',
        keep_originals: true,
      })

      expect(res.status).toBe(200)
      await expect(res.json()).resolves.toEqual({ result: 'consolidated with originals' })
      expect(consolidateCliMock).toHaveBeenCalledWith('decisions/api', true)
    })

    it('returns 502 when CLI fails', async () => {
      consolidateCliMock.mockRejectedValue(new Error('Consolidation failed'))
      const app = await createApp()

      const res = await postJson(app, '/consolidate', {
        topic: 'decisions/api',
      })

      expect(res.status).toBe(502)
      const json = await res.json() as Record<string, unknown>
      expect(json.error).toBe('hyphae operation failed')
      expect(json.detail).toBe('Consolidation failed')
    })
  })
})
