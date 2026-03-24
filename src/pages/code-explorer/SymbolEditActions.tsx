import { Alert, Button, Group, SegmentedControl, Stack, Text, TextInput } from '@mantine/core'
import { IconArrowsMove, IconCopy, IconEdit, IconInfoCircle } from '@tabler/icons-react'

type EditAction = 'copy' | 'move' | 'rename'

interface SymbolEditActionsProps {
  actionBusy: boolean
  activeAction: EditAction | null
  activeError: string | null
  canSubmitCopyMove: boolean
  canSubmitRename: boolean
  copyPending: boolean
  lastResult: string | null
  movePending: boolean
  onApplyCopyMove: (action: 'copy' | 'move') => void
  onApplyRename: () => void
  onCancel: () => void
  onChangePosition: (value: 'before' | 'after') => void
  onChangeRenameValue: (value: string) => void
  onChangeTargetFile: (value: string) => void
  onChangeTargetSymbol: (value: string) => void
  onToggleAction: (action: EditAction) => void
  position: 'before' | 'after'
  renamePending: boolean
  renameValue: string
  targetFile: string
  targetSymbol: string
}

export function SymbolEditActions({
  actionBusy,
  activeAction,
  activeError,
  canSubmitCopyMove,
  canSubmitRename,
  copyPending,
  lastResult,
  movePending,
  onApplyCopyMove,
  onApplyRename,
  onCancel,
  onChangePosition,
  onChangeRenameValue,
  onChangeTargetFile,
  onChangeTargetSymbol,
  onToggleAction,
  position,
  renamePending,
  renameValue,
  targetFile,
  targetSymbol,
}: SymbolEditActionsProps) {
  return (
    <Stack gap='xs'>
      <Group gap='xs'>
        <Button
          leftSection={<IconEdit size={14} />}
          onClick={() => onToggleAction('rename')}
          size='xs'
          variant={activeAction === 'rename' ? 'filled' : 'light'}
        >
          Rename
        </Button>
        <Button
          leftSection={<IconCopy size={14} />}
          onClick={() => onToggleAction('copy')}
          size='xs'
          variant={activeAction === 'copy' ? 'filled' : 'light'}
        >
          Copy
        </Button>
        <Button
          leftSection={<IconArrowsMove size={14} />}
          onClick={() => onToggleAction('move')}
          size='xs'
          variant={activeAction === 'move' ? 'filled' : 'light'}
        >
          Move
        </Button>
      </Group>

      {lastResult && (
        <Alert
          color='green'
          icon={<IconInfoCircle size={16} />}
          variant='light'
        >
          <Text size='sm'>{lastResult}</Text>
        </Alert>
      )}

      {activeError && (
        <Alert
          color='red'
          icon={<IconInfoCircle size={16} />}
          variant='light'
        >
          <Text size='sm'>{activeError}</Text>
        </Alert>
      )}

      {activeAction === 'rename' && (
        <Stack gap='xs'>
          <Text
            c='dimmed'
            size='xs'
          >
            Rename this symbol in place. The update is delegated to Rhizome&apos;s symbol rename workflow.
          </Text>
          <TextInput
            label='New symbol name'
            onChange={(event) => onChangeRenameValue(event.currentTarget.value)}
            placeholder='newSymbolName'
            value={renameValue}
          />
          <Group gap='xs'>
            <Button
              disabled={!canSubmitRename || actionBusy}
              loading={renamePending}
              onClick={onApplyRename}
              size='xs'
            >
              Apply rename
            </Button>
            <Button
              onClick={onCancel}
              size='xs'
              variant='subtle'
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      )}

      {(activeAction === 'copy' || activeAction === 'move') && (
        <Stack gap='xs'>
          <Text
            c='dimmed'
            size='xs'
          >
            {activeAction === 'move'
              ? 'Move this symbol relative to another symbol. Same-file moves may be rejected by Rhizome in this MVP.'
              : 'Copy this symbol relative to another symbol in the target file.'}
          </Text>
          <TextInput
            label='Target file'
            onChange={(event) => onChangeTargetFile(event.currentTarget.value)}
            placeholder='src/example.ts'
            value={targetFile}
          />
          <TextInput
            label='Target symbol'
            onChange={(event) => onChangeTargetSymbol(event.currentTarget.value)}
            placeholder='ExistingTargetSymbol'
            value={targetSymbol}
          />
          <SegmentedControl
            data={[
              { label: 'Before', value: 'before' },
              { label: 'After', value: 'after' },
            ]}
            onChange={(value) => onChangePosition(value as 'before' | 'after')}
            size='xs'
            value={position}
          />
          <Group gap='xs'>
            <Button
              disabled={!canSubmitCopyMove || actionBusy}
              loading={activeAction === 'copy' ? copyPending : movePending}
              onClick={() => onApplyCopyMove(activeAction)}
              size='xs'
            >
              {activeAction === 'copy' ? 'Copy symbol' : 'Move symbol'}
            </Button>
            <Button
              onClick={onCancel}
              size='xs'
              variant='subtle'
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  )
}
