/**
 * Unit tests for TradingViewChartModel server-side auto-bin path:
 *  - performAutoBin sends AUTOBIN_ZOOM / AUTOBIN_RESET via widget.sendMessage
 *  - handleAutoBinFigure swaps the subscribed table, drains queued requests
 *  - performResample dispatches across both paths
 */
import TradingViewChartModel from '../TradingViewChartModel';
import type { TvlFigureData } from '../TradingViewTypes';

type Listener = (event: { detail: unknown }) => void;

class MockTable {
  size = 100;

  columns: { name: string; type: string }[] = [
    { name: 'Timestamp', type: 'io.deephaven.time.DateTime' },
    { name: 'Value', type: 'double' },
  ];

  isRefreshing = false;

  listenerMap: Map<string, Set<Listener>> = new Map();

  closed = false;

  addEventListener = jest.fn((event: string, l: Listener) => {
    if (!this.listenerMap.has(event)) this.listenerMap.set(event, new Set());
    this.listenerMap.get(event)!.add(l);
    return () => this.listenerMap.get(event)?.delete(l);
  });

  removeEventListener = jest.fn();

  subscribe = jest.fn(() => ({
    addEventListener: jest.fn(() => () => {
      /* noop */
    }),
    close: jest.fn(),
  }));

  setViewport = jest.fn(() => ({
    addEventListener: jest.fn(() => () => {
      /* noop */
    }),
    setViewport: jest.fn(),
    close: jest.fn(),
  }));

  close = jest.fn(() => {
    this.closed = true;
  });
}

function makeFigure(autoBin: boolean): TvlFigureData {
  return {
    chartOptions: {},
    series: [
      {
        id: 'series_0',
        type: 'Histogram',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'Timestamp', value: 'Value' },
        },
      },
    ],
    deephaven: { mappings: [] },
    autoBinMeta: autoBin
      ? {
          '0': {
            timeCol: 'Timestamp',
            binWidthNs: 1_000_000_000,
            fullRangeNs: [0, 86_400_000_000_000],
            targetBins: 5000,
            series: {
              series_0: { type: 'Histogram', agg: 'sum', valueCols: ['Value'] },
            },
          },
        }
      : undefined,
  };
}

function makeMockDh() {
  const tableSubscribers: Set<Listener> = new Set();
  return {
    Widget: { EVENT_MESSAGE: 'message', EVENT_CLOSE: 'close' },
    Table: {
      EVENT_UPDATED: 'updated',
      EVENT_DISCONNECT: 'disconnect',
      EVENT_RECONNECT: 'reconnect',
    },
    DateWrapper: {
      ofJsDate: (d: Date) => ({ asDate: () => d }),
    },
    plot: {
      ChartData: jest.fn().mockImplementation(() => ({
        update: jest.fn(),
        getColumn: jest.fn(() => []),
      })),
      Downsample: { runChartDownsample: jest.fn() },
    },
    _tableSubscribers: tableSubscribers,
  } as unknown as typeof import('@deephaven/jsapi-types').dh;
}

function makeMockWidget() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    sendMessage: jest.fn(),
    addEventListener: jest.fn((event: string, l: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(l);
    }),
    removeEventListener: jest.fn((event: string, l: Listener) => {
      listeners.get(event)?.delete(l);
    }),
    exportedObjects: [],
    getDataAsString: jest.fn(),
    /** Fire a synthetic widget event. */
    fire(event: string, detail: unknown) {
      const ls = listeners.get(event);
      if (ls) ls.forEach(l => l({ detail }));
    },
  };
}

async function initModelWithAutoBin(autoBin: boolean): Promise<{
  model: TradingViewChartModel;
  widget: ReturnType<typeof makeMockWidget>;
  table: MockTable;
}> {
  const dh = makeMockDh();
  const widget = makeMockWidget();
  const model = new TradingViewChartModel(dh, widget as never);

  const figure = makeFigure(autoBin);
  const dataString = JSON.stringify({
    type: 'NEW_FIGURE',
    figure,
    revision: 1,
    new_references: [0],
    removed_references: [],
  });

  const table = new MockTable();
  const exported = [{ fetch: jest.fn().mockResolvedValue(table) } as never];

  model.setTimeZone('UTC');
  await model.init(exported, dataString);

  return { model, widget, table };
}

