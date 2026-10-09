import React from 'react';
import { render, within } from '@testing-library/react';
import {
  LayoutUtils,
  PanelIdContext,
  type WidgetDescriptor,
  useLayoutManager,
  useListener,
} from '@deephaven/dashboard';
import type { ContentItem } from '@deephaven/golden-layout';
import { TestUtils } from '@deephaven/test-utils';
import ReactPanel from './ReactPanel';
import {
  type ReactPanelManager,
  ReactPanelManagerContext,
} from './ReactPanelManager';
import { ParentItemContext } from './ParentItemContext';
import { type ReactPanelProps } from './LayoutUtils';
import PortalPanelManagerContext, {
  type PortalPanelMap,
} from './PortalPanelManagerContext';
import WidgetStatusContext, { type WidgetStatus } from './WidgetStatusContext';
import { PanelKeyScopeContext } from './PanelKeyScopeContext';

const mockPanelId = 'test-panel-id';
// Stable like the real manager's, so re-renders don't re-run the panel's effects
const mockIsPanelOpen = jest.fn(() => false);
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
  onOpen = jest.fn(() => true),
  getPanelId = jest.fn(() => mockPanelId),
  onDataChange = jest.fn(),
  getInitialData = jest.fn(() => []),
  isPanelOpen = mockIsPanelOpen,
  title = 'test title',
  panelKey,
}: Partial<ReactPanelProps> &
  Partial<ReactPanelManager> & { panelKey?: string } = {}) {
  return (
    <ReactPanelManagerContext.Provider
      value={{
        getPanelId,
        metadata,
        onClose,
        onOpen,
        onDataChange,
        getInitialData,
        isPanelOpen,
      }}
    >
      <ReactPanel title={title} __dhKey={panelKey}>
        {children}
      </ReactPanel>
    </ReactPanelManagerContext.Provider>
  );
}

