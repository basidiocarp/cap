export interface RawEvent {
  source: string
  payload: unknown
  received_at: string // ISO 8601
}

export type CapEvent =
  | { type: 'session_start'; session_id: string }
  | { type: 'notify'; message: string; severity: 'info' | 'warning' | 'error' }
  | { type: 'dashboard_update'; data: Record<string, unknown> }

export interface WatcherAdapter {
  name: string
  validate(body: Buffer, signature: string, secret: string): boolean
  transform(event: RawEvent): CapEvent
}

export interface WatcherConfig {
  enabled: string[]
  webhook_secret: string
  github_secret: string
}
