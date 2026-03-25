import { SegmentedControl } from '@mantine/core'

import type { HostCoverageMode } from '../lib/readiness'

interface CoveragePreferenceControlProps {
  onChange: (mode: HostCoverageMode) => void
  value: HostCoverageMode
}

export function CoveragePreferenceControl({ onChange, value }: CoveragePreferenceControlProps) {
  return (
    <SegmentedControl
      aria-label='Coverage preference'
      data={[
        { label: 'Auto', value: 'auto' },
        { label: 'Codex focus', value: 'codex' },
        { label: 'Claude focus', value: 'claude' },
        { label: 'Both', value: 'both' },
      ]}
      onChange={(nextValue) => onChange(nextValue as HostCoverageMode)}
      size='xs'
      value={value}
    />
  )
}
