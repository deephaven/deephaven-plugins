import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import TradingViewChart from '../TradingViewChart';
import type { TvlLegendEntry } from '../TradingViewOverlayTypes';

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

let mockVisibleRange: { from: number; to: number } | null = {
  from: 0,
  to: 100,
};
// Toggles the mock model's resampling state so tests can exercise the plain
// ticking (non-downsampled) path as well as the downsampled path.
let mockIsResampling = true;
const mockVisibleRangeHandlers: Array<() => void> = [];
const mockSizeHandlers: Array<() => void> = [];
// Legend overlay state, so a test can mount the legend and drive a row click
// through the real component against the mocked renderer and model.
let mockLegendOptions: Record<string, unknown> | undefined;
let mockLegendEntries: TvlLegendEntry[] = [];
const mockHiddenSeriesIds = new Set<string>();
let mockEnabledHandlers: string[] = [];
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

    refreshMarkers = jest.fn();

    updateDynamicPriceLines = jest.fn();

    getLastSeriesTime = jest.fn(() => undefined);

    isScaffoldEnabled = jest.fn(() => false);

    setScaffoldData = jest.fn();

    fitContent = jest.fn();

    getTimeScaleWidth = jest.fn(() => mockTimeScale.width());

    resetPriceScales = jest.fn();

    freezeDeferredAutoScales = jest.fn();

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

    getLegendOptions = jest.fn(() => mockLegendOptions);

    getTooltipOptions = jest.fn(() => undefined);

    getLegendEntries = jest.fn(() => mockLegendEntries);

    getHiddenSeriesIds = jest.fn(() => Array.from(mockHiddenSeriesIds));

    getLastSeriesPoint = jest.fn(() => undefined);

    setSeriesVisible = jest.fn((id: string, visible: boolean) => {
      if (visible) {
        mockHiddenSeriesIds.delete(id);
      } else {
        mockHiddenSeriesIds.add(id);
      }
    });

    subscribeCrosshairMove = jest.fn(() => () => undefined);

    subscribeOverlayUpdate = jest.fn(() => () => undefined);

    notifyOverlayUpdate = jest.fn();

    formatTime = jest.fn((t: unknown) => String(t));

    resize = jest.fn();

    dispose = jest.fn();

    getTextColor = jest.fn(() => '#eee');

    timeToCoordinate = jest.fn(() => null);

    priceToCoordinate = jest.fn(() => null);

    getSeriesIds = jest.fn(() => ['s0']);

    seriesHasData = jest.fn(() => true);

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
      isResampling: jest.fn(() => mockIsResampling),
      isDownsampled: jest.fn(() => mockIsResampling),
      isAutoBinned: jest.fn(() => false),
      getDownsampledTableIds: jest.fn(() => new Set([0])),
      getAutoBinMeta: jest.fn(() => ({})),
      getAutoBinBodyRange: jest.fn(() => null),
      getTable: jest.fn(() => ({ size: 1000 })),
      isReady: jest.fn(() => true),
      isQuiescent: jest.fn(() => true),
      getTimeZone: jest.fn(() => 'UTC'),
      getEnabledHandlers: jest.fn(() => mockEnabledHandlers),
      sendEvent: jest.fn(),
      performResample: jest.fn(),
      performAutoBin: jest.fn(),
      pendingDownsample: false,
      pendingAutoBin: false,
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
  const { fetch, metadata } = {
    fetch: () => Promise.resolve(widget),
    metadata: {},
  } as unknown as React.ComponentProps<typeof TradingViewChart>;
  const result = render(<TradingViewChart fetch={fetch} metadata={metadata} />);

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
    mockIsResampling = true;
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

  it('retries a zoom made while the chart is settling after a swap', async () => {
    // A swap suppresses range handling for 600ms. A gesture in that window is
    // still the user's intent, so it must reach the server rather than be
    // dropped.
    await renderChart();
    const model = mockModelInstances[0] as { performResample: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // A swap starts the suppression window.
    emitDataUpdate({ isDownsampleSwap: true });
    model.performResample.mockClear();

    // User zooms while suppressed.
    mockVisibleRange = { from: 40, to: 60 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });
    expect(model.performResample).not.toHaveBeenCalled();

    // Once suppression lifts, the retry delivers it.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(model.performResample).toHaveBeenCalledWith([36, 64], 1000);
  });

  it('shows the downsample indicator from the gesture, not the request', async () => {
    // The request is a 200ms debounce away and the chart repaints the old
    // coarse data immediately, so waiting for it leaves a visible window with
    // no indication anything is happening.
    const { container } = await renderChart();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    mockVisibleRange = { from: 30, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
    });

    // Before the debounce has fired, the scrim is already scheduled.
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(container.querySelector('.tvl-pending-scrim')).not.toBeNull();
  });

  it('does not strand the indicator when a gesture sends no request', async () => {
    const { container } = await renderChart();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // A gesture that resolves back to the baseline range requests nothing.
    mockVisibleRange = { from: 30, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
    });
    mockVisibleRange = { from: 0, to: 100 };
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(container.querySelector('.tvl-pending-scrim')).toBeNull();
  });

  it('resamples when zooming back out to the original range', async () => {
    // The gesture baseline stays where it started, so the return trip reads as
    // "no change" and no request goes out — leaving the narrow body from the
    // zoom-in stretched across the full view with straight coarse edges.
    await renderChart();
    const model = mockModelInstances[0] as { performResample: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // Zoom in: requests a narrow window.
    mockVisibleRange = { from: 40, to: 60 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(1000);
    });
    expect(model.performResample).toHaveBeenCalledWith([36, 64], 1000);

    // Zoom back out to exactly where we started. The loaded data only covers
    // 36..64, so this must request again.
    model.performResample.mockClear();
    mockVisibleRange = { from: 0, to: 100 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(1000);
    });

    expect(model.performResample).toHaveBeenCalledWith([-20, 120], 1000);
  });

  it('drops a pending zoom when a reset double-click supersedes it', async () => {
    // The reset requests the full range (null). Replaying a buffered zoom
    // after the guard lifts would re-aggregate at the old zoomed width and
    // leave the chart zoomed.
    const { container } = await renderChart();
    const model = mockModelInstances[0] as { performResample: jest.Mock };
    const chartContainer = container.querySelector('.dh-tvl-chart');
    expect(chartContainer).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // Zoom, then reset before the debounce fires.
    mockVisibleRange = { from: 30, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(50);
    });
    model.performResample.mockClear();
    act(() => {
      chartContainer?.dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true })
      );
    });
    expect(model.performResample).toHaveBeenCalledWith(null, 1000);

    // The reset lands and re-establishes the baseline.
    model.performResample.mockClear();
    mockVisibleRange = { from: 0, to: 100 };
    emitDataUpdate({ isResetView: true });

    // Reflow events during the guard must not be replayed once it lifts, or
    // they re-aggregate the full range and the chart is no longer "reset".
    mockVisibleRange = { from: 0, to: 400 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(5000);
    });
    expect(model.performResample).not.toHaveBeenCalled();
  });

  it('still resamples when a data update lands before the zoom debounce', async () => {
    // Data updates must not move the gesture baseline, or a zoom whose
    // debounce has not fired yet is compared against its own range, no
    // resample is sent, and the chart stays on stale downsampled data.
    await renderChart();
    const model = mockModelInstances[0] as { performResample: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // User zooms out, then a tick arrives before the 200ms debounce fires.
    mockVisibleRange = { from: 0, to: 400 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(50);
    });
    model.performResample.mockClear();
    emitDataUpdate({ addedCount: 1 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(model.performResample).toHaveBeenCalledWith([-80, 480], 1000);
  });

  it('detects the first zoom when data loads after the settle timer', async () => {
    // A slow first load (big_multi) has no visible range when the settle timer
    // fires, so the baseline must come from the fit that follows the data.
    // Without it the first zoom only captures a baseline and the next tick
    // re-fits, resetting the view.
    mockIsResampling = false;
    mockVisibleRange = null;
    await renderChart();
    const renderer = mockRendererInstances[0] as { fitContent: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000); // settle with no range available
    });

    // Data lands and the chart fits to it.
    mockVisibleRange = { from: 0, to: 100 };
    emitDataUpdate({ addedCount: 1 });

    // First zoom must be recognised immediately.
    mockVisibleRange = { from: 30, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(50);
    });

    renderer.fitContent.mockClear();
    emitDataUpdate({ addedCount: 1 });
    expect(renderer.fitContent).not.toHaveBeenCalled();
  });

  it('does not treat a range change caused by new data as a user gesture', async () => {
    // setData moves the visible time range by growing the data extent. Reading
    // that as a zoom would save it as the range to restore and replay it on
    // the next swap, making the viewport jump and series flicker.
    mockIsResampling = false;
    await renderChart();
    const renderer = mockRendererInstances[0] as { fitContent: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // A data update that shifts the range; LWC reports it after the fact.
    act(() => {
      mockVisibleRange = { from: 30, to: 70 };
      emitDataUpdate({ addedCount: 1 });
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // Still pre-interaction: ticks keep gluing the view to the live extent.
    renderer.fitContent.mockClear();
    emitDataUpdate({ addedCount: 1 });
    expect(renderer.fitContent).toHaveBeenCalled();
  });

  it('does not re-fit on a tick that lands between a zoom and its debounce', async () => {
    // The gesture must be claimed on the range-change event, not 200ms later:
    // a tick in that window would otherwise re-fit and undo the zoom before it
    // was ever recorded, so the zoom appears to reset over and over.
    mockIsResampling = false;
    await renderChart();
    const renderer = mockRendererInstances[0] as { fitContent: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // User zooms, but only 50ms pass before a tick arrives.
    mockVisibleRange = { from: 30, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(50);
    });

    renderer.fitContent.mockClear();
    emitDataUpdate({ addedCount: 1 });
    expect(renderer.fitContent).not.toHaveBeenCalled();
  });

  it('tracks zoom on a non-resampled ticking chart so later ticks stop re-fitting', async () => {
    // A plain ticking chart (no downsample/auto-bin) must still detect user
    // zoom/pan; otherwise every tick calls fitContent and resets the view.
    mockIsResampling = false;
    await renderChart();
    const renderer = mockRendererInstances[0] as { fitContent: jest.Mock };

    act(() => {
      jest.advanceTimersByTime(1000); // let the chart settle
    });

    // Establish the range-change baseline at the initial extent.
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // Pre-interaction tick keeps the view glued to the live extent (fits).
    renderer.fitContent.mockClear();
    emitDataUpdate({ addedCount: 1 });
    expect(renderer.fitContent).toHaveBeenCalled();

    // User zooms in (visible duration 100 -> 40 is a >10% change).
    mockVisibleRange = { from: 30, to: 70 };
    act(() => {
      mockVisibleRangeHandlers.forEach(handler => handler());
      jest.advanceTimersByTime(200);
    });

    // Post-interaction tick must NOT re-fit — the user's zoom is preserved.
    renderer.fitContent.mockClear();
    emitDataUpdate({ addedCount: 1 });
    expect(renderer.fitContent).not.toHaveBeenCalled();
  });
});

describe('TradingViewChart unmount during fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('closes the widget when unmounted before fetch resolves', async () => {
    const widget = { ...makeWidget(), close: jest.fn() };
    let resolveFetch: (w: unknown) => void = () => undefined;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });
    const { fetch, metadata } = {
      fetch: () => fetchPromise,
      metadata: {},
    } as unknown as React.ComponentProps<typeof TradingViewChart>;

    const modelsBefore = mockModelInstances.length;
    const { unmount } = render(
      <TradingViewChart fetch={fetch} metadata={metadata} />
    );
    unmount();

    // Widget arrives after unmount: no model owns it, so the effect cleanup
    // cannot close it. The fetch path has to do so itself.
    await act(async () => {
      resolveFetch(widget);
      await fetchPromise;
      await Promise.resolve();
    });

    expect(widget.close).toHaveBeenCalled();
    expect(mockModelInstances).toHaveLength(modelsBefore);
  });
});

