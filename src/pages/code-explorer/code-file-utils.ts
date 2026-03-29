const CODE_EXTENSIONS = new Set([
  'c',
  'cc',
  'cpp',
  'cs',
  'dart',
  'ex',
  'go',
  'h',
  'hpp',
  'java',
  'js',
  'jsx',
  'kt',
  'lua',
  'mts',
  'php',
  'py',
  'rb',
  'rs',
  'swift',
  'ts',
  'tsx',
  'zig',
])

export function isCodeFile(path: string | null): boolean {
  if (!path) return false

  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return CODE_EXTENSIONS.has(ext)
}
