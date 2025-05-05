# Travel Request Maker

## Testing

This project uses [Jest](https://jestjs.io/) for automated testing.

### Automated Test Hooks

This project uses Git hooks to ensure code quality:

- **Pre-commit**: Automatically runs linting and tests on staged files before each commit
- **Post-merge**: Runs tests after pulling changes to catch any issues from upstream

These hooks are managed by [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged).

### Test Commands

- `npm test` — Run all tests once
- `npm run test:watch` — Run tests in watch mode (re-runs on file changes)
- `npm run test:coverage` — Run all tests and generate a coverage report in the `coverage/` directory

### Running Tests in Cursor

- Cursor IDE natively supports Jest. You can run and debug tests directly from the IDE using the built-in test runner or by running the above commands in the integrated terminal.

### Test Structure

- All test files for modules in `src/js/` are located in `src/js/__tests__/` and follow the `<module>.test.js` naming convention.
- See `src/js/__tests__/README.md` for more details on test structure and conventions.
