import { createCliRunner } from '../lib/cli.ts'

const runCli = createCliRunner(process.env.HYPHAE_BIN ?? 'hyphae', 'hyphae')

export async function store(topic: string, summary: string, importance?: string, keywords?: string[]) {
  const args = ['store', '-t', topic, '-c', summary]
  if (importance) args.push('-i', importance)
  if (keywords?.length) args.push('-k', keywords.join(','))
  return runCli(args)
}

export async function forget(id: string) {
  return runCli(['forget', id])
}

export async function updateImportance(id: string, importance: string) {
  return runCli(['update', '--id', id, '--importance', importance])
}

export async function invalidateMemory(id: string, reason?: string) {
  const args = ['invalidate', '--id', id]
  if (reason) args.push('--reason', reason)
  return runCli(args)
}

export async function consolidate(topic: string, keepOriginals = false) {
  const args = ['consolidate', '-t', topic]
  if (keepOriginals) args.push('--keep-originals')
  return runCli(args)
}
