import type { EcosystemStatus } from '../../lib/api'
import { ProjectContextSummary } from '../../components/ProjectContextSummary'
import { SectionCard } from '../../components/SectionCard'

export function StatusProjectContextCard({ status }: { status: EcosystemStatus }) {
  return (
    <SectionCard title='Project context'>
      <ProjectContextSummary
        activeProject={status.project.active}
        mode='detailed'
        note='Switch here before checking Rhizome status if you want the dashboard to inspect a different repo or worktree.'
        recentProjects={status.project.recent}
      />
    </SectionCard>
  )
}
