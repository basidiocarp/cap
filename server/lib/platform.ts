import { execFile } from 'node:child_process'
import { accessSync, constants, existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { basename, delimiter, extname, isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

function configHomeDir(): string {
  const home = homedir()
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support')
    case 'win32':
      return process.env.APPDATA ?? join(home, 'AppData', 'Roaming')
    default:
      return process.env.XDG_CONFIG_HOME ?? join(home, '.config')
  }
}

function dataHomeDir(): string {
  const home = homedir()
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support')
    case 'win32':
      return process.env.APPDATA ?? join(home, 'AppData', 'Roaming')
    default:
      return process.env.XDG_DATA_HOME ?? join(home, '.local', 'share')
  }
}

function pathCandidates(bin: string): string[] {
  if (platform() !== 'win32') {
    return [bin]
  }

  if (extname(bin)) {
    return [bin]
  }

  const pathExt = process.env.PATHEXT?.split(';').filter(Boolean) ?? ['.COM', '.EXE', '.BAT', '.CMD']
  return [bin, ...pathExt.map((suffix) => `${bin}${suffix.toLowerCase()}`), ...pathExt.map((suffix) => `${bin}${suffix.toUpperCase()}`)]
}

function canExecute(filePath: string): boolean {
  try {
    accessSync(filePath, platform() === 'win32' ? constants.F_OK : constants.X_OK)
    return true
  } catch {
    return false
  }
}

export function appConfigDir(appName: string): string {
  return join(configHomeDir(), appName)
}

export function appConfigPath(appName: string, fileName = 'config.toml'): string {
  return join(appConfigDir(appName), fileName)
}

export function appDataDir(appName: string): string {
  return join(dataHomeDir(), appName)
}

export function appDataPath(appName: string, fileName: string): string {
  return join(appDataDir(appName), fileName)
}

export function claudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json')
}

export function codexConfigPath(): string {
  return join(homedir(), '.codex', 'config.toml')
}

export function codexSessionsDir(): string {
  return join(homedir(), '.codex', 'sessions')
}

export function findCommandPath(bin: string): string | null {
  if (!bin) return null

  if (isAbsolute(bin) || bin.includes('/') || bin.includes('\\')) {
    return existsSync(bin) && canExecute(bin) ? bin : null
  }

  const pathDirs = (process.env.PATH ?? '').split(delimiter).filter(Boolean)
  const candidates = pathCandidates(bin)
  for (const dir of pathDirs) {
    for (const candidate of candidates) {
      const fullPath = join(dir, candidate)
      if (existsSync(fullPath) && canExecute(fullPath)) {
        return fullPath
      }
    }
  }

  return null
}

export function isCommandAvailable(bin: string): boolean {
  return findCommandPath(bin) !== null
}

export async function isProcessRunning(bin: string): Promise<boolean> {
  const commandName = basename(bin, extname(bin))

  if (platform() === 'win32') {
    try {
      const { stdout } = await exec('tasklist', ['/FO', 'CSV', '/NH'])
      const processNames = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^"|"$/g, '').split('","')[0]?.toLowerCase())
      return processNames.some((name) => name === `${commandName}.exe`.toLowerCase() || name === commandName.toLowerCase())
    } catch {
      return false
    }
  }

  try {
    await exec('pgrep', ['-x', commandName], { timeout: 1000 })
    return true
  } catch {
    return false
  }
}
