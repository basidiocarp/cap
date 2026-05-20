import type { CapEvent, WatcherAdapter } from './types.ts'
import { logger } from '../../logger.ts'

export class WatcherRegistry {
  private adapters = new Map<string, WatcherAdapter>()

  register(adapter: WatcherAdapter): void {
    this.adapters.set(adapter.name, adapter)
    logger.debug({ watcher: adapter.name }, 'Watcher registered')
  }

  get(name: string): WatcherAdapter | undefined {
    return this.adapters.get(name)
  }

  list(): string[] {
    return [...this.adapters.keys()]
  }

  dispatch(event: CapEvent): number {
    // Iterate registered adapters and attempt to dispatch to handlers.
    // Adapters are transformers (validate + transform), not event handlers.
    // Real event handlers are follow-on work; currently no handlers are registered.
    const dispatched = 0
    for (const adapter of this.adapters.values()) {
      try {
        logger.debug({ adapter: adapter.name, eventType: event.type }, '[watcher-registry] processing event')
        // When real handlers are added, call them here.
        // For now, adapters have already transformed the event; nothing more to do.
      } catch (err) {
        logger.error({ adapter: adapter.name, err, eventType: event.type }, '[watcher-registry] adapter error')
      }
    }
    logger.info({ dispatchedCount: dispatched, eventType: event.type }, '[watcher-registry] dispatch complete')
    return dispatched
  }
}

export const registry = new WatcherRegistry()
