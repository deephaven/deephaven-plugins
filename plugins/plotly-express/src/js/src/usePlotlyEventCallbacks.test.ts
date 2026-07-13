import { renderHook } from '@testing-library/react';
import { type dh as DhType } from '@deephaven/jsapi-types';
import type {
  PlotMouseEvent,
  PlotSelectionEvent,
  LegendClickEvent,
  ClickAnnotationEvent,
} from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import { PlotlyExpressChartModel } from './PlotlyExpressChartModel';
import { usePlotlyEventCallbacks } from './usePlotlyEventCallbacks';
import { type PlotlyChartWidgetData } from './PlotlyExpressChartUtils';

// plotly.js-dist-min pulls in browser/WebGL APIs that jsdom can't load, so mock
// it. The hook only uses Plotly.animate/restyle for programmatic re-triggers.
jest.mock('plotly.js-dist-min', () => ({
  __esModule: true,
  default: { animate: jest.fn(), restyle: jest.fn() },
}));

function createMockWidgetWithCallbacks(
  callbacks?: Record<string, string>,
  preventableCallbacks?: string[]
) {
  const widgetData: PlotlyChartWidgetData = {
    type: 'test',
    figure: {
      deephaven: {
        mappings: [],
        is_user_set_color: false,
        is_user_set_template: false,
        callbacks,
        preventable_callbacks: preventableCallbacks,
      },
      plotly: {
        data: [{ type: 'scatter' as const, mode: 'markers' }],
        layout: { title: { text: 'Test' } },
      },
    },
    revision: 0,
    new_references: [],
    removed_references: [],
  };

  return {
    getDataAsString: () => JSON.stringify(widgetData),
    exportedObjects: [],
    addEventListener: jest.fn(() => jest.fn()),
    close: jest.fn(),
    sendMessage: jest.fn(),
  } satisfies Partial<DhType.Widget> as unknown as DhType.Widget;
}

const mockDh = {
  calendar: { DayOfWeek: { values: () => [] } },
  plot: {
    Downsample: { runChartDownsample: jest.fn() },
    ChartData: jest.fn(),
  },
  Table: { EVENT_UPDATED: 'updated' },
  Widget: { EVENT_MESSAGE: 'message' },
  i18n: { TimeZone: { getTimeZone: () => ({ id: 'UTC', standardOffset: 0 }) } },
} as unknown as typeof DhType;

const NO_MODIFIERS = { shift: false, ctrl: false, alt: false, meta: false };

/** Parse the most recent message sent through the widget. */
function lastSent(widget: DhType.Widget): {
  type: string;
  callback_id: string;
  args: Record<string, unknown>;
  request_id?: string;
} {
  const { calls } = (widget.sendMessage as jest.Mock).mock;
  return JSON.parse(calls[calls.length - 1][0]);
}

function makeModel(
  callbacks?: Record<string, string>,
  preventableCallbacks?: string[]
): { model: PlotlyExpressChartModel; widget: DhType.Widget } {
  const widget = createMockWidgetWithCallbacks(callbacks, preventableCallbacks);
  const model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());
  return { model, widget };
}

