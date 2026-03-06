// Mock @deephaven/plugin package
const PluginActual = jest.requireActual('@deephaven/plugin');

module.exports = {
  ...PluginActual,
  useDashboardPlugins: jest.fn(() => []),
  __esModule: true,
};
