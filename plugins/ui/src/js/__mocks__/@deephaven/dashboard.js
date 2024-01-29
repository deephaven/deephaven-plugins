// Mock LayoutUtils, useListener, and PanelEvent from @deephaven/dashboard package
const mockLayout = { root: { contentItems: [] }, eventHub: {} };

const DashboardActual = jest.requireActual('@deephaven/dashboard');
module.exports = {
  ...DashboardActual,
  LayoutUtils: {
    getComponentName: jest.fn(),
    openComponent: jest.fn(),
    closeComponent: jest.fn(),
  },
  useLayoutManager: jest.fn(() => mockLayout),
  useListener: jest.fn(),
  __esModule: true,
  default: jest.fn(),
};