describe('usePlotlyEventCallbacks', () => {
  beforeEach(() => {
    (Plotly.restyle as jest.Mock).mockClear();
    (Plotly.animate as jest.Mock).mockClear();
  });

  it('returns an empty object when the model is null', () => {
    const { result } = renderHook(() => usePlotlyEventCallbacks(null));
    expect(result.current).toEqual({});
  });

  it('defines all handlers; unregistered ones are no-ops', () => {
    const { model, widget } = makeModel({ on_click: 'cb_0' });
    const { result } = renderHook(() => usePlotlyEventCallbacks(model));

    // All handlers are always defined; gating happens live inside each so they
    // stay in sync with the model's callbackMap, which is replaced when widget
    // data updates after this hook first runs.
    expect(result.current.onPlotlyClick).toBeDefined();
    expect(result.current.onPlotlySelected).toBeDefined();
    expect(result.current.onPlotlyDeselect).toBeDefined();
    expect(result.current.onPlotElementChange).toBeDefined();

    // Unregistered handlers do nothing when invoked.
    result.current.onPlotlyDeselect?.();
    result.current.onPlotlySelected?.({
      points: [],
    } as unknown as PlotSelectionEvent);
    expect(widget.sendMessage).not.toHaveBeenCalled();
  });

  describe('onPlotlyClick', () => {
    it('sends serialized points and modifiers for a non-preventable click', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClick?.({
        points: [
          {
            x: 5,
            y: 0.5,
            curveNumber: 2,
            data: { name: 'DOG', type: 'scatter' },
          },
        ],
      } as unknown as PlotMouseEvent);

      const sent = lastSent(widget);
      expect(sent.type).toBe('CALLABLE_EVENT');
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.request_id).toBeUndefined();
      expect(sent.args).toEqual({
        points: [
          {
            x: 5,
            y: 0.5,
            trace_name: 'DOG',
            trace_type: 'scatter',
            curve_number: 2,
          },
        ],
        modifiers: NO_MODIFIERS,
      });
    });

    it('serializes extra data-space fields present on the point', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClick?.({
        points: [
          {
            lat: 10,
            lon: 20,
            location: 'US',
            curveNumber: 0,
            data: { name: 'X', type: 'scattergeo' },
          },
        ],
      } as unknown as PlotMouseEvent);

      const sent = lastSent(widget);
      expect(sent.args.points).toEqual([
        {
          lat: 10,
          lon: 20,
          location: 'US',
          trace_name: 'X',
          trace_type: 'scattergeo',
          curve_number: 0,
        },
      ]);
    });

    it('does nothing for a preventable click on hierarchical traces', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' }, ['cb_0']);
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClick?.({
        points: [{ curveNumber: 0, data: { name: 'All', type: 'sunburst' } }],
      } as unknown as PlotMouseEvent);

      expect(widget.sendMessage).not.toHaveBeenCalled();
    });

    it('still fires for non-hierarchical traces in a preventable figure', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' }, ['cb_0']);
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClick?.({
        points: [
          {
            x: 1,
            y: 2,
            curveNumber: 0,
            data: { name: 'DOG', type: 'scatter' },
          },
        ],
      } as unknown as PlotMouseEvent);

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args.points[0].trace_type).toBe('scatter');
    });

    it('includes xvals/yvals for a clickanywhere empty-area click', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClick?.({
        points: [],
        xvals: [5],
        yvals: [0.5],
      } as unknown as PlotMouseEvent);

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args).toEqual({
        points: [],
        xvals: [5],
        yvals: [0.5],
        modifiers: NO_MODIFIERS,
      });
    });

    it('does not fire an empty-area click when preventable and hierarchical', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' }, ['cb_0']);
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      // Empty points on a preventable figure should still send (guards against
      // [].every() returning true and swallowing clickanywhere events).
      result.current.onPlotlyClick?.({
        points: [],
        xvals: [1],
        yvals: [2],
      } as unknown as PlotMouseEvent);

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args.xvals).toEqual([1]);
    });
  });

  describe('onPlotlySelected', () => {
    it('sends points, range, and modifiers', () => {
      const { model, widget } = makeModel({ on_selected: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlySelected?.({
        points: [
          {
            x: 1,
            y: 2,
            curveNumber: 0,
            data: { name: 'DOG', type: 'scatter' },
          },
        ],
        range: { x: [0, 10], y: [0, 5] },
      } as unknown as PlotSelectionEvent);

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args.range).toEqual({ x: [0, 10], y: [0, 5] });
      expect(sent.args.modifiers).toEqual(NO_MODIFIERS);
    });

    it('does nothing when the event is undefined', () => {
      const { model, widget } = makeModel({ on_selected: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlySelected?.(undefined);

      expect(widget.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('onPlotlyDeselect', () => {
    it('sends modifiers only', () => {
      const { model, widget } = makeModel({ on_deselect: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyDeselect?.();

      expect(lastSent(widget).args).toEqual({ modifiers: NO_MODIFIERS });
    });
  });

  describe('onPlotlyClickAnnotation', () => {
    it('sends index, annotation, and modifiers', () => {
      const { model, widget } = makeModel({ on_click_annotation: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClickAnnotation?.({
        index: 1,
        annotation: { text: 'Spike', x: 3, y: 4 },
      } as unknown as ClickAnnotationEvent);

      expect(lastSent(widget).args).toEqual({
        index: 1,
        annotation: { text: 'Spike', x: 3, y: 4 },
        modifiers: NO_MODIFIERS,
      });
    });
  });

  describe('onPlotlyDoubleClick', () => {
    it('sends modifiers when on_double_click is registered', () => {
      const { model, widget } = makeModel({ on_double_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyDoubleClick?.();

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args).toEqual({ modifiers: NO_MODIFIERS });
    });

    it('does nothing when not registered', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyDoubleClick?.();

      expect(widget.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('onPlotlyWebGlContextLost', () => {
    it('sends modifiers when registered', () => {
      const { model, widget } = makeModel({ on_web_gl_context_lost: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyWebGlContextLost?.();

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args).toEqual({ modifiers: NO_MODIFIERS });
    });
  });

  describe('onPlotlyRelayout', () => {
    it('debounces changes and includes modifiers', () => {
      jest.useFakeTimers();
      const { model, widget } = makeModel({ on_relayout: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyRelayout?.({ 'xaxis.range[0]': 0 });
      result.current.onPlotlyRelayout?.({ 'xaxis.range[1]': 10 });
      expect(widget.sendMessage).not.toHaveBeenCalled();

      jest.advanceTimersByTime(150);

      expect(lastSent(widget).args).toEqual({
        'xaxis.range[0]': 0,
        'xaxis.range[1]': 10,
        modifiers: NO_MODIFIERS,
      });
      jest.useRealTimers();
    });
  });

  describe('onPlotlyLegendClick', () => {
    it('returns true (allows default) when not registered', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      const returned = result.current.onPlotlyLegendClick?.({
        curveNumber: 0,
        data: [],
      } as unknown as LegendClickEvent);

      expect(returned).toBe(true);
      expect(widget.sendMessage).not.toHaveBeenCalled();
    });

    it('prevents the default, debounces, sends a request, and restyles when allowed', async () => {
      jest.useFakeTimers();
      const { model, widget } = makeModel({ on_legend_click: 'cb_0' }, [
        'cb_0',
      ]);
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));
      const gd = { on: jest.fn(), data: [{ visible: true }] };
      result.current.onPlotElementChange?.(gd as unknown as HTMLElement);

      const returned = result.current.onPlotlyLegendClick?.({
        curveNumber: 0,
        data: [{ name: 'DOG' }],
      } as unknown as LegendClickEvent);
      expect(returned).toBe(false);

      // Not sent yet (debounced)
      expect(widget.sendMessage).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.request_id).toBeDefined();
      expect(sent.args).toEqual({
        trace_name: 'DOG',
        curve_number: 0,
        modifiers: NO_MODIFIERS,
      });

      model.handleCallableResponse({
        request_id: sent.request_id as string,
        result: true,
      });
      await jest.advanceTimersByTimeAsync(0);

      expect(Plotly.restyle).toHaveBeenCalledWith(
        gd,
        { visible: 'legendonly' },
        [0]
      );
      jest.useRealTimers();
    });

    it('does not restyle when the callback prevents it', async () => {
      jest.useFakeTimers();
      const { model, widget } = makeModel({ on_legend_click: 'cb_0' }, [
        'cb_0',
      ]);
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));
      const gd = { on: jest.fn(), data: [{ visible: true }] };
      result.current.onPlotElementChange?.(gd as unknown as HTMLElement);

      result.current.onPlotlyLegendClick?.({
        curveNumber: 0,
        data: [{ name: 'DOG' }],
      } as unknown as LegendClickEvent);

      jest.advanceTimersByTime(300);

      const sent = lastSent(widget);
      model.handleCallableResponse({
        request_id: sent.request_id as string,
        result: false,
      });
      await jest.advanceTimersByTimeAsync(0);

      expect(Plotly.restyle).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('onPlotlyLegendDoubleClick', () => {
    it('returns true (allows default) when nothing is registered', () => {
      const { model } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      const returned = result.current.onPlotlyLegendDoubleClick?.({
        curveNumber: 0,
        data: [],
      } as unknown as LegendClickEvent);

      expect(returned).toBe(true);
    });

    it('cancels pending legend click debounce on double-click', () => {
      jest.useFakeTimers();
      const { model, widget } = makeModel(
        { on_legend_click: 'cb_0', on_legend_double_click: 'cb_1' },
        ['cb_0', 'cb_1']
      );
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));
      const gd = { on: jest.fn(), data: [{ visible: true }] };
      result.current.onPlotElementChange?.(gd as unknown as HTMLElement);

      // First click of double-click
      result.current.onPlotlyLegendClick?.({
        curveNumber: 0,
        data: [{ name: 'DOG' }],
      } as unknown as LegendClickEvent);

      // Double-click arrives before debounce expires
      result.current.onPlotlyLegendDoubleClick?.({
        curveNumber: 0,
        data: [{ name: 'DOG' }],
      } as unknown as LegendClickEvent);

      jest.advanceTimersByTime(300);

      // Only the double-click callback should have been sent
      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_1');
      expect(widget.sendMessage).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('modifiers', () => {
    it('defaults modifiers to all false', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      result.current.onPlotlyClick?.({
        points: [{ x: 1, y: 2, curveNumber: 0, data: {} }],
      } as unknown as PlotMouseEvent);

      expect(lastSent(widget).args.modifiers).toEqual(NO_MODIFIERS);
    });

    it('captures modifier keys held during a document pointerdown', () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      document.dispatchEvent(
        new MouseEvent('pointerdown', { shiftKey: true, metaKey: true })
      );

      result.current.onPlotlyClick?.({
        points: [{ x: 1, y: 2, curveNumber: 0, data: {} }],
      } as unknown as PlotMouseEvent);

      expect(lastSent(widget).args.modifiers).toEqual({
        shift: true,
        ctrl: false,
        alt: false,
        meta: true,
      });
    });

    it('removes the document pointerdown listener on unmount', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      const { model } = makeModel({ on_click: 'cb_0' });
      const { unmount } = renderHook(() => usePlotlyEventCallbacks(model));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function),
        true
      );
      removeSpy.mockRestore();
    });
  });

  describe('hierarchical drill-down wiring (onPlotElementChange)', () => {
    it('wires sunburst/treemap/icicle handlers that prevent default and send modifiers', async () => {
      const { model, widget } = makeModel({ on_click: 'cb_0' }, ['cb_0']);
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      const handlers: Record<string, (data: unknown) => unknown> = {};
      const gd = {
        on: (name: string, cb: (data: unknown) => unknown) => {
          handlers[name] = cb;
        },
        data: [],
      };
      result.current.onPlotElementChange?.(gd as unknown as HTMLElement);

      // Wiring is deferred to a microtask so it registers after react-plotly.js.
      await Promise.resolve();

      expect(typeof handlers.plotly_sunburstclick).toBe('function');
      expect(typeof handlers.plotly_treemapclick).toBe('function');
      expect(typeof handlers.plotly_icicleclick).toBe('function');

      const returned = handlers.plotly_sunburstclick({
        points: [
          {
            label: 'A',
            parent: '',
            value: 10,
            id: 'A',
            curveNumber: 0,
            data: { name: 'X', type: 'sunburst' },
          },
        ],
        nextLevel: 'A',
      });
      expect(returned).toBe(false);

      const sent = lastSent(widget);
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.request_id).toBeDefined();
      expect(sent.args).toEqual({
        points: [
          {
            label: 'A',
            parent: '',
            value: 10,
            id: 'A',
            trace_name: 'X',
            trace_type: 'sunburst',
            curve_number: 0,
          },
        ],
        next_level: 'A',
        modifiers: NO_MODIFIERS,
      });
    });

    it('does not wire hierarchical handlers when on_click is not preventable', async () => {
      const { model } = makeModel({ on_click: 'cb_0' });
      const { result } = renderHook(() => usePlotlyEventCallbacks(model));

      const onSpy = jest.fn();
      result.current.onPlotElementChange?.({
        on: onSpy,
        data: [],
      } as unknown as HTMLElement);
      await Promise.resolve();

      expect(onSpy).not.toHaveBeenCalled();
    });
  });
});
