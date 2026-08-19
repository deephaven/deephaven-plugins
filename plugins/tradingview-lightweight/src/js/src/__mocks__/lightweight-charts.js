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
  createPriceLine: jest.fn(() => mockPriceLine),
  priceScale: jest.fn(() => mockPriceScale),
  applyOptions: jest.fn(),
  options: jest.fn(() => ({})),
  priceFormatter: jest.fn(() => ({ format: v => String(v) })),
  priceToCoordinate: jest.fn(() => null),
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

const createChart = jest.fn(() => mockChart);
const createYieldCurveChart = jest.fn(() => mockChart);
const createOptionsChart = jest.fn(() => mockChart);
const createSeriesMarkers = jest.fn(() => mockMarkersPlugin);
const createTextWatermark = jest.fn(() => mockWatermarkPlugin);

const ColorType = { Solid: 'solid' };

// Series definition constants
const CandlestickSeries = 'CandlestickSeries';
const BarSeries = 'BarSeries';
const LineSeries = 'LineSeries';
const AreaSeries = 'AreaSeries';
const BaselineSeries = 'BaselineSeries';
const HistogramSeries = 'HistogramSeries';

module.exports = {
  createChart,
  createYieldCurveChart,
  createOptionsChart,
  createSeriesMarkers,
  createTextWatermark,
  ColorType,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries,
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
