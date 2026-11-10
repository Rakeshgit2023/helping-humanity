/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Slightly larger than Tailwind defaults (+1px) for readability on all screens.
      fontSize: {
        xs: ['13px', { lineHeight: '18px' }],
        sm: ['15px', { lineHeight: '21px' }],
        base: ['17px', { lineHeight: '24px' }],
        lg: ['19px', { lineHeight: '26px' }],
        xl: ['22px', { lineHeight: '28px' }],
        '2xl': ['26px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '38px' }],
      },
      colors: {
        ink: '#0A1E3D',
        'ink-soft': '#5A6B85',
        paper: '#F8F6F0',
        line: '#E3DFD2',
        teal: { DEFAULT: '#0B3B78', soft: '#E1E8F2' },
        marigold: { DEFAULT: '#E8B923', soft: '#FBF0CE' },
        clay: { DEFAULT: '#E0201F', soft: '#FBDEDD' },
        leaf: { DEFAULT: '#1C7A54', soft: '#DDF0E6' },
        purple: { DEFAULT: '#5C3F82', soft: '#EAE2F2' },
      },
    },
  },
  plugins: [],
};
