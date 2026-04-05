import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../test/render'
import { CallGraph } from './CallGraph'

const useDependenciesMock = vi.hoisted(() => vi.fn())

vi.mock('../lib/queries', () => ({
  useDependencies: useDependenciesMock,
}))

vi.mock('@xyflow/react', () => ({
  Background: () => null,
  Controls: () => null,
  MarkerType: { ArrowClosed: 'ArrowClosed' },
  ReactFlow: ({ edges, nodes }: { edges: unknown[]; nodes: unknown[] }) => (
    <pre data-testid='call-graph'>{JSON.stringify({ edges, nodes })}</pre>
  ),
}))

describe('CallGraph', () => {
  it('groups callers, hubs, callees, and external nodes into distinct layout columns', () => {
    useDependenciesMock.mockReturnValue({
      data: [
        { callee: 'sharedFn', caller: 'callerOne', line: 12 },
        { callee: 'helperFn', caller: 'sharedFn', line: 18 },
        { callee: 'src/utils.ts', caller: 'callerOne', line: 25 },
      ],
      isLoading: false,
    })

    renderWithProviders(<CallGraph file='src/example.ts' />)

    const payload = JSON.parse(screen.getByTestId('call-graph').textContent ?? '{}') as {
      edges: Array<{ label: string; source: string; target: string }>
      nodes: Array<{ id: string; position: { x: number; y: number } }>
    }

    expect(payload.nodes.find((node) => node.id === 'callerOne')?.position.x).toBe(0)
    expect(payload.nodes.find((node) => node.id === 'sharedFn')?.position.x).toBe(220)
    expect(payload.nodes.find((node) => node.id === 'helperFn')?.position.x).toBe(440)
    expect(payload.nodes.find((node) => node.id === 'src/utils.ts')?.position.x).toBe(660)
    expect(payload.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'L12', source: 'callerOne', target: 'sharedFn' }),
        expect.objectContaining({ label: 'L18', source: 'sharedFn', target: 'helperFn' }),
        expect.objectContaining({ label: 'L25', source: 'callerOne', target: 'src/utils.ts' }),
      ])
    )
  })
})
