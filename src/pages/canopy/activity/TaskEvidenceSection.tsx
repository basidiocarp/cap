import { Badge, Button, Divider, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { evidenceLinks } from '../canopy-formatters'

export function TaskEvidenceSection({ evidence }: { evidence: CanopyTaskDetail['evidence'] }) {
  return (
    <>
      <Divider label='Evidence' />
      {evidence.length > 0 ? (
        <Stack gap='xs'>
          {evidence.map((item) => {
            const links = evidenceLinks(item)

            return (
              <SectionCard
                key={item.evidence_id}
                p='sm'
              >
                <Stack gap={4}>
                  <Group gap='xs'>
                    <Badge
                      color='teal'
                      size='xs'
                      variant='light'
                    >
                      {item.source_kind}
                    </Badge>
                    <Text fw={500}>{item.label}</Text>
                  </Group>
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    {item.source_ref}
                  </Text>
                  {item.summary ? <Text size='sm'>{item.summary}</Text> : null}
                  {links.length > 0 ? (
                    <Group gap='xs'>
                      {links.map((link) => (
                        <Button
                          component={Link}
                          key={`${item.evidence_id}-${link.label}`}
                          size='xs'
                          to={link.to}
                          variant='subtle'
                        >
                          {link.label}
                        </Button>
                      ))}
                    </Group>
                  ) : null}
                </Stack>
              </SectionCard>
            )
          })}
        </Stack>
      ) : (
        <EmptyState>No evidence attached to this task.</EmptyState>
      )}
    </>
  )
}
