const BASE = '/api'

let _apiKey: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('cap:apiKey') : null

export function setApiKey(key: string): void {
  _apiKey = key
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cap:apiKey', key)
  }
}

function getOrigin(): string {
  return (globalThis as { location?: { origin?: string } }).location?.origin ?? 'http://localhost'
}

async function extractErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error
  }

  return `${res.status} ${res.statusText}`
}

function createUrl(path: string, params?: Record<string, string>): URL {
  const url = new URL(`${BASE}${path}`, getOrigin())
  if (!params) {
    return url
  }

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

async function request<T>(path: string, init: RequestInit = {}, params?: Record<string, string>, _isRetry = false): Promise<T> {
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) || {}) }
  if (_apiKey) {
    headers.Authorization = `Bearer ${_apiKey}`
  }

  const res = await fetch(createUrl(path, params).toString(), {
    ...init,
    headers,
  })

  if (res.status === 401 && !_isRetry) {
    const key = (globalThis as { prompt?: (msg: string) => string | null }).prompt?.('Enter the Cap API key:') ?? null
    if (key) {
      setApiKey(key)
      return request<T>(path, init, params, true)
    }
    throw new Error('Authorization required')
  }

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res))
  }

  return res.json() as Promise<T>
}

export function get<T>(path: string, params?: Record<string, string>) {
  return request<T>(path, {}, params)
}

export function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
}

export function put<T>(path: string, body: unknown) {
  return request<T>(path, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
}

export function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' })
}

export interface ClientConfig {
  authRequired: boolean
}

export function getClientConfig(): Promise<ClientConfig> {
  return get<ClientConfig>('/client-config')
}
