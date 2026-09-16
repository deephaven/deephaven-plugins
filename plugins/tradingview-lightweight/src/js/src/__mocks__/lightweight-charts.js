// Manual mock for lightweight-charts module
const mockPriceScale = {
  applyOptions: jest.fn(),
  setAutoScale: jest.fn(),
};

const mockPriceLine = {
  applyOptions: jest.fn(),
  options: jest.fn(() => ({ price: 0 })),
};

const mockSeriesInstance = {
  setData: jest.fn(),
  data: jest.fn(() => []),
  dataByIndex: jest.fn(() => null),
  createPriceLine: jest.fn(() => mockPriceLine),
  priceScale: jest.fn(() => mockPriceScale),
  applyOptions: jest.fn(),
  options: jest.fn(() => ({})),
  priceFormatter: jest.fn(() => ({ format: v => String(v) })),
  // Non-null: LWC throws 'Value is null' if a marker price can't convert,
  // so the renderer only attaches prices when this succeeds.
  priceToCoordinate: jest.fn(() => 50),
};

const mockMarkersPlugin = {
  setMarkers: jest.fn(),
  markers: jest.fn(() => []),
};

const mockWatermarkPlugin = {
  applyOptions: jest.fn(),
  detach: jest.fn(),
};

const mockPane = {
  setStretchFactor: jest.fn(),
  getStretchFactor: jest.fn(() => 1),
};

const mockPane2 = {
  setStretchFactor: jest.fn(),
  getStretchFactor: jest.fn(() => 1),
};

const mockTimeScale = {
  fitContent: jest.fn(),
};

const mockChart = {
  addSeries: jest.fn(() => mockSeriesInstance),
  addCustomSeries: jest.fn(() => mockSeriesInstance),
  removeSeries: jest.fn(),
  applyOptions: jest.fn(),
  resize: jest.fn(),
  remove: jest.fn(),
  timeScale: jest.fn(() => mockTimeScale),
  priceScale: jest.fn(() => mockPriceScale),
  panes: jest.fn(() => [mockPane, mockPane2]),
  subscribeClick: jest.fn(),
  unsubscribeClick: jest.fn(),
  subscribeDblClick: jest.fn(),
  unsubscribeDblClick: jest.fn(),
  subscribeCrosshairMove: jest.fn(),
  unsubscribeCrosshairMove: jest.fn(),
};

// Late-bound: mockChart isn't defined when mockSeriesInstance is declared.
mockSeriesInstance.chart = jest.fn(() => mockChart);

const createChart = jest.fn(() => mockChart);
const createYieldCurveChart = jest.fn(() => mockChart);
const createOptionsChart = jest.fn(() => mockChart);
const createSeriesMarkers = jest.fn(() => mockMarkersPlugin);
const createTextWatermark = jest.fn(() => mockWatermarkPlugin);

const ColorType = { Solid: 'solid' };

// Values must match the real library (used by press-event snapping).
const MismatchDirection = { NearestLeft: -1, None: 0, NearestRight: 1 };

// Series definition constants
const CandlestickSeries = 'CandlestickSeries';
const BarSeries = 'BarSeries';
const LineSeries = 'LineSeries';
const AreaSeries = 'AreaSeries';
const BaselineSeries = 'BaselineSeries';
const HistogramSeries = 'HistogramSeries';

const customSeriesDefaultOptions = {};

// createChartEx takes a horzScaleBehavior; tests assert on the options object,
// so forward to the same mock chart factory.
const createChartEx = jest.fn((container, behavior, options) =>
  createChart(container, options)
);

// Minimal stand-in for the real base class. Only the pieces our zone-aware
// subclass touches are implemented; the real behavior is exercised in
// TimeZoneHorzScaleBehavior.probe.test.ts against the actual library.
/* eslint-disable class-methods-use-this */
class MockHorzScaleBehavior {
  key(item) {
    return typeof item === 'object' && item !== null ? item.timestamp : item;
  }

  convertHorzItemToInternal(t) {
    return { timestamp: t };
  }

  formatHorzItem(item) {
    return String(this.key(item));
  }

  formatTickmark(tickMark) {
    return String(this.key(tickMark.time));
  }

  maxTickMarkWeight(marks) {
    return marks.reduce((a, b) => (b.weight > a.weight ? b : a), marks[0])
      .weight;
  }

  fillWeightsForPoints() {
    // no-op
  }

  options() {
    return {};
  }

  setOptions() {
    // no-op
  }

  preprocessData() {
    // no-op
  }

  createConverterToInternalObj() {
    return t => ({ timestamp: t });
  }

  cacheKey(item) {
    return this.key(item);
  }

  updateFormatter() {
    // no-op
  }
}

/* eslint-enable class-methods-use-this */

const defaultHorzScaleBehavior = jest.fn(() => MockHorzScaleBehavior);

module.exports = {
  createChart,
  createChartEx,
  defaultHorzScaleBehavior,
  createYieldCurveChart,
  createOptionsChart,
  createSeriesMarkers,
  createTextWatermark,
  ColorType,
  MismatchDirection,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries,
  customSeriesDefaultOptions,
  mockChart,
  mockSeriesInstance,
  mockPriceLine,
  mockPriceScale,
  mockMarkersPlugin,
  mockWatermarkPlugin,
  mockPane,
  mockPane2,
  mockTimeScale,
};
