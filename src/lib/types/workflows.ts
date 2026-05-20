export interface WorkflowSummary {
  path: string
  workflow_id: string
  name: string
  description: string
  node_count: number
}

export interface NodeRunStatus {
  node_id: string
  kind: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  started_at?: string
  completed_at?: string
  output_preview?: string
}

export interface WorkflowRunStatus {
  run_id: string
  workflow_id: string
  started_at: string
  status: 'running' | 'success' | 'failed' | 'waiting_approval'
  nodes: NodeRunStatus[]
}
