import React from 'react';
import { render } from '@testing-library/react';
import { LayoutUtils, useListener } from '@deephaven/dashboard';
import ReactPanel from './ReactPanel';
import {
  ReactPanelManager,
  ReactPanelManagerContext,
} from './ReactPanelManager';
import { ReactPanelProps } from './LayoutUtils';
import PortalPanelManager from './PortalPanelManager';

const mockPanelId = 'test-panel-id';

beforeEach(() => {
  jest.clearAllMocks();
});

function makeReactPanel({
  children,
  metadata = { name: 'test-name', type: 'test-type' },
  onClose = jest.fn(),
  onOpen = jest.fn(),
  getPanelId = jest.fn(() => mockPanelId),
  title = 'test title',
}: Partial<ReactPanelProps> & Partial<ReactPanelManager> = {}) {
  return (
    <PortalPanelManager>
      <ReactPanelManagerContext.Provider
        value={{
          getPanelId,
          metadata,
          onClose,
          onOpen,
        }}
      >
        <ReactPanel title={title}>{children}</ReactPanel>
      </ReactPanelManagerContext.Provider>
    </PortalPanelManager>
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
  const metadata = { type: 'bar' };
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
  const metadata = { type: 'bar' };
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
      metadata: { type: 'baz' },
    })
  );

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(2);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(2);
  expect(onClose).toHaveBeenCalledTimes(1);
});
