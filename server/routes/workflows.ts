import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { Hono } from 'hono'

import { logger } from '../logger.ts'

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

function getWorkflowsDir(): string | null {
  try {
    const result = execSync('lamella path workflows 2>/dev/null', { encoding: 'utf-8', timeout: 3000 })
    const dir = result.trim()
    if (dir && existsSync(dir)) {
      return dir
    }
  } catch {
    // fall through
  }

  const lamellaResources = process.env.LAMELLA_RESOURCES
  if (lamellaResources && existsSync(lamellaResources)) {
    const dir = join(lamellaResources, 'workflows')
    if (existsSync(dir)) {
      return dir
    }
  }

  const fallbackDir = join(homedir(), '.local', 'share', 'lamella', 'resources', 'workflows')
  if (existsSync(fallbackDir)) {
    return fallbackDir
  }

  return null
}

function parseYamlTopLevel(content: string): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  const lines = content.split('\n')

  let nodeCount = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('kind:')) {
      nodeCount++
    }

    if (trimmed.startsWith('schema_version:')) {
      const match = /schema_version:\s*['"]?(.+?)['"]?\s*$/.exec(trimmed)
      if (match) result.schema_version = match[1].trim()
    } else if (trimmed.startsWith('workflow_id:')) {
      const match = /workflow_id:\s*['"]?(.+?)['"]?\s*$/.exec(trimmed)
      if (match) result.workflow_id = match[1].trim()
    } else if (trimmed.startsWith('name:')) {
      const match = /name:\s*['"]?(.+?)['"]?\s*$/.exec(trimmed)
      if (match) result.name = match[1].trim()
    } else if (trimmed.startsWith('description:')) {
      const match = /description:\s*['"]?(.+?)['"]?\s*$/.exec(trimmed)
      if (match) result.description = match[1].trim()
    }
  }

  result.node_count = nodeCount
  return result
}

const app = new Hono()

app.get('/list', async (c) => {
  try {
    const workflowsDir = getWorkflowsDir()

    if (!workflowsDir) {
      return c.json({ workflows: [] })
    }

    const files = readdirSync(workflowsDir)
    const yamlFiles = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))

    const workflows: WorkflowSummary[] = []

    for (const file of yamlFiles) {
      const filePath = join(workflowsDir, file)
      try {
        const content = readFileSync(filePath, 'utf-8')
        const parsed = parseYamlTopLevel(content)

        workflows.push({
          description: (parsed.description as string) || '',
          name: (parsed.name as string) || file,
          node_count: (parsed.node_count as number) || 0,
          path: file,
          workflow_id: (parsed.workflow_id as string) || file.replace(/\.(yaml|yml)$/, ''),
        })
      } catch (err) {
        logger.warn({ err, file }, 'Failed to parse workflow file')
      }
    }

    return c.json({ workflows })
  } catch (err) {
    logger.error({ err }, 'Failed to list workflows')
    return c.json({ error: 'Failed to list workflows', workflows: [] }, 500)
  }
})

app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const workflowsDir = getWorkflowsDir()

    if (!workflowsDir) {
      return c.json({ error: 'Workflows directory not found', yaml: '' }, 404)
    }

    // Security: prevent directory traversal — belt check on known vectors.
    if (id.includes('..') || id.includes('/')) {
      return c.json({ error: 'Invalid workflow id', yaml: '' }, 400)
    }

    // Try both .yaml and .yml extensions
    const yamlPath = join(workflowsDir, `${id}.yaml`)
    const ymlPath = join(workflowsDir, `${id}.yml`)

    let filePath: string | null = null
    if (existsSync(yamlPath)) {
      filePath = yamlPath
    } else if (existsSync(ymlPath)) {
      filePath = ymlPath
    }

    if (!filePath) {
      return c.json({ error: 'Workflow not found', yaml: '' }, 404)
    }

    // Defense-in-depth: confirm the resolved path stays inside the workflows directory.
    if (!resolve(filePath).startsWith(resolve(workflowsDir) + sep)) {
      return c.json({ error: 'Invalid workflow id', yaml: '' }, 400)
    }

    const yaml = readFileSync(filePath, 'utf-8')
    return c.json({ yaml })
  } catch (err) {
    logger.error({ err }, 'Failed to get workflow')
    return c.json({ error: 'Failed to get workflow', yaml: '' }, 500)
  }
})

app.get('/runs/status', (c) => {
  try {
    const output = execSync('hymenium status --json', { encoding: 'utf-8', timeout: 5000 })
    const parsed: unknown = JSON.parse(output)
    if (!Array.isArray(parsed)) {
      logger.warn({ parsed }, 'hymenium status --json returned unexpected shape')
      return c.json({ error: 'hymenium unavailable', runs: [] })
    }
    const runs = parsed as WorkflowRunStatus[]
    return c.json({ runs })
  } catch (err) {
    logger.debug({ err }, 'hymenium unavailable')
    return c.json({ error: 'hymenium unavailable', runs: [] })
  }
})

export default app
