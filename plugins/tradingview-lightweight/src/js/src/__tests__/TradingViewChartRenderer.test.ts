import type { TvlSeriesConfig } from '../TradingViewTypes';
import TradingViewChartRenderer from '../TradingViewChartRenderer';

// The manual mock at src/__mocks__/lightweight-charts.js is loaded via moduleNameMapper.
// We import the mock internals to set up assertions.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lwc = require('lightweight-charts');

const {
  createChart,
  createYieldCurveChart,
  createOptionsChart,
  createSeriesMarkers,
  createTextWatermark,
} = lwc;
// eslint-disable-next-line no-underscore-dangle
const mockChart = lwc.__mockChart;
// eslint-disable-next-line no-underscore-dangle
const mockSeriesInstance = lwc.__mockSeriesInstance;
// eslint-disable-next-line no-underscore-dangle
const mockMarkersPlugin = lwc.__mockMarkersPlugin;
// eslint-disable-next-line no-underscore-dangle
const mockWatermarkPlugin = lwc.__mockWatermarkPlugin;
// eslint-disable-next-line no-underscore-dangle
const mockPane = lwc.__mockPane;
// eslint-disable-next-line no-underscore-dangle
const mockTimeScale = lwc.__mockTimeScale;
// eslint-disable-next-line no-underscore-dangle
const mockPriceLine = lwc.__mockPriceLine;
// eslint-disable-next-line no-underscore-dangle
const mockPriceScale = lwc.__mockPriceScale;
// eslint-disable-next-line no-underscore-dangle
const mockPane2 = lwc.__mockPane2;

beforeEach(() => {
  jest.clearAllMocks();
});

function createRenderer(): TradingViewChartRenderer {
  const container = document.createElement('div');
  return new TradingViewChartRenderer(container);
}

