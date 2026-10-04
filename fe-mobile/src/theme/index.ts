import { darkColors, lightColors } from './colors';
import { spacing, radius } from './spacing';
import { fontSize, fontWeight } from './typography';
import { shadows } from './shadows';

export { palette, lightColors, darkColors, brand } from './colors';
export type { ThemeColors } from './colors';
export { spacing, radius } from './spacing';
export { fontSize, fontWeight } from './typography';
export { shadows } from './shadows';

export const themes = {
  light: { colors: lightColors, spacing, radius, fontSize, fontWeight, shadows },
  dark: { colors: darkColors, spacing, radius, fontSize, fontWeight, shadows },
} as const;

export type ThemeMode = keyof typeof themes;
export type Theme = (typeof themes)[ThemeMode];
