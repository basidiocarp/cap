import type { ReactNode } from 'react'
import { Badge, Group, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../lib/api'
import type { HostCoverageMode } from '../lib/readiness'
import { getHostCoverageView } from '../lib/readiness'
import { CoveragePreferenceControl } from './CoveragePreferenceControl'
import { ProjectContextSummary } from './ProjectContextSummary'

interface HostCoveragePanelProps {
  children?: ReactNode
  mode: HostCoverageMode
  onModeChange: (mode: HostCoverageMode) => void
  showProjectContext?: boolean
  status: EcosystemStatus
  summary?: ReactNode
}

export function HostCoveragePanel({ children, mode, onModeChange, showProjectContext = false, status, summary }: HostCoveragePanelProps) {
  const hostCoverage = getHostCoverageView(status, mode)

  return (
    <Stack gap='sm'>
      <Group justify='space-between'>
        <Text
          c='dimmed'
          size='sm'
        >
          {hostCoverage.detail}
        </Text>
        <Badge
          color='gray'
          size='sm'
          variant='light'
        >
          {hostCoverage.label}
        </Badge>
      </Group>

      {summary}

      <CoveragePreferenceControl
        onChange={onModeChange}
        value={mode}
      />

      {showProjectContext && (
        <ProjectContextSummary
          activeProject={status.project.active}
          recentProjects={status.project.recent}
        />
      )}

      {children}
    </Stack>
  )
}
