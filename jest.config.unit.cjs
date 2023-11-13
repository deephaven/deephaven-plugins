const baseConfig = require('./jest.config.base.cjs');

module.exports = {
  ...baseConfig,
  projects: ['<rootDir>/plugins/*/src/js/jest.config.cjs'],
  collectCoverage: process.env.CI === 'true',
  collectCoverageFrom: ['./src/**/*.{js,ts,jsx,tsx}'], // This is relative to individual project root due to how Jest handles it
  coverageDirectory: './coverage',
};
