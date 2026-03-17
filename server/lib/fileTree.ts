import { extname } from 'node:path'

export const EXT_LANGUAGE: Record<string, string> = {
  '.c': 'c',
  '.cc': 'cpp',
  '.cpp': 'cpp',
  '.css': 'css',
  '.cxx': 'cpp',
  '.go': 'go',
  '.h': 'c',
  '.hpp': 'cpp',
  '.html': 'html',
  '.java': 'java',
  '.js': 'javascript',
  '.json': 'json',
  '.jsx': 'javascript',
  '.md': 'markdown',
  '.mts': 'typescript',
  '.py': 'python',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.toml': 'toml',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.yaml': 'yaml',
  '.yml': 'yaml',
}

export interface FileNode {
  children?: FileNode[]
  language?: string
  name: string
  path: string
  type: 'dir' | 'file'
}

export function inferLanguage(filename: string): string | undefined {
  return EXT_LANGUAGE[extname(filename)]
}

export function buildFileTree(files: string[], basePath: string | undefined, maxDepth: number): FileNode[] {
  const rootChildren: FileNode[] = []
  const prefix = basePath ? (basePath.endsWith('/') ? basePath : `${basePath}/`) : ''

  for (const filePath of files) {
    if (prefix && !filePath.startsWith(prefix)) continue

    const relPath = prefix ? filePath.slice(prefix.length) : filePath
    if (!relPath) continue

    const parts = relPath.split('/')
    let currentChildren = rootChildren

    for (let i = 0; i < parts.length; i++) {
      if (i >= maxDepth) break

      const part = parts[i]
      const fullPath = prefix ? `${prefix}${parts.slice(0, i + 1).join('/')}` : parts.slice(0, i + 1).join('/')
      const isFile = i === parts.length - 1

      if (isFile) {
        const node: FileNode = { name: part, path: fullPath, type: 'file' }
        const lang = inferLanguage(part)
        if (lang) node.language = lang
        currentChildren.push(node)
      } else {
        let dirNode = currentChildren.find((n) => n.name === part && n.type === 'dir')
        if (!dirNode) {
          dirNode = { children: [], name: part, path: fullPath, type: 'dir' }
          currentChildren.push(dirNode)
        }
        currentChildren = dirNode.children ?? []
      }
    }
  }

  return rootChildren
}
