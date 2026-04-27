import { createHmac, timingSafeEqual } from 'node:crypto'

import type { CapEvent, RawEvent, WatcherAdapter } from './types.ts'
import { logger } from '../../logger.ts'

export class WebhookWatcher implements WatcherAdapter {
  name = 'webhook'

  validate(body: Buffer, signature: string, secret: string): boolean {
    if (!secret) {
      // Pure HMAC check: no secret means we cannot verify — reject.
      // The caller is responsible for checking any dev-mode bypass before
      // invoking validate().
      logger.warn('webhook-watcher: secret not configured — rejecting unsigned payload')
      return false
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
      logger.error({ err }, 'webhook-watcher: HMAC verification failed')
      return false
    }
  }

  transform(event: RawEvent): CapEvent {
    return {
      data: event.payload as Record<string, unknown>,
      type: 'dashboard_update',
    }
  }
}
