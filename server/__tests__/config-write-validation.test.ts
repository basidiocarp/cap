import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerWriteRoutes } from '../routes/settings/writes.ts'

const testState = vi.hoisted(() => ({
  root: '',
}))

vi.mock('../lib/platform.ts', () => ({
  appConfigDir: (name: string) => join(testState.root, name),
  appConfigPath: (name: string) => join(testState.root, name, 'config.toml'),
  appDataPath: (name: string, file: string) => join(testState.root, 'data', name, file),
}))

function createApp() {
  const app = new Hono()
  registerWriteRoutes(app)
  return app
}

function configPath(name: string) {
  return join(testState.root, name, 'config.toml')
}

function readConfig(name: string) {
  return readFileSync(configPath(name), 'utf-8')
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

beforeEach(() => {
  testState.root = mkdtempSync(join(tmpdir(), 'cap-config-write-validation-'))
})

afterEach(() => {
  rmSync(testState.root, { force: true, recursive: true })
  testState.root = ''
})

describe('settings config writes', () => {
  it('rejects invalid payload shapes before writing files', async () => {
    const app = createApp()

    const [nullRes, arrayRes] = await Promise.all([putJson(app, '/mycelium', null), putJson(app, '/mycelium', [])])

    expect(nullRes.status).toBe(400)
    await expect(nullRes.json()).resolves.toEqual({ error: 'Invalid settings payload' })
    expect(arrayRes.status).toBe(400)
    await expect(arrayRes.json()).resolves.toEqual({ error: 'Invalid settings payload' })
    expect(existsSync(configPath('mycelium'))).toBe(false)
  })

  it.each([
    ['/mycelium', { hyphae_enabled: 'yes' }, 'hyphae_enabled must be a boolean', 'mycelium'],
    ['/rhizome', { auto_export: 'no' }, 'auto_export must be a boolean', 'rhizome'],
    ['/rhizome', { languages: ['rust', ''] }, 'languages must be an array of non-empty strings', 'rhizome'],
    ['/hyphae', { embedding_model: '' }, 'embedding_model must be a non-empty string', 'hyphae'],
    ['/hyphae', { similarity_threshold: 1.5 }, 'similarity_threshold must be a number between 0 and 1', 'hyphae'],
  ] as const)('rejects %s payloads', async (path, body, error, configName) => {
    const app = createApp()

    const res = await putJson(app, path, body)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error })
    expect(existsSync(configPath(configName))).toBe(false)
  })

  it('writes escaped TOML strings and arrays safely', async () => {
    const app = createApp()

    mkdirSync(join(testState.root, 'hyphae'), { recursive: true })
    writeFileSync(
      configPath('hyphae'),
      ['[store]', 'path = "db.sqlite"', '', 'embedding_model = "old"', 'similarity_threshold = 0.25', ''].join('\n'),
      'utf-8'
    )

    const hyphaeRes = await putJson(app, '/hyphae', {
      embedding_model: 'text "embed" \\ v2',
      similarity_threshold: 0.85,
    })

    expect(hyphaeRes.status).toBe(200)
    expect(readConfig('hyphae')).toContain('embedding_model = "text \\"embed\\" \\\\ v2"')
    expect(readConfig('hyphae')).toContain('similarity_threshold = 0.85')

    const rhizomeRes = await putJson(app, '/rhizome', {
      auto_export: true,
      languages: ['rust', 'c++', 'line\nbreak', 'quote"me', 'slash\\path'],
    })

    expect(rhizomeRes.status).toBe(200)
    expect(readConfig('rhizome')).toBe(
      ['auto_export = true', 'languages = ["rust", "c++", "line\\nbreak", "quote\\"me", "slash\\\\path"]', ''].join('\n')
    )
  })

  it('serializes mycelium booleans through the shared TOML helper', async () => {
    const app = createApp()

    const res = await putJson(app, '/mycelium', {
      hyphae_enabled: false,
      rhizome_enabled: true,
    })

    expect(res.status).toBe(200)
    expect(readConfig('mycelium')).toBe(['[filters.hyphae]', 'enabled = false', '', '[filters.rhizome]', 'enabled = true', ''].join('\n'))
  })
})
