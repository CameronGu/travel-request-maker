module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(test).js?(x)'],
  testPathIgnorePatterns: ['/tests/.*\\.spec\\.js$', '/tests-examples/.*\\.spec\\.js$'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}; 