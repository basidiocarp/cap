import type { StipeDoctorCheck } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { IssueCard } from './IssueCard'

export function OnboardDetectedIssuesSection({ checks }: { checks: StipeDoctorCheck[] }) {
  if (checks.length === 0) {
    return null
  }

  return (
    <SectionCard title='Detected issues'>
      {checks.map((check) => (
        <IssueCard
          check={check}
          key={check.name}
        />
      ))}
    </SectionCard>
  )
}
