/**
 * The design tokens. The old theme had four colours and five breakpoints, so
 * every component reached for a hardcoded hex instead — these exist so that
 * stops happening.
 */
export const theme = {
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
  colors: {
    background: '#0f1117',
    surface: '#181b24',
    surfaceRaised: '#20242f',
    border: '#2b3040',
    text: '#e8eaf0',
    textMuted: '#a7b0c4',
    primary: '#6366f1',
    primaryHover: '#818cf8',
    accent: '#22d3ee',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    onPrimary: '#ffffff',

    /** One place for the rarity palette — cards, badges and borders all read it. */
    rarity: {
      common: '#9aa4b8',
      rare: '#38bdf8',
      epic: '#c084fc',
      legendary: '#fbbf24',
    },
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
    xxl: '64px',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    pill: '999px',
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '28px',
    xxl: '40px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.35)',
    lg: '0 16px 48px rgba(0, 0, 0, 0.45)',
  },
  transitions: {
    fast: '120ms ease',
    base: '220ms ease',
  },
  zIndices: {
    dropdown: 10,
    header: 20,
    toast: 40,
  },
} as const;

export type ITheme = typeof theme;
export type IBreakpointsName = keyof ITheme['breakpoints'];

export const media = {
  up: (size: IBreakpointsName) => `@media (min-width: ${theme.breakpoints[size]}px)`,
  down: (size: IBreakpointsName) => `@media (max-width: ${theme.breakpoints[size] - 1}px)`,
};
