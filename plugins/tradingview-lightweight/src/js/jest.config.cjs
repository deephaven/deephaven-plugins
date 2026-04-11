const path = require('path');
const baseConfig = require('../../../../jest.config.base.cjs');

module.exports = {
  ...baseConfig,
  displayName: '@deephaven/js-plugin-tradingview-lightweight',
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^lightweight-charts$': path.join(
      __dirname,
      'src/__mocks__/lightweight-charts.js'
    ),
  },
};
