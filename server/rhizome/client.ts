import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'

import type { McpResponse, PendingRequest } from './types.ts'
import { isCommandAvailable } from '../lib/platform.ts'
import { logger } from '../logger.ts'
import { MCP_PROTOCOL_VERSION, RHIZOME_BIN, RHIZOME_PROJECT, TOOL_CALL_TIMEOUT } from './config.ts'

export class RhizomeClient {
  private bin: string
  private project: string
  private proc: ChildProcess | null = null
  private nextId = 1
  private pending = new Map<number, PendingRequest>()
  private spawnPromise: Promise<void> | null = null
  private stdoutBuffer = ''
  private availableCache: boolean | null = null

  constructor(opts?: { bin?: string; project?: string }) {
    this.bin = opts?.bin ?? RHIZOME_BIN
    this.project = opts?.project ?? RHIZOME_PROJECT
  }

  isAvailable(): boolean {
    if (this.availableCache !== null) return this.availableCache
    this.availableCache = isCommandAvailable(this.bin)
    return this.availableCache
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    await this.ensureRunning()

    const id = this.nextId++
    const request = {
      id,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { arguments: args, name },
    }

    logger.debug({ args, id, tool: name }, 'Rhizome tool call')

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Rhizome tool call "${name}" timed out after ${TOOL_CALL_TIMEOUT}ms`))
      }, TOOL_CALL_TIMEOUT)

      this.pending.set(id, { reject, resolve, timer })
      this.send(request)
    })
  }

  destroy(): void {
    if (this.proc) {
      logger.debug('Destroying Rhizome subprocess')
      this.proc.kill()
      this.proc = null
    }
    this.spawnPromise = null
    this.rejectAll(new Error('RhizomeClient destroyed'))
  }

  private async ensureRunning(): Promise<void> {
    if (this.proc && this.proc.exitCode === null) return
    if (this.spawnPromise) return this.spawnPromise
    this.spawnPromise = this.spawnProcess()
    try {
      await this.spawnPromise
    } finally {
      this.spawnPromise = null
    }
  }

  private spawnProcess(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      logger.debug({ bin: this.bin, project: this.project }, 'Spawning Rhizome MCP server')

      this.proc = spawn(this.bin, ['serve', '--expanded', '--project', this.project], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      this.stdoutBuffer = ''

      this.proc.stdout?.on('data', (chunk: Buffer) => {
        this.stdoutBuffer += chunk.toString()
        this.processBuffer()
      })

      this.proc.stderr?.on('data', (chunk: Buffer) => {
        const msg = chunk.toString().trim()
        if (msg) logger.warn({ source: 'rhizome' }, msg)
      })

      this.proc.on('error', (err) => {
        logger.error({ err }, 'Rhizome process error')
        this.handleExit()
        reject(err)
      })

      this.proc.on('exit', (code, signal) => {
        logger.warn({ code, signal }, 'Rhizome process exited unexpectedly')
        this.handleExit()
      })

      const initId = 0
      const initRequest = {
        id: initId,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          capabilities: {},
          clientInfo: { name: 'cap', version: '0.1.0' },
          protocolVersion: MCP_PROTOCOL_VERSION,
        },
      }

      const initTimer = setTimeout(() => {
        this.pending.delete(initId)
        reject(new Error('Rhizome MCP initialize timed out'))
      }, TOOL_CALL_TIMEOUT)

      this.pending.set(initId, {
        reject,
        resolve: () => {
          this.send({ jsonrpc: '2.0', method: 'notifications/initialized' })
          logger.debug('Rhizome MCP initialized')
          resolve()
        },
        timer: initTimer,
      })

      this.send(initRequest)
    })
  }

  private send(msg: Record<string, unknown>): void {
    if (!this.proc?.stdin?.writable) {
      throw new Error('Rhizome process stdin not writable')
    }
    this.proc.stdin.write(`${JSON.stringify(msg)}\n`)
  }

  private processBuffer(): void {
    const lines = this.stdoutBuffer.split('\n')
    this.stdoutBuffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      let msg: McpResponse
      try {
        msg = JSON.parse(trimmed) as McpResponse
      } catch {
        logger.debug({ line: trimmed }, 'Non-JSON line from Rhizome stdout')
        continue
      }

      if (msg.id === undefined) continue

      const pending = this.pending.get(msg.id)
      if (!pending) {
        logger.warn({ id: msg.id }, 'Received response for unknown request ID')
        continue
      }

      clearTimeout(pending.timer)
      this.pending.delete(msg.id)

      if (msg.error) {
        pending.reject(new Error(`Rhizome MCP error ${msg.error.code}: ${msg.error.message}`))
        continue
      }

      const result = msg.result
      if (result?.isError) {
        const text = result.content?.[0]?.text ?? 'Unknown tool error'
        pending.reject(new Error(`Rhizome tool error: ${text}`))
        continue
      }

      const text = result?.content?.[0]?.text
      if (text !== undefined) {
        try {
          pending.resolve(JSON.parse(text))
        } catch {
          pending.resolve(text)
        }
      } else {
        pending.resolve(result)
      }
    }
  }

  private handleExit(): void {
    this.proc = null
    this.spawnPromise = null
    this.rejectAll(new Error('Rhizome process exited unexpectedly'))
  }

  private rejectAll(err: Error): void {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(err)
    }
    this.pending.clear()
  }
}
