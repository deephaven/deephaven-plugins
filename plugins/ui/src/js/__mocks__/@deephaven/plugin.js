// Mock @deephaven/plugin package
const React = require('react');
const PluginActual = jest.requireActual('@deephaven/plugin');

module.exports = {
  ...PluginActual,
  useDashboardPlugins: jest.fn(() => []),
  // Mock usePersistentState to behave like useState.
  // The real implementation requires FiberProvider which is internal to Dashboard.
  usePersistentState: (initialState, _config) => React.useState(initialState),
  __esModule: true,
};
