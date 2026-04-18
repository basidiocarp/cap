import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core'
import { IconCircleFilled, IconX } from '@tabler/icons-react'
import { useState } from 'react'

import type { AnnulusToolReport } from '../lib/api'
import { useAnnulusStatus } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toolColor(report: AnnulusToolReport): string {
  if (!report.available) return 'red'
  if (report.degraded_capabilities.length > 0) return 'orange'
  return 'green'
}

function toolLabel(report: AnnulusToolReport): string {
  if (!report.available) return 'Unavailable'
  if (report.degraded_capabilities.length > 0) return `Degraded: ${report.degraded_capabilities.join(', ')}`
  return 'Available'
}

function tierLabel(tier: 'tier1' | 'tier2' | 'tier3'): string {
  const labels: Record<'tier1' | 'tier2' | 'tier3', string> = {
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
  }
  return labels[tier]
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ToolIndicator({ report }: { report: AnnulusToolReport }) {
  const color = toolColor(report)
  const label = toolLabel(report)

  return (
    <Tooltip label={label}>
      <Badge
        color={color}
        leftSection={
          <IconCircleFilled
            aria-hidden
            size={8}
          />
        }
        variant='light'
      >
        {report.tool}
      </Badge>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EcosystemStatusPanel
// ─────────────────────────────────────────────────────────────────────────────

export function EcosystemStatusPanel() {
  const [dismissed, setDismissed] = useState(false)
  const { data } = useAnnulusStatus()

  if (dismissed) return null
  if (!data || !data.available) {
    return (
      <Text
        c='dimmed'
        size='xs'
      >
        Ecosystem status unavailable
      </Text>
    )
  }

  if (data.reports.length === 0) {
    return (
      <Text
        c='dimmed'
        size='xs'
      >
        No tool reports available
      </Text>
    )
  }

  const tiers: Array<'tier1' | 'tier2' | 'tier3'> = ['tier1', 'tier2', 'tier3']

  return (
    <Stack gap='xs'>
      {tiers.map((tier) => {
        const reports = data.reports.filter((r) => r.tier === tier)
        if (reports.length === 0) return null
        return (
          <Group
            gap='xs'
            key={tier}
          >
            <Text
              c='dimmed'
              fw={500}
              size='xs'
              w={48}
            >
              {tierLabel(tier)}
            </Text>
            {reports.map((report) => (
              <ToolIndicator
                key={report.tool}
                report={report}
              />
            ))}
          </Group>
        )
      })}
      <Group justify='flex-end'>
        <ActionIcon
          aria-label='Dismiss ecosystem status panel'
          onClick={() => setDismissed(true)}
          size='xs'
          variant='subtle'
        >
          <IconX size={12} />
        </ActionIcon>
      </Group>
    </Stack>
  )
}
