import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { parseSessionUsage } from '../lib/usage.ts'

const tempDirs: string[] = []

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      rmSync(dir, { force: true, recursive: true })
    }
  }
})

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

describe('parseSessionUsage', () => {
  it('parses Claude session transcripts', () => {
    const root = makeTempDir('cap-usage-claude-')
    const transcriptPath = join(root, '.claude', 'projects', 'demo-project', 'session-1.jsonl')
    mkdirSync(join(root, '.claude', 'projects', 'demo-project'), { recursive: true })
    writeFileSync(
      transcriptPath,
      [
        JSON.stringify({
          cwd: '/Users/test/demo-project',
          message: { role: 'user' },
          sessionId: 'session-1',
          timestamp: '2026-03-23T10:00:00.000Z',
          type: 'user',
        }),
        JSON.stringify({
          cwd: '/Users/test/demo-project',
          message: {
            model: 'claude-sonnet-4-6',
            usage: {
              cache_creation_input_tokens: 50,
              cache_read_input_tokens: 100,
              input_tokens: 300,
              output_tokens: 120,
            },
          },
          sessionId: 'session-1',
          timestamp: '2026-03-23T10:00:05.000Z',
          type: 'assistant',
        }),
      ].join('\n'),
      'utf8'
    )

    const usage = parseSessionUsage(transcriptPath)

    expect(usage).not.toBeNull()
    expect(usage).toMatchObject({
      cache_tokens: 150,
      cost_known: true,
      duration_messages: 2,
      input_tokens: 300,
      model: 'claude-sonnet-4-6',
      output_tokens: 120,
      project: 'demo-project',
      provider: 'anthropic',
      runtime: 'claude-code',
      session_id: 'session-1',
    })
  })

  it('parses Codex session transcripts', () => {
    const root = makeTempDir('cap-usage-codex-')
    const transcriptPath = join(root, '.codex', 'sessions', '2026', '03', '23', 'rollout-test.jsonl')
    mkdirSync(join(root, '.codex', 'sessions', '2026', '03', '23'), { recursive: true })
    writeFileSync(
      transcriptPath,
      [
        JSON.stringify({
          payload: {
            cwd: '/Users/test/demo-project',
            id: 'rollout-1',
            model_provider: 'openai',
            timestamp: '2026-03-23T11:00:00.000Z',
          },
          timestamp: '2026-03-23T11:00:00.000Z',
          type: 'session_meta',
        }),
        JSON.stringify({
          payload: {
            cwd: '/Users/test/demo-project',
            model: 'gpt-5.4',
          },
          timestamp: '2026-03-23T11:00:01.000Z',
          type: 'turn_context',
        }),
        JSON.stringify({
          payload: { message: 'hello', type: 'user_message' },
          timestamp: '2026-03-23T11:00:02.000Z',
          type: 'event_msg',
        }),
        JSON.stringify({
          payload: {
            content: [{ text: 'working', type: 'output_text' }],
            role: 'assistant',
            type: 'message',
          },
          timestamp: '2026-03-23T11:00:03.000Z',
          type: 'response_item',
        }),
        JSON.stringify({
          payload: {
            info: {
              total_token_usage: {
                cached_input_tokens: 250,
                input_tokens: 1200,
                output_tokens: 480,
              },
            },
            type: 'token_count',
          },
          timestamp: '2026-03-23T11:00:04.000Z',
          type: 'event_msg',
        }),
      ].join('\n'),
      'utf8'
    )

    const usage = parseSessionUsage(transcriptPath)

    expect(usage).not.toBeNull()
    expect(usage).toMatchObject({
      cache_tokens: 250,
      cost_known: false,
      duration_messages: 2,
      input_tokens: 1200,
      model: 'gpt-5.4',
      output_tokens: 480,
      project: 'demo-project',
      provider: 'openai',
      runtime: 'codex',
      session_id: 'rollout-1',
    })
  })
})
