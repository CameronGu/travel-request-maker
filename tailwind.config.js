/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', fg: '#fff' },
        secondary: { DEFAULT: '#f3f4f6', fg: '#1f2937' },
        muted: '#6b7280',
        destructive: '#dc2626',

        // 🟩 Required for ShadCN components
        border: '#e5e7eb',
        input: '#f9fafb',
        ring: '#3b82f6',
        background: '#ffffff',
        foreground: '#000000'
      }
    }
  },
  plugins: []
};
