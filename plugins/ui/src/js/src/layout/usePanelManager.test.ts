import React, { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  LayoutManagerContext,
  LayoutUtils,
  type WidgetDescriptor,
} from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import {
  usePanelManager as usePanelManagerWithLayout,
  type UsePanelManagerProps,
} from './usePanelManager';
import { type WidgetStatus } from './WidgetStatusContext';
import { type ReadonlyWidgetData } from '../widget/WidgetTypes';
import ReactPanel from './ReactPanel';
import { mapLayoutPanels, PANEL_ID_PROP } from './PanelIdUtils';

let mockWidgetStatus: WidgetStatus['status'] = 'ready';
jest.mock('./useWidgetStatus', () => ({
  useWidgetStatus: () => ({ status: mockWidgetStatus }),
}));

const mockLogWarn = jest.fn();
jest.mock('@deephaven/log', () => {
  const actual = jest.requireActual('@deephaven/log');
  return {
    __esModule: true,
    ...actual,
    default: {
      module: (name: string) => ({
        ...actual.default.module(name),
        // The logger is created on import, before `mockLogWarn` is initialized
        warn: (...args: unknown[]) => mockLogWarn(...args),
      }),
    },
  };
});

// Mock nanoid to return predictable values
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => `generated-id-${Math.random().toString(36).slice(2)}`),
}));

function makeWidget(
  overrides: Partial<WidgetDescriptor> = {}
): WidgetDescriptor {
  return TestUtils.createMockProxy<WidgetDescriptor>({
    id: 'test-widget-id',
    type: 'test-widget',
    name: 'Test Widget',
    ...overrides,
  });
}

/** Most tests only need the panel manager */
function usePanelManager(props: UsePanelManagerProps) {
  return usePanelManagerWithLayout(props).panelManager;
}

function panel(title?: string, key?: string): React.ReactElement {
  return React.createElement(ReactPanel as React.ElementType, {
    key,
    __dhKey: key,
    title,
  });
}

/** The id each panel in the layout was given, in render order */
function getIds(children: ReactNode): string[] {
  const ids: string[] = [];
  mapLayoutPanels(
    children,
    { isNested: false, hasInitialLayout: false },
    element => {
      ids.push((element.props as Record<string, string>)[PANEL_ID_PROP]);
      return element;
    }
  );
  return ids;
}

function renderLayout(
  layout: ReactNode,
  props: Partial<UsePanelManagerProps> = {}
) {
  return renderHook(
    ({ children }: { children: ReactNode }) =>
      usePanelManagerWithLayout({ widget: makeWidget(), ...props, children }),
    { initialProps: { children: layout } }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWidgetStatus = 'ready';
});

