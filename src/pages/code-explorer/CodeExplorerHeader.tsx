import { Group, Text, Title } from '@mantine/core'

import { ProjectContextSummary } from '../../components/ProjectContextSummary'

interface CodeExplorerHeaderProps {
  activeProject: string | null
  projectName: string
  recentProjects: string[]
}

export function CodeExplorerHeader({ activeProject, projectName, recentProjects }: CodeExplorerHeaderProps) {
  return (
    <>
      <Group justify='space-between'>
        <Title order={2}>Code Explorer</Title>
      </Group>

      {activeProject ? (
        <ProjectContextSummary
          activeProject={activeProject}
          note={`Exploring symbols and structure in ${projectName}.`}
          recentProjects={recentProjects}
        />
      ) : (
        <Text
          c='dimmed'
          size='sm'
        >
          Exploring symbols and structure in {projectName}
        </Text>
      )}
    </>
  )
}
