// Mock LayoutUtils, useListener, and PanelEvent from @deephaven/dashboard package
const mockLayout = {
  root: { contentItems: [], addChild: jest.fn() },
  eventHub: {},
  createContentItem: jest.fn(() => ({ setSize: jest.fn() })),
};

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
