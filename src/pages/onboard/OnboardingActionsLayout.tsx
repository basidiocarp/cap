import { Grid } from '@mantine/core'

import type { OnboardingAction, OnboardingActionGroups } from '../../lib/onboarding'
import { OnboardingActionSection } from './OnboardingActionSection'

interface OnboardingActionsLayoutProps {
  groups: OnboardingActionGroups
  onRun: (action: OnboardingAction) => void
  optionalCoverageTitle: string
  recentlyRan: (action: OnboardingAction) => boolean
  requiredCoverageTitle: string
  running: (action: OnboardingAction) => boolean
}

export function OnboardingActionsLayout({
  groups,
  onRun,
  optionalCoverageTitle,
  recentlyRan,
  requiredCoverageTitle,
  running,
}: OnboardingActionsLayoutProps) {
  const {
    manual: manualActions,
    optionalClaude: optionalClaudeActions,
    optionalCore: otherOptionalActions,
    primary: primaryActions,
  } = groups

  return (
    <>
      {primaryActions.length > 0 && (
        <OnboardingActionSection
          actions={primaryActions}
          emptyMessage='No required coverage steps are needed right now.'
          onRun={onRun}
          recentlyRan={recentlyRan}
          running={running}
          title={requiredCoverageTitle}
        />
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <OnboardingActionSection
            actions={optionalClaudeActions}
            emptyMessage='No optional host coverage steps are needed right now.'
            onRun={onRun}
            recentlyRan={recentlyRan}
            running={running}
            title={optionalCoverageTitle}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <OnboardingActionSection
            actions={otherOptionalActions}
            emptyMessage='No extra profiles are needed right now.'
            onRun={onRun}
            recentlyRan={recentlyRan}
            running={running}
            title='Other optional profiles'
          />
        </Grid.Col>
      </Grid>

      <OnboardingActionSection
        actions={manualActions}
        emptyMessage='No direct tool installs are needed right now.'
        onRun={onRun}
        recentlyRan={recentlyRan}
        running={running}
        title='Required tool installs'
      />
    </>
  )
}
