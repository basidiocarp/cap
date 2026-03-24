import { Badge, Group, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import { ProjectSelector } from '../../components/ProjectSelector'
import { SectionCard } from '../../components/SectionCard'

export function StatusProjectContextCard({ status }: { status: EcosystemStatus }) {
  const recentProjects = status.project.recent.filter((project) => project !== status.project.active)

  return (
    <SectionCard title='Project context'>
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
              {status.project.active}
            </Text>
          </div>
          <ProjectSelector variant='button' />
        </Group>

        <div>
          <Text
            c='dimmed'
            size='xs'
          >
            Workspace notes
          </Text>
          <Text
            c='dimmed'
            size='sm'
          >
            Switch here before checking Rhizome status if you want the dashboard to inspect a different repo or worktree.
          </Text>
        </div>

        {recentProjects.length > 0 ? (
          <div>
            <Text
              c='dimmed'
              mb={6}
              size='xs'
            >
              Recent projects
            </Text>
            <Group gap='xs'>
              {recentProjects.slice(0, 4).map((project) => (
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
        )}
      </Stack>
    </SectionCard>
  )
}