describe('TradingViewChartRenderer', () => {
  describe('constructor', () => {
    it('should call createChart with the container and default options', () => {
      const container = document.createElement('div');
      const renderer = new TradingViewChartRenderer(container);

      expect(createChart).toHaveBeenCalledTimes(1);
      expect(createChart).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          autoSize: true,
        })
      );
      expect(renderer).toBeDefined();
    });

    it('should apply custom options to createChart', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        layout: {
          background: { type: 'solid' as never, color: '#FF0000' },
        },
      });

      expect(createChart).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          layout: expect.objectContaining({
            background: { type: 'solid', color: '#FF0000' },
          }),
          autoSize: true,
        })
      );
    });
  });

  describe('configureSeries', () => {
    it('should create a Candlestick series via addSeries', () => {
      const renderer = createRenderer();
      const configs: TvlSeriesConfig[] = [
        {
          id: 'candle-1',
          type: 'Candlestick',
          options: { upColor: '#00FF00' },
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ];

      renderer.configureSeries(configs);

      expect(mockChart.addSeries).toHaveBeenCalledTimes(1);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.CandlestickSeries,
        { upColor: '#00FF00' },
        undefined
      );
    });

    it('should create a Bar series via addSeries', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'bar-1',
          type: 'Bar',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.BarSeries,
        {},
        undefined
      );
    });

    it('should create a Line series via addSeries', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: { color: '#0000FF' },
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.LineSeries,
        { color: '#0000FF' },
        undefined
      );
    });

    it('should create an Area series via addSeries', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'area-1',
          type: 'Area',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.AreaSeries,
        {},
        undefined
      );
    });

    it('should create a Baseline series via addSeries', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'baseline-1',
          type: 'Baseline',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.BaselineSeries,
        {},
        undefined
      );
    });

    it('should create a Histogram series via addSeries', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'hist-1',
          type: 'Histogram',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.HistogramSeries,
        {},
        undefined
      );
    });

    it('should handle unknown series type gracefully', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'unknown-1',
          type: 'Unknown' as TvlSeriesConfig['type'],
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      // addSeries should NOT be called for unknown types
      expect(mockChart.addSeries).not.toHaveBeenCalled();
    });

    it('should remove existing series before creating new ones', () => {
      const renderer = createRenderer();

      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledTimes(1);

      // Second configuration should remove old series first
      renderer.configureSeries([
        {
          id: 'candle-1',
          type: 'Candlestick',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.removeSeries).toHaveBeenCalledTimes(1);
      expect(mockChart.removeSeries).toHaveBeenCalledWith(mockSeriesInstance);
      expect(mockChart.addSeries).toHaveBeenCalledTimes(2);
    });

    it('should create multiple series at once', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'candle-1',
          type: 'Candlestick',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledTimes(2);
    });

    it('should apply price lines when configured', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
          priceLines: [
            {
              price: 100,
              color: '#FF0000',
              lineWidth: 2,
              lineStyle: 0,
              axisLabelVisible: true,
              title: 'Support',
            },
          ],
        },
      ]);
      expect(mockSeriesInstance.createPriceLine).toHaveBeenCalledTimes(1);
      expect(mockSeriesInstance.createPriceLine).toHaveBeenCalledWith({
        price: 100,
        color: '#FF0000',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'Support',
      });
    });
  });

  describe('colorway defaults', () => {
    const colorway = ['#4878d0', '#6acc64', '#d5bb67'];
    const ohlcColors = { upColor: '#26a69a', downColor: '#ef5350' };

    it('should assign colorway colors to Line series without explicit color', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'line-1',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
          {
            id: 'line-2',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      expect(mockChart.addSeries).toHaveBeenCalledTimes(2);
      expect(mockChart.addSeries).toHaveBeenNthCalledWith(
        1,
        lwc.LineSeries,
        expect.objectContaining({ color: '#4878d0' }),
        undefined
      );
      expect(mockChart.addSeries).toHaveBeenNthCalledWith(
        2,
        lwc.LineSeries,
        expect.objectContaining({ color: '#6acc64' }),
        undefined
      );
    });

    it('should not override user-specified colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'line-1',
            type: 'Line',
            options: { color: '#FF0000' },
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.LineSeries,
        expect.objectContaining({ color: '#FF0000' }),
        undefined
      );
    });

    it('should wrap around when more series than colorway entries', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'line-1',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
          {
            id: 'line-2',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
          {
            id: 'line-3',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
          {
            id: 'line-4',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      // 4th series wraps to colorway[0]
      expect(mockChart.addSeries).toHaveBeenNthCalledWith(
        4,
        lwc.LineSeries,
        expect.objectContaining({ color: '#4878d0' }),
        undefined
      );
    });

    it('should assign colorway color and derive fills for Area series', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'area-1',
            type: 'Area',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.AreaSeries,
        expect.objectContaining({
          lineColor: '#4878d0',
          topColor: 'rgba(72, 120, 208, 0.4)',
          bottomColor: 'rgba(72, 120, 208, 0)',
        }),
        undefined
      );
    });

    it('should not override user-specified Area fill colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'area-1',
            type: 'Area',
            options: { topColor: '#FF0000' },
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      // lineColor from colorway, but topColor kept as user-specified
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.AreaSeries,
        expect.objectContaining({
          lineColor: '#4878d0',
          topColor: '#FF0000',
          bottomColor: 'rgba(72, 120, 208, 0)',
        }),
        undefined
      );
    });

    it('should assign colorway color and derive fills for Baseline series', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'baseline-1',
            type: 'Baseline',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.BaselineSeries,
        expect.objectContaining({
          topLineColor: '#4878d0',
          topFillColor1: 'rgba(72, 120, 208, 0.3)',
          topFillColor2: 'rgba(72, 120, 208, 0)',
        }),
        undefined
      );
    });

    it('should assign colorway color to Histogram series', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'hist-1',
            type: 'Histogram',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.HistogramSeries,
        expect.objectContaining({ color: '#4878d0' }),
        undefined
      );
    });

    it('should apply OHLC theme colors to Candlestick without user colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'candle-1',
            type: 'Candlestick',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway,
        ohlcColors
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.CandlestickSeries,
        expect.objectContaining({
          upColor: '#26a69a',
          downColor: '#ef5350',
        }),
        undefined
      );
    });

    it('should derive border and wick colors from OHLC theme colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'candle-1',
            type: 'Candlestick',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway,
        ohlcColors
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.CandlestickSeries,
        expect.objectContaining({
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        }),
        undefined
      );
    });

    it('should not override user-specified border/wick colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'candle-1',
            type: 'Candlestick',
            options: { borderUpColor: '#AAAAAA', wickDownColor: '#BBBBBB' },
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway,
        ohlcColors
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.CandlestickSeries,
        expect.objectContaining({
          borderUpColor: '#AAAAAA',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#BBBBBB',
        }),
        undefined
      );
    });

    it('should not override user-specified OHLC colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'candle-1',
            type: 'Candlestick',
            options: { upColor: '#00FF00' },
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway,
        ohlcColors
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.CandlestickSeries,
        expect.objectContaining({
          upColor: '#00FF00',
          downColor: '#ef5350',
        }),
        undefined
      );
    });

    it('should apply OHLC theme colors to Bar without user colors', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'bar-1',
            type: 'Bar',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway,
        ohlcColors
      );

      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.BarSeries,
        expect.objectContaining({
          upColor: '#26a69a',
          downColor: '#ef5350',
        }),
        undefined
      );
    });

    it('should not consume colorway index for OHLC types', () => {
      const renderer = createRenderer();
      renderer.configureSeries(
        [
          {
            id: 'candle-1',
            type: 'Candlestick',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
          {
            id: 'line-1',
            type: 'Line',
            options: {},
            dataMapping: { tableId: 0, columns: { time: 'T' } },
          },
        ],
        colorway,
        ohlcColors
      );

      // Line series should get colorway[0], not colorway[1]
      expect(mockChart.addSeries).toHaveBeenNthCalledWith(
        2,
        lwc.LineSeries,
        expect.objectContaining({ color: '#4878d0' }),
        undefined
      );
    });
  });

  describe('setSeriesData', () => {
    it('should call setData on the correct series', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);

      const data = [
        { time: 1704067200, value: 100 },
        { time: 1704153600, value: 105 },
      ];

      renderer.setSeriesData('line-1', data);
      expect(mockSeriesInstance.setData).toHaveBeenCalledTimes(1);
      expect(mockSeriesInstance.setData).toHaveBeenCalledWith(data);
    });

    it('should not throw when series id is not found', () => {
      const renderer = createRenderer();
      expect(() => renderer.setSeriesData('nonexistent', [])).not.toThrow();
      expect(mockSeriesInstance.setData).not.toHaveBeenCalled();
    });
  });

  describe('setSeriesMarkers', () => {
    it('should call createSeriesMarkers for the series', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);

      const markers = [
        {
          time: 1704067200,
          position: 'aboveBar' as const,
          shape: 'arrowDown' as const,
          color: '#FF0000',
          text: 'Sell',
        },
      ];

      renderer.setSeriesMarkers('line-1', markers);
      expect(createSeriesMarkers).toHaveBeenCalledTimes(1);
      expect(createSeriesMarkers).toHaveBeenCalledWith(
        mockSeriesInstance,
        expect.arrayContaining([
          expect.objectContaining({
            time: 1704067200,
            position: 'aboveBar',
            shape: 'arrowDown',
            color: '#FF0000',
            text: 'Sell',
          }),
        ])
      );
    });

    it('should use setMarkers on subsequent calls for same series', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);

      const markers1 = [
        {
          time: 1704067200,
          position: 'aboveBar' as const,
          shape: 'circle' as const,
          color: '#FF0000',
          text: 'A',
        },
      ];
      const markers2 = [
        {
          time: 1704153600,
          position: 'belowBar' as const,
          shape: 'square' as const,
          color: '#00FF00',
          text: 'B',
        },
      ];

      renderer.setSeriesMarkers('line-1', markers1);
      renderer.setSeriesMarkers('line-1', markers2);

      // createSeriesMarkers should only be called once
      expect(createSeriesMarkers).toHaveBeenCalledTimes(1);
      // setMarkers should be called on the plugin for subsequent calls
      expect(mockMarkersPlugin.setMarkers).toHaveBeenCalledTimes(1);
    });

    it('should not throw when series id is not found', () => {
      const renderer = createRenderer();
      expect(() => renderer.setSeriesMarkers('nonexistent', [])).not.toThrow();
      expect(createSeriesMarkers).not.toHaveBeenCalled();
    });
  });

  describe('applyOptions', () => {
    it('should call chart.applyOptions', () => {
      const renderer = createRenderer();
      const newOptions = {
        layout: { textColor: '#AABBCC' },
      };

      renderer.applyOptions(newOptions);
      expect(mockChart.applyOptions).toHaveBeenCalledTimes(1);
      expect(mockChart.applyOptions).toHaveBeenCalledWith(newOptions);
    });
  });

  describe('resize', () => {
    it('should call chart.resize with width and height', () => {
      const renderer = createRenderer();
      renderer.resize(800, 600);

      expect(mockChart.resize).toHaveBeenCalledTimes(1);
      expect(mockChart.resize).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('fitContent', () => {
    it('should call chart.timeScale().fitContent()', () => {
      const renderer = createRenderer();
      renderer.fitContent();

      expect(mockChart.timeScale).toHaveBeenCalledTimes(1);
      expect(mockTimeScale.fitContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChart', () => {
    it('should return the underlying chart API', () => {
      const renderer = createRenderer();
      const chart = renderer.getChart();
      expect(chart).toBe(mockChart);
    });
  });

  describe('dispose', () => {
    it('should call chart.remove()', () => {
      const renderer = createRenderer();
      renderer.dispose();

      expect(mockChart.remove).toHaveBeenCalledTimes(1);
    });

    it('should clear the series map so subsequent data calls are no-ops', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);

      mockSeriesInstance.setData.mockClear();

      renderer.dispose();

      // After dispose, setting data should be a no-op
      renderer.setSeriesData('line-1', []);
      expect(mockSeriesInstance.setData).not.toHaveBeenCalled();
    });

    it('should detach watermark on dispose', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      const renderer = new TradingViewChartRenderer(container, {
        watermark: {
          text: 'AAPL',
          color: 'rgba(0,0,0,0.2)',
        },
      } as never);

      renderer.dispose();
      expect(mockWatermarkPlugin.detach).toHaveBeenCalledTimes(1);
    });
  });

  describe('watermark', () => {
    it('should create a text watermark plugin when watermark options are provided', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        watermark: {
          text: 'AAPL',
          color: 'rgba(0,0,0,0.2)',
          fontSize: 64,
          horzAlign: 'left',
          vertAlign: 'top',
        },
      } as never);

      expect(createTextWatermark).toHaveBeenCalledTimes(1);
      expect(createTextWatermark).toHaveBeenCalledWith(
        mockPane,
        expect.objectContaining({
          visible: true,
          horzAlign: 'left',
          vertAlign: 'top',
          lines: [
            expect.objectContaining({
              text: 'AAPL',
              color: 'rgba(0,0,0,0.2)',
              fontSize: 64,
            }),
          ],
        })
      );
    });

    it('should use theme-derived defaults when only text is provided', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        layout: { textColor: '#D1D4DC' },
        watermark: { text: 'AAPL' },
      } as never);

      expect(createTextWatermark).toHaveBeenCalledTimes(1);
      expect(createTextWatermark).toHaveBeenCalledWith(
        mockPane,
        expect.objectContaining({
          horzAlign: 'center',
          vertAlign: 'center',
          lines: [
            expect.objectContaining({
              text: 'AAPL',
              color: 'rgba(209, 212, 220, 0.2)',
              fontSize: 66,
            }),
          ],
        })
      );
    });

    it('should not create watermark when no watermark options are provided', () => {
      createRenderer();
      expect(createTextWatermark).not.toHaveBeenCalled();
    });

    it('should not create watermark when visible is false', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        watermark: {
          text: 'AAPL',
          visible: false,
        },
      } as never);

      expect(createTextWatermark).not.toHaveBeenCalled();
    });

    it('should not create watermark when text is empty', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        watermark: {
          color: 'rgba(0,0,0,0.2)',
        },
      } as never);

      expect(createTextWatermark).not.toHaveBeenCalled();
    });

    it('should not pass watermark option to createChart', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        watermark: {
          text: 'AAPL',
        },
      } as never);

      const createChartOptions = createChart.mock.calls[0][1];
      expect(createChartOptions).not.toHaveProperty('watermark');
    });

    it('should update watermark via applyOptions', () => {
      const container = document.createElement('div');
      const renderer = new TradingViewChartRenderer(container, {
        watermark: {
          text: 'AAPL',
        },
      } as never);

      renderer.applyOptions({
        watermark: {
          text: 'GOOG',
          color: '#FF0000',
        },
      } as never);

      expect(mockWatermarkPlugin.applyOptions).toHaveBeenCalledTimes(1);
      expect(mockWatermarkPlugin.applyOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: [
            expect.objectContaining({
              text: 'GOOG',
              color: '#FF0000',
            }),
          ],
        })
      );
    });

    it('should not pass watermark to chart.applyOptions', () => {
      const renderer = createRenderer();
      renderer.applyOptions({
        watermark: { text: 'AAPL' },
        layout: { textColor: '#FFF' },
      } as never);

      expect(mockChart.applyOptions).toHaveBeenCalledWith(
        expect.not.objectContaining({ watermark: expect.anything() })
      );
      expect(mockChart.applyOptions).toHaveBeenCalledWith(
        expect.objectContaining({ layout: { textColor: '#FFF' } })
      );
    });

    it('should update textColor for watermark derivation on applyOptions', () => {
      const container = document.createElement('div');
      // Start with dark text color
      const renderer = new TradingViewChartRenderer(container, {
        layout: { textColor: '#000000' },
        watermark: { text: 'AAPL' },
      } as never);

      // First watermark uses initial textColor-derived color
      const firstCall = (createTextWatermark as jest.Mock).mock.calls[0][1];
      const firstColor = firstCall.lines[0].color;
      expect(firstColor).toContain('0, 0, 0'); // derived from #000000

      jest.clearAllMocks();

      // Apply new theme with light text color + watermark update
      renderer.applyOptions({
        layout: { textColor: '#FFFFFF' },
        watermark: { text: 'AAPL' },
      } as never);

      // Watermark should now derive from the NEW text color
      const updateCall = (mockWatermarkPlugin.applyOptions as jest.Mock).mock
        .calls[0][0];
      const updatedColor = updateCall.lines[0].color;
      expect(updatedColor).toContain('255, 255, 255'); // derived from #FFFFFF
    });
  });

  describe('priceScaleOptions', () => {
    it('should apply priceScaleOptions after creating series', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
          priceScaleOptions: {
            autoScale: false,
            scaleMargins: { top: 0.1, bottom: 0.2 },
          },
        },
      ]);

      expect(mockSeriesInstance.priceScale).toHaveBeenCalled();
      expect(mockPriceScale.applyOptions).toHaveBeenCalledWith({
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      });
    });

    it('should not call priceScale when no priceScaleOptions', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);

      expect(mockPriceScale.applyOptions).not.toHaveBeenCalled();
    });
  });

  describe('localization price formatter', () => {
    it('should resolve priceFormatterName to a function in constructor', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        localization: { priceFormatterName: 'currency_usd' },
      } as never);

      const createChartOptions = createChart.mock.calls[0][1];
      expect(createChartOptions.localization).toBeDefined();
      expect(typeof createChartOptions.localization.priceFormatter).toBe(
        'function'
      );
      expect(
        createChartOptions.localization.priceFormatterName
      ).toBeUndefined();
    });

    it('should resolve priceFormatterName via applyOptions', () => {
      const renderer = createRenderer();
      renderer.applyOptions({
        localization: { priceFormatterName: 'percent' },
      } as never);

      const appliedOptions = mockChart.applyOptions.mock.calls[0][0];
      expect(typeof appliedOptions.localization.priceFormatter).toBe(
        'function'
      );
      // Verify the percent formatter works correctly
      const fmt = appliedOptions.localization.priceFormatter;
      expect(fmt(42.5)).toBe('42.50%');
    });

    it('should pass through unknown formatter names as-is', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        localization: { priceFormatterName: 'nonexistent' },
      } as never);

      const createChartOptions = createChart.mock.calls[0][1];
      // Should be left as-is (not resolved)
      expect(createChartOptions.localization.priceFormatterName).toBe(
        'nonexistent'
      );
    });

    it('should include default timeFormatter in localization', () => {
      createRenderer();
      const createChartOptions = createChart.mock.calls[0][1];
      expect(createChartOptions.localization).toBeDefined();
      expect(createChartOptions.localization.timeFormatter).toBeInstanceOf(
        Function
      );
    });

    it('should format compact values correctly', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        localization: { priceFormatterName: 'compact' },
      } as never);

      const createChartOptions = createChart.mock.calls[0][1];
      const fmt = createChartOptions.localization.priceFormatter;
      expect(fmt(1500)).toBe('1.5K');
      expect(fmt(2500000)).toBe('2.5M');
      expect(fmt(3200000000)).toBe('3.2B');
      expect(fmt(42.5)).toBe('42.50');
    });

    it('should format scientific values correctly', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {
        localization: { priceFormatterName: 'scientific' },
      } as never);

      const createChartOptions = createChart.mock.calls[0][1];
      const fmt = createChartOptions.localization.priceFormatter;
      expect(fmt(12345)).toBe('1.23e+4');
    });
  });

  describe('pane support', () => {
    it('should pass paneIndex as third arg to addSeries', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
          paneIndex: 1,
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(lwc.LineSeries, {}, 1);
    });

    it('should pass undefined paneIndex when not specified', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
        },
      ]);
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        lwc.LineSeries,
        {},
        undefined
      );
    });

    it('should apply stretch factors to panes', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'candle-1',
          type: 'Candlestick',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
          paneIndex: 0,
        },
        {
          id: 'hist-1',
          type: 'Histogram',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T' } },
          paneIndex: 1,
        },
      ]);

      renderer.applyPaneStretchFactors([3, 1]);

      expect(mockChart.panes).toHaveBeenCalled();
      expect(mockPane.setStretchFactor).toHaveBeenCalledWith(3);
      expect(mockPane2.setStretchFactor).toHaveBeenCalledWith(1);
    });

    it('should not throw when stretch factors exceed pane count', () => {
      const renderer = createRenderer();
      expect(() => renderer.applyPaneStretchFactors([3, 1, 2])).not.toThrow();
    });
  });

  describe('dynamic price lines', () => {
    it('should create a dynamic price line with initial price 0 for column-based lines', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
          priceLines: [
            {
              column: 'AvgPrice',
              color: 'blue',
              title: 'Average',
            },
          ],
        },
      ]);
      expect(mockSeriesInstance.createPriceLine).toHaveBeenCalledTimes(1);
      expect(mockSeriesInstance.createPriceLine).toHaveBeenCalledWith({
        price: 0,
        color: 'blue',
        lineWidth: undefined,
        lineStyle: undefined,
        axisLabelVisible: undefined,
        title: 'Average',
      });
    });

    it('should update dynamic price line with last-row column value', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
          priceLines: [
            {
              column: 'AvgPrice',
              color: 'blue',
              title: 'Average',
            },
          ],
        },
      ]);

      const columnData = new Map<string, unknown[]>();
      columnData.set('AvgPrice', [100, 110, 120]);

      renderer.updateDynamicPriceLines('line-1', columnData);
      expect(mockPriceLine.applyOptions).toHaveBeenCalledWith({ price: 120 });
    });

    it('should not update static price lines on data change', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
          priceLines: [
            {
              price: 100,
              color: 'gray',
              title: 'Static',
            },
          ],
        },
      ]);

      const columnData = new Map<string, unknown[]>();
      columnData.set('SomeCol', [200, 300]);

      renderer.updateDynamicPriceLines('line-1', columnData);
      // No dynamic price lines registered, so applyOptions should not be called
      // (the createPriceLine mock is called once for the static line, but
      // applyOptions on the price line should not be called)
      expect(mockPriceLine.applyOptions).not.toHaveBeenCalled();
    });

    it('should handle mixed static and dynamic price lines', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
          priceLines: [
            { price: 50, color: 'gray', title: 'Static' },
            { column: 'MaxPrice', color: 'green', title: 'High' },
          ],
        },
      ]);

      expect(mockSeriesInstance.createPriceLine).toHaveBeenCalledTimes(2);

      const columnData = new Map<string, unknown[]>();
      columnData.set('MaxPrice', [150, 160, 170]);

      renderer.updateDynamicPriceLines('line-1', columnData);
      expect(mockPriceLine.applyOptions).toHaveBeenCalledWith({ price: 170 });
    });

    it('should not throw when updating non-existent series', () => {
      const renderer = createRenderer();
      const columnData = new Map<string, unknown[]>();
      columnData.set('AvgPrice', [100]);

      expect(() =>
        renderer.updateDynamicPriceLines('nonexistent', columnData)
      ).not.toThrow();
    });

    it('should skip NaN values when updating dynamic price lines', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
          priceLines: [{ column: 'AvgPrice', color: 'blue', title: 'Avg' }],
        },
      ]);

      const columnData = new Map<string, unknown[]>();
      columnData.set('AvgPrice', [NaN]);

      renderer.updateDynamicPriceLines('line-1', columnData);
      expect(mockPriceLine.applyOptions).not.toHaveBeenCalled();
    });

    it('should clear dynamic price lines on reconfigure', () => {
      const renderer = createRenderer();
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
          priceLines: [{ column: 'AvgPrice', color: 'blue', title: 'Avg' }],
        },
      ]);

      // Reconfigure without dynamic price lines
      renderer.configureSeries([
        {
          id: 'line-1',
          type: 'Line',
          options: {},
          dataMapping: { tableId: 0, columns: { time: 'T', value: 'V' } },
        },
      ]);

      const columnData = new Map<string, unknown[]>();
      columnData.set('AvgPrice', [100]);

      renderer.updateDynamicPriceLines('line-1', columnData);
      // After reconfigure, no dynamic price lines should be registered
      expect(mockPriceLine.applyOptions).not.toHaveBeenCalled();
    });
  });

  describe('chart type selection', () => {
    it('should call createChart for standard chart type', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {}, 'standard');
      expect(createChart).toHaveBeenCalledTimes(1);
      expect(createYieldCurveChart).not.toHaveBeenCalled();
      expect(createOptionsChart).not.toHaveBeenCalled();
    });

    it('should call createYieldCurveChart for yieldCurve chart type', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {}, 'yieldCurve');
      expect(createYieldCurveChart).toHaveBeenCalledTimes(1);
      expect(createChart).not.toHaveBeenCalled();
      expect(createOptionsChart).not.toHaveBeenCalled();
    });

    it('should call createOptionsChart for options chart type', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container, {}, 'options');
      expect(createOptionsChart).toHaveBeenCalledTimes(1);
      expect(createChart).not.toHaveBeenCalled();
      expect(createYieldCurveChart).not.toHaveBeenCalled();
    });

    it('should default to createChart when no chart type specified', () => {
      const container = document.createElement('div');
      // eslint-disable-next-line no-new
      new TradingViewChartRenderer(container);
      expect(createChart).toHaveBeenCalledTimes(1);
    });

    it('should expose chart type via getChartType()', () => {
      const container = document.createElement('div');
      const standard = new TradingViewChartRenderer(container, {}, 'standard');
      expect(standard.getChartType()).toBe('standard');

      const yc = new TradingViewChartRenderer(container, {}, 'yieldCurve');
      expect(yc.getChartType()).toBe('yieldCurve');

      const opts = new TradingViewChartRenderer(container, {}, 'options');
      expect(opts.getChartType()).toBe('options');
    });
  });
});
