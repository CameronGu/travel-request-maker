import { tokens } from './styles/tokens';

import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: tokens.light.colors,
      boxShadow: tokens.light.shadows,
      borderRadius: {
        DEFAULT: tokens.light.radius,
      },
      fontFamily: {
        sans: [tokens.light.fonts.sans],
        serif: [tokens.light.fonts.serif],
        mono: [tokens.light.fonts.mono],
      },
    },
  },
  plugins: [],
} satisfies Config;
