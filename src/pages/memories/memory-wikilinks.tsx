import { Anchor } from '@mantine/core'
import type { ReactNode } from 'react'

/**
 * Renders text with clickable wikilink tokens [[target]].
 * Non-matching spans are returned as plain strings.
 * Each [[target]] becomes a clickable Anchor button.
 * Empty/whitespace-only targets are treated as literal text.
 */
export function renderWithWikilinks(text: string, onNavigate: (target: string) => void): ReactNode[] {
  const parts: ReactNode[] = []
  // `[^\]]*` deliberately stops at the first `]`, so a target containing `]`
  // (e.g. `[[foo]bar]]`) won't match and falls through to literal text. Hyphae
  // memory slugs are generated and never contain `]`, so this is safe.
  const regex = /\[\[([^\]]*)\]\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Extract target and check if it's non-empty
    const target = match[1].trim()

    if (target) {
      // Add clickable link. The list is parsed once and never reordered, so a
      // positional key is stable for this render — React's documented-safe case.
      parts.push(
        <Anchor
          key={parts.length}
          component="button"
          onClick={() => onNavigate(target)}
          type="button"
        >
          {target}
        </Anchor>
      )
    } else {
      // Empty target: render as literal text
      parts.push(match[0])
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}
