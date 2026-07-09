import { PlotlyExpressChartModel } from './PlotlyExpressChartModel';
import { TestUtils } from '@deephaven/test-utils';
import { type dh as DhType } from '@deephaven/jsapi-types';
import type {
  PlotMouseEvent,
  PlotSelectionEvent,
  LegendClickEvent,
  ClickAnnotationEvent,
} from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import { type PlotlyChartWidgetData } from './PlotlyExpressChartUtils';

// plotly.js-dist-min pulls in browser/WebGL APIs that jsdom can't load, so mock
// it. The model only uses Plotly.animate/restyle for programmatic re-triggers.
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

/** Flush all pending microtasks (e.g. chained promise callbacks). */
const flushPromises = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, 0);
  });

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

describe('PlotlyExpressChartModel - Event Callbacks', () => {
  let model: PlotlyExpressChartModel;

  describe('callback map parsing', () => {
    it('parses callbacks from widget data', () => {
      const widget = createMockWidgetWithCallbacks(
        { on_click: 'cb_0', on_selected: 'cb_1' },
        []
      );
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      const callbackMap = model.getCallbackMap();
      expect(callbackMap.get('on_click')).toBe('cb_0');
      expect(callbackMap.get('on_selected')).toBe('cb_1');
    });

    it('sets empty callback map when no callbacks', () => {
      const widget = createMockWidgetWithCallbacks(undefined, undefined);
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      expect(model.getCallbackMap().size).toBe(0);
    });

    it('parses preventable_callbacks', () => {
      const widget = createMockWidgetWithCallbacks(
        { on_legend_click: 'cb_0' },
        ['cb_0']
      );
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      expect(model.isPreventable('cb_0')).toBe(true);
      expect(model.isPreventable('cb_1')).toBe(false);
    });
  });

  describe('sendEventCallback', () => {
    it('sends fire-and-forget message', () => {
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      model.sendEventCallback('cb_0', { points: [{ x: 1 }] });

      expect(widget.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('"type":"CALLABLE_EVENT"'),
        []
      );
      const sent = JSON.parse(
        (widget.sendMessage as jest.Mock).mock.calls[0][0]
      );
      expect(sent.callback_id).toBe('cb_0');
      expect(sent.args).toEqual({ points: [{ x: 1 }] });
      expect(sent.request_id).toBeUndefined();
    });
  });

  describe('sendEventCallbackWithResponse', () => {
    it('sends message with request_id and returns promise', async () => {
      const widget = createMockWidgetWithCallbacks(
        { on_legend_click: 'cb_0' },
        ['cb_0']
      );
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      const promise = model.sendEventCallbackWithResponse('cb_0', {
        trace_name: 'DOG',
      });

      const sent = JSON.parse(
        (widget.sendMessage as jest.Mock).mock.calls[0][0]
      );
      expect(sent.request_id).toBeDefined();
      expect(sent.type).toBe('CALLABLE_EVENT');

      // Simulate response
      model.handleCallableResponse({
        request_id: sent.request_id,
        result: false,
      });

      const result = await promise;
      expect(result).toBe(false);
    });

    it('resolves to true when result is not false', async () => {
      const widget = createMockWidgetWithCallbacks(
        { on_legend_click: 'cb_0' },
        ['cb_0']
      );
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      const promise = model.sendEventCallbackWithResponse('cb_0', {});

      const sent = JSON.parse(
        (widget.sendMessage as jest.Mock).mock.calls[0][0]
      );
      model.handleCallableResponse({
        request_id: sent.request_id,
        result: true,
      });

      const result = await promise;
      expect(result).toBe(true);
    });

    it('resolves to true when result is null/None', async () => {
      const widget = createMockWidgetWithCallbacks(
        { on_legend_click: 'cb_0' },
        ['cb_0']
      );
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      const promise = model.sendEventCallbackWithResponse('cb_0', {});

      const sent = JSON.parse(
        (widget.sendMessage as jest.Mock).mock.calls[0][0]
      );
      model.handleCallableResponse({
        request_id: sent.request_id,
        result: null as unknown,
      });

      const result = await promise;
      expect(result).toBe(true);
    });
  });

  describe('handleCallableResponse', () => {
    it('ignores unknown request_ids', () => {
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      // Should not throw
      model.handleCallableResponse({
        request_id: 'unknown-id',
        result: false,
      });
    });
  });

  describe('widget message handling', () => {
    it('routes CALLABLE_RESPONSE to handleCallableResponse', async () => {
      const widget = createMockWidgetWithCallbacks(
        { on_legend_click: 'cb_0' },
        ['cb_0']
      );
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      // Subscribe to set up the event listener
      await model.subscribe(jest.fn());

      // Send a request
      const promise = model.sendEventCallbackWithResponse('cb_0', {});
      const sent = JSON.parse(
        (widget.sendMessage as jest.Mock).mock.calls[0][0]
      );

      // Simulate the widget firing the response as EVENT_MESSAGE
      const eventListenerCall = (widget.addEventListener as jest.Mock).mock
        .calls[0];
      const messageHandler = eventListenerCall[1];

      messageHandler({
        detail: {
          getDataAsString: () =>
            JSON.stringify({
              type: 'CALLABLE_RESPONSE',
              request_id: sent.request_id,
              result: false,
            }),
          exportedObjects: [],
        },
      });

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('modifiers', () => {
    beforeEach(() => {
      (Plotly.restyle as jest.Mock).mockClear();
      (Plotly.animate as jest.Mock).mockClear();
    });

    it('adds and removes the document pointerdown listener on subscribe/unsubscribe', async () => {
      const addSpy = jest.spyOn(document, 'addEventListener');
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      await model.subscribe(jest.fn());
      expect(addSpy).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function),
        true
      );

      model.unsubscribe(jest.fn());
      expect(removeSpy).toHaveBeenCalledWith(
        'pointerdown',
        expect.any(Function),
        true
      );

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('defaults modifiers to all false', () => {
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      model.onClick({
        points: [{ x: 1, y: 2, curveNumber: 0, data: {} }],
      } as unknown as PlotMouseEvent);

      expect(lastSent(widget).args.modifiers).toEqual(NO_MODIFIERS);
    });

    it('captures modifier keys held during a document pointerdown', async () => {
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());
      await model.subscribe(jest.fn());

      document.dispatchEvent(
        new MouseEvent('pointerdown', { shiftKey: true, metaKey: true })
      );

      model.onClick({
        points: [{ x: 1, y: 2, curveNumber: 0, data: {} }],
      } as unknown as PlotMouseEvent);

      expect(lastSent(widget).args.modifiers).toEqual({
        shift: true,
        ctrl: false,
        alt: false,
        meta: true,
      });

      model.unsubscribe(jest.fn());
    });
  });

  describe('event forwarding from Plotly component props', () => {
    beforeEach(() => {
      (Plotly.restyle as jest.Mock).mockClear();
      (Plotly.animate as jest.Mock).mockClear();
    });

    describe('onClick', () => {
      it('sends points and modifiers for a non-preventable click', () => {
        const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onClick({
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

      it('does nothing when on_click is not registered', () => {
        const widget = createMockWidgetWithCallbacks({ on_selected: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onClick({ points: [] } as unknown as PlotMouseEvent);

        expect(widget.sendMessage).not.toHaveBeenCalled();
      });

      it('does nothing for a preventable click on hierarchical traces', () => {
        const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' }, [
          'cb_0',
        ]);
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onClick({
          points: [
            {
              curveNumber: 0,
              data: { name: 'All', type: 'sunburst' },
            },
          ],
        } as unknown as PlotMouseEvent);

        expect(widget.sendMessage).not.toHaveBeenCalled();
      });

      it('still fires for non-hierarchical traces in a preventable figure', () => {
        const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' }, [
          'cb_0',
        ]);
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onClick({
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
    });

    describe('onSelected', () => {
      it('sends points, range, and modifiers', () => {
        const widget = createMockWidgetWithCallbacks({ on_selected: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onSelected({
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
        expect(sent.args.points).toEqual([
          {
            x: 1,
            y: 2,
            trace_name: 'DOG',
            trace_type: 'scatter',
            curve_number: 0,
          },
        ]);
        expect(sent.args.range).toEqual({ x: [0, 10], y: [0, 5] });
        expect(sent.args.modifiers).toEqual(NO_MODIFIERS);
      });

      it('does nothing when the event is undefined', () => {
        const widget = createMockWidgetWithCallbacks({ on_selected: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onSelected(undefined);

        expect(widget.sendMessage).not.toHaveBeenCalled();
      });
    });

    describe('onDeselect', () => {
      it('sends modifiers only', () => {
        const widget = createMockWidgetWithCallbacks({ on_deselect: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onDeselect();

        expect(lastSent(widget).args).toEqual({ modifiers: NO_MODIFIERS });
      });

      it('does nothing when on_deselect is not registered', () => {
        const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onDeselect();

        expect(widget.sendMessage).not.toHaveBeenCalled();
      });
    });

    describe('onClickAnnotation', () => {
      it('sends index, annotation, and modifiers', () => {
        const widget = createMockWidgetWithCallbacks({
          on_click_annotation: 'cb_0',
        });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onClickAnnotation({
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

    describe('onLegendClick', () => {
      it('allows the default (returns true) when not registered', () => {
        const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        const result = model.onLegendClick({
          curveNumber: 0,
          data: [],
        } as unknown as LegendClickEvent);

        expect(result).toBe(true);
        expect(widget.sendMessage).not.toHaveBeenCalled();
      });

      it('prevents the default, debounces, sends a request, and restyles when allowed', async () => {
        jest.useFakeTimers();
        const widget = createMockWidgetWithCallbacks(
          { on_legend_click: 'cb_0' },
          ['cb_0']
        );
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());
        const gd = { on: jest.fn(), data: [{ visible: true }] };
        model.setPlotElement(gd as unknown as HTMLElement);

        const result = model.onLegendClick({
          curveNumber: 0,
          data: [{ name: 'DOG' }],
        } as unknown as LegendClickEvent);
        expect(result).toBe(false);

        // Not sent yet (debounced)
        expect(widget.sendMessage).not.toHaveBeenCalled();

        // Advance past debounce delay
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
        // Flush the promise .then() microtask
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
        const widget = createMockWidgetWithCallbacks(
          { on_legend_click: 'cb_0' },
          ['cb_0']
        );
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());
        const gd = { on: jest.fn(), data: [{ visible: true }] };
        model.setPlotElement(gd as unknown as HTMLElement);

        model.onLegendClick({
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

    describe('onLegendDoubleClick', () => {
      it('allows the default (returns true) when nothing is registered', () => {
        const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        const result = model.onLegendDoubleClick({
          curveNumber: 0,
          data: [],
        } as unknown as LegendClickEvent);

        expect(result).toBe(true);
      });

      it('cancels pending legend click debounce on double-click', () => {
        jest.useFakeTimers();
        const widget = createMockWidgetWithCallbacks(
          { on_legend_click: 'cb_0', on_legend_double_click: 'cb_1' },
          ['cb_0', 'cb_1']
        );
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());
        const gd = { on: jest.fn(), data: [{ visible: true }] };
        model.setPlotElement(gd as unknown as HTMLElement);

        // First click of double-click
        model.onLegendClick({
          curveNumber: 0,
          data: [{ name: 'DOG' }],
        } as unknown as LegendClickEvent);

        // Double-click arrives before debounce expires
        model.onLegendDoubleClick({
          curveNumber: 0,
          data: [{ name: 'DOG' }],
        } as unknown as LegendClickEvent);

        // Advance past debounce — single click should NOT fire
        jest.advanceTimersByTime(300);

        // Only the double-click callback should have been sent
        const sent = lastSent(widget);
        expect(sent.callback_id).toBe('cb_1');
        expect(widget.sendMessage).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
      });
    });

    describe('onRelayout', () => {
      it('debounces changes and includes modifiers', () => {
        jest.useFakeTimers();
        const widget = createMockWidgetWithCallbacks({ on_relayout: 'cb_0' });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onRelayout({ 'xaxis.range[0]': 0 });
        model.onRelayout({ 'xaxis.range[1]': 10 });
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

    describe('onDoubleClick', () => {
      it('sends event with modifiers when on_double_click is registered', () => {
        const widget = createMockWidgetWithCallbacks({
          on_double_click: 'cb_0',
        });
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onDoubleClick();

        const sent = lastSent(widget);
        expect(sent.callback_id).toBe('cb_0');
        expect(sent.args).toEqual({ modifiers: NO_MODIFIERS });
      });

      it('does nothing when on_double_click is not registered', () => {
        const widget = createMockWidgetWithCallbacks({});
        model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

        model.onDoubleClick();

        expect(widget.sendMessage).not.toHaveBeenCalled();
      });
    });
  });

  describe('hierarchical drill-down wiring (setPlotElement)', () => {
    it('wires sunburst/treemap/icicle handlers that prevent default and send modifiers', async () => {
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' }, [
        'cb_0',
      ]);
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      const handlers: Record<string, (data: unknown) => unknown> = {};
      const gd = {
        on: (name: string, cb: (data: unknown) => unknown) => {
          handlers[name] = cb;
        },
        data: [],
      };
      model.setPlotElement(gd as unknown as HTMLElement);

      // Wiring is deferred to a microtask so it registers after react-plotly.js.
      await Promise.resolve();

      expect(typeof handlers.plotly_sunburstclick).toBe('function');
      expect(typeof handlers.plotly_treemapclick).toBe('function');
      expect(typeof handlers.plotly_icicleclick).toBe('function');

      const result = handlers.plotly_sunburstclick({
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
      expect(result).toBe(false);

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
      const widget = createMockWidgetWithCallbacks({ on_click: 'cb_0' });
      model = new PlotlyExpressChartModel(mockDh, widget, jest.fn());

      const onSpy = jest.fn();
      model.setPlotElement({
        on: onSpy,
        data: [],
      } as unknown as HTMLElement);
      await Promise.resolve();

      expect(onSpy).not.toHaveBeenCalled();
    });
  });
});