function makeTestComponent({
  children,
  metadata = defaultDescriptor,
  onClose = jest.fn(),
  onOpen = jest.fn(() => true),
  getPanelId = jest.fn(() => mockPanelId),
  isPanelOpen,
  portals = new Map(),
  status = defaultStatus,
  title = 'test title',
  panelKey,
}: Partial<ReactPanelProps> &
  Partial<ReactPanelManager> & {
    metadata?: WidgetDescriptor;
    portals?: PortalPanelMap;
    status?: WidgetStatus;
    panelKey?: string;
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
          isPanelOpen,
          title,
          panelKey,
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

/** Unmount, then let the deferred layout close run */
async function unmountAndSettle(unmount: () => void) {
  unmount();
  await Promise.resolve();
}

it('opens panel on mount, and closes panel on unmount', async () => {
  const onOpen = jest.fn(() => true);
  const onClose = jest.fn();
  const { unmount } = render(makeTestComponent({ onOpen, onClose }));
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  await unmountAndSettle(unmount);

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).toHaveBeenCalledTimes(1);
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('keeps the layout item when a panel replacing it opens with the same id', async () => {
  const isPanelOpen = jest.fn(() => false);
  const { unmount } = render(makeTestComponent({ isPanelOpen }));
  isPanelOpen.mockReturnValue(true);

  await unmountAndSettle(unmount);

  expect(isPanelOpen).toHaveBeenCalledWith(mockPanelId);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
});

it('removes a non-closable panel from the layout on unmount', async () => {
  const onClose = jest.fn();
  const contentItem = TestUtils.createMockProxy<ContentItem>();
  (LayoutUtils.getContentItemInStack as jest.Mock).mockReturnValueOnce(
    contentItem
  );
  // Panels opened inside another panel (e.g. a nested dashboard) aren't closable
  const { unmount } = render(
    <PanelIdContext.Provider value="host-panel-id">
      {makeTestComponent({ onClose })}
    </PanelIdContext.Provider>
  );
  const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;
  expect(LayoutUtils.openComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      config: expect.objectContaining({ isClosable: false }),
    })
  );

  await unmountAndSettle(unmount);

  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(LayoutUtils.getStackForConfig).toHaveBeenLastCalledWith(root, {
    id: mockPanelId,
  });
  expect(contentItem.remove).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('finds and closes existing panels from the layout root, but opens in the parent stack', async () => {
  const onOpen = jest.fn(() => true);
  const onClose = jest.fn();
  // Use a parent that is distinct from the layout root, e.g. the user moved the panel
  // into a different stack within the layout.
  const parent = TestUtils.createMockProxy<ContentItem>();

  const { unmount } = render(
    <ParentItemContext.Provider value={parent}>
      {makeTestComponent({ onOpen, onClose })}
    </ParentItemContext.Provider>
  );

  const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;

  // Searches for an existing panel from the root, not just the parent
  expect(LayoutUtils.getStackForConfig).toHaveBeenCalledWith(root, {
    id: mockPanelId,
  });
  // Opens the panel in the parent stack rather than at the root
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.openComponent).toHaveBeenCalledWith(
    expect.objectContaining({ root: parent })
  );

  await unmountAndSettle(unmount);

  // Closes the panel from the root, since it may have been moved out of the parent
  expect(LayoutUtils.closeComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).toHaveBeenCalledWith(root, {
    id: mockPanelId,
  });
});

it('re-attaches a detached parent to the root before opening the panel', () => {
  const onOpen = jest.fn(() => true);
  const onClose = jest.fn();
  // A parent that is detached from the root (parent.parent === null)
  const parent = TestUtils.createMockProxy<ContentItem>({ parent: null });

  render(
    <ParentItemContext.Provider value={parent}>
      {makeTestComponent({ onOpen, onClose })}
    </ParentItemContext.Provider>
  );

  const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;

  // parent is the topmost detached ancestor; root has no children so addChild is called on root
  expect(root.addChild).toHaveBeenCalledWith(parent);
  // Panel should still open in the parent stack after re-attachment
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.openComponent).toHaveBeenCalledWith(
    expect.objectContaining({ root: parent })
  );
});

it('re-attaches the topmost detached ancestor to the root before opening the panel', () => {
  const onOpen = jest.fn(() => true);
  const onClose = jest.fn();
  // parent is a stack inside a detached row (grandparent.parent === null)
  const grandparent = TestUtils.createMockProxy<ContentItem>({ parent: null });
  const parent = TestUtils.createMockProxy<ContentItem>({
    parent: grandparent,
  });

  render(
    <ParentItemContext.Provider value={parent}>
      {makeTestComponent({ onOpen, onClose })}
    </ParentItemContext.Provider>
  );

  const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;

  // The topmost detached ancestor (grandparent) should be re-added, not just parent
  expect(root.addChild).toHaveBeenCalledWith(grandparent);
  expect(root.addChild).not.toHaveBeenCalledWith(parent);
  // Panel should still open in the original parent (not grandparent)
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.openComponent).toHaveBeenCalledWith(
    expect.objectContaining({ root: parent })
  );
});

it('does not re-attach when the parent is the layout root', () => {
  const onOpen = jest.fn(() => true);
  const onClose = jest.fn();
  const { root } = (useLayoutManager as jest.Mock)();
  // A real golden-layout root has a null parent. Without the guard, root would be
  // misdetected as detached and re-added into its own child, throwing a DOM
  // hierarchy error when rehydrating a layout with a new panel (DH-23527).
  root.parent = null;

  render(
    <ParentItemContext.Provider value={root}>
      {makeTestComponent({ onOpen, onClose })}
    </ParentItemContext.Provider>
  );

  expect(root.addChild).not.toHaveBeenCalled();
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.openComponent).toHaveBeenCalledWith(
    expect.objectContaining({ root })
  );
});

