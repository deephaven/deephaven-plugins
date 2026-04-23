import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import {
  LayoutManagerContext,
  useLayoutManager,
  type WidgetDescriptor,
} from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import NestedDashboard from './NestedDashboard';
import { ReactPanelContext, usePanelId } from './ReactPanelContext';
import { ReactPanelManagerContext } from './ReactPanelManager';
import WidgetStatusContext, { type WidgetStatus } from './WidgetStatusContext';

// Mock the child layout components to avoid GoldenLayout complexity
jest.mock('./LayoutUtils', () => ({
  ...jest.requireActual('./LayoutUtils'),
  normalizeDashboardChildren: (children: React.ReactNode) => children,
}));

// Mock usePersistentState which requires FiberProvider context
// Mock Dashboard which requires Redux Provider
jest.mock('@deephaven/dashboard', () => {
  const actual = jest.requireActual('@deephaven/dashboard');
  const react = jest.requireActual('react');
  return {
    ...actual,
    Dashboard: function MockDashboard({
      children,
      onLayoutInitialized,
    }: {
      children: React.ReactNode;
      onLayoutInitialized?: () => void;
    }) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      react.useEffect(() => {
        onLayoutInitialized?.();
      }, [onLayoutInitialized]);
      return react.createElement('div', null, children);
    },
    useLayoutManager: jest.fn(),
    usePersistentState: (initialValue: unknown) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [state, setState] = react.useState(initialValue);
      return [state, setState];
    },
  };
});

// Mock useDashboardPlugins which requires PluginsContext
jest.mock('@deephaven/plugin', () => {
  const actual = jest.requireActual('@deephaven/plugin');
  return {
    ...actual,
    usePlugins: () => new Map(),
    useDashboardPlugins: () => null,
  };
});

const mockLayout = {
  root: {
    contentItems: [],
    addChild: jest.fn(),
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

const mockWidgetStatus: WidgetStatus = {
  status: 'ready',
  descriptor: TestUtils.createMockProxy<WidgetDescriptor>({
    id: 'test-widget',
    type: 'test',
    name: 'Test Widget',
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useLayoutManager as jest.Mock).mockReturnValue(mockLayout);
});

/**
 * Helper component that reads the panel ID from context
 */
function PanelIdReader(): JSX.Element {
  const panelId = usePanelId();
  return <div data-testid="panel-id">{panelId ?? 'null'}</div>;
}

/**
 * Helper component that reads from ReactPanelManagerContext
 */
function PanelManagerReader(): JSX.Element {
  const panelManager = useContext(ReactPanelManagerContext);
  return (
    <div data-testid="panel-manager">
      {panelManager != null ? 'has-manager' : 'no-manager'}
    </div>
  );
}

describe('NestedDashboard', () => {
  it('renders children inside a nested dashboard container', () => {
    render(
      <WidgetStatusContext.Provider value={mockWidgetStatus}>
        <LayoutManagerContext.Provider value={mockLayout as never}>
          <NestedDashboard>
            <div data-testid="child-content">Nested Content</div>
          </NestedDashboard>
        </LayoutManagerContext.Provider>
      </WidgetStatusContext.Provider>
    );

    expect(document.querySelector('.dh-nested-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });

  it('resets ReactPanelContext to null', () => {
    render(
      <WidgetStatusContext.Provider value={mockWidgetStatus}>
        <LayoutManagerContext.Provider value={mockLayout as never}>
          <ReactPanelContext.Provider value="outer-panel-id">
            <NestedDashboard>
              <PanelIdReader />
            </NestedDashboard>
          </ReactPanelContext.Provider>
        </LayoutManagerContext.Provider>
      </WidgetStatusContext.Provider>
    );

    // Inside NestedDashboard, the panel context should be null
    expect(screen.getByTestId('panel-id')).toHaveTextContent('null');
  });

  it('provides ReactPanelManagerContext for nested panels', () => {
    render(
      <WidgetStatusContext.Provider value={mockWidgetStatus}>
        <LayoutManagerContext.Provider value={mockLayout as never}>
          <NestedDashboard>
            <PanelManagerReader />
          </NestedDashboard>
        </LayoutManagerContext.Provider>
      </WidgetStatusContext.Provider>
    );

    // Should have a panel manager available
    expect(screen.getByTestId('panel-manager')).toHaveTextContent(
      'has-manager'
    );
  });
});
