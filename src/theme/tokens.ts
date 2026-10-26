/**
 * Threadtone design tokens — black/white glass, one accent. A near-black
 * canvas, chalk-white text, translucent surfaces. No emoji anywhere in the
 * UI; every icon is a vector drawn in src/ui/icons.tsx.
 */
import type { TextStyle } from 'react-native';

export const color = {
  bg: '#0A0B0D',
  surface1: '#121316',
  surface2: '#191B1F',
  surface3: '#222428',
  border: '#2B2E33',
  hair: '#1E2024',

  text1: '#F7F8F8',
  text2: '#A3A8AE',
  text3: '#6B7076',

  // The one accent color used for primary actions and selection state.
  accent: '#EDEFF2',
  accentFg: '#0A0B0D',

  positive: '#5FCF8E',
  negative: '#E2685F',
  warning: '#E0B15B',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.6 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6 },
  caption: { fontSize: 13, fontWeight: '400' as const },
} satisfies Record<string, TextStyle>;

/** Minimum thumb-safe tap target. */
export const TAP_TARGET = 44;
