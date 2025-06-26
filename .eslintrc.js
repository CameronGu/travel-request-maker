module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'next',
    'next/typescript',
    'prettier',
  ],
  ignorePatterns: ['.next/**', 'node_modules/**'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // Guard-rails
    'max-lines': [
      'warn',
      { max: 300, skipComments: true, skipBlankLines: true },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9a-f]{3,6}$/i]',
        message:
          'Use Tailwind semantic token classes instead of raw HEX colours.',
      },
    ],
    // Import hygiene
    'import/order': [
      'warn',
      {
        groups: [
          'type',
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'error',
    'import/newline-after-import': 'warn',
    // Misc
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_' },
    ],
  },
}; 