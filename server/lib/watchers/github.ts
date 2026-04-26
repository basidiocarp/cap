import { createHmac, timingSafeEqual } from 'node:crypto'

import type { CapEvent, RawEvent, WatcherAdapter } from './types.ts'
import { logger } from '../../logger.ts'

interface GitHubPayload {
  action?: string
  number?: number
  pull_request?: { number: number }
  [key: string]: unknown
}

export class GithubWatcher implements WatcherAdapter {
  name = 'github'

  validate(body: Buffer, signature: string, secret: string): boolean {
    if (!secret) {
      logger.warn('github-watcher: secret not configured, skipping validation')
      return true
    }

    try {
      // Compare raw HMAC bytes to avoid length-mismatch throws from timingSafeEqual.
      const expected = createHmac('sha256', secret).update(body).digest()
      const sigHex = signature.startsWith('sha256=') ? signature.slice(7) : ''
      if (sigHex.length !== expected.length * 2) {
        return false
      }
      const received = Buffer.from(sigHex, 'hex')
      return timingSafeEqual(expected, received)
    } catch (err) {
      logger.error({ err }, 'github-watcher: HMAC verification failed')
      return false
    }
  }

  transform(event: RawEvent): CapEvent {
    const payload = event.payload as GitHubPayload

    // Check for pull_request events
    if ('pull_request' in payload && (payload.action === 'opened' || payload.action === 'closed')) {
      const prNumber = payload.pull_request?.number ?? payload.number
      return {
        message: `PR #${prNumber} ${payload.action}`,
        severity: 'info',
        type: 'notify',
      }
    }

    // Default: map to dashboard update
    return {
      data: payload,
      type: 'dashboard_update',
    }
  }
}
