import { themes } from './styles/tokens';

import type { Config } from 'tailwindcss';

// Pick the active theme (claymorphism for now)
const activeTheme = themes.claymorphism;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: activeTheme.colors,
      boxShadow: activeTheme.shadows,
      borderRadius: {
        DEFAULT: activeTheme.radius,
      },
      fontFamily: {
        sans: [activeTheme.fonts.sans],
        serif: [activeTheme.fonts.serif],
        mono: [activeTheme.fonts.mono],
      },
    },
  },
  plugins: [],
} satisfies Config;