describe('TradingViewChart settle timer teardown', () => {
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
    jest.useRealTimers();
  });

  it('fires the post-init autobin while mounted', async () => {
    const { unmount } = await renderChart();
    const model = mockModelInstances[0] as {
      isAutoBinned: jest.Mock;
      performAutoBin: jest.Mock;
    };
    model.isAutoBinned.mockReturnValue(true);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(model.performAutoBin).toHaveBeenCalled();
    unmount();
  });

  it('does not autobin when unmounted before the settle timer fires', async () => {
    const { unmount } = await renderChart();
    const model = mockModelInstances[0] as {
      isAutoBinned: jest.Mock;
      performAutoBin: jest.Mock;
    };
    model.isAutoBinned.mockReturnValue(true);

    unmount();
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(model.performAutoBin).not.toHaveBeenCalled();
  });
});

describe('TradingViewChart legend toggle bridge', () => {
  // The browser-to-Python leg of a legend toggle: a click on a real legend
  // row, rendered by the chart, must reach `model.sendEvent` with the full
  // payload when the figure advertised `seriesToggle`, and must not when it
  // did not. The legend and Python tests each stop one step short of this.
  const entry: TvlLegendEntry = {
    id: 's0',
    series: {} as never,
    title: 'Area',
    color: '#48a',
    kind: 'Area',
    visible: true,
  };

  function resetLegendMocks(): void {
    mockLegendOptions = undefined;
    mockLegendEntries = [];
    mockHiddenSeriesIds.clear();
    mockEnabledHandlers = [];
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockVisibleRange = { from: 0, to: 100 };
    mockVisibleRangeHandlers.length = 0;
    mockSizeHandlers.length = 0;
    mockModelInstances.length = 0;
    mockRendererInstances.length = 0;
    resetLegendMocks();
    mockLegendOptions = { variant: 'rows' };
    mockLegendEntries = [entry];
  });

  afterEach(() => {
    resetLegendMocks();
    jest.useRealTimers();
  });

  it('sends seriesToggle to Python when the handler is advertised', async () => {
    mockEnabledHandlers = ['seriesToggle'];
    const { container, unmount } = await renderChart();
    const model = mockModelInstances[0] as { sendEvent: jest.Mock };
    const renderer = mockRendererInstances[0] as {
      setSeriesVisible: jest.Mock;
    };

    const row = container.querySelector('.tvl-legend-row') as HTMLElement;
    expect(row).not.toBeNull();
    fireEvent.click(row);

    // The chart applies the toggle itself before reporting it.
    expect(renderer.setSeriesVisible).toHaveBeenCalledWith('s0', false);
    const payload = {
      type: 'seriesToggle',
      series: 'Area',
      seriesId: 's0',
      visible: false,
      hiddenSeriesIds: ['s0'],
    };
    expect(model.sendEvent).toHaveBeenCalledTimes(1);
    expect(model.sendEvent).toHaveBeenCalledWith('seriesToggle', payload);
    // The DOM seam carries the same payload for the e2e specs.
    expect(
      JSON.parse(
        container.firstElementChild?.getAttribute('data-tvl-last-toggle') ??
          'null'
      )
    ).toEqual(payload);
    unmount();
  });

  it('applies the toggle locally but sends nothing without a handler', async () => {
    const { container, unmount } = await renderChart();
    const model = mockModelInstances[0] as { sendEvent: jest.Mock };
    const renderer = mockRendererInstances[0] as {
      setSeriesVisible: jest.Mock;
    };

    fireEvent.click(container.querySelector('.tvl-legend-row') as HTMLElement);

    expect(renderer.setSeriesVisible).toHaveBeenCalledWith('s0', false);
    expect(model.sendEvent).not.toHaveBeenCalled();
    // Still observable client-side, so a legend costs nothing server-side.
    expect(
      container.firstElementChild?.getAttribute('data-tvl-last-toggle')
    ).toContain('"seriesId":"s0"');
    unmount();
  });
});
