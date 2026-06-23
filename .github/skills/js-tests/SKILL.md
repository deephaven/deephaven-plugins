---
name: js-tests
description: Run JavaScript/TypeScript Jest unit tests. Use when asked to run JS tests, Jest tests, or frontend unit tests.
---

# Running JS Tests

Uses Jest. Run from repo root.

## Commands

```bash
# Run all unit tests
npm run test:unit

# Run tests for specific plugin
npm run test:unit -- --testPathPattern="plugins/ui"

# Run specific test file
npm run test:unit -- plugins/ui/src/js/src/layout/LayoutUtils.test.tsx

# Run tests matching name
npm run test:unit -- --testNamePattern="should render"

# Run lint tests
npm run test:lint
```

## Watch mode (during development)

```bash
npm run test -- --testPathPattern="plugins/ui"
```

## Notes

- Run `npm install` first if dependencies not installed
- Test files are `*.test.tsx` or `*.test.ts` in `plugins/*/src/js/`
