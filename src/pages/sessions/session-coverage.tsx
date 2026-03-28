import type { ReactNode } from 'react'
import { Badge, Group, Stack, Text } from '@mantine/core'

import type { AllowedStipeAction } from '../../lib/onboarding'
import type { EcosystemReadinessModel, ReadinessQuickAction } from '../../lib/readiness'
import type { EcosystemStatus, RhizomeStatus, SessionTimelineRecord } from '../../lib/types'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { ReadinessQuickActions } from '../../components/ReadinessQuickActions'
import { SectionCard } from '../../components/SectionCard'
import { getToolQuickActions } from '../../lib/readiness'

export interface CoverageIssue {
  actions: ReadinessQuickAction[]
  description: string
  hint?: string
  title: string
}

export function buildCoverageIssues(
  commandCount: number,
  readiness: EcosystemReadinessModel | null,
  sessions: SessionTimelineRecord[],
  status: EcosystemStatus | undefined
): CoverageIssue[] {
  if (!readiness || !status) {
    return []
  }

  const issues: CoverageIssue[] = []

  if (!status.hyphae.available) {
    issues.push({
      actions: readiness.recommendedQuickActions,
      description: 'Hyphae is unavailable, so Cap cannot show structured session timelines for this project yet.',
      hint: 'Restore Hyphae first, then refresh this page to populate session activity and recall/outcome events.',
      title: 'Hyphae coverage needs attention',
    })
  } else if (sessions.length === 0) {
    issues.push({
      actions: getToolQuickActions('hyphae', readiness, status),
      description: 'No Hyphae sessions are currently in scope for the active project context.',
      hint: 'This usually means no structured session start/end and recall/outcome data has been recorded for the selected project yet.',
      title: 'No Hyphae sessions in scope yet',
    })
  }

  if (!status.mycelium.available) {
    issues.push({
      actions: readiness.recommendedQuickActions,
      description: 'Mycelium is unavailable, so Sessions cannot join command filtering and savings data into the operator timeline.',
      hint: 'Install or repair Mycelium, then refresh to recover project-scoped command history for each session window.',
      title: 'Mycelium coverage needs attention',
    })
  } else if (commandCount === 0) {
    issues.push({
      actions: getToolQuickActions('mycelium', readiness, status),
      description: 'No Mycelium commands matched the active project scope yet.',
      hint: 'The session cards will show filtered command history after Mycelium records activity for this project path.',
      title: 'No Mycelium command history in scope yet',
    })
  }

  if (!status.rhizome.available) {
    issues.push({
      actions: readiness.recommendedQuickActions,
      description: 'Rhizome is unavailable, so the session header cannot confirm code-intelligence backend health for this project.',
      hint: 'Repair or install Rhizome to restore backend visibility before moving into deeper operator and Canopy work.',
      title: 'Rhizome coverage needs attention',
    })
  }

  return issues
}

function CoverageIssueCard({
  actionIsRunning,
  issue,
  onRefresh,
  onRun,
}: {
  actionIsRunning: (actionKey?: AllowedStipeAction) => boolean
  issue: CoverageIssue
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
}) {
  return (
    <ActionEmptyState
      actions={
        <ReadinessQuickActions
          actionIsRunning={actionIsRunning}
          actions={issue.actions}
          onRefresh={onRefresh}
          onRun={onRun}
        />
      }
      description={issue.description}
      hint={issue.hint}
      title={issue.title}
    />
  )
}

export function ToolContextCard({
  actionIsRunning,
  commandCount,
  coverageIssues,
  onRefresh,
  onRun,
  projectPath,
  rhizomeStatus,
  stipeFeedback,
}: {
  actionIsRunning: (actionKey?: AllowedStipeAction) => boolean
  commandCount: number
  coverageIssues: CoverageIssue[]
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
  projectPath: string | null
  rhizomeStatus: RhizomeStatus | undefined
  stipeFeedback: ReactNode
}) {
  return (
    <SectionCard title='Tool Context'>
      <Stack gap='sm'>
        <Group gap='sm'>
          {projectPath ? (
            <Badge
              color='gray'
              size='lg'
              variant='outline'
            >
              {projectPath}
            </Badge>
          ) : null}
          <Badge
            color='mycelium'
            size='lg'
            variant='light'
          >
            {commandCount} Mycelium commands in scope
          </Badge>
          <Badge
            color={rhizomeStatus?.available ? 'green' : 'gray'}
            size='lg'
            variant='light'
          >
            Rhizome {rhizomeStatus?.available ? (rhizomeStatus.backend ?? 'available') : 'unavailable'}
          </Badge>
          {rhizomeStatus?.available ? (
            <Badge
              color='blue'
              size='lg'
              variant='light'
            >
              {rhizomeStatus.languages.length} languages
            </Badge>
          ) : null}
        </Group>
        <Text
          c='dimmed'
          size='sm'
        >
          The session timeline below is joined with project-scoped Mycelium command history. Rhizome status is shown here so you can see the
          current code-intelligence backend while reading session activity.
        </Text>
        {coverageIssues.length > 0 ? (
          <Stack gap='sm'>
            {coverageIssues.map((issue) => (
              <CoverageIssueCard
                actionIsRunning={actionIsRunning}
                issue={issue}
                key={issue.title}
                onRefresh={onRefresh}
                onRun={onRun}
              />
            ))}
            {stipeFeedback}
          </Stack>
        ) : null}
      </Stack>
    </SectionCard>
  )
}
