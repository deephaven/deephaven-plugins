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
import PortalPanelManagerContext from './PortalPanelManagerContext';

const mockPanelId = 'test-panel-id';

beforeEach(() => {
  jest.clearAllMocks();
});

function makeReactPanelManager({
  children,
  metadata = { name: 'test-name', type: 'test-type' },
  onClose = jest.fn(),
  onOpen = jest.fn(),
  getPanelId = jest.fn(() => mockPanelId),
  title = 'test title',
}: Partial<ReactPanelProps> & Partial<ReactPanelManager> = {}) {
  return (
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
  );
}

function makeTestComponent({
  children,
  metadata = { name: 'test-name', type: 'test-type' },
  onClose = jest.fn(),
  onOpen = jest.fn(),
  getPanelId = jest.fn(() => mockPanelId),
  title = 'test title',
}: Partial<ReactPanelProps> & Partial<ReactPanelManager> = {}) {
  return (
    <PortalPanelManager>
      {makeReactPanelManager({
        children,
        metadata,
        onClose,
        onOpen,
        getPanelId,
        title,
      })}
    </PortalPanelManager>
  );
}

/**
 * Simulate the panel CLOSED event. Assumes the `useListener` has only been called with that event listener.
 */
function simulatePanelClosed() {
  (useListener as jest.Mock).mock.calls[0][2](mockPanelId);
}

it('opens panel on mount, and closes panel on unmount', () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const { unmount } = render(makeTestComponent({ onOpen, onClose }));
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

it('only calls open once if the panel has not closed and only children change', () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const metadata = { type: 'bar' };
  const children = 'hello';
  const { rerender } = render(
    makeTestComponent({ children, onOpen, onClose, metadata })
  );
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  rerender(makeTestComponent({ children: 'world', onOpen, onClose, metadata }));

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
});

it('calls openComponent again after panel is closed only if the metadata changes', () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const metadata = { type: 'bar' };
  const children = 'hello';
  const { rerender } = render(
    makeTestComponent({
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
    makeTestComponent({
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
    makeTestComponent({
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

// Case when rehydrating a widget
it('does not call openComponent or setActiveContentItem if panel already exists when created', () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const mockStack = {
    setActiveContentItem: jest.fn(),
  };
  const mockContentItem = {};
  (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValue(mockStack);
  (LayoutUtils.getContentItemInStack as jest.Mock).mockReturnValue(
    mockContentItem
  );
  const portal = document.createElement('div');
  const portals = new Map([[mockPanelId, portal]]);

  const metadata = { type: 'bar' };
  const children = 'hello';
  const { rerender } = render(
    <PortalPanelManagerContext.Provider value={portals}>
      {makeReactPanelManager({
        children,
        onOpen,
        onClose,
        metadata,
      })}
    </PortalPanelManagerContext.Provider>
  );
  expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.getStackForConfig).toHaveBeenCalled();
  expect(mockStack.setActiveContentItem).not.toHaveBeenCalled();

  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  // Now check that it focuses it if it's called after the metadat changes
  rerender(
    <PortalPanelManagerContext.Provider value={portals}>
      {makeReactPanelManager({
        children: 'world',
        onOpen,
        onClose,
        metadata: { type: 'baz' },
      })}
    </PortalPanelManagerContext.Provider>
  );

  expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  expect(mockStack.setActiveContentItem).toHaveBeenCalledTimes(1);
  expect(mockStack.setActiveContentItem).toHaveBeenCalledWith(mockContentItem);
});

it('calls setActiveContentItem if metadata changed while the panel already exists', () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const metadata = { type: 'bar' };
  const children = 'hello';
  const { rerender } = render(
    makeTestComponent({
      children,
      onOpen,
      onClose,
      metadata,
    })
  );
  expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(useListener).toHaveBeenCalledTimes(1);

  const mockStack = {
    setActiveContentItem: jest.fn(),
  };
  const mockContentItem = {};
  (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValue(mockStack);
  (LayoutUtils.getContentItemInStack as jest.Mock).mockReturnValue(
    mockContentItem
  );
  rerender(
    makeTestComponent({
      children: 'world',
      onOpen,
      onClose,
      metadata: { type: 'baz' },
    })
  );

  expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(mockStack.setActiveContentItem).toHaveBeenCalledTimes(1);
});
