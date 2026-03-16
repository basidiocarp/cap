import { mergeThemeOverrides } from '@mantine/core';

import { buttonStyles } from './button';
import { textStyles } from './text';

export const allComponentStyles = mergeThemeOverrides(buttonStyles, textStyles);

export { buttonStyles } from './button';
export { textStyles } from './text';
