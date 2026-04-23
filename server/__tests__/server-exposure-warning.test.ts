import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMock = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('../logger.ts', () => ({
  logger: loggerMock,
}))

vi.mock('@hono/node-server', () => ({
  serve: vi.fn(),
}))

const previousEnv = {
  apiKey: process.env.CAP_API_KEY,
  capHost: process.env.CAP_HOST,
  port: process.env.PORT,
}

function restoreEnv() {
  if (previousEnv.capHost === undefined) {
    delete process.env.CAP_HOST
  } else {
    process.env.CAP_HOST = previousEnv.capHost
  }

  if (previousEnv.apiKey === undefined) {
    delete process.env.CAP_API_KEY
  } else {
    process.env.CAP_API_KEY = previousEnv.apiKey
  }

  if (previousEnv.port === undefined) {
    delete process.env.PORT
  } else {
    process.env.PORT = previousEnv.port
  }
}

describe('startServer exposure warning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreEnv()
  })

  afterEach(() => {
    vi.resetModules()
    restoreEnv()
  })

  it('warns when CAP_HOST is 0.0.0.0 and CAP_API_KEY is unset', async () => {
    process.env.CAP_HOST = '0.0.0.0'
    delete process.env.CAP_API_KEY

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.objectContaining({ host: '0.0.0.0' }), expect.stringContaining('CAP_API_KEY'))
  })

  it('warns when CAP_HOST is 0.0.0.0 and CAP_API_KEY is empty string', async () => {
    process.env.CAP_HOST = '0.0.0.0'
    process.env.CAP_API_KEY = ''

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.objectContaining({ host: '0.0.0.0' }), expect.stringContaining('CAP_API_KEY'))
  })

  it('warns when CAP_HOST is 0.0.0.0 and CAP_API_KEY is only whitespace', async () => {
    process.env.CAP_HOST = '0.0.0.0'
    process.env.CAP_API_KEY = '   '

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.objectContaining({ host: '0.0.0.0' }), expect.stringContaining('CAP_API_KEY'))
  })

  it('does not warn when CAP_HOST is 127.0.0.1 and CAP_API_KEY is unset', async () => {
    process.env.CAP_HOST = '127.0.0.1'
    delete process.env.CAP_API_KEY

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  it('does not warn when CAP_HOST is localhost (default) and CAP_API_KEY is unset', async () => {
    delete process.env.CAP_HOST
    delete process.env.CAP_API_KEY

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  it('does not warn when CAP_HOST is 0.0.0.0 and CAP_API_KEY is set', async () => {
    process.env.CAP_HOST = '0.0.0.0'
    process.env.CAP_API_KEY = 'test-api-key'

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  it('does not warn when CAP_HOST is a private network address and CAP_API_KEY is set', async () => {
    process.env.CAP_HOST = '192.168.1.1'
    process.env.CAP_API_KEY = 'test-api-key'

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).not.toHaveBeenCalled()
  })

  it('warns when CAP_HOST is a private network address and CAP_API_KEY is unset', async () => {
    process.env.CAP_HOST = '192.168.1.1'
    delete process.env.CAP_API_KEY

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.warn).toHaveBeenCalledWith(expect.objectContaining({ host: '192.168.1.1' }), expect.stringContaining('CAP_API_KEY'))
  })

  it('still logs info message when warning is triggered', async () => {
    process.env.CAP_HOST = '0.0.0.0'
    delete process.env.CAP_API_KEY

    const { startServer } = await import('../index.ts')
    startServer()

    expect(loggerMock.info).toHaveBeenCalledWith(expect.objectContaining({ host: '0.0.0.0' }), 'Cap server started')
    expect(loggerMock.warn).toHaveBeenCalled()
  })
})
