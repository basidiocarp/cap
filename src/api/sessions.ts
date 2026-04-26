export interface SessionConversation {
  session_id: string
  conversation_id: string | null
}

const API_BASE = '/api/sessions'

export async function getConversation(sessionId: string): Promise<SessionConversation> {
  const res = await fetch(`${API_BASE}/${sessionId}/conversation`)

  if (!res.ok) {
    throw new Error(`Failed to get conversation: ${res.status}`)
  }

  return res.json()
}

export async function setConversation(sessionId: string, conversationId: string): Promise<SessionConversation> {
  const res = await fetch(`${API_BASE}/${sessionId}/conversation`, {
    body: JSON.stringify({ conversation_id: conversationId }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!res.ok) {
    throw new Error(`Failed to set conversation: ${res.status}`)
  }

  return res.json()
}
