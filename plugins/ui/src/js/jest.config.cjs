const path = require('path');
const baseConfig = require('../../../../jest.config.base.cjs');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  displayName: packageJson.name,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Force all react imports to the local React 18 to avoid dual-instance issues
    // with the root workspace's React 17.
    '^react$': path.resolve(__dirname, 'node_modules/react'),
    '^react/(.*)$': path.resolve(__dirname, 'node_modules/react/$1'),
    '^react-dom$': path.resolve(__dirname, 'node_modules/react-dom'),
    '^react-dom/(.*)$': path.resolve(__dirname, 'node_modules/react-dom/$1'),
  },
};
