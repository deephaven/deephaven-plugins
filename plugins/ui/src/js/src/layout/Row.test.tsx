import React from 'react';
import { render, screen } from '@testing-library/react';
import type { DashboardLayoutConfig } from '@deephaven/dashboard';
import Row from './Row';
import { ReactPanelContext } from './ReactPanelContext';
import { InitialLayoutConfigContext } from './InitialLayoutConfigContext';
import { wrapBareChildrenInPanel } from './LayoutUtils';

// Mock Flex so we can detect the "inside a panel" branch without pulling in the
// full Spectrum provider stack.
jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  Flex: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="flex">{children}</div>
  ),
}));

// Spy on wrapBareChildrenInPanel so we can assert the rehydration branch is not
// taken when we're inside a panel.
jest.mock('./LayoutUtils', () => ({
  ...jest.requireActual('./LayoutUtils'),
  wrapBareChildrenInPanel: jest.fn((children: React.ReactNode) => children),
}));

const mockLayoutConfig = [
  { type: 'row', content: [] },
] as unknown as DashboardLayoutConfig;

beforeEach(() => {
  jest.clearAllMocks();
});

it('renders as a Flex when inside a panel, even during rehydration (DH-23205)', () => {
  // Regression: a ui.row used as the content of a ui.panel must render as a
  // Flex, not wrap its bare children in a nested panel, which would throw a
  // NestedPanelError. This must hold even when an initial layout config exists.
  render(
    <ReactPanelContext.Provider value="test-panel-id">
      <InitialLayoutConfigContext.Provider value={mockLayoutConfig}>
        <Row height={100}>hello</Row>
      </InitialLayoutConfigContext.Provider>
    </ReactPanelContext.Provider>
  );

  expect(screen.getByTestId('flex')).toHaveTextContent('hello');
  expect(wrapBareChildrenInPanel).not.toHaveBeenCalled();
});

it('renders as a Flex when inside a panel with no initial layout config', () => {
  render(
    <ReactPanelContext.Provider value="test-panel-id">
      <Row height={100}>hello</Row>
    </ReactPanelContext.Provider>
  );

  expect(screen.getByTestId('flex')).toHaveTextContent('hello');
  expect(wrapBareChildrenInPanel).not.toHaveBeenCalled();
});

it('wraps bare children in a panel during rehydration when not inside a panel', () => {
  render(
    <InitialLayoutConfigContext.Provider value={mockLayoutConfig}>
      <Row height={100}>hello</Row>
    </InitialLayoutConfigContext.Provider>
  );

  expect(screen.queryByTestId('flex')).not.toBeInTheDocument();
  expect(wrapBareChildrenInPanel).toHaveBeenCalled();
});
