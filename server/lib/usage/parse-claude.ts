import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

import type { SessionUsage } from './types.ts'
import { logger } from '../../logger.ts'
import { estimateCost } from './pricing.ts'

export function parseClaudeSessionUsage(transcriptPath: string): SessionUsage | null {
  try {
    const content = readFileSync(transcriptPath, 'utf-8')
    const lines = content.split('\n').filter((line) => line.trim())

    let inputTokens = 0
    let outputTokens = 0
    let cacheTokens = 0
    let messageCount = 0
    let model = 'claude-sonnet-4-6'
    let project = ''
    let sessionId = ''
    let timestamp = ''

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as Record<string, unknown>
        const message = typeof entry.message === 'object' && entry.message !== null ? (entry.message as Record<string, unknown>) : null
        const usage = typeof message?.usage === 'object' && message.usage !== null ? (message.usage as Record<string, unknown>) : null

        if (!sessionId && typeof entry.sessionId === 'string') sessionId = entry.sessionId
        if (!sessionId && typeof entry.uuid === 'string') sessionId = entry.uuid
        if (!project && typeof entry.cwd === 'string') project = basename(entry.cwd)
        if (!timestamp && typeof entry.timestamp === 'string') timestamp = entry.timestamp

        if (typeof message?.model === 'string') model = message.model

        if (usage) {
          inputTokens += typeof usage.input_tokens === 'number' ? usage.input_tokens : 0
          outputTokens += typeof usage.output_tokens === 'number' ? usage.output_tokens : 0
          cacheTokens += typeof usage.cache_read_input_tokens === 'number' ? usage.cache_read_input_tokens : 0
          cacheTokens += typeof usage.cache_creation_input_tokens === 'number' ? usage.cache_creation_input_tokens : 0
        }

        if (entry.type === 'user' || entry.type === 'assistant') {
          messageCount++
        }
      } catch (err) {
        logger.debug({ err, transcriptPath }, 'Failed to parse transcript line')
      }
    }

    if (messageCount === 0) return null

    const { cost, known } = estimateCost(model, inputTokens, outputTokens)
    return {
      _transcriptPath: transcriptPath,
      cache_tokens: cacheTokens,
      cost_known: known,
      duration_messages: messageCount,
      estimated_cost: cost,
      input_tokens: inputTokens,
      model,
      output_tokens: outputTokens,
      project: project || 'unknown',
      provider: 'anthropic',
      runtime: 'claude-code',
      session_id: sessionId || basename(transcriptPath, '.jsonl'),
      timestamp: timestamp || new Date().toISOString(),
    }
  } catch (err) {
    logger.debug({ err, transcriptPath }, 'Failed to parse Claude session usage')
    return null
  }
}
