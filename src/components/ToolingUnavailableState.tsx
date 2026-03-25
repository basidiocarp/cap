import type { ReactNode } from 'react'
import { Button } from '@mantine/core'
import { Link } from 'react-router-dom'

import { ActionEmptyState } from './ActionEmptyState'

interface ToolingUnavailableStateProps {
  description: ReactNode
  hint: ReactNode
  includeOnboardingLink?: boolean
  includeSettingsLink?: boolean
  includeStatusLink?: boolean
  onRetry: () => void
  retryLabel: string
  title: ReactNode
}

export function ToolingUnavailableState({
  description,
  hint,
  includeOnboardingLink = true,
  includeSettingsLink = true,
  includeStatusLink = true,
  onRetry,
  retryLabel,
  title,
}: ToolingUnavailableStateProps) {
  return (
    <ActionEmptyState
      actions={
        <>
          <Button
            onClick={onRetry}
            size='xs'
            variant='light'
          >
            {retryLabel}
          </Button>
          {includeStatusLink && (
            <Button
              component={Link}
              size='xs'
              to='/status'
              variant='subtle'
            >
              Open status
            </Button>
          )}
          {includeOnboardingLink && (
            <Button
              component={Link}
              size='xs'
              to='/onboard'
              variant='subtle'
            >
              Open onboarding
            </Button>
          )}
          {includeSettingsLink && (
            <Button
              component={Link}
              size='xs'
              to='/settings'
              variant='subtle'
            >
              Open settings
            </Button>
          )}
        </>
      }
      description={description}
      hint={hint}
      title={title}
    />
  )
}