it('only calls open once if the panel has not closed and only children change', () => {
  const onOpen = jest.fn(() => true);
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
  const onOpen = jest.fn(() => true);
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
  const onOpen = jest.fn(() => true);
  const onClose = jest.fn();
  const mockStack = {
    setActiveContentItem: jest.fn(),
  };
  const mockContentItem = { config: {} };
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
  const onOpen = jest.fn(() => true);
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
  const mockContentItem = { config: {} };
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

describe('key', () => {
  it('gets its id by its key within the enclosing key scope', () => {
    const getPanelId = jest.fn(() => mockPanelId);
    const onOpen = jest.fn(() => true);
    render(
      <PanelKeyScopeContext.Provider value={['stack-key']}>
        {makeTestComponent({ getPanelId, onOpen, panelKey: 'panel-key' })}
      </PanelKeyScopeContext.Provider>
    );

    const panelKey = JSON.stringify(['stack-key', 'panel-key']);
    expect(getPanelId).toHaveBeenCalledWith(panelKey);
    expect(onOpen).toHaveBeenCalledWith(mockPanelId, panelKey);
  });

  it('gets a positional id without a key, even inside a key scope', () => {
    const getPanelId = jest.fn(() => mockPanelId);
    render(
      <PanelKeyScopeContext.Provider value={['stack-key']}>
        {makeTestComponent({ getPanelId })}
      </PanelKeyScopeContext.Provider>
    );

    expect(getPanelId).toHaveBeenCalledWith(undefined);
  });

  it('opens with a new id when another open panel has the same key', () => {
    const onOpen = jest
      .fn<boolean, [string, string?]>()
      .mockReturnValueOnce(false)
      .mockReturnValue(true);
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValue(undefined);
    render(makeTestComponent({ onOpen, panelKey: 'panel-key' }));

    const panelKey = JSON.stringify(['panel-key']);
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenNthCalledWith(1, mockPanelId, panelKey);
    const [newId] = onOpen.mock.calls[1];
    expect(newId).not.toBe(mockPanelId);
    expect(onOpen).toHaveBeenNthCalledWith(2, newId, panelKey);
    expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
    expect(LayoutUtils.openComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ id: newId }),
      })
    );
  });
});

describe('title', () => {
  it('renames a rehydrated panel whose layout title is stale', () => {
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValueOnce({});
    render(makeTestComponent({ title: 'new title' }));
    const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;

    expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
    expect(LayoutUtils.renameComponent).toHaveBeenCalledWith(
      root,
      { id: mockPanelId },
      'new title'
    );
  });

  it('does not rename a rehydrated panel whose layout title is current', () => {
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValueOnce({});
    (LayoutUtils.getContentItemInStack as jest.Mock).mockReturnValueOnce({
      config: { title: 'same title' },
    });
    render(makeTestComponent({ title: 'same title' }));

    expect(LayoutUtils.openComponent).not.toHaveBeenCalled();
    expect(LayoutUtils.renameComponent).not.toHaveBeenCalled();
  });

  it('does not rename a panel it just opened', () => {
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValueOnce(null);
    render(makeTestComponent({ title: 'new title' }));

    expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
    expect(LayoutUtils.renameComponent).not.toHaveBeenCalled();
  });

  it('renames the panel when its title changes', () => {
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValueOnce(null);
    const { rerender } = render(makeTestComponent({ title: 'first' }));
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValueOnce({});
    rerender(makeTestComponent({ title: 'second' }));
    const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;

    expect(LayoutUtils.renameComponent).toHaveBeenCalledTimes(1);
    expect(LayoutUtils.renameComponent).toHaveBeenCalledWith(
      root,
      { id: mockPanelId },
      'second'
    );
  });

  it('keeps the saved title while the document loads, then renames once it is ready', () => {
    (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValue({});
    const loading: WidgetStatus = {
      status: 'loading',
      descriptor: defaultDescriptor,
    };
    // A rehydration placeholder is titled with the widget name, not the saved tab title
    const { rerender } = render(
      makeTestComponent({ title: 'widget name', status: loading })
    );
    expect(LayoutUtils.renameComponent).not.toHaveBeenCalled();

    rerender(makeTestComponent({ title: 'document title' }));
    const { root } = (useLayoutManager as jest.Mock).mock.results[0].value;

    expect(LayoutUtils.renameComponent).toHaveBeenCalledTimes(1);
    expect(LayoutUtils.renameComponent).toHaveBeenCalledWith(
      root,
      { id: mockPanelId },
      'document title'
    );
  });
});
