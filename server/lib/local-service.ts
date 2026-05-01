import { readFile } from 'node:fs/promises'
import { createConnection } from 'node:net'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { logger } from '../logger.ts'

interface ServiceEndpoint {
  schema_version: string
  transport: string
  endpoint: string
}

let nextReqId = 0

async function readSocketPath(tool: string): Promise<string | null> {
  const descriptorPath = join(homedir(), '.config', tool, `${tool}.endpoint.json`)
  try {
    const raw = await readFile(descriptorPath, 'utf8')
    const descriptor = JSON.parse(raw) as ServiceEndpoint
    if (descriptor.transport !== 'unix-socket' || !descriptor.endpoint) return null
    return descriptor.endpoint
  } catch {
    return null
  }
}

// Sends a single JSON-RPC 2.0 request over a unix socket and returns the result
// as a JSON string. Returns null if the endpoint is not available. Throws on
// socket errors or RPC-level errors.
export async function callLocalService(
  tool: string,
  method: string,
  params: Record<string, unknown>
): Promise<string | null> {
  const socketPath = await readSocketPath(tool)
  if (!socketPath) {
    logger.debug({ tool }, 'No local service endpoint — will fall back to CLI')
    return null
  }

  const id = ++nextReqId
  return new Promise((resolve, reject) => {
    const socket = createConnection(socketPath)
    let buf = ''

    socket.setTimeout(5000)

    socket.on('connect', () => {
      const request = JSON.stringify({ id, jsonrpc: '2.0', method, params }) + '\n'
      socket.write(request)
    })

    socket.on('data', (chunk: Buffer) => {
      buf += chunk.toString('utf8')
      const nl = buf.indexOf('\n')
      if (nl === -1) return
      const line = buf.slice(0, nl)
      socket.destroy()
      try {
        const response = JSON.parse(line) as { result?: unknown; error?: unknown }
        if (response.error != null) {
          reject(new Error(typeof response.error === 'string' ? response.error : JSON.stringify(response.error)))
          return
        }
        if (response.result === undefined || response.result === null) {
          resolve(null)
          return
        }
        const resultStr =
          typeof response.result === 'string' ? response.result : JSON.stringify(response.result)
        resolve(resultStr)
      } catch (err) {
        reject(err)
      }
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error(`Socket timeout calling ${tool}/${method}`))
    })

    socket.on('error', (err: Error) => {
      reject(err)
    })
  })
}