describe('usePanelManager', () => {
  it('returns a panelManager with all required properties', () => {
    const widget = makeWidget();
    const { result } = renderHook(() => usePanelManager({ widget }));

    expect(result.current).toEqual(
      expect.objectContaining({
        metadata: widget,
        onOpen: expect.any(Function),
        onClose: expect.any(Function),
        onDataChange: expect.any(Function),
        getInitialData: expect.any(Function),
      })
    );
  });

  describe('panel ids', () => {
    it('generates unique panel IDs when no initialData', () => {
      const { result } = renderLayout([panel(), panel()]);

      const [id1, id2] = getIds(result.current.children);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('returns stored panel IDs from initialData first', () => {
      const initialData: ReadonlyWidgetData = {
        panelIds: ['stored-id-1', 'stored-id-2'],
      };

      const { result } = renderLayout([panel(), panel(), panel()], {
        initialData,
      });

      const [id1, id2, thirdId] = getIds(result.current.children);
      expect(id1).toBe('stored-id-1');
      expect(id2).toBe('stored-id-2');
      // Third panel should get a new ID
      expect(thirdId).not.toBe('stored-id-1');
      expect(thirdId).not.toBe('stored-id-2');
    });

    it('keeps the ids of the panels in the same positions when the document changes', () => {
      const { result, rerender } = renderLayout([panel('A'), panel('B')]);
      const ids = getIds(result.current.children);

      rerender({ children: [panel('A'), panel('B'), panel('C')] });

      expect(getIds(result.current.children).slice(0, 2)).toEqual(ids);
    });
  });

  describe('getInitialData', () => {
    it('returns empty array when no data for panel', () => {
      const widget = makeWidget();
      const { result } = renderHook(() => usePanelManager({ widget }));

      const data = result.current.getInitialData('unknown-panel');
      expect(data).toEqual([]);
    });

    it('returns stored data for panel', () => {
      const widget = makeWidget();
      const panelData = [{ foo: 'bar' }, { baz: 123 }];
      const initialData: ReadonlyWidgetData = {
        panelStates: {
          'my-panel': panelData,
        },
      };

      const { result } = renderHook(() =>
        usePanelManager({ widget, initialData })
      );

      expect(result.current.getInitialData('my-panel')).toEqual(panelData);
    });

    it('returns the latest data, so a remounted panel keeps it', () => {
      const { result } = renderHook(() =>
        usePanelManager({ widget: makeWidget() })
      );

      act(() => {
        result.current.onDataChange('my-panel', [{ latest: true }]);
      });

      expect(result.current.getInitialData('my-panel')).toEqual([
        { latest: true },
      ]);
    });
  });

  describe('onOpen', () => {
    it('tracks opened panels', () => {
      const widget = makeWidget();
      const onDataChange = jest.fn();
      const { result } = renderHook(() =>
        usePanelManager({ widget, onDataChange })
      );

      act(() => {
        result.current.onOpen('panel-1');
      });

      // Should have called onDataChange with the panel IDs
      expect(onDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          panelIds: ['panel-1'],
        })
      );
    });

    it('throws error on duplicate panel open', () => {
      const widget = makeWidget();
      const { result } = renderHook(() => usePanelManager({ widget }));

      act(() => {
        result.current.onOpen('panel-1');
      });

      expect(() => {
        act(() => {
          result.current.onOpen('panel-1');
        });
      }).toThrow('Duplicate panel opens received');
    });
  });

  describe('onClose', () => {
    it('removes panels from tracking', () => {
      const widget = makeWidget();
      const onDataChange = jest.fn();
      const { result } = renderHook(() =>
        usePanelManager({ widget, onDataChange })
      );

      // Open two panels
      act(() => {
        result.current.onOpen('panel-1');
      });
      act(() => {
        result.current.onOpen('panel-2');
      });

      onDataChange.mockClear();

      // Close one panel
      act(() => {
        result.current.onClose('panel-1');
      });

      expect(onDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          panelIds: ['panel-2'],
        })
      );
    });

    it('calls onClose callback when all panels are closed', () => {
      const widget = makeWidget();
      const onClose = jest.fn();
      const { result } = renderHook(() => usePanelManager({ widget, onClose }));

      // Open and then close a panel
      act(() => {
        result.current.onOpen('panel-1');
      });

      act(() => {
        result.current.onClose('panel-1');
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose if panels remain open', () => {
      const widget = makeWidget();
      const onClose = jest.fn();
      const { result } = renderHook(() => usePanelManager({ widget, onClose }));

      // Open two panels
      act(() => {
        result.current.onOpen('panel-1');
      });
      act(() => {
        result.current.onOpen('panel-2');
      });

      // Close one
      act(() => {
        result.current.onClose('panel-1');
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('throws error when closing unknown panel', () => {
      const widget = makeWidget();
      const { result } = renderHook(() => usePanelManager({ widget }));

      expect(() => {
        act(() => {
          result.current.onClose('unknown-panel');
        });
      }).toThrow('Panel close received for unknown panel');
    });
  });

  describe('onDataChange', () => {
    it('calls onDataChange with panel state', () => {
      const widget = makeWidget();
      const onDataChange = jest.fn();
      const { result } = renderHook(() =>
        usePanelManager({ widget, onDataChange })
      );

      const panelData = [{ key: 'value' }];

      act(() => {
        result.current.onDataChange('panel-1', panelData);
      });

      expect(onDataChange).toHaveBeenCalledWith({
        panelStates: {
          'panel-1': panelData,
        },
      });
    });

    it('preserves existing panel states when adding new data', () => {
      const widget = makeWidget();
      const onDataChange = jest.fn();
      const initialData: ReadonlyWidgetData = {
        panelStates: {
          'existing-panel': [{ existing: true }],
        },
      };

      const { result } = renderHook(() =>
        usePanelManager({ widget, initialData, onDataChange })
      );

      const newPanelData = [{ new: true }];

      act(() => {
        result.current.onDataChange('new-panel', newPanelData);
      });

      expect(onDataChange).toHaveBeenCalledWith({
        panelStates: {
          'existing-panel': [{ existing: true }],
          'new-panel': newPanelData,
        },
      });
    });

    it('accumulates state across sequential updates from different panels', () => {
      const widget = makeWidget();
      const onDataChange = jest.fn();
      const { result } = renderHook(() =>
        usePanelManager({ widget, onDataChange })
      );

      const panel1Data = [{ a: 1 }];
      const panel2Data = [{ b: 2 }];

      act(() => {
        result.current.onDataChange('panel-1', panel1Data);
      });
      act(() => {
        result.current.onDataChange('panel-2', panel2Data);
      });

      // The second panel's update must not drop the first panel's state
      expect(onDataChange).toHaveBeenLastCalledWith({
        panelStates: {
          'panel-1': panel1Data,
          'panel-2': panel2Data,
        },
      });
    });
  });

  describe('metadata', () => {
    it('exposes the widget as metadata', () => {
      const widget = makeWidget();
      const { result } = renderHook(() => usePanelManager({ widget }));

      expect(result.current.metadata).toBe(widget);
    });
  });

  describe('orphaned panels', () => {
    const initialData: ReadonlyWidgetData = {
      panelIds: ['alive', 'orphan'],
      panelStates: { alive: [{ a: 1 }], orphan: [{ b: 2 }] },
    };
    const layoutManager = { root: {} };
    const stack = {};
    const orphanItem = { remove: jest.fn() };

    function renderInLayout(onDataChange = jest.fn()) {
      (LayoutUtils.getStackForConfig as jest.Mock).mockReturnValue(stack);
      (LayoutUtils.getContentItemInStack as jest.Mock).mockReturnValue(
        orphanItem
      );
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          LayoutManagerContext.Provider,
          { value: layoutManager as never },
          children
        );
      return renderHook(
        () =>
          usePanelManager({ widget: makeWidget(), initialData, onDataChange }),
        { wrapper }
      );
    }

    it('removes saved panels the document did not reopen, and their state', () => {
      const onDataChange = jest.fn();
      const { result } = renderInLayout(onDataChange);

      act(() => {
        result.current.onOpen('alive');
      });

      expect(LayoutUtils.getStackForConfig).toHaveBeenCalledTimes(1);
      expect(LayoutUtils.getStackForConfig).toHaveBeenCalledWith(
        layoutManager.root,
        { id: 'orphan' }
      );
      expect(LayoutUtils.getContentItemInStack).toHaveBeenCalledWith(stack, {
        id: 'orphan',
      });
      expect(orphanItem.remove).toHaveBeenCalledTimes(1);
      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['alive'],
          panelStates: { alive: [{ a: 1 }] },
        })
      );
    });

    it('only removes orphans on the first sync', () => {
      const { result } = renderInLayout();

      act(() => {
        result.current.onOpen('alive');
      });
      act(() => {
        result.current.onOpen('new-panel');
      });

      expect(orphanItem.remove).toHaveBeenCalledTimes(1);
    });

    it('ignores rehydration placeholders opened before the document is ready', () => {
      mockWidgetStatus = 'loading';
      const onDataChange = jest.fn();
      const { result, rerender } = renderInLayout(onDataChange);

      // A placeholder panel opens for every saved id while loading
      act(() => {
        result.current.onOpen('alive');
        result.current.onOpen('orphan');
      });
      expect(orphanItem.remove).not.toHaveBeenCalled();

      mockWidgetStatus = 'ready';
      rerender();
      // The ready document renders one panel, so the extra placeholder closes
      act(() => {
        result.current.onClose('orphan');
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['alive'],
          panelStates: { alive: [{ a: 1 }] },
        })
      );
    });

    it('does not hand out orphaned saved ids to panels added afterwards', () => {
      const { result, rerender } = renderLayout([panel('Alive')], {
        initialData,
      });

      expect(getIds(result.current.children)).toEqual(['alive']);
      act(() => {
        result.current.panelManager.onOpen('alive');
      });
      rerender({ children: [panel('Alive'), panel('New')] });

      expect(getIds(result.current.children)[1]).not.toBe('orphan');
    });
  });

  describe('keyed panels', () => {
    const keyA = JSON.stringify(['a']);
    const keyB = JSON.stringify(['b']);
    const keyedData: ReadonlyWidgetData = {
      panelIds: ['a-id', 'b-id'],
      panelKeyMap: { [keyA]: 'a-id', [keyB]: 'b-id' },
    };

    it('gives keyed panels positional ids when no keys were saved, then saves the keys', () => {
      const onDataChange = jest.fn();
      const { result } = renderLayout([panel('A', 'a'), panel('B', 'b')], {
        initialData: { panelIds: ['first-id', 'second-id'] },
        onDataChange,
      });

      act(() => {
        result.current.panelManager.onOpen('first-id');
        result.current.panelManager.onOpen('second-id');
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['first-id', 'second-id'],
          panelKeyMap: { [keyA]: 'first-id', [keyB]: 'second-id' },
        })
      );
    });

    it('omits the key map when no keyed panels are open', () => {
      const onDataChange = jest.fn();
      const { result } = renderLayout([panel('Unkeyed')], {
        initialData: keyedData,
        onDataChange,
      });

      act(() => {
        getIds(result.current.children).forEach(
          result.current.panelManager.onOpen
        );
      });

      expect(onDataChange.mock.lastCall[0].panelKeyMap).toBeUndefined();
    });

    it('gives a second panel with the same key a new id, and warns once', () => {
      const document = [panel('A', 'a'), panel('Duplicate', 'a')];
      const { result, rerender } = renderLayout(document, {
        initialData: keyedData,
      });
      rerender({ children: document });

      const [id, duplicateId] = getIds(result.current.children);
      expect(id).toBe('a-id');
      expect(duplicateId).not.toBe('a-id');
      expect(mockLogWarn).toHaveBeenCalledTimes(1);
    });

    it('gives a removed keyed panel a new id when it comes back', () => {
      const { result, rerender } = renderLayout(
        [panel('A', 'a'), panel('B', 'b')],
        { initialData: keyedData }
      );

      rerender({ children: [panel('B', 'b')] });
      rerender({ children: [panel('A', 'a'), panel('B', 'b')] });

      const [aId, bId] = getIds(result.current.children);
      expect(aId).not.toBe('a-id');
      expect(bId).toBe('b-id');
    });

    it('keeps the ids of keyed panels while the document reloads', () => {
      const document = [panel('B', 'b'), panel('A', 'a')];
      const { result, rerender } = renderLayout(document, {
        initialData: keyedData,
      });

      mockWidgetStatus = 'loading';
      rerender({ children: [panel(), panel()] });
      mockWidgetStatus = 'ready';
      rerender({ children: document });

      expect(getIds(result.current.children)).toEqual(['b-id', 'a-id']);
    });

    it('gives the placeholders every saved id in order until the document is ready', () => {
      mockWidgetStatus = 'loading';
      const { result, rerender } = renderLayout([panel(), panel()], {
        initialData: keyedData,
      });
      expect(getIds(result.current.children)).toEqual(['a-id', 'b-id']);

      mockWidgetStatus = 'ready';
      rerender({ children: [panel('B', 'b'), panel('Unkeyed')] });

      const [bId, unkeyedId] = getIds(result.current.children);
      expect(bId).toBe('b-id');
      expect(unkeyedId).not.toBe('a-id');
    });

    it('keeps the saved key map while only placeholders are open', () => {
      mockWidgetStatus = 'loading';
      const onDataChange = jest.fn();
      const { result } = renderLayout([panel(), panel()], {
        initialData: keyedData,
        onDataChange,
      });

      act(() => {
        result.current.panelManager.onOpen('a-id');
        result.current.panelManager.onOpen('b-id');
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ panelKeyMap: keyedData.panelKeyMap })
      );
    });

    it("gives a new widget's loading placeholder id to its first unkeyed panel", () => {
      mockWidgetStatus = 'loading';
      const { result, rerender } = renderLayout([panel()]);
      const [placeholderId] = getIds(result.current.children);

      mockWidgetStatus = 'ready';
      rerender({ children: [panel('A')] });

      expect(getIds(result.current.children)).toEqual([placeholderId]);
    });
  });

  describe('panel open/close batching', () => {
    it('handles panel opening and closing in same render cycle', () => {
      const widget = makeWidget();
      const onClose = jest.fn();
      const onDataChange = jest.fn();
      const { result } = renderHook(() =>
        usePanelManager({ widget, onClose, onDataChange })
      );

      // Open a panel first
      act(() => {
        result.current.onOpen('panel-1');
      });

      onDataChange.mockClear();
      onClose.mockClear();

      // Close old panel and open new panel in same act
      act(() => {
        result.current.onClose('panel-1');
        result.current.onOpen('panel-2');
      });

      // Should NOT call onClose since a new panel was opened
      expect(onClose).not.toHaveBeenCalled();
      // Should have called onDataChange with the new panel
      expect(onDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          panelIds: ['panel-2'],
        })
      );
    });
  });
});
