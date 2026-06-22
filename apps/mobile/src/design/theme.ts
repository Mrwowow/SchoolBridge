/**
 * src/design/theme.ts
 * Design tokens ported from the SchoolBridge mockup (data.jsx themeVars).
 * The mockup used OKLCH + color-mix CSS; React Native needs concrete values,
 * so each token is resolved to its rendered hex/rgba equivalent.
 */

export interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  muted2: string;
  border: string;
  border2: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  primaryInk: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  red: string;
  redSoft: string;
  scrim: string;
  // shadow (RN style fragments)
  shadow: object;
  shadowSm: object;
}

const PRIMARY = '#2F6BFF';

export const lightTheme: Theme = {
  bg: '#F4F6FB', // oklch(0.972 0.008 255)
  surface: '#FFFFFF',
  surface2: '#F7F9FC', // oklch(0.975 0.009 255)
  text: '#2A3242', // oklch(0.27 0.03 262)
  muted: '#6B7480', // oklch(0.52 0.025 260)
  muted2: '#98A1AD', // oklch(0.66 0.02 260)
  border: 'rgba(17,24,39,0.08)',
  border2: 'rgba(17,24,39,0.05)',
  primary: PRIMARY,
  onPrimary: '#FFFFFF',
  primarySoft: '#E9EFFF', // primary 11% on white
  primaryInk: '#0E2C7A', // primary 78% on black
  green: '#1F9D6B', // oklch(0.58 0.13 158)
  greenSoft: '#E3F5EE',
  amber: '#D9920B', // oklch(0.7 0.13 70)
  amberSoft: '#FBF1DC',
  red: '#D6453B', // oklch(0.6 0.18 25)
  redSoft: '#FBE6E4',
  scrim: 'rgba(17,24,39,0.4)',
  shadow: {
    shadowColor: '#111827',
    shadowOpacity: 0.09,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  shadowSm: {
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export const darkTheme: Theme = {
  bg: '#181A20',
  surface: '#23262E',
  surface2: '#2A2E37',
  text: '#F2F3F5',
  muted: '#A9B0BB',
  muted2: '#7C828C',
  border: 'rgba(255,255,255,0.09)',
  border2: 'rgba(255,255,255,0.06)',
  primary: PRIMARY,
  onPrimary: '#FFFFFF',
  primarySoft: '#2A3553',
  primaryInk: '#A9C0FF',
  green: '#3FD18B',
  greenSoft: '#1F3A33',
  amber: '#E7B24D',
  amberSoft: '#3A331F',
  red: '#E76A5E',
  redSoft: '#3A2522',
  scrim: 'rgba(0,0,0,0.55)',
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
};

/** Tone helper — maps a semantic tone name to {fg, soft} colors. */
export type Tone = 'primary' | 'green' | 'amber' | 'red';

export function toneColors(theme: Theme, tone: Tone): { fg: string; soft: string } {
  switch (tone) {
    case 'green':
      return { fg: theme.green, soft: theme.greenSoft };
    case 'amber':
      return { fg: theme.amber, soft: theme.amberSoft };
    case 'red':
      return { fg: theme.red, soft: theme.redSoft };
    default:
      return { fg: theme.primary, soft: theme.primarySoft };
  }
}
