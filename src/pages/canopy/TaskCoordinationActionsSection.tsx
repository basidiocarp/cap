import { Button, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'

import type {
  CanopyAgentRegistration,
  CanopyCouncilMessageType,
  CanopyEvidenceSourceKind,
  CanopyHandoffType,
  CanopyTaskDetail,
} from '../../lib/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'

const HANDOFF_TYPE_OPTIONS: { label: string; value: CanopyHandoffType }[] = [
  { label: 'Request help', value: 'request_help' },
  { label: 'Request review', value: 'request_review' },
  { label: 'Transfer ownership', value: 'transfer_ownership' },
  { label: 'Request verification', value: 'request_verification' },
  { label: 'Record decision', value: 'record_decision' },
  { label: 'Close task', value: 'close_task' },
]

const MESSAGE_TYPE_OPTIONS: { label: string; value: CanopyCouncilMessageType }[] = [
  { label: 'Proposal', value: 'proposal' },
  { label: 'Objection', value: 'objection' },
  { label: 'Evidence', value: 'evidence' },
  { label: 'Decision', value: 'decision' },
  { label: 'Handoff', value: 'handoff' },
  { label: 'Status', value: 'status' },
]

const EVIDENCE_SOURCE_OPTIONS: { label: string; value: CanopyEvidenceSourceKind }[] = [
  { label: 'Hyphae session', value: 'hyphae_session' },
  { label: 'Hyphae recall', value: 'hyphae_recall' },
  { label: 'Hyphae outcome', value: 'hyphae_outcome' },
  { label: 'Cortina event', value: 'cortina_event' },
  { label: 'Mycelium command', value: 'mycelium_command' },
  { label: 'Mycelium explain', value: 'mycelium_explain' },
  { label: 'Rhizome impact', value: 'rhizome_impact' },
  { label: 'Rhizome export', value: 'rhizome_export' },
  { label: 'Manual note', value: 'manual_note' },
]

export function TaskCoordinationActionsSection({ agents, detail }: { agents: CanopyAgentRegistration[]; detail: CanopyTaskDetail }) {
  const taskActionMutation = useCanopyTaskAction()
  const allowedKinds = useMemo(() => new Set(detail.allowed_actions.map((action) => action.kind)), [detail.allowed_actions])
  const agentOptions = useMemo(
    () =>
      agents.map((agent) => ({
        label: `${agent.agent_id} · ${agent.host_type} · ${agent.model}`,
        value: agent.agent_id,
      })),
    [agents]
  )

  const [handoffFromAgentId, setHandoffFromAgentId] = useState<string | null>(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
  const [handoffToAgentId, setHandoffToAgentId] = useState<string | null>(agents[0]?.agent_id ?? null)
  const [handoffType, setHandoffType] = useState<CanopyHandoffType>('request_review')
  const [handoffSummary, setHandoffSummary] = useState('')
  const [requestedAction, setRequestedAction] = useState('')
  const [handoffDueAt, setHandoffDueAt] = useState('')
  const [handoffExpiresAt, setHandoffExpiresAt] = useState('')

  const [authorAgentId, setAuthorAgentId] = useState<string | null>(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
  const [messageType, setMessageType] = useState<CanopyCouncilMessageType>('status')
  const [messageBody, setMessageBody] = useState('')

  const [evidenceSourceKind, setEvidenceSourceKind] = useState<CanopyEvidenceSourceKind>('manual_note')
  const [evidenceSourceRef, setEvidenceSourceRef] = useState('')
  const [evidenceLabel, setEvidenceLabel] = useState('')
  const [evidenceSummary, setEvidenceSummary] = useState('')
  const [relatedHandoffId, setRelatedHandoffId] = useState<string | null>(null)
  const [relatedSessionId, setRelatedSessionId] = useState('')
  const [relatedMemoryQuery, setRelatedMemoryQuery] = useState('')
  const [relatedSymbol, setRelatedSymbol] = useState('')
  const [relatedFile, setRelatedFile] = useState('')

  const [followUpTitle, setFollowUpTitle] = useState('')
  const [followUpDescription, setFollowUpDescription] = useState('')

  useEffect(() => {
    const defaultFromAgentId = detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null
    const defaultToAgentId = agents.find((agent) => agent.agent_id !== defaultFromAgentId)?.agent_id ?? agents[0]?.agent_id ?? null

    setHandoffFromAgentId(defaultFromAgentId)
    setHandoffToAgentId(defaultToAgentId)
    setHandoffType('request_review')
    setHandoffSummary('')
    setRequestedAction('')
    setHandoffDueAt('')
    setHandoffExpiresAt('')

    setAuthorAgentId(defaultFromAgentId)
    setMessageType('status')
    setMessageBody('')

    setEvidenceSourceKind('manual_note')
    setEvidenceSourceRef('')
    setEvidenceLabel('')
    setEvidenceSummary('')
    setRelatedHandoffId(null)
    setRelatedSessionId('')
    setRelatedMemoryQuery('')
    setRelatedSymbol('')
    setRelatedFile('')

    setFollowUpTitle('')
    setFollowUpDescription('')
  }, [agents, detail])

  const handoffOptions = useMemo(
    () =>
      detail.handoffs.map((handoff) => ({
        label: `${handoff.handoff_id} · ${handoff.summary}`,
        value: handoff.handoff_id,
      })),
    [detail.handoffs]
  )
  const isPending = taskActionMutation.isPending
  const mutationError = taskActionMutation.error instanceof Error ? taskActionMutation.error : null

  return (
    <Stack gap='md'>
      <ErrorAlert error={mutationError} />

      {allowedKinds.has('create_handoff') ? (
        <Stack gap='xs'>
          <Text fw={600}>Create handoff</Text>
          <Group align='end'>
            <Select
              data={agentOptions}
              disabled={isPending}
              flex={1}
              label='From agent'
              onChange={setHandoffFromAgentId}
              searchable
              value={handoffFromAgentId}
            />
            <Select
              data={agentOptions}
              disabled={isPending}
              flex={1}
              label='To agent'
              onChange={setHandoffToAgentId}
              searchable
              value={handoffToAgentId}
            />
            <Select
              data={HANDOFF_TYPE_OPTIONS}
              disabled={isPending}
              label='Type'
              onChange={(value) => {
                if (value) setHandoffType(value as CanopyHandoffType)
              }}
              value={handoffType}
            />
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Handoff summary'
            minRows={2}
            onChange={(event) => setHandoffSummary(event.currentTarget.value)}
            placeholder='Describe the requested coordination step'
            value={handoffSummary}
          />
          <TextInput
            disabled={isPending}
            label='Requested action'
            onChange={(event) => setRequestedAction(event.currentTarget.value)}
            placeholder='Optional concrete ask for the receiving agent'
            value={requestedAction}
          />
          <Group align='end'>
            <TextInput
              disabled={isPending}
              flex={1}
              label='Due at'
              onChange={(event) => setHandoffDueAt(event.currentTarget.value)}
              placeholder='Optional RFC3339 timestamp'
              value={handoffDueAt}
            />
            <TextInput
              disabled={isPending}
              flex={1}
              label='Expires at'
              onChange={(event) => setHandoffExpiresAt(event.currentTarget.value)}
              placeholder='Optional RFC3339 timestamp'
              value={handoffExpiresAt}
            />
            <Button
              disabled={!handoffFromAgentId || !handoffToAgentId || !handoffSummary.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'create_handoff',
                  changed_by: TASK_OPERATOR_ACTOR,
                  due_at: handoffDueAt.trim() || undefined,
                  expires_at: handoffExpiresAt.trim() || undefined,
                  from_agent_id: handoffFromAgentId ?? undefined,
                  handoff_summary: handoffSummary.trim(),
                  handoff_type: handoffType,
                  requested_action: requestedAction.trim() || undefined,
                  taskId: detail.task.task_id,
                  to_agent_id: handoffToAgentId ?? undefined,
                })
              }
            >
              Create handoff
            </Button>
          </Group>
        </Stack>
      ) : null}

      {allowedKinds.has('summon_council_session') ? (
        <Stack gap='xs'>
          <Text fw={600}>Summon council</Text>
          <Text
            c='dimmed'
            size='sm'
          >
            Open a task-linked council session with the fixed reviewer and architect roles.
          </Text>
          <Group justify='flex-end'>
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'summon_council_session',
                  changed_by: TASK_OPERATOR_ACTOR,
                  taskId: detail.task.task_id,
                })
              }
            >
              Summon council
            </Button>
          </Group>
        </Stack>
      ) : null}

      {allowedKinds.has('post_council_message') ? (
        <Stack gap='xs'>
          <Text fw={600}>Post council message</Text>
          <Group align='end'>
            <Select
              data={agentOptions}
              disabled={isPending}
              flex={1}
              label='Author agent'
              onChange={setAuthorAgentId}
              searchable
              value={authorAgentId}
            />
            <Select
              data={MESSAGE_TYPE_OPTIONS}
              disabled={isPending}
              label='Message type'
              onChange={(value) => {
                if (value) setMessageType(value as CanopyCouncilMessageType)
              }}
              value={messageType}
            />
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Message body'
            minRows={3}
            onChange={(event) => setMessageBody(event.currentTarget.value)}
            placeholder='Record the proposal, decision, or status update'
            value={messageBody}
          />
          <Group justify='flex-end'>
            <Button
              disabled={!authorAgentId || !messageBody.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'post_council_message',
                  author_agent_id: authorAgentId ?? undefined,
                  changed_by: TASK_OPERATOR_ACTOR,
                  message_body: messageBody.trim(),
                  message_type: messageType,
                  taskId: detail.task.task_id,
                })
              }
            >
              Post message
            </Button>
          </Group>
        </Stack>
      ) : null}

      {allowedKinds.has('attach_evidence') ? (
        <Stack gap='xs'>
          <Text fw={600}>Attach evidence</Text>
          <Group align='end'>
            <Select
              data={EVIDENCE_SOURCE_OPTIONS}
              disabled={isPending}
              label='Source kind'
              onChange={(value) => {
                if (value) setEvidenceSourceKind(value as CanopyEvidenceSourceKind)
              }}
              value={evidenceSourceKind}
            />
            <TextInput
              disabled={isPending}
              flex={1}
              label='Source ref'
              onChange={(event) => setEvidenceSourceRef(event.currentTarget.value)}
              placeholder='Session id, command id, export id, or note key'
              value={evidenceSourceRef}
            />
            <TextInput
              disabled={isPending}
              flex={1}
              label='Label'
              onChange={(event) => setEvidenceLabel(event.currentTarget.value)}
              placeholder='Short operator-facing label'
              value={evidenceLabel}
            />
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Evidence summary'
            minRows={2}
            onChange={(event) => setEvidenceSummary(event.currentTarget.value)}
            placeholder='Optional note about why this evidence matters'
            value={evidenceSummary}
          />
          <Group align='end'>
            <Select
              clearable
              data={handoffOptions}
              disabled={isPending}
              flex={1}
              label='Related handoff'
              onChange={setRelatedHandoffId}
              searchable
              value={relatedHandoffId}
            />
            <TextInput
              disabled={isPending}
              flex={1}
              label='Related session id'
              onChange={(event) => setRelatedSessionId(event.currentTarget.value)}
              placeholder='Optional Hyphae session id'
              value={relatedSessionId}
            />
          </Group>
          <Group align='end'>
            <TextInput
              disabled={isPending}
              flex={1}
              label='Related memory query'
              onChange={(event) => setRelatedMemoryQuery(event.currentTarget.value)}
              placeholder='Optional memory search query'
              value={relatedMemoryQuery}
            />
            <TextInput
              disabled={isPending}
              flex={1}
              label='Related symbol'
              onChange={(event) => setRelatedSymbol(event.currentTarget.value)}
              placeholder='Optional symbol name'
              value={relatedSymbol}
            />
            <TextInput
              disabled={isPending}
              flex={1}
              label='Related file'
              onChange={(event) => setRelatedFile(event.currentTarget.value)}
              placeholder='Optional file path'
              value={relatedFile}
            />
            <Button
              disabled={!evidenceSourceRef.trim() || !evidenceLabel.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'attach_evidence',
                  changed_by: TASK_OPERATOR_ACTOR,
                  evidence_label: evidenceLabel.trim(),
                  evidence_source_kind: evidenceSourceKind,
                  evidence_source_ref: evidenceSourceRef.trim(),
                  evidence_summary: evidenceSummary.trim() || undefined,
                  related_file: relatedFile.trim() || undefined,
                  related_handoff_id: relatedHandoffId ?? undefined,
                  related_memory_query: relatedMemoryQuery.trim() || undefined,
                  related_session_id: relatedSessionId.trim() || undefined,
                  related_symbol: relatedSymbol.trim() || undefined,
                  taskId: detail.task.task_id,
                })
              }
            >
              Attach evidence
            </Button>
          </Group>
        </Stack>
      ) : null}

      {allowedKinds.has('create_follow_up_task') ? (
        <Stack gap='xs'>
          <Text fw={600}>Create follow-up task</Text>
          <TextInput
            disabled={isPending}
            label='Title'
            onChange={(event) => setFollowUpTitle(event.currentTarget.value)}
            placeholder='Name the next coordination task'
            value={followUpTitle}
          />
          <Textarea
            autosize
            disabled={isPending}
            label='Description'
            minRows={2}
            onChange={(event) => setFollowUpDescription(event.currentTarget.value)}
            placeholder='Optional task detail carried into the follow-up'
            value={followUpDescription}
          />
          <Group justify='flex-end'>
            <Button
              disabled={!followUpTitle.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'create_follow_up_task',
                  changed_by: TASK_OPERATOR_ACTOR,
                  follow_up_description: followUpDescription.trim() || undefined,
                  follow_up_title: followUpTitle.trim(),
                  taskId: detail.task.task_id,
                })
              }
            >
              Create follow-up
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Stack>
  )
}