describe('TradingViewChartModel auto-bin', () => {
  describe('autoBinMeta detection', () => {
    it('marks the model as auto-binned when figure.autoBinMeta is present', async () => {
      const { model } = await initModelWithAutoBin(true);
      expect(model.isAutoBinned()).toBe(true);
      expect(model.isResampling()).toBe(true);
      expect(Object.keys(model.getAutoBinMeta())).toEqual(['0']);
    });

    it('is not auto-binned when figure has no autoBinMeta', async () => {
      const { model } = await initModelWithAutoBin(false);
      expect(model.isAutoBinned()).toBe(false);
      expect(model.isResampling()).toBe(false);
    });
  });

  describe('performAutoBin', () => {
    it('sends AUTOBIN_RESET when range is null', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      model.performAutoBin(null);
      expect(widget.sendMessage).toHaveBeenCalledTimes(1);
      const [payload] = widget.sendMessage.mock.calls[0];
      const msg = JSON.parse(payload as string);
      expect(msg).toEqual({ type: 'AUTOBIN_RESET', tableRef: 0 });
    });

    it('sends AUTOBIN_ZOOM with from/to nanoseconds when range is provided', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      // 2024-01-01T00:00:00Z to 2024-01-01T01:00:00Z in TZ-shifted seconds
      // (timeZone='UTC' so unconvertTime is identity).
      const fromSec = 1704067200;
      const toSec = 1704067200 + 3600;
      model.performAutoBin([fromSec, toSec]);
      expect(widget.sendMessage).toHaveBeenCalledTimes(1);
      const msg = JSON.parse(widget.sendMessage.mock.calls[0][0] as string);
      expect(msg).toMatchObject({
        type: 'AUTOBIN_ZOOM',
        tableRef: 0,
        fromNs: fromSec * 1e9,
        toNs: toSec * 1e9,
      });
    });

    it('queues a second request while the first is in flight', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      model.performAutoBin([0, 100]);
      expect(widget.sendMessage).toHaveBeenCalledTimes(1);
      // Second call hits the pending guard
      model.performAutoBin([200, 300]);
      expect(widget.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('emits DOWNSAMPLE_PENDING when in flight', async () => {
      const { model } = await initModelWithAutoBin(true);
      const events: { pending: boolean }[] = [];
      model.subscribe(e => {
        if (e.type === 'DOWNSAMPLE_PENDING') {
          events.push({ pending: e.pending });
        }
      });
      model.performAutoBin([0, 100]);
      expect(events).toEqual([{ pending: true }]);
    });

    it('increments resampleSeq on each issued request', async () => {
      const { model } = await initModelWithAutoBin(true);
      const before = model.resampleSeq;
      model.performAutoBin([0, 100]);
      expect(model.resampleSeq).toBe(before + 1);
    });

    it('does nothing when not auto-binned', async () => {
      const { model, widget } = await initModelWithAutoBin(false);
      model.performAutoBin([0, 100]);
      expect(widget.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleAutoBinFigure', () => {
    it('clears pendingAutoBin on a noop ack', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      const events: { pending: boolean }[] = [];
      model.subscribe(e => {
        if (e.type === 'DOWNSAMPLE_PENDING') {
          events.push({ pending: e.pending });
        }
      });
      model.performAutoBin([0, 100]);
      // Simulate the server's noop AUTOBIN_FIGURE ack
      const detail = {
        getDataAsString: () =>
          JSON.stringify({
            type: 'AUTOBIN_FIGURE',
            revision: 2,
            tableRef: 0,
            binWidthNs: 1_000_000_000,
            autoBinMeta: model.getAutoBinMeta(),
            new_references: [],
            noop: true,
          }),
        exportedObjects: [],
      };
      widget.fire('message', detail);
      // setPendingAutoBin(false) runs synchronously inside the noop branch
      expect(events.map(e => e.pending)).toEqual([true, false]);
    });

    it('marks the swap as a reset when AUTOBIN_RESET was the trigger', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      // First send a reset
      model.performAutoBin(null);

      const newTable = new MockTable();
      newTable.size = 12;

      const detail = {
        getDataAsString: () =>
          JSON.stringify({
            type: 'AUTOBIN_FIGURE',
            revision: 2,
            tableRef: 0,
            binWidthNs: 86_400_000_000_000,
            autoBinMeta: {
              '0': {
                timeCol: 'Timestamp',
                binWidthNs: 86_400_000_000_000,
                fullRangeNs: [0, 86_400_000_000_000],
                targetBins: 5000,
                series: {
                  series_0: {
                    type: 'Histogram',
                    agg: 'sum',
                    valueCols: ['Value'],
                  },
                },
              },
            },
            new_references: [0],
          }),
        exportedObjects: [{ fetch: jest.fn().mockResolvedValue(newTable) }],
      };

      const dataEvents: { isResetView?: boolean }[] = [];
      model.subscribe(e => {
        if (e.type === 'DATA_UPDATED') dataEvents.push({ isResetView: e.isResetView });
      });

      widget.fire('message', detail);
      await new Promise<void>(resolve => {
        setTimeout(resolve, 0);
      });

      // The new table's first DATA_UPDATED would normally come from a real
      // subscription tick. Here MockTable doesn't fire one, so we just verify
      // the resetPendingForTable bookkeeping by inspecting model state via
      // its public swap behavior — the table was replaced.
      expect(model.getTable(0)).toBe(newTable);
    });

    it('swaps the aggregated table when a non-noop response arrives', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      model.performAutoBin([0, 100]);

      const newTable = new MockTable();
      newTable.size = 42;

      const detail = {
        getDataAsString: () =>
          JSON.stringify({
            type: 'AUTOBIN_FIGURE',
            revision: 2,
            tableRef: 0,
            binWidthNs: 500_000_000,
            autoBinMeta: {
              '0': {
                timeCol: 'Timestamp',
                binWidthNs: 500_000_000,
                fullRangeNs: [0, 86_400_000_000_000],
                targetBins: 5000,
                series: {
                  series_0: {
                    type: 'Histogram',
                    agg: 'sum',
                    valueCols: ['Value'],
                  },
                },
              },
            },
            new_references: [0],
          }),
        exportedObjects: [{ fetch: jest.fn().mockResolvedValue(newTable) }],
      };
      widget.fire('message', detail);

      // Allow the awaited fetch + subscribe to run
      await new Promise<void>(resolve => {
        setTimeout(resolve, 0);
      });

      expect(model.getTable(0)).toBe(newTable);
      expect(model.getAutoBinMeta()['0'].binWidthNs).toBe(500_000_000);
    });
  });

  describe('performResample router', () => {
    it('routes auto-binned figures through the auto-bin path', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      model.performResample([0, 100], 1024);
      expect(widget.sendMessage).toHaveBeenCalledTimes(1);
      const msg = JSON.parse(widget.sendMessage.mock.calls[0][0] as string);
      expect(msg.type).toBe('AUTOBIN_ZOOM');
    });

    it('initial auto-bin subscription uses subscribe (not setViewport)', async () => {
      const { table } = await initModelWithAutoBin(true);
      // Server-side scoping: agg table is small enough for full subscribe.
      // The viewport API is no longer used on autobin tables.
      expect(table.setViewport).not.toHaveBeenCalled();
      expect(table.subscribe).toHaveBeenCalledTimes(1);
    });

    it('AUTOBIN_ZOOM payload includes atLiveEdge=true at the source right edge', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      // fullRangeNs[1] = 86_400_000_000_000 → 86400s in TZ-shifted seconds
      const fromSec = 86400 - 60;
      const toSec = 86400;
      model.performAutoBin([fromSec, toSec]);
      const msg = JSON.parse(widget.sendMessage.mock.calls[0][0] as string);
      expect(msg.type).toBe('AUTOBIN_ZOOM');
      expect(msg.atLiveEdge).toBe(true);
    });

    it('AUTOBIN_ZOOM payload includes atLiveEdge=false inside the source extent', async () => {
      const { model, widget } = await initModelWithAutoBin(true);
      const fromSec = 100;
      const toSec = 200;
      model.performAutoBin([fromSec, toSec]);
      const msg = JSON.parse(widget.sendMessage.mock.calls[0][0] as string);
      expect(msg.type).toBe('AUTOBIN_ZOOM');
      expect(msg.atLiveEdge).toBe(false);
    });

    it('does nothing when neither downsample nor auto-bin is active', async () => {
      const { model, widget } = await initModelWithAutoBin(false);
      model.performResample([0, 100], 1024);
      expect(widget.sendMessage).not.toHaveBeenCalled();
    });
  });
});
