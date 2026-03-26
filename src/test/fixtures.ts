import type { Concept, ConceptInspection, EcosystemStatus, Memoir, MemoirDetail, RhizomeSymbol, SymbolDefinition } from '../lib/api'

export function createEcosystemStatus(overrides: Partial<EcosystemStatus> = {}): EcosystemStatus {
  const base: EcosystemStatus = {
    agents: {
      claude_code: {
        adapter: {
          configured: true,
          detected: true,
          kind: 'hooks',
          label: 'Claude hooks',
        },
        config_path: '/Users/test/.claude/settings.json',
        configured: true,
        detected: true,
        integration: 'hooks',
        resolved_config_path: '/Users/test/.claude/settings.json',
        resolved_config_source: 'config_file',
      },
      codex: {
        adapter: {
          configured: true,
          detected: true,
          kind: 'mcp',
          label: 'Codex MCP',
        },
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        detected: true,
        integration: 'mcp',
        notify: {
          command: 'hyphae codex-notify',
          config_path: '/Users/test/.codex/config.toml',
          configured: true,
          contract_matched: true,
        },
        resolved_config_path: '/Users/test/.codex/config.toml',
        resolved_config_source: 'config_file',
      },
    },
    hooks: {
      error_count: 0,
      installed_hooks: [
        {
          command: 'hyphae hook',
          event: 'PostToolUse',
          matcher: '*',
        },
      ],
      lifecycle: [
        { event: 'PostToolUse', installed: true, matching_hooks: 1 },
        { event: 'SessionEnd', installed: true, matching_hooks: 1 },
      ],
      recent_errors: [],
    },
    hyphae: {
      activity: {
        codex_memory_count: 2,
        last_codex_memory_at: '2026-03-25T12:00:00Z',
        last_session_memory_at: '2026-03-25T12:00:00Z',
        last_session_topic: 'session/test',
        recent_session_memory_count: 2,
      },
      available: true,
      memoirs: 7,
      memories: 42,
      version: '0.9.1',
    },
    lsps: [],
    mycelium: {
      available: true,
      version: '0.7.0',
    },
    project: {
      active: '/workspace/cap',
      recent: ['/workspace/cap', '/workspace/hyphae'],
    },
    rhizome: {
      available: true,
      backend: 'lsp',
      languages: ['typescript'],
    },
  }

  return {
    ...base,
    ...overrides,
    agents: {
      claude_code: {
        ...base.agents.claude_code,
        ...overrides.agents?.claude_code,
        adapter: {
          ...base.agents.claude_code.adapter,
          ...overrides.agents?.claude_code?.adapter,
        },
      },
      codex: {
        ...base.agents.codex,
        ...overrides.agents?.codex,
        adapter: {
          ...base.agents.codex.adapter,
          ...overrides.agents?.codex?.adapter,
        },
        notify:
          overrides.agents?.codex?.notify === undefined
            ? base.agents.codex.notify
            : {
                ...base.agents.codex.notify,
                ...overrides.agents.codex.notify,
              },
      },
    },
    hooks: {
      ...base.hooks,
      ...overrides.hooks,
    },
    hyphae: {
      ...base.hyphae,
      ...overrides.hyphae,
      activity: {
        ...base.hyphae.activity,
        ...overrides.hyphae?.activity,
      },
    },
    mycelium: {
      ...base.mycelium,
      ...overrides.mycelium,
    },
    project: {
      ...base.project,
      ...overrides.project,
    },
    rhizome: {
      ...base.rhizome,
      ...overrides.rhizome,
    },
  }
}

export function createRhizomeSymbol(overrides: Partial<RhizomeSymbol> = {}): RhizomeSymbol {
  return {
    doc_comment: null,
    kind: 'function',
    name: 'renderStatus',
    signature: 'function renderStatus(): void',
    ...overrides,
    location: {
      column_end: 10,
      column_start: 2,
      file_path: '/workspace/cap/src/example.ts',
      line_end: 12,
      line_start: 4,
      ...overrides.location,
    },
  }
}

export function createSymbolDefinition(overrides: Partial<SymbolDefinition> = {}): SymbolDefinition {
  return {
    body: 'export function renderStatus() {}',
    doc_comment: null,
    kind: 'function',
    name: 'renderStatus',
    signature: 'function renderStatus(): void',
    ...overrides,
  }
}

export function createMemoir(overrides: Partial<Memoir> = {}): Memoir {
  return {
    consolidation_threshold: 20,
    created_at: '2026-03-25T12:00:00Z',
    description: 'Code knowledge graph',
    id: 'memoir-1',
    name: 'code:cap',
    updated_at: '2026-03-25T12:00:00Z',
    ...overrides,
  }
}

export function createConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    confidence: 0.92,
    created_at: '2026-03-25T12:00:00Z',
    definition: 'Shared readiness panel logic',
    id: 'concept-1',
    labels: JSON.stringify([
      { namespace: 'code', value: 'function' },
      { namespace: 'domain', value: 'ui' },
    ]),
    memoir_id: 'memoir-1',
    name: 'getReadinessPanels',
    revision: 3,
    source_memory_ids: '[]',
    updated_at: '2026-03-25T12:00:00Z',
    ...overrides,
  }
}

export function createMemoirDetail(overrides: Partial<MemoirDetail> = {}): MemoirDetail {
  const concepts = overrides.concepts ?? [createConcept()]

  return {
    concepts,
    limit: 200,
    memoir: createMemoir(overrides.memoir),
    offset: 0,
    query: null,
    total_concepts: concepts.length,
    ...overrides,
  }
}

export function createConceptInspection(overrides: Partial<ConceptInspection> = {}): ConceptInspection {
  const concept = overrides.concept ?? createConcept()
  const neighborConcept = createConcept({
    definition: 'Displays the host coverage details',
    id: 'concept-2',
    name: 'HostCoveragePanel',
  })

  return {
    concept,
    neighbors: overrides.neighbors ?? [
      {
        concept: neighborConcept,
        direction: 'outgoing',
        link: {
          created_at: '2026-03-25T12:00:00Z',
          id: 'link-1',
          relation: 'calls',
          source_id: concept.id,
          target_id: neighborConcept.id,
          weight: 1,
        },
      },
    ],
  }
}
