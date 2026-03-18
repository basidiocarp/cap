export interface MyceliumAnalytics {
  filter_hit_rate: { filtered: number; passthrough: number; rate: number }
  savings_by_category: { category: string; commands: number; rate: number; tokens_input: number; tokens_saved: number }[]
  savings_trend: { commands: number; date: string; tokens_saved: number }[]
  top_commands: { avg_savings_percent: number; command: string; count: number }[]
  total_stats: { overall_rate: number; total_commands: number; total_tokens_input: number; total_tokens_saved: number }
}

export interface GainResult {
  avg_savings_pct?: number
  by_command?: [string, number, number, number][]
  total_commands?: number
  total_input?: number
  total_saved?: number
}
