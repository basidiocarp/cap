import { Alert, Badge, CloseButton, Group, Text } from '@mantine/core'
import { IconHeartbeat } from '@tabler/icons-react'
import { useState } from 'react'

import type { EcosystemStatus } from '../lib/types'
import { useEcosystemStatus } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Tier classification
//
// Tier 1 tools are critical — their absence turns the panel red.
// Tier 2 tools degrade the experience but don't block core function; their
// absence keeps the panel amber as long as all Tier 1 tools are up.
//
// The /api/status endpoint currently reports availability for mycelium, rhizome,
// and hyphae. Tier 2 names that aren't in the response are listed for
// completeness but cannot trigger amber today.
// ─────────────────────────────────────────────────────────────────────────────

interface ToolCheck {
  available: boolean
  label: string
  tier: 1 | 2
}

function buildToolChecks(status: EcosystemStatus): ToolCheck[] {
  return [
    { available: status.mycelium.available, label: 'mycelium', tier: 1 },
    { available: status.rhizome.available, label: 'rhizome', tier: 1 },
    { available: status.hyphae.available, label: 'hyphae', tier: 2 },
  ]
}

type HealthLevel = 'red' | 'amber'

interface PanelState {
  color: 'red' | 'yellow'
  downTools: string[]
  level: HealthLevel
  title: string
}

function computePanelState(checks: ToolCheck[]): PanelState | null {
  const down = checks.filter((c) => !c.available)
  if (down.length === 0) return null

  const tier1Down = down.filter((c) => c.tier === 1)

  if (tier1Down.length > 0) {
    return {
      color: 'red',
      downTools: down.map((c) => c.label),
      level: 'red',
      title: 'Core tool unavailable',
    }
  }

  return {
    color: 'yellow',
    downTools: down.map((c) => c.label),
    level: 'amber',
    title: 'Tool degraded',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ServiceHealthPanel() {
  const { data: status } = useEcosystemStatus()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !status) return null

  const checks = buildToolChecks(status)
  const panel = computePanelState(checks)

  if (!panel) return null

  return (
    <Alert
      color={panel.color}
      icon={<IconHeartbeat size={16} />}
      styles={{ root: { borderRadius: 0 } }}
      title={
        <Group
          gap='xs'
          justify='space-between'
          wrap='nowrap'
        >
          <Group
            gap='xs'
            wrap='nowrap'
          >
            <Text
              fw={600}
              inherit
            >
              {panel.title}
            </Text>
            {panel.downTools.map((tool) => (
              <Badge
                color={panel.color}
                key={tool}
                size='sm'
                variant='light'
              >
                {tool}
              </Badge>
            ))}
          </Group>
          <CloseButton
            aria-label='Dismiss health banner'
            onClick={() => setDismissed(true)}
            size='sm'
          />
        </Group>
      }
      variant='light'
    />
  )
}
