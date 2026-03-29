export interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timer: ReturnType<typeof setTimeout>
}

export interface McpResponse {
  jsonrpc: string
  id?: number
  result?: {
    content?: { type: string; text: string }[]
    isError?: boolean
  }
  error?: { code: number; message: string }
}
