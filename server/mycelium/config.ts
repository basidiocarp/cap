import { existsSync, readFileSync } from 'node:fs'

import { appConfigPath, appDataPath } from '../lib/platform.ts'
import { logger } from '../logger.ts'

export function resolveMyceliumDbPath(): string {
  const envPath = process.env.MYCELIUM_DB_PATH
  if (envPath?.trim()) {
    return envPath
  }

  const configPath = appConfigPath('mycelium')
  if (existsSync(configPath)) {
    try {
      const config = readFileSync(configPath, 'utf-8')
      const match = config.match(/\[tracking\][\s\S]*?database_path\s*=\s*"([^"]+)"/)
      if (match?.[1]) {
        return match[1]
      }
    } catch (err) {
      logger.debug({ configPath, err }, 'Failed to read mycelium config while resolving DB path')
    }
  }

  return appDataPath('mycelium', 'history.db')
}
