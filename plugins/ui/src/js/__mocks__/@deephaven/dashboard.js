// Mock LayoutUtils, useListener, and PanelEvent from @deephaven/dashboard package
const mockLayout = {
  root: {
    contentItems: [],
    addChild: jest.fn(config => ({
      ...config,
      contentItems: [],
      setSize: jest.fn(),
    })),
    setSize: jest.fn(),
  },
  eventHub: {
    on: jest.fn(),
    off: jest.fn(),
  },
  createContentItem: jest.fn(() => ({
    setSize: jest.fn(),
    contentItems: [],
    addChild: jest.fn(),
  })),
};

const DashboardActual = jest.requireActual('@deephaven/dashboard');

// Mock Dashboard component that provides a layout manager context
// and calls onLayoutInitialized immediately
const MockDashboard = ({ children, onLayoutInitialized }) => {
  const React = require('react');
  React.useEffect(() => {
    if (onLayoutInitialized) {
      onLayoutInitialized();
    }
  }, [onLayoutInitialized]);
  return React.createElement(
    DashboardActual.LayoutManagerContext.Provider,
    { value: mockLayout },
    children
  );
};

module.exports = {
  ...DashboardActual,
  Dashboard: MockDashboard,
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
