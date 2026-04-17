import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function septaDir(): string {
  return join(process.cwd(), '..', 'septa')
}

describe('resolved status customization contract', () => {
  it('exposes the core fields Cap needs for status preview', () => {
    const schemaPath = join(septaDir(), 'resolved-status-customization-v1.schema.json')
    if (!existsSync(schemaPath)) {
      console.warn('Skipping: resolved-status-customization-v1 schema not found')
      return
    }

    const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as {
      properties?: Record<string, unknown>
      required?: string[]
    }

    expect(schema.required).toEqual(expect.arrayContaining(['schema_version', 'segments', 'theme']))

    const properties = schema.properties ?? {}
    expect(properties).toHaveProperty('segments')
    expect(properties).toHaveProperty('theme')
  })
})
