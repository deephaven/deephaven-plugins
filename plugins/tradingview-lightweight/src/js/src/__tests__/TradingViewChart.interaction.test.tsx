import React from 'react';
import { act, render } from '@testing-library/react';
import TradingViewChart from '../TradingViewChart';

const mockFigure = {
  chartType: 'standard',
  chartOptions: {},
  series: [
    {
      id: 's0',
      type: 'Area',
      options: {},
      dataMapping: {
        tableId: 0,
        columns: { time: 'Timestamp', value: 'Value' },
      },
    },
  ],
  deephaven: { mappings: [] },
  downsampleMeta: {
    0: {
      tableSize: 10_000,
      timeCol: 'Timestamp',
      valueCols: ['Value'],
      seriesTypes: ['Area'],
    },
  },
};

const mockColumnData = new Map<string, unknown[]>([
  ['Timestamp', [0, 50, 100, 101]],
  ['Value', [10, 11, 12, 13]],
]);

let mockVisibleRange = { from: 0, to: 100 };
const mockVisibleRangeHandlers: Array<() => void> = [];
const mockSizeHandlers: Array<() => void> = [];
const mockModelInstances: unknown[] = [];
const mockRendererInstances: unknown[] = [];
const mockDh = {};
const mockChartTheme = {
  paperBgColor: '#111',
  plotBgColor: '#111',
  textColor: '#eee',
  gridColor: '#333',
  lineColor: '#555',
  zeroLineColor: '#777',
  crosshairLabelBgColor: '#444',
  fontFamily: 'sans-serif',
  ohlcIncreasing: '#0a0',
  ohlcDecreasing: '#a00',
  colorway: ['#48a', '#f81'],
};

const mockTimeScale = {
  getVisibleRange: jest.fn(() => mockVisibleRange),
  setVisibleRange: jest.fn(range => {
    mockVisibleRange = range;
  }),
  width: jest.fn(() => 1000),
};

const mockChart = {
  timeScale: jest.fn(() => mockTimeScale),
  applyOptions: jest.fn(),
};

jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => 'UTC'),
}));

jest.mock('@deephaven/redux', () => ({
  getTimeZone: jest.fn(),
}));

jest.mock('@deephaven/jsapi-bootstrap', () => ({
  useApi: jest.fn(() => mockDh),
}));

jest.mock('../TradingViewTheme', () => ({
  useDHChartTheme: jest.fn(() => mockChartTheme),
  chartThemeToOptions: jest.fn(() => ({})),
  getColorway: jest.fn(() => ['#48a']),
  getOhlcColors: jest.fn(() => ({
    upColor: '#0a0',
    downColor: '#a00',
    borderUpColor: '#0a0',
    borderDownColor: '#a00',
    wickUpColor: '#0a0',
    wickDownColor: '#a00',
  })),
}));

jest.mock('../TradingViewChartRenderer', () => {
  class MockRenderer {
    setChartType = jest.fn();

    applyOptions = jest.fn();

    configureSeries = jest.fn();

    applyPaneStretchFactors = jest.fn();

    getChartType = jest.fn(() => 'standard');

    getChart = jest.fn(() => mockChart);

    setSeriesData = jest.fn();

    updateSeriesPoint = jest.fn();

    setSeriesMarkers = jest.fn();

    updateDynamicPriceLines = jest.fn();

    isScaffoldEnabled = jest.fn(() => false);

    setScaffoldData = jest.fn();

    fitContent = jest.fn();

    getTimeScaleWidth = jest.fn(() => mockTimeScale.width());

    resetPriceScales = jest.fn();

    subscribeVisibleLogicalRangeChange = jest.fn(handler => {
      mockVisibleRangeHandlers.push(handler);
      return () => undefined;
    });

    subscribeSizeChange = jest.fn(handler => {
      mockSizeHandlers.push(handler);
      return () => undefined;
    });

    subscribeClick = jest.fn(() => () => undefined);

    subscribeDblClick = jest.fn(() => () => undefined);

    hasTooltip = jest.fn(() => false);

    setupTooltip = jest.fn(() => () => undefined);

    resize = jest.fn();

    dispose = jest.fn();

    getTextColor = jest.fn(() => '#eee');

    timeToCoordinate = jest.fn(() => null);

    priceToCoordinate = jest.fn(() => null);

    getSeriesIds = jest.fn(() => ['s0']);

    constructor() {
      mockRendererInstances.push(this);
    }
  }

  return {
    __esModule: true,
    default: MockRenderer,
  };
});

