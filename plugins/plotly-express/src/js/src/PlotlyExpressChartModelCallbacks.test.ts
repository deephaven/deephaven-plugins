import { type dh as DhType } from '@deephaven/jsapi-types';
import { PlotlyExpressChartModel } from './PlotlyExpressChartModel';
import { type PlotlyChartWidgetData } from './PlotlyExpressChartUtils';

// plotly.js-dist-min pulls in browser/WebGL APIs that jsdom can't load, so mock
// it. The model doesn't use Plotly directly, but importing it transitively can.
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
});
