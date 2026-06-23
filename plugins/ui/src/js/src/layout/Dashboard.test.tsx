import React from 'react';
import { render, screen } from '@testing-library/react';
import { LayoutManagerContext, useLayoutManager } from '@deephaven/dashboard';
import Dashboard from './Dashboard';
import { ReactPanelContext } from './ReactPanelContext';

// Mock the child layout components to avoid GoldenLayout complexity
jest.mock('./LayoutUtils', () => ({
  ...jest.requireActual('./LayoutUtils'),
  normalizeDashboardChildren: (children: React.ReactNode) => children,
}));

// Mock NestedDashboard to avoid complex rendering
jest.mock(
  './NestedDashboard',
  () =>
    function MockNestedDashboard({
      children,
    }: {
      children: React.ReactNode;
    }): JSX.Element {
      return <div className="dh-nested-dashboard">{children}</div>;
    }
);

const mockLayout = {
  root: { contentItems: [], addChild: jest.fn() },
  eventHub: {
    on: jest.fn(),
    off: jest.fn(),
  },
  createContentItem: jest.fn(() => ({ setSize: jest.fn() })),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useLayoutManager as jest.Mock).mockReturnValue(mockLayout);
});

describe('Dashboard', () => {
  it('renders at top level with existing layout manager', () => {
    render(
      <LayoutManagerContext.Provider value={mockLayout as never}>
        <Dashboard>
          <div data-testid="child-content">Test Content</div>
        </Dashboard>
      </LayoutManagerContext.Provider>
    );

    // The child content should be rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders NestedDashboard when inside a panel context', () => {
    render(
      <LayoutManagerContext.Provider value={mockLayout as never}>
        <ReactPanelContext.Provider value="parent-panel-id">
          <Dashboard>
            <div data-testid="nested-child">Nested Content</div>
          </Dashboard>
        </ReactPanelContext.Provider>
      </LayoutManagerContext.Provider>
    );

    // Should render inside a nested dashboard container
    expect(document.querySelector('.dh-nested-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
  });

  it('normalizes children correctly when not nested', () => {
    render(
      <LayoutManagerContext.Provider value={mockLayout as never}>
        <Dashboard>
          <div>Child 1</div>
          <div>Child 2</div>
        </Dashboard>
      </LayoutManagerContext.Provider>
    );

    // Both children should be rendered
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('does not render nested dashboard container when at top level', () => {
    render(
      <LayoutManagerContext.Provider value={mockLayout as never}>
        <Dashboard>
          <div>Top Level Content</div>
        </Dashboard>
      </LayoutManagerContext.Provider>
    );

    // Should not have the nested dashboard class
    expect(
      document.querySelector('.dh-nested-dashboard')
    ).not.toBeInTheDocument();
  });
});
