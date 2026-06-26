const path = require('path');
const baseConfig = require('../../../../jest.config.base.cjs');

module.exports = {
  ...baseConfig,
  displayName: '@deephaven/js-plugin-tradingview-lightweight',
  // The Playwright e2e specs under e2e/ are *.spec.ts (jest's default glob
  // would otherwise collect them); they import @playwright/test and need a
  // live server, so they belong to `npm run test:e2e`, not jest.
  testPathIgnorePatterns: [...(baseConfig.testPathIgnorePatterns ?? []), '/e2e/'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^lightweight-charts$': path.join(
      __dirname,
      'src/__mocks__/lightweight-charts.js'
    ),
    // Vite's `?inline` CSS import has no meaning under jest — stub to a string.
    '\\.css\\?inline$': path.join(__dirname, 'src/__mocks__/styleMock.js'),
  },
  setupFilesAfterEach: [
    ...(baseConfig.setupFilesAfterEach ?? []),
    path.join(__dirname, 'jest.setup.ts'),
  ],
  setupFiles: [
    ...(baseConfig.setupFiles ?? []),
    path.join(__dirname, 'jest.setup.ts'),
  ],
};
