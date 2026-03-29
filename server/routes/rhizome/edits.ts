import type { Hono } from 'hono'

import { parseJsonBody, requiredNumberField, requiredStringField, rhizomeTool } from './shared.ts'

export function registerEditRoutes(app: Hono) {
  app.post('/rename', async (c) => {
    const body = await parseJsonBody(c)
    if (body instanceof Response) return body

    const file = requiredStringField(body, 'file')
    if (file instanceof Response) return file
    const newName = requiredStringField(body, 'new_name')
    if (newName instanceof Response) return newName
    const line = requiredNumberField(body, 'line')
    if (line instanceof Response) return line
    const column = requiredNumberField(body, 'column')
    if (column instanceof Response) return column

    return rhizomeTool(c, 'rename_symbol', {
      column,
      file,
      line,
      new_name: newName,
    })
  })

  app.post('/copy-symbol', async (c) => {
    const body = await parseJsonBody(c)
    if (body instanceof Response) return body

    const sourceFile = requiredStringField(body, 'source_file')
    if (sourceFile instanceof Response) return sourceFile
    const symbol = requiredStringField(body, 'symbol')
    if (symbol instanceof Response) return symbol
    const targetFile = requiredStringField(body, 'target_file')
    if (targetFile instanceof Response) return targetFile
    const targetSymbol = requiredStringField(body, 'target_symbol')
    if (targetSymbol instanceof Response) return targetSymbol
    const position = requiredStringField(body, 'position')
    if (position instanceof Response) return position

    return rhizomeTool(c, 'copy_symbol', {
      position,
      source_file: sourceFile,
      symbol,
      target_file: targetFile,
      target_symbol: targetSymbol,
    })
  })

  app.post('/move-symbol', async (c) => {
    const body = await parseJsonBody(c)
    if (body instanceof Response) return body

    const sourceFile = requiredStringField(body, 'source_file')
    if (sourceFile instanceof Response) return sourceFile
    const symbol = requiredStringField(body, 'symbol')
    if (symbol instanceof Response) return symbol
    const targetFile = requiredStringField(body, 'target_file')
    if (targetFile instanceof Response) return targetFile
    const targetSymbol = requiredStringField(body, 'target_symbol')
    if (targetSymbol instanceof Response) return targetSymbol
    const position = requiredStringField(body, 'position')
    if (position instanceof Response) return position

    return rhizomeTool(c, 'move_symbol', {
      position,
      source_file: sourceFile,
      symbol,
      target_file: targetFile,
      target_symbol: targetSymbol,
    })
  })
}
