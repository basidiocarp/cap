import { ScrollArea, Stack, Title } from '@mantine/core'

import type { FileTreeState } from '../../hooks/useFileTreeState'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'
import { FileTreeNode } from './FileTreeNode'

interface CodeExplorerSidebarProps {
  fileTree: FileTreeState
  onSelect: (filePath: string) => void
}

export function CodeExplorerSidebar({ fileTree, onSelect }: CodeExplorerSidebarProps) {
  return (
    <SectionCard miw={280}>
      <Title
        mb='sm'
        order={5}
      >
        Files
      </Title>
      <ScrollArea h={600}>
        {fileTree.rootNodes.length > 0 ? (
          <Stack gap={0}>
            {fileTree.rootNodes.map((node) => (
              <FileTreeNode
                expanded={fileTree.expanded}
                fileTree={fileTree.fileTree}
                key={node.path}
                level={0}
                node={node}
                onExpand={fileTree.handleExpand}
                onSelect={onSelect}
                selectedFile={fileTree.selectedFile}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState>No files found</EmptyState>
        )}
      </ScrollArea>
    </SectionCard>
  )
}
