import { renderHook, act } from '@testing-library/react-hooks';
import { WidgetDescriptor } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import { usePanelManager } from './usePanelManager';
import { ReadonlyWidgetData } from './WidgetTypes';

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
  });

  describe('metadata', () => {
    it('exposes the widget as metadata', () => {
      const widget = makeWidget({ id: 'custom-id', name: 'Custom Widget' });
      const { result } = renderHook(() => usePanelManager({ widget }));

      expect(result.current.metadata).toBe(widget);
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
