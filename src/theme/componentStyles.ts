import { mergeThemeOverrides } from '@mantine/core'

import { buttonStyles } from './components/button'
import { textStyles } from './components/text'

export const themeComponentStyles = mergeThemeOverrides(buttonStyles, textStyles)
