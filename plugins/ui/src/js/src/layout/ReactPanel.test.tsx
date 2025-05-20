import React from 'react';
import { render, within } from '@testing-library/react';
import {
  LayoutUtils,
  WidgetDescriptor,
  useListener,
} from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import ReactPanel from './ReactPanel';
import {
  ReactPanelManager,
  ReactPanelManagerContext,
} from './ReactPanelManager';
import { ReactPanelProps } from './LayoutUtils';
import PortalPanelManagerContext, {
  PortalPanelMap,
} from './PortalPanelManagerContext';
import WidgetStatusContext, { WidgetStatus } from './WidgetStatusContext';

const mockPanelId = 'test-panel-id';
const defaultDescriptor = { name: 'test-name', type: 'test-type' };
const defaultStatus: WidgetStatus = {
  status: 'ready',
  descriptor: defaultDescriptor,
};

beforeEach(() => {
  jest.clearAllMocks();
});

function makeReactPanelManager({
  children,
  metadata = defaultDescriptor,
  onClose = jest.fn(),
  onOpen = jest.fn(),
  getPanelId = jest.fn(() => mockPanelId),
  onDataChange = jest.fn(),
  getInitialData = jest.fn(() => []),
  title = 'test title',
}: Partial<ReactPanelProps> & Partial<ReactPanelManager> = {}) {
  return (
    <ReactPanelManagerContext.Provider
      value={{
        getPanelId,
        metadata,
        onClose,
        onOpen,
        onDataChange,
        getInitialData,
      }}
    >
      <ReactPanel title={title}>{children}</ReactPanel>
    </ReactPanelManagerContext.Provider>
  );
}

function makeTestComponent({
  children,
  metadata = defaultDescriptor,
  onClose = jest.fn(),
  onOpen = jest.fn(),
  getPanelId = jest.fn(() => mockPanelId),
  portals = new Map(),
  status = defaultStatus,
  title = 'test title',
}: Partial<ReactPanelProps> &
  Partial<ReactPanelManager> & {
    metadata?: WidgetDescriptor;
    portals?: PortalPanelMap;
    status?: WidgetStatus;
  } = {}) {
  return (
    <WidgetStatusContext.Provider value={status}>
      <PortalPanelManagerContext.Provider value={portals}>
        {makeReactPanelManager({
          children,
          metadata,
          onClose,
          onOpen,
          getPanelId,
          title,
        })}
      </PortalPanelManagerContext.Provider>
    </WidgetStatusContext.Provider>
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
    makeTestComponent({
      children,
      onOpen,
      onClose,
      metadata,
      portals,
    })
  );
  expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.getStackForConfig).toHaveBeenCalled();
  expect(mockStack.setActiveContentItem).not.toHaveBeenCalled();

  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  // Now check that it focuses it if it's called after the metadata changes
  rerender(
    makeTestComponent({
      children: 'world',
      onOpen,
      onClose,
      metadata: { type: 'baz' },
      portals,
    })
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

it('catches an error thrown by children, renders error view', () => {
  TestUtils.disableConsoleOutput();

  const error = new Error('test error');
  const ErrorComponent = () => {
    throw error;
  };

  const portal = document.createElement('div');
  const portals = new Map([[mockPanelId, portal]]);

  const { rerender } = render(
    makeTestComponent({
      children: <ErrorComponent />,
      portals,
    })
  );
  const { getByText } = within(portal);
  expect(getByText('test error')).toBeDefined();

  rerender(
    makeTestComponent({
      children: <div>Hello</div>,
      portals,
    })
  );

  expect(getByText('Hello')).toBeDefined();
});

it('displays an error if the widget is in an error state', () => {
  const error = new Error('test error');
  const portal = document.createElement('div');
  const portals = new Map([[mockPanelId, portal]]);
  const status: WidgetStatus = {
    status: 'error',
    descriptor: defaultDescriptor,
    error,
  };

  render(makeTestComponent({ portals, status }));

  const { getByText } = within(portal);
  expect(getByText('test error')).toBeDefined();
});
