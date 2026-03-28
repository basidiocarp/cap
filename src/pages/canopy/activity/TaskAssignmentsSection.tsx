import { Divider, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { timeAgo } from '../../../lib/time'

export function TaskAssignmentsSection({ assignments }: { assignments: CanopyTaskDetail['assignments'] }) {
  return (
    <>
      <Divider label='Assignments' />
      {assignments.length > 0 ? (
        <Stack gap='xs'>
          {assignments.map((assignment) => (
            <SectionCard
              key={assignment.assignment_id}
              p='sm'
            >
              <Stack gap={4}>
                <Text size='sm'>
                  {assignment.assigned_by} → {assignment.assigned_to}
                </Text>
                <Text
                  c='dimmed'
                  size='sm'
                >
                  {timeAgo(assignment.assigned_at, { allowMonths: true })}
                </Text>
                {assignment.reason ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Reason: {assignment.reason}
                  </Text>
                ) : null}
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      ) : (
        <EmptyState>No assignments recorded for this task yet.</EmptyState>
      )}
    </>
  )
}
