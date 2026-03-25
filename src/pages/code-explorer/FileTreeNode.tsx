import { NavLink } from '@mantine/core'
import { IconFile, IconFolder, IconFolderOpen } from '@tabler/icons-react'

import type { FileNode } from '../../lib/api'
import { onActivate } from '../../lib/keyboard'

interface FileTreeNodeProps {
  expanded: Set<string>
  fileTree: Map<string, FileNode[]>
  level: number
  node: FileNode
  onExpand: (path: string) => void
  onSelect: (path: string) => void
  selectedFile: string | null
}

export function FileTreeNode({ expanded, fileTree, level, node, onExpand, onSelect, selectedFile }: FileTreeNodeProps) {
  const isDir = node.type === 'dir'
  const isExpanded = expanded.has(node.path)
  const children = fileTree.get(node.path)

  return (
    <>
      <NavLink
        active={!isDir && selectedFile === node.path}
        aria-current={!isDir && selectedFile === node.path ? 'page' : undefined}
        aria-expanded={isDir ? isExpanded : undefined}
        label={node.name}
        leftSection={isDir ? isExpanded ? <IconFolderOpen size={16} /> : <IconFolder size={16} /> : <IconFile size={16} />}
        onClick={() => (isDir ? onExpand(node.path) : onSelect(node.path))}
        onKeyDown={onActivate(() => (isDir ? onExpand(node.path) : onSelect(node.path)))}
        opened={isDir ? isExpanded : undefined}
        style={{ paddingLeft: level * 12 }}
        tabIndex={0}
      />
      {isDir &&
        isExpanded &&
        children?.map((child) => (
          <FileTreeNode
            expanded={expanded}
            fileTree={fileTree}
            key={child.path}
            level={level + 1}
            node={child}
            onExpand={onExpand}
            onSelect={onSelect}
            selectedFile={selectedFile}
          />
        ))}
    </>
  )
}
