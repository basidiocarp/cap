import { Button, Group, Select, Stack, Textarea } from '@mantine/core'

import type { CanopyVerificationState } from '../../lib/api'
import type { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'
const REVIEW_OUTCOME_OPTIONS: { label: string; value: Exclude<CanopyVerificationState, 'unknown'> }[] = [
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
]

interface Props {
  allowedKinds: Set<string>
  assignableAgents: { label: string; value: string }[]
  decisionAuthorAgentId: string | null
  decisionBody: string
  isPending: boolean
  reviewOutcome: Extract<CanopyVerificationState, 'failed' | 'pending'>
  reviewSummary: string
  setDecisionAuthorAgentId: (value: string | null) => void
  setDecisionBody: (value: string) => void
  setReviewOutcome: (value: Extract<CanopyVerificationState, 'failed' | 'pending'>) => void
  setReviewSummary: (value: string) => void
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskId: string
}

export function TaskReviewActionsSection({
  allowedKinds,
  assignableAgents,
  decisionAuthorAgentId,
  decisionBody,
  isPending,
  reviewOutcome,
  reviewSummary,
  setDecisionAuthorAgentId,
  setDecisionBody,
  setReviewOutcome,
  setReviewSummary,
  taskActionMutation,
  taskId,
}: Props) {
  return (
    <>
      {allowedKinds.has('verify_task') ? (
        <Stack gap='xs'>
          <Group align='end'>
            <Select
              data={REVIEW_OUTCOME_OPTIONS}
              disabled={isPending}
              label='Verification outcome'
              onChange={(value) => {
                if (value) setReviewOutcome(value as Extract<CanopyVerificationState, 'failed' | 'pending'>)
              }}
              value={reviewOutcome}
            />
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'verify_task',
                  changed_by: TASK_OPERATOR_ACTOR,
                  note: reviewSummary.trim() || undefined,
                  taskId,
                  verification_state: reviewOutcome,
                })
              }
            >
              Record review
            </Button>
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Review note'
            minRows={2}
            onChange={(event) => setReviewSummary(event.currentTarget.value)}
            placeholder='Capture what still needs work before completion'
            value={reviewSummary}
          />
        </Stack>
      ) : null}

      {allowedKinds.has('record_decision') ? (
        <Stack gap='xs'>
          <Group align='end'>
            <Select
              data={assignableAgents}
              disabled={isPending}
              flex={1}
              label='Decision author'
              onChange={(value) => setDecisionAuthorAgentId(value)}
              placeholder='Choose an agent'
              searchable
              value={decisionAuthorAgentId}
            />
            <Button
              disabled={!decisionAuthorAgentId || !decisionBody.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'record_decision',
                  author_agent_id: decisionAuthorAgentId ?? undefined,
                  changed_by: TASK_OPERATOR_ACTOR,
                  message_body: decisionBody.trim(),
                  taskId,
                })
              }
            >
              Record decision
            </Button>
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Decision body'
            minRows={2}
            onChange={(event) => setDecisionBody(event.currentTarget.value)}
            placeholder='Capture the review decision that moves this task into closeout'
            value={decisionBody}
          />
        </Stack>
      ) : null}
    </>
  )
}
