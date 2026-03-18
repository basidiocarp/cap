import { ActionIcon, Combobox, Group, Text, TextInput, useCombobox } from '@mantine/core'
import { IconFolder, IconFolderOpen } from '@tabler/icons-react'
import { useState } from 'react'

import { useProject, useSwitchProject } from '../lib/queries'

function basename(path: string): string {
  return path.split('/').pop() ?? path
}

export function ProjectSelector() {
  const { data: project } = useProject()
  const switchProject = useSwitchProject()
  const combobox = useCombobox()
  const [customPath, setCustomPath] = useState('')

  if (!project) return null

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

  return (
    <Combobox
      onOptionSubmit={handleSelect}
      store={combobox}
    >
      <Combobox.Target>
        <ActionIcon
          color='mycelium'
          loading={switchProject.isPending}
          onClick={() => combobox.toggleDropdown()}
          size='lg'
          title={`Project: ${project.active}`}
          variant='subtle'
        >
          <IconFolder size={20} />
        </ActionIcon>
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
          {project.recent.map((path) => (
            <Combobox.Option
              key={path}
              value={path}
            >
              <Group gap='xs'>
                <IconFolderOpen size={14} />
                <div>
                  <Text
                    fw={path === project.active ? 600 : 400}
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
