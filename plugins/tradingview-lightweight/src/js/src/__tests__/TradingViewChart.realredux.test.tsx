/**
 * FAITHFUL integration test of the timezone wiring using the REAL
 * @deephaven/redux store, the REAL updateSettings action (what the Settings
 * dropdown dispatches), and the REAL getTimeZone selector — nothing about the
 * redux layer is mocked. This reproduces the exact path the user exercises
 * when changing the timezone in the Settings sidebar, without a DH server.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store, updateSettings } from '@deephaven/redux';
import TradingViewChart from '../TradingViewChart';
import TradingViewChartModel from '../TradingViewChartModel';

// Regression guard: the DH client's plugin require shim does NOT provide
// `@deephaven/redux`, so it must be BUNDLED, not externalized. Externalizing
// it makes the plugin fail to load entirely ("Could not require
// '@deephaven/redux'"). Importing it is fine (plotly-express does the same) as
// long as it is absent from vite.config externals. This test fails if it is
// ever added back to externals. (react-redux/redux ARE client-provided, so
// they stay externalized.)
it('does not externalize @deephaven/redux (must be bundled)', () => {
  const vite = fs.readFileSync(
    path.join(__dirname, '..', '..', 'vite.config.ts'),
    'utf8'
  );
  const externalBlock = vite.slice(
    vite.indexOf('external:'),
    vite.indexOf(']', vite.indexOf('external:'))
  );
  expect(externalBlock).not.toContain('@deephaven/redux');
});

jest.mock('@deephaven/jsapi-bootstrap', () => {
  const dh = {
    Widget: { EVENT_MESSAGE: 'message', EVENT_CLOSE: 'close' },
    Table: { EVENT_UPDATED: 'updated', EVENT_DISCONNECT: 'd', EVENT_RECONNECT: 'r' },
    DateWrapper: { ofJsDate: (d: Date) => ({ asDate: () => d }) },
    plot: {
      ChartData: function ChartData() {
        return { update: () => undefined, getColumn: () => [] };
      },
      Downsample: { runChartDownsample: () => undefined },
    },
  };
  return { useApi: () => dh };
});

jest.mock('../TradingViewTheme', () => {
  const actual = jest.requireActual('../TradingViewTheme');
  return {
    ...actual,
    useDHChartTheme: () => ({
      paperBgColor: '#111', plotBgColor: '#111', textColor: '#eee',
      gridColor: '#333', lineColor: '#555', zeroLineColor: '#777',
      crosshairLabelBgColor: '#444', fontFamily: 'sans-serif',
      ohlcIncreasing: '#0a0', ohlcDecreasing: '#a00', colorway: ['#48a', '#f81'],
    }),
  };
});

class MockResizeObserver {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}
(global as unknown as { ResizeObserver: unknown }).ResizeObserver = MockResizeObserver;

class MockTable {
  size = 10;

  columns = [
    { name: 'Timestamp', type: 'io.deephaven.time.DateTime' },
    { name: 'Value', type: 'double' },
  ];

  addEventListener = jest.fn(() => () => undefined);

  removeEventListener = jest.fn();

  subscribe = jest.fn(() => ({
    addEventListener: jest.fn(() => () => undefined),
    close: jest.fn(),
  }));

  close = jest.fn();
}

function makeWidget() {
  const table = new MockTable();
  return {
    addEventListener: jest.fn(() => () => undefined),
    removeEventListener: jest.fn(),
    exportedObjects: [{ fetch: jest.fn().mockResolvedValue(table) }],
    getDataAsString: jest.fn(() =>
      JSON.stringify({
        type: 'NEW_FIGURE',
        figure: {
          chartType: 'standard',
          chartOptions: {},
          series: [{ id: 's0', type: 'Line', options: {}, dataMapping: { tableId: 0, columns: { time: 'Timestamp', value: 'Value' } } }],
          deephaven: { mappings: [] },
        },
        revision: 1,
        new_references: [0],
        removed_references: [],
      })
    ),
  };
}

it('changing the real redux timezone setting pushes it into the model', async () => {
  const setTimeZoneSpy = jest.spyOn(TradingViewChartModel.prototype, 'setTimeZone');
  const widget = makeWidget();
  const props = {
    fetch: () => Promise.resolve(widget),
    metadata: {},
  } as unknown as React.ComponentProps<typeof TradingViewChart>;

  await act(async () => {
    render(
      <Provider store={store}>
        <TradingViewChart {...props} />
      </Provider>
    );
  });

  // The Settings dropdown dispatches exactly this.
  await act(async () => {
    store.dispatch(updateSettings({ timeZone: 'Asia/Tokyo' }) as never);
  });

  await waitFor(() =>
    expect(setTimeZoneSpy).toHaveBeenCalledWith('Asia/Tokyo')
  );

  setTimeZoneSpy.mockRestore();
});
