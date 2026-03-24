import { Badge, Group, Stack, Text } from '@mantine/core'

import { useProjectContextView } from '../store/project-context'
import { ProjectSelector } from './ProjectSelector'

interface ProjectContextSummaryProps {
  activeProject?: string
  mode?: 'compact' | 'detailed'
  note?: string
  recentProjects?: string[]
  selectorFullWidth?: boolean
}

export function ProjectContextSummary({
  activeProject,
  mode = 'compact',
  note,
  recentProjects = [],
  selectorFullWidth = false,
}: ProjectContextSummaryProps) {
  const projectContext = useProjectContextView(activeProject ? { active: activeProject, recent: recentProjects } : null)
  const resolvedActiveProject = projectContext.activeProject
  const recent = projectContext.recentProjects.filter((project) => project !== resolvedActiveProject)

  if (!resolvedActiveProject) return null

  return (
    <Stack gap='sm'>
      <Group
        align='start'
        justify='space-between'
      >
        <div style={{ flex: 1 }}>
          <Text
            c='dimmed'
            size='xs'
          >
            Active project
          </Text>
          <Text
            ff='monospace'
            size='sm'
          >
            {resolvedActiveProject}
          </Text>
        </div>
        <ProjectSelector
          fullWidth={selectorFullWidth}
          variant='button'
        />
      </Group>

      {note ? (
        <Text
          c='dimmed'
          size='sm'
        >
          {note}
        </Text>
      ) : null}

      {mode === 'detailed' ? (
        recent.length > 0 ? (
          <div>
            <Text
              c='dimmed'
              mb={6}
              size='xs'
            >
              Recent projects
            </Text>
            <Group gap='xs'>
              {recent.slice(0, 4).map((project) => (
                <Badge
                  color='gray'
                  key={project}
                  size='sm'
                  variant='outline'
                >
                  {project}
                </Badge>
              ))}
            </Group>
          </div>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No other recent project contexts recorded yet.
          </Text>
        )
      ) : null}
    </Stack>
  )
}
