export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  primary: '#000000',
  primaryLight: '#27272A',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
} as const;

export const lightColors = {
  background: palette.white,
  surface: palette.gray50,
  text: palette.gray900,
  textMuted: palette.gray500,
  border: palette.gray200,
  primary: palette.primary,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
} as const;

export const darkColors = {
  background: palette.gray900,
  surface: palette.gray800,
  text: palette.white,
  textMuted: palette.gray400,
  border: palette.gray700,
  primary: palette.white,
  danger: palette.danger,
  success: palette.success,
  warning: palette.warning,
} as const;

export type ThemeColors = typeof lightColors;

// "Helping Humanity" brand palette — used by the auth screens, and anywhere
// else the brand look is applied. Kept separate from the neutral palette
// above so `color` props (icons, etc.) can reference the exact hex NativeWind
// classes like `bg-teal` / `text-clay` resolve to (see tailwind.config.js).
export const brand = {
  ink: '#0A1E3D',
  inkSoft: '#5A6B85',
  paper: '#F8F6F0',
  line: '#E3DFD2',
  teal: '#0B3B78',
  tealSoft: '#E1E8F2',
  marigold: '#E8B923',
  marigoldSoft: '#FBF0CE',
  clay: '#E0201F',
  claySoft: '#FBDEDD',
  leaf: '#1C7A54',
  leafSoft: '#DDF0E6',
  purple: '#5C3F82',
  purpleSoft: '#EAE2F2',
} as const;
