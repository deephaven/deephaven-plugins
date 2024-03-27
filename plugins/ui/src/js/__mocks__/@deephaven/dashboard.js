// Mock LayoutUtils, useListener, and PanelEvent from @deephaven/dashboard package
const mockLayout = {
  root: { contentItems: [], addChild: jest.fn() },
  eventHub: {
    on: jest.fn(),
    off: jest.fn(),
  },
  createContentItem: jest.fn(() => ({ setSize: jest.fn() })),
};

const DashboardActual = jest.requireActual('@deephaven/dashboard');
module.exports = {
  ...DashboardActual,
  LayoutUtils: {
    getComponentName: jest.fn(),
    getContentItemInStack: jest.fn(),
    getStackForConfig: jest.fn(),
    getIdFromContainer: DashboardActual.LayoutUtils.getIdFromContainer,
    openComponent: jest.fn(),
    closeComponent: jest.fn(),
  },
  useLayoutManager: jest.fn(() => mockLayout),
  useListener: jest.fn(),
  __esModule: true,
  default: jest.fn(),
};
