module.exports = {
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}'],
      rules: { '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] }
    },
    {
      files: ['src/scripts/**/*.js'],
      rules: { 'no-console': 'off' }
    }
  ],
}; 