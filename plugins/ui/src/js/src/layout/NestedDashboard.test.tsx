import React, { useContext, useEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  LayoutManagerContext,
  useLayoutManager,
  type WidgetDescriptor,
} from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import NestedDashboard from './NestedDashboard';
import Row from './Row';
import Column from './Column';
import Stack from './Stack';
import { ReactPanelContext, usePanelId } from './ReactPanelContext';
import {
  ReactPanelManagerContext,
  type ReactPanelManager,
} from './ReactPanelManager';
import WidgetStatusContext, { type WidgetStatus } from './WidgetStatusContext';

// Allow tests to seed the persisted dashboard state and observe writes to it.
// Names are prefixed with `mock` so jest.mock can reference them.
let mockPersistedInitialValue: unknown;
const mockSetPersistedSpy = jest.fn();

// Mock the child layout components to avoid GoldenLayout complexity
jest.mock('./LayoutUtils', () => ({
  ...jest.requireActual('./LayoutUtils'),
  normalizeDashboardChildren: (children: React.ReactNode) => children,
  normalizeRowChildren: (children: React.ReactNode) => children,
  normalizeColumnChildren: (children: React.ReactNode) => children,
  normalizeStackChildren: (children: React.ReactNode) => children,
  wrapBareChildrenInPanel: (children: React.ReactNode) => children,
}));

// Mock ReactPanel to a simple passthrough. These tests verify Row/Column/Stack
// content-item behavior, not the panel's GoldenLayout interaction (which the
// mock layout manager can't fully satisfy).
jest.mock('./ReactPanel', () => ({
  __esModule: true,
  default: function MockReactPanel({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode {
    return children;
  },
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
    usePersistentState: () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [state, setState] = react.useState(mockPersistedInitialValue);
      const wrappedSet = react.useCallback((updater: unknown) => {
        mockSetPersistedSpy(updater);
        setState(updater);
      }, []);
      return [state, wrappedSet];
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
  mockPersistedInitialValue = undefined;
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

  describe('rehydration with saved layoutConfig', () => {
    it('does not create new GoldenLayout items for Row/Column/Stack when an initial layoutConfig exists', () => {
      mockPersistedInitialValue = {
        layoutConfig: [
          {
            type: 'row',
            content: [
              {
                type: 'stack',
                content: [{ type: 'react-component', component: 'panel' }],
              },
            ],
          },
        ],
      };

      render(
        <WidgetStatusContext.Provider value={mockWidgetStatus}>
          <LayoutManagerContext.Provider value={mockLayout as never}>
            <NestedDashboard>
              <Row height={100}>
                <Column width={100}>
                  <Stack>
                    <div data-testid="rehydrated-child">child</div>
                  </Stack>
                </Column>
              </Row>
            </NestedDashboard>
          </LayoutManagerContext.Provider>
        </WidgetStatusContext.Provider>
      );

      // Children still render through the layout fragments
      expect(screen.getByTestId('rehydrated-child')).toBeInTheDocument();

      // Row/Column/Stack should bail out and NOT create new GL content items,
      // since the saved layoutConfig already describes the layout.
      expect(mockLayout.createContentItem).not.toHaveBeenCalled();
    });

    it('creates new GoldenLayout items for Row/Column/Stack when no initial layoutConfig exists (baseline)', () => {
      mockPersistedInitialValue = undefined;

      render(
        <WidgetStatusContext.Provider value={mockWidgetStatus}>
          <LayoutManagerContext.Provider value={mockLayout as never}>
            <NestedDashboard>
              <Row height={100}>
                <Column width={100}>
                  <Stack>
                    <div data-testid="fresh-child">child</div>
                  </Stack>
                </Column>
              </Row>
            </NestedDashboard>
          </LayoutManagerContext.Provider>
        </WidgetStatusContext.Provider>
      );

      // Without a saved layoutConfig, layout elements DO create GL content items.
      expect(mockLayout.createContentItem).toHaveBeenCalled();
    });
  });

  describe('widgetData persistence throttling', () => {
    /**
     * Helper that captures the ReactPanelManager from context so a test can
     * invoke onDataChange directly to simulate panel widget data updates.
     */
    function PanelManagerCapture({
      onReady,
    }: {
      onReady: (pm: ReactPanelManager) => void;
    }): JSX.Element | null {
      const pm = useContext(ReactPanelManagerContext);
      useEffect(() => {
        if (pm != null) {
          onReady(pm);
        }
      }, [pm, onReady]);
      return null;
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    });

    it('throttles widgetData updates and does not write again when data is unchanged', () => {
      let panelManager: ReactPanelManager | undefined;

      render(
        <WidgetStatusContext.Provider value={mockWidgetStatus}>
          <LayoutManagerContext.Provider value={mockLayout as never}>
            <NestedDashboard>
              <PanelManagerCapture
                onReady={pm => {
                  panelManager = pm;
                }}
              />
            </NestedDashboard>
          </LayoutManagerContext.Provider>
        </WidgetStatusContext.Provider>
      );

      expect(panelManager).toBeDefined();

      // Reset persisted-state spy after initial mount so we only observe
      // updates triggered by handleDataChange.
      mockSetPersistedSpy.mockClear();

      // First update: leading-edge of throttle should fire immediately and
      // persist the new widgetData.
      act(() => {
        panelManager!.onDataChange('panel-1', [{ value: 1 }]);
      });
      expect(mockSetPersistedSpy).toHaveBeenCalledTimes(1);

      // Second update with identical data inside the throttle window: the
      // trailing-edge invocation should short-circuit via deep-equality and
      // NOT write to persisted state again.
      act(() => {
        panelManager!.onDataChange('panel-1', [{ value: 1 }]);
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(mockSetPersistedSpy).toHaveBeenCalledTimes(1);

      // A genuinely different update should be persisted on the next
      // throttle window, confirming the short-circuit only suppresses no-ops.
      act(() => {
        panelManager!.onDataChange('panel-1', [{ value: 2 }]);
      });
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(mockSetPersistedSpy).toHaveBeenCalledTimes(2);
    });

    it('coalesces multiple rapid widgetData updates into a single persisted write', () => {
      let panelManager: ReactPanelManager | undefined;

      render(
        <WidgetStatusContext.Provider value={mockWidgetStatus}>
          <LayoutManagerContext.Provider value={mockLayout as never}>
            <NestedDashboard>
              <PanelManagerCapture
                onReady={pm => {
                  panelManager = pm;
                }}
              />
            </NestedDashboard>
          </LayoutManagerContext.Provider>
        </WidgetStatusContext.Provider>
      );

      mockSetPersistedSpy.mockClear();

      // Leading edge: first call writes immediately.
      act(() => {
        panelManager!.onDataChange('panel-1', [{ value: 'a' }]);
      });
      expect(mockSetPersistedSpy).toHaveBeenCalledTimes(1);

      // Several more rapid changes inside the throttle window — only the
      // final accumulated state should be flushed at the trailing edge.
      act(() => {
        panelManager!.onDataChange('panel-1', [{ value: 'b' }]);
        panelManager!.onDataChange('panel-1', [{ value: 'c' }]);
        panelManager!.onDataChange('panel-1', [{ value: 'd' }]);
      });
      // Still only one write so far (the leading-edge one).
      expect(mockSetPersistedSpy).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Trailing edge fires once with the latest data — total of 2 writes.
      expect(mockSetPersistedSpy).toHaveBeenCalledTimes(2);
    });
  });
});