jest.mock('../TradingViewChartModel', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    const listeners: Array<(event: unknown) => void> = [];
    const model = {
      subscribe: jest.fn(listener => {
        listeners.push(listener);
        return () => undefined;
      }),
      emit: (event: unknown) => {
        listeners.forEach(listener => listener(event));
      },
      init: jest.fn(async () => undefined),
      close: jest.fn(),
      setTimeZone: jest.fn(),
      setChartType: jest.fn(),
      setDebugFn: jest.fn(),
      getFigureData: jest.fn(() => mockFigure),
      getColumnData: jest.fn(() => mockColumnData),
      isResampling: jest.fn(() => true),
      isDownsampled: jest.fn(() => true),
      isAutoBinned: jest.fn(() => false),
      getDownsampledTableIds: jest.fn(() => new Set([0])),
      getAutoBinMeta: jest.fn(() => ({})),
      getAutoBinBodyRange: jest.fn(() => null),
      getTable: jest.fn(() => ({ size: 1000 })),
      isReady: jest.fn(() => true),
      getTimeZone: jest.fn(() => 'UTC'),
      getEnabledHandlers: jest.fn(() => []),
      performResample: jest.fn(),
      performAutoBin: jest.fn(),
    };
    mockModelInstances.push(model);
    return model;
  }),
}));

const MockResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

(global as unknown as { ResizeObserver: unknown }).ResizeObserver =
  MockResizeObserver;

function makeWidget() {
  return {
    addEventListener: jest.fn(() => () => undefined),
    removeEventListener: jest.fn(),
    exportedObjects: [],
    getDataAsString: jest.fn(() =>
      JSON.stringify({
        type: 'NEW_FIGURE',
        figure: mockFigure,
        revision: 1,
        new_references: [0],
        removed_references: [],
      })
    ),
  };
}

async function renderChart() {
  const widget = makeWidget();
  const result = render(
    <TradingViewChart fetch={() => Promise.resolve(widget)} metadata={{}} />
  );

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(mockRendererInstances).toHaveLength(1);
  expect(mockModelInstances).toHaveLength(1);
  return result;
}

function emitDataUpdate(event: Record<string, unknown>): void {
  const model = mockModelInstances[0] as { emit: (e: unknown) => void };
  act(() => {
    model.emit({
      type: 'DATA_UPDATED',
      tableId: 0,
      isInitialLoad: false,
      addedCount: 0,
      removedCount: 0,
      modifiedCount: 0,
      isDownsampleSwap: false,
      ...event,
    });
  });
}

function dispatchPointerDown(element: Element): void {
  act(() => {
    element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  });
}

describe('TradingViewChart drag viewport handling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockVisibleRange = { from: 0, to: 100 };
    mockVisibleRangeHandlers.length = 0;
    mockSizeHandlers.length = 0;
    mockModelInstances.length = 0;
    mockRendererInstances.length = 0;
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('does not fit content when a tick arrives during an active drag', async () => {
    const { container } = await renderChart();
    const renderer = mockRendererInstances[0] as { fitContent: jest.Mock };
    const chartContainer = container.querySelector('.dh-tvl-chart');
    expect(chartContainer).not.toBeNull();

    renderer.fitContent.mockClear();
    mockTimeScale.setVisibleRange.mockClear();
    dispatchPointerDown(chartContainer as Element);
    emitDataUpdate({ addedCount: 1 });

    expect(renderer.fitContent).not.toHaveBeenCalled();
    expect(mockTimeScale.setVisibleRange).not.toHaveBeenCalled();
  });

  it('restores the live drag range when a downsample swap arrives mid-drag', async () => {
    const { container } = await renderChart();
    const model = mockModelInstances[0] as {
      performResample: jest.Mock;
    };
    const chartContainer = container.querySelector('.dh-tvl-chart');
    expect(chartContainer).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    mockVisibleRange = { from: 10, to: 60 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });
    expect(model.performResample).toHaveBeenCalledWith([0, 70], 1000);

    dispatchPointerDown(chartContainer as Element);
    mockVisibleRange = { from: 20, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
    });

    mockTimeScale.setVisibleRange.mockClear();
    emitDataUpdate({ isDownsampleSwap: true });

    expect(mockTimeScale.setVisibleRange).toHaveBeenCalledWith({
      from: 20,
      to: 70,
    });
    expect(mockTimeScale.setVisibleRange).not.toHaveBeenCalledWith({
      from: 10,
      to: 60,
    });
  });
});
