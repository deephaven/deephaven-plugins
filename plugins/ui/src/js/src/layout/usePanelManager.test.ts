import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  LayoutManagerContext,
  LayoutUtils,
  type WidgetDescriptor,
} from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import { usePanelManager } from './usePanelManager';
import { type WidgetStatus } from './WidgetStatusContext';
import { type ReadonlyWidgetData } from '../widget/WidgetTypes';

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
        getPanelId: expect.any(Function),
        getInitialData: expect.any(Function),
      })
    );
  });

  describe('getPanelId', () => {
    it('generates unique panel IDs when no initialData', () => {
      const widget = makeWidget();
      const { result } = renderHook(() => usePanelManager({ widget }));

      const id1 = result.current.getPanelId();
      const id2 = result.current.getPanelId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('returns stored panel IDs from initialData first', () => {
      const widget = makeWidget();
      const initialData: ReadonlyWidgetData = {
        panelIds: ['stored-id-1', 'stored-id-2'],
      };

      const { result } = renderHook(() =>
        usePanelManager({ widget, initialData })
      );

      expect(result.current.getPanelId()).toBe('stored-id-1');
      expect(result.current.getPanelId()).toBe('stored-id-2');
      // Third call should generate a new ID
      const thirdId = result.current.getPanelId();
      expect(thirdId).not.toBe('stored-id-1');
      expect(thirdId).not.toBe('stored-id-2');
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
      const widget = makeWidget({ id: 'custom-id', name: 'Custom Widget' });
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
        result.current.onOpen(result.current.getPanelId());
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
        result.current.onOpen(result.current.getPanelId());
        result.current.onOpen(result.current.getPanelId());
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
      const { result } = renderInLayout();

      expect(result.current.getPanelId()).toBe('alive');
      act(() => {
        result.current.onOpen('alive');
      });

      expect(result.current.getPanelId()).not.toBe('orphan');
    });
  });

  describe('keyed panels', () => {
    const keyA = JSON.stringify(['a']);
    const keyB = JSON.stringify(['b']);
    const generatedId = expect.stringMatching(/^generated-id-/);
    const keyedData: ReadonlyWidgetData = {
      panelIds: ['a-id', 'b-id'],
      panelKeyMap: { [keyA]: 'a-id', [keyB]: 'b-id' },
    };

    function renderManager(
      initialData?: ReadonlyWidgetData,
      onDataChange = jest.fn()
    ) {
      return renderHook(() =>
        usePanelManager({ widget: makeWidget(), initialData, onDataChange })
      );
    }

    it('gives a keyed panel its saved id regardless of order', () => {
      const { result } = renderManager(keyedData);

      expect(result.current.getPanelId(keyB)).toBe('b-id');
      expect(result.current.getPanelId(keyA)).toBe('a-id');
    });

    it('gives a new keyed panel inserted before others a new id', () => {
      const { result } = renderManager(keyedData);

      expect(result.current.getPanelId(keyA)).toBe('a-id');
      expect(result.current.getPanelId(JSON.stringify(['new']))).toEqual(
        generatedId
      );
      expect(result.current.getPanelId(keyB)).toBe('b-id');
    });

    it('never gives an unkeyed panel a keyed panel id', () => {
      const { result } = renderManager({
        panelIds: ['a-id', 'unkeyed-id'],
        panelKeyMap: { [keyA]: 'a-id' },
      });

      expect(result.current.getPanelId()).toBe('unkeyed-id');
      expect(result.current.getPanelId(keyA)).toBe('a-id');
      expect(result.current.getPanelId()).toEqual(generatedId);
    });

    it('gives keyed panels positional ids when no keys were saved, then saves the keys', () => {
      const onDataChange = jest.fn();
      const { result } = renderManager(
        { panelIds: ['first-id', 'second-id'] },
        onDataChange
      );

      act(() => {
        result.current.onOpen(result.current.getPanelId(keyA), keyA);
        result.current.onOpen(result.current.getPanelId(keyB), keyB);
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['first-id', 'second-id'],
          panelKeyMap: { [keyA]: 'first-id', [keyB]: 'second-id' },
        })
      );
    });

    it('refuses to open a second panel with the same key, and keeps the first under the key', () => {
      const onDataChange = jest.fn();
      const { result } = renderManager(keyedData, onDataChange);

      expect(result.current.getPanelId(keyA)).toBe('a-id');
      expect(result.current.getPanelId(keyA)).toBe('a-id');

      let isFirstOpened: boolean | undefined;
      let isDuplicateOpened: boolean | undefined;
      act(() => {
        isFirstOpened = result.current.onOpen('a-id', keyA);
        isDuplicateOpened = result.current.onOpen('a-id', keyA);
      });
      expect(isFirstOpened).toBe(true);
      expect(isDuplicateOpened).toBe(false);
      expect(mockLogWarn).toHaveBeenCalledTimes(1);

      // The duplicate opens again with a new id of its own
      act(() => {
        result.current.onOpen('duplicate-id', keyA);
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['a-id', 'duplicate-id'],
          panelKeyMap: { [keyA]: 'a-id' },
        })
      );
    });

    it('lets a keyed panel moved to another parent keep its id, without a duplicate warning', () => {
      const onDataChange = jest.fn();
      const { result } = renderManager(keyedData, onDataChange);

      act(() => {
        result.current.onOpen(result.current.getPanelId(keyA), keyA);
      });
      // The moved panel renders while the old one is still open
      const movedId = result.current.getPanelId(keyA);
      expect(movedId).toBe('a-id');
      // React runs the old panel's cleanup before the moved panel's effects
      act(() => {
        result.current.onClose('a-id');
        result.current.onOpen(movedId, keyA);
      });

      expect(mockLogWarn).not.toHaveBeenCalled();
      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['a-id'],
          panelKeyMap: { [keyA]: 'a-id' },
        })
      );
    });

    it('gives the same ids when a render is repeated or thrown away', () => {
      const { result } = renderManager(keyedData);
      const newKey = JSON.stringify(['new']);

      // A thrown away render
      result.current.getPanelId(keyA);
      const newId = result.current.getPanelId(newKey);

      expect(result.current.getPanelId(keyA)).toBe('a-id');
      expect(result.current.getPanelId(newKey)).toBe(newId);
      let isOpened: boolean | undefined;
      act(() => {
        isOpened = result.current.onOpen('a-id', keyA);
      });
      expect(isOpened).toBe(true);
      expect(mockLogWarn).not.toHaveBeenCalled();
    });

    it('gives a keyed panel its id back when it reopens', () => {
      const { result } = renderManager(keyedData);

      act(() => {
        result.current.onOpen(result.current.getPanelId(keyB), keyB);
      });
      act(() => {
        result.current.onClose('b-id');
      });

      expect(result.current.getPanelId(keyB)).toBe('b-id');
    });

    it('drops keys of panels that did not open', () => {
      const onDataChange = jest.fn();
      const { result } = renderManager(keyedData, onDataChange);

      act(() => {
        result.current.onOpen(result.current.getPanelId(keyA), keyA);
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['a-id'],
          panelKeyMap: { [keyA]: 'a-id' },
        })
      );
    });

    it('omits the key map when no keyed panels are open', () => {
      const onDataChange = jest.fn();
      const { result } = renderManager(keyedData, onDataChange);

      act(() => {
        result.current.onOpen(result.current.getPanelId());
      });

      expect(onDataChange.mock.lastCall[0].panelKeyMap).toBeUndefined();
    });

    it('lets the document panel take over the id of a remounted placeholder', () => {
      mockWidgetStatus = 'loading';
      const onDataChange = jest.fn();
      let documentPanelId: string | undefined;
      const { result, rerender } = renderHook(() => {
        const manager = usePanelManager({
          widget: makeWidget(),
          initialData: keyedData,
          onDataChange,
        });
        // The document's panel claims its id in the render where the document becomes ready
        if (mockWidgetStatus === 'ready' && documentPanelId == null) {
          documentPanelId = manager.getPanelId(keyA);
        }
        return manager;
      });

      act(() => {
        result.current.onOpen(result.current.getPanelId(keyA), keyA);
      });

      mockWidgetStatus = 'ready';
      rerender();
      expect(documentPanelId).toBe('a-id');
      act(() => {
        result.current.onClose('a-id');
        result.current.onOpen('a-id', keyA);
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          panelIds: ['a-id'],
          panelKeyMap: { [keyA]: 'a-id' },
        })
      );
    });

    it('refuses a duplicate key after the placeholders are replaced', () => {
      mockWidgetStatus = 'loading';
      const { result, rerender } = renderManager(keyedData);
      act(() => {
        result.current.onOpen(result.current.getPanelId());
        result.current.onOpen(result.current.getPanelId());
      });

      mockWidgetStatus = 'ready';
      rerender();
      let isFirstOpened: boolean | undefined;
      let isDuplicateOpened: boolean | undefined;
      act(() => {
        result.current.onClose('a-id');
        result.current.onClose('b-id');
        isFirstOpened = result.current.onOpen(
          result.current.getPanelId(keyA),
          keyA
        );
        isDuplicateOpened = result.current.onOpen(
          result.current.getPanelId(keyA),
          keyA
        );
      });

      expect(isFirstOpened).toBe(true);
      expect(isDuplicateOpened).toBe(false);
      expect(mockLogWarn).toHaveBeenCalledTimes(1);
    });

    it('keeps the saved key map while only placeholders are open', () => {
      mockWidgetStatus = 'loading';
      const onDataChange = jest.fn();
      const { result } = renderManager(keyedData, onDataChange);

      act(() => {
        result.current.onOpen(result.current.getPanelId());
        result.current.onOpen(result.current.getPanelId());
      });

      expect(onDataChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ panelKeyMap: keyedData.panelKeyMap })
      );
    });

    it('gives the placeholders every saved id in order until the document is ready', () => {
      mockWidgetStatus = 'loading';
      const { result, rerender } = renderManager(keyedData);

      expect(result.current.getPanelId()).toBe('a-id');
      expect(result.current.getPanelId()).toBe('b-id');

      mockWidgetStatus = 'ready';
      rerender();

      expect(result.current.getPanelId(keyB)).toBe('b-id');
      expect(result.current.getPanelId()).toEqual(generatedId);
    });

    it("gives a new widget's loading placeholder id to its first unkeyed panel", () => {
      mockWidgetStatus = 'loading';
      const { result, rerender } = renderManager();
      const placeholderId = result.current.getPanelId();

      mockWidgetStatus = 'ready';
      rerender();

      expect(result.current.getPanelId()).toBe(placeholderId);
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
