import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { RHIZOME_PROJECT } from '../lib/config.ts'
import { logger } from '../logger.ts'

const exec = promisify(execFile)

// Reject paths with traversal sequences or absolute paths.
function isValidFilePath(file: string): boolean {
  return file.length > 0 && !file.includes('..') && !file.startsWith('/') && !file.startsWith('~')
}

// Accept only git ref characters (commit SHA, branch, tag, HEAD~n).
function isValidRef(ref: string): boolean {
  return /^[a-zA-Z0-9_.~^/:@{}-]+$/.test(ref)
}

const app = new Hono()

// GET /api/diff?file=<path>&base=<ref>
// Returns { diff: string, file: string } — diff is empty string when no changes.
app.get('/', async (c) => {
  const file = c.req.query('file') ?? ''
  const base = c.req.query('base') || 'HEAD'

  if (!isValidFilePath(file)) {
    return c.json({ error: 'Invalid file path' }, 400)
  }
  if (!isValidRef(base)) {
    return c.json({ error: 'Invalid base ref' }, 400)
  }

  try {
    const { stdout } = await exec('git', ['diff', base, '--', file], {
      cwd: RHIZOME_PROJECT,
      timeout: 5000,
    })
    return c.json({ diff: stdout, file })
  } catch (err) {
    logger.debug({ base, err, file }, 'git diff failed')
    // git exits non-zero when no repo or no changes; treat as empty diff.
    return c.json({ diff: '', file })
  }
})

export default app
