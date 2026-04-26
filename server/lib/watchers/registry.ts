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

  dispatch(event: CapEvent): void {
    // Route CapEvent to action handlers — stub for now
    logger.info({ eventType: event.type }, '[watcher-registry] dispatching event')
    // Real handlers are follow-on work
  }
}

export const registry = new WatcherRegistry()
