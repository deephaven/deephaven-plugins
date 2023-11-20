const baseConfig = require('./jest.config.base.cjs');

module.exports = {
  ...baseConfig,
  projects: ['<rootDir>/plugins/*/src/js/jest.config.cjs'],
};
