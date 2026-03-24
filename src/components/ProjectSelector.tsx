import { ActionIcon, Button, Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core'
import { IconFolder, IconFolderOpen } from '@tabler/icons-react'
import { useState } from 'react'

import { useProject, useSwitchProject } from '../lib/queries'
import { useProjectContextView } from '../store/project-context'

function basename(path: string): string {
  return path.split('/').pop() ?? path
}

export function ProjectSelector({ fullWidth = false, variant = 'icon' }: { fullWidth?: boolean; variant?: 'button' | 'icon' }) {
  const { data: project } = useProject()
  const switchProject = useSwitchProject()
  const combobox = useCombobox()
  const [customPath, setCustomPath] = useState('')
  const { activeProject, isSwitchingProject, recentProjects } = useProjectContextView(project)

  if (!activeProject) return null

  const handleSelect = (path: string) => {
    switchProject.mutate(path)
    combobox.closeDropdown()
  }

  const handleSubmitCustom = () => {
    const trimmed = customPath.trim()
    if (trimmed) {
      switchProject.mutate(trimmed)
      setCustomPath('')
      combobox.closeDropdown()
    }
  }

  const activeBasename = basename(activeProject)

  return (
    <Combobox
      onOptionSubmit={handleSelect}
      store={combobox}
    >
      <Combobox.Target>
        {variant === 'button' ? (
          <Button
            justify='space-between'
            leftSection={<IconFolder size={16} />}
            loading={isSwitchingProject || switchProject.isPending}
            onClick={() => combobox.toggleDropdown()}
            rightSection={<IconFolderOpen size={14} />}
            size='sm'
            title={`Project: ${activeProject}`}
            variant='light'
            w={fullWidth ? '100%' : undefined}
          >
            {activeBasename}
          </Button>
        ) : (
          <ActionIcon
            color='mycelium'
            loading={isSwitchingProject || switchProject.isPending}
            onClick={() => combobox.toggleDropdown()}
            size='lg'
            title={`Project: ${activeProject}`}
            variant='subtle'
          >
            <IconFolder size={20} />
          </ActionIcon>
        )}
      </Combobox.Target>

      <Combobox.Dropdown maw={500}>
        <Combobox.Header>
          <Text
            fw={500}
            size='sm'
          >
            Switch Project
          </Text>
        </Combobox.Header>

        <Combobox.Options>
          {recentProjects.map((path) => (
            <Combobox.Option
              key={path}
              value={path}
            >
              <Group gap='xs'>
                <IconFolderOpen size={14} />
                <div>
                  <Text
                    fw={path === activeProject ? 600 : 400}
                    size='sm'
                  >
                    {basename(path)}
                  </Text>
                  <Text
                    c='dimmed'
                    ff='monospace'
                    size='xs'
                  >
                    {path}
                  </Text>
                </div>
              </Group>
            </Combobox.Option>
          ))}
        </Combobox.Options>

        <Combobox.Footer>
          <TextInput
            leftSection={<IconFolder size={14} />}
            onChange={(e) => setCustomPath(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmitCustom()
              }
            }}
            placeholder='Enter project path...'
            size='xs'
            value={customPath}
          />
        </Combobox.Footer>
      </Combobox.Dropdown>
    </Combobox>
  )
}
