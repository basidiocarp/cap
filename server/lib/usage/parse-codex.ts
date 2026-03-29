import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

import type { SessionProvider, SessionUsage } from './types.ts'
import { logger } from '../../logger.ts'
import { normalizeProvider } from './parse-helpers.ts'
import { estimateCost } from './pricing.ts'

export function parseCodexSessionUsage(transcriptPath: string): SessionUsage | null {
  try {
    const content = readFileSync(transcriptPath, 'utf-8')
    const lines = content.split('\n').filter((line) => line.trim())

    let inputTokens = 0
    let outputTokens = 0
    let cacheTokens = 0
    let messageCount = 0
    let model = 'unknown'
    let provider: SessionProvider = 'unknown'
    let project = ''
    let sessionId = ''
    let timestamp = ''

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as Record<string, unknown>
        const type = typeof entry.type === 'string' ? entry.type : ''
        const payload = typeof entry.payload === 'object' && entry.payload !== null ? (entry.payload as Record<string, unknown>) : null

        if (type === 'session_meta' && payload) {
          if (!sessionId && typeof payload.id === 'string') sessionId = payload.id
          if (!timestamp && typeof payload.timestamp === 'string') timestamp = payload.timestamp
          if (!project && typeof payload.cwd === 'string') project = basename(payload.cwd)
          if (provider === 'unknown') provider = normalizeProvider(payload.model_provider)
        }

        if (type === 'turn_context' && payload) {
          if (!timestamp && typeof entry.timestamp === 'string') timestamp = entry.timestamp
          if (!project && typeof payload.cwd === 'string') project = basename(payload.cwd)
          if (model === 'unknown' && typeof payload.model === 'string') model = payload.model
        }

        if (type === 'event_msg' && payload) {
          if (payload.type === 'user_message') {
            messageCount++
          }

          if (payload.type === 'token_count') {
            const info = typeof payload.info === 'object' && payload.info !== null ? (payload.info as Record<string, unknown>) : null
            const totalUsage =
              info && typeof info.total_token_usage === 'object' && info.total_token_usage !== null
                ? (info.total_token_usage as Record<string, unknown>)
                : null

            if (totalUsage) {
              inputTokens = typeof totalUsage.input_tokens === 'number' ? totalUsage.input_tokens : inputTokens
              outputTokens = typeof totalUsage.output_tokens === 'number' ? totalUsage.output_tokens : outputTokens
              cacheTokens = typeof totalUsage.cached_input_tokens === 'number' ? totalUsage.cached_input_tokens : cacheTokens
            }
          }
        }

        if (type === 'response_item' && payload?.type === 'message' && payload.role === 'assistant') {
          messageCount++
        }

        if (!timestamp && typeof entry.timestamp === 'string') timestamp = entry.timestamp
      } catch (err) {
        logger.debug({ err, transcriptPath }, 'Failed to parse Codex transcript line')
      }
    }

    if (messageCount === 0 && inputTokens === 0 && outputTokens === 0 && cacheTokens === 0) {
      return null
    }

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
      provider,
      runtime: 'codex',
      session_id: sessionId || basename(transcriptPath, '.jsonl'),
      timestamp: timestamp || new Date().toISOString(),
    }
  } catch (err) {
    logger.debug({ err, transcriptPath }, 'Failed to parse Codex session usage')
    return null
  }
}
