import React from 'react';
import { render } from '@testing-library/react';
import { LayoutUtils, useListener } from '@deephaven/dashboard';
import ReactPanel, { ReactPanelProps } from './ReactPanel';

// Mock LayoutUtils, useListener, and PanelEvent from @deephaven/dashboard package
const mockLayout = { root: {}, eventHub: {} };
jest.mock('@deephaven/dashboard', () => {
  const DashboardActual = jest.requireActual('@deephaven/dashboard');
  return {
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
});

const mockPanelId = 'test-panel-id';
jest.mock('shortid', () => jest.fn(() => mockPanelId));

beforeEach(() => {
  jest.clearAllMocks();
});

function makeReactPanel({
  children,
  metadata,
  onClose,
  onOpen,
  title = 'test title',
}: Partial<ReactPanelProps> = {}) {
  return (
    <ReactPanel
      metadata={metadata}
      onClose={onClose}
      onOpen={onOpen}
      title={title}
    >
      {children}
    </ReactPanel>
  );
}

/**
 * Simulate the panel CLOSED event. Assumes the `useListener` has only been called with that event listener.
 */
function simulatePanelClosed() {
  (useListener as jest.Mock).mock.calls[0][2](mockPanelId);
}

it('opens panel on mount, and closes panel on unmount', async () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const { unmount } = render(makeReactPanel({ onOpen, onClose }));
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  unmount();

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).toHaveBeenCalledTimes(1);
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('only calls open once if the panel has not closed and only children change', async () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const metadata = { foo: 'bar' };
  const children = 'hello';
  const { rerender } = render(
    makeReactPanel({ children, onOpen, onClose, metadata })
  );
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  rerender(makeReactPanel({ children: 'world', onOpen, onClose, metadata }));

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});

it('calls openComponent again after panel is closed only if the metadata changes', async () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const metadata = { foo: 'bar' };
  const children = 'hello';
  const { rerender } = render(
    makeReactPanel({
      children,
      onOpen,
      onClose,
      metadata,
    })
  );
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(useListener).toHaveBeenCalledTimes(1);

  simulatePanelClosed();

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);

  // Should not re-open if just the children change but the metadata stays the same
  rerender(
    makeReactPanel({
      children: 'world',
      onOpen,
      onClose,
      metadata,
    })
  );

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);

  // Should re-open after the metadata change
  rerender(
    makeReactPanel({
      children,
      onOpen,
      onClose,
      metadata: { fiz: 'baz' },
    })
  );

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(2);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(2);
  expect(onClose).toHaveBeenCalledTimes(1);
});
