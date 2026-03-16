import type { ButtonProps } from '@mantine/core';

import { Button, createTheme } from '@mantine/core';

export type CustomButtonVariant =
  | 'filled'
  | 'outline'
  | 'subtle'
  | 'grayOutline'
  | 'whiteOutline'
  | 'menuItem'
  | 'menuItemCompact'
  | 'noStyle'
  | 'navLink'
  | 'toggle'
  | 'toggleActive'
  | 'helpFab'
  | 'roundedToggle'
  | 'roundedToggleActive';

interface ExtendedButtonProps extends ButtonProps {
  variant?: CustomButtonVariant;
}

export const buttonStyles = createTheme({
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'md',
      },
      styles: (_theme, props) => {
        const p = props as ExtendedButtonProps;

        const baseStyles = {
          fontSize: '1rem',
          fontWeight: 500,
          letterSpacing: '1.6px',
          minHeight: '2.8125rem',
          padding: '0.5em 1.5em',
          textTransform: 'uppercase' as const,
          transition: 'background-color 100ms ease-in-out, border-color 100ms ease-in-out, color 100ms ease-in-out',
        };

        switch (p.variant) {
          case 'menuItem':
            return {
              root: {
                ...baseStyles,
                display: 'flex',
                fontSize: '0.875rem',
                fontWeight: 400,
                height: 'var(--button-height)',
                letterSpacing: 0,
                minHeight: 'auto',
                padding: '0.4375em 1em',
                textTransform: 'capitalize' as const,
              },
            };
          case 'menuItemCompact':
            return {
              root: {
                ...baseStyles,
                display: 'flex',
                fontSize: '0.875rem',
                fontWeight: 400,
                height: 'var(--button-height)',
                letterSpacing: 0,
                minHeight: 'auto',
                padding: '0.4375em 0em',
                textTransform: 'capitalize' as const,
              },
            };
          case 'noStyle':
            return {
              root: {
                ...baseStyles,
                height: 'auto',
                padding: 0,
              },
            };
          case 'navLink':
            return {
              root: {
                ...baseStyles,
                background: 'transparent',
                border: 'none',
                padding: 0,
              },
            };
          case 'toggle':
          case 'toggleActive':
            return {
              root: {
                ...baseStyles,
                height: '2.9em',
                width: '100%',
              },
            };
          case 'helpFab':
            return {
              root: {
                ...baseStyles,
                bottom: 0,
                gap: '8px',
                letterSpacing: '0.1rem',
                position: 'absolute' as const,
                right: 0,
                transition: 'all ease-in-out 250ms',
              },
            };
          case 'roundedToggle':
            return {
              root: {
                ...baseStyles,
                fontWeight: 500,
                letterSpacing: 0,
                padding: '0 2rem',
                textTransform: 'capitalize' as const,
              },
            };
          case 'roundedToggleActive':
            return {
              root: {
                ...baseStyles,
                fontWeight: 500,
                height: '3rem',
                letterSpacing: 0,
                padding: '0 2rem',
                textTransform: 'capitalize' as const,
              },
            };
          default:
            return { root: baseStyles };
        }
      },
      vars: (_theme, props) => {
        const p = props as ExtendedButtonProps;

        switch (p.variant) {
          case 'grayOutline':
            return {
              root: {
                '--button-bd': '1px solid var(--mantine-color-gray-9)',
                '--button-bg': 'transparent',
                '--button-color': 'var(--mantine-color-gray-9)',
                '--button-hover': 'rgba(85, 85, 85, 0.05)',
                '--button-hover-color': 'var(--mantine-color-gray-9)',
              },
            };
          case 'whiteOutline':
            return {
              root: {
                '--button-bd': '1px solid var(--mantine-color-white)',
                '--button-bg': 'transparent',
                '--button-color': 'var(--mantine-color-white)',
                '--button-hover': 'rgba(255, 255, 255, 0.1)',
              },
            };
          case 'menuItem':
            return {
              root: {
                '--button-bd': 'none',
                '--button-bg': 'transparent',
                '--button-color': 'var(--mantine-color-gray-9)',
                '--button-fz': 'var(--mantine-font-size-sm)',
                '--button-height': 'var(--button-height-sm)',
                '--button-hover': 'transparent',
                '--button-hover-color': 'var(--mantine-color-sinopia-5)',
                '--button-padding-x': '1em',
                '--button-padding-y': '0.4375em',
              },
            };
          case 'menuItemCompact':
            return {
              root: {
                '--button-bd': 'none',
                '--button-bg': 'transparent',
                '--button-color': 'var(--mantine-color-gray-9)',
                '--button-height': 'var(--button-height-sm)',
                '--button-hover': 'transparent',
                '--button-hover-color': 'var(--mantine-color-sinopia-5)',
                '--button-padding-x': '0',
                '--button-padding-y': '0.4375em',
              },
            };
          case 'noStyle':
            return {
              root: {
                '--button-bg': 'transparent',
                '--button-color': 'var(--mantine-color-gray-9)',
                '--button-height': 'auto',
                '--button-hover': 'transparent',
                '--button-padding-x': '0',
              },
            };
          case 'navLink':
            return {
              root: {
                '--button-bd': 'none',
                '--button-bg': 'transparent',
                '--button-padding-x': '0',
              },
            };
          case 'toggle':
            return {
              root: {
                '--button-bd': '1px solid var(--mantine-color-gray-6)',
                '--button-bg': 'transparent',
                '--button-color': 'var(--mantine-color-gray-9)',
                '--button-height': '2.9em',
                '--button-hover': 'transparent',
                '--button-hover-color': 'var(--mantine-color-sinopia-5)',
                '--button-radius': '0.5em',
              },
            };
          case 'toggleActive':
            return {
              root: {
                '--button-bd': '1px solid var(--mantine-color-sinopia-5)',
                '--button-bg': 'var(--mantine-color-sinopia-5)',
                '--button-color': 'white',
                '--button-height': '2.9em',
                '--button-radius': '0.5em',
              },
            };
          case 'helpFab':
            return {
              root: {
                '--button-bg': 'var(--mantine-color-navy-5)',
                '--button-color': 'white',
                '--button-height': '3rem',
                '--button-hover': 'var(--mantine-color-navy-4)',
                '--button-padding-x': '24px',
                '--button-radius': '50vh',
              },
            };
          case 'roundedToggle':
            return {
              root: {
                '--button-bd': '1px solid var(--mantine-color-gray-9)',
                '--button-bg': 'var(--mantine-color-white)',
                '--button-color': 'var(--mantine-color-gray-9)',
                '--button-hover': 'rgba(47, 47, 47, 0.05)',
                '--button-padding-x': '2rem',
                '--button-radius': '2rem',
              },
            };
          case 'roundedToggleActive':
            return {
              root: {
                '--button-bd': '1px solid var(--mantine-color-sinopia-5)',
                '--button-bg': 'var(--mantine-color-sinopia-5)',
                '--button-color': 'var(--mantine-color-white)',
                '--button-hover': '#E64D00',
                '--button-padding-x': '2rem',
                '--button-radius': '2rem',
              },
            };
          case 'light':
          case 'subtle':
          case 'outline':
          case 'transparent':
          case 'white':
            return {
              root: {
                '--button-hover': 'var(--mantine-color-sinopia-5)',
                '--button-hover-color': 'var(--mantine-color-white)',
              },
            };
          case 'default':
            return {
              root: {
                '--button-hover': 'var(--mantine-color-default-hover)',
                '--button-hover-color': 'var(--mantine-color-default-color)',
              },
            };
          case 'filled':
            return {
              root: {
                '--button-hover': '#E64D00',
              },
            };
          default:
            return { root: {} };
        }
      },
    }),
  },
});
