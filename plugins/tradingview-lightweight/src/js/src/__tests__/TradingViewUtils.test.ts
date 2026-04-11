import type { TvlMarkerSpec, TvlSeriesConfig } from '../TradingViewTypes';
import {
  convertTime,
  transformTableData,
  getRequiredColumns,
  getAllColumnsForTable,
  buildMarkersFromTableData,
} from '../TradingViewUtils';

describe('convertTime', () => {
  const utcSeconds = 1704067200; // 2024-01-01T00:00:00Z

  it('should apply explicit timezone offset for America/New_York', () => {
    // 2024-01-01 is EST (UTC-5), so offset = -5 * 3600 = -18000
    const result = convertTime(utcSeconds, 'America/New_York');
    expect(result).toBe(utcSeconds - 5 * 3600);
  });

  it('should apply explicit timezone offset for Asia/Tokyo', () => {
    // Tokyo is UTC+9, so offset = +9 * 3600
    const result = convertTime(utcSeconds, 'Asia/Tokyo');
    expect(result).toBe(utcSeconds + 9 * 3600);
  });

  it('should fall back to browser local timezone when no timezone provided', () => {
    const offsetSeconds = -(
      new Date(utcSeconds * 1000).getTimezoneOffset() * 60
    );
    const expected = utcSeconds + offsetSeconds;
    expect(convertTime(utcSeconds)).toBe(expected);
  });

  it('should convert milliseconds to offset-adjusted seconds', () => {
    const result = convertTime(utcSeconds * 1000, 'UTC');
    expect(result).toBe(utcSeconds); // UTC offset is 0
  });

  it('should convert nanoseconds to offset-adjusted seconds', () => {
    const result = convertTime(utcSeconds * 1e9, 'UTC');
    expect(result).toBe(utcSeconds);
  });

  it('should handle a Date object', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const result = convertTime(date, 'UTC');
    expect(result).toBe(utcSeconds);
  });

  it('should handle a string timestamp', () => {
    const result = convertTime('2024-01-01T00:00:00Z', 'UTC');
    expect(result).toBe(utcSeconds);
  });

  it('should return 0 for null/undefined', () => {
    expect(convertTime(null)).toBe(0);
    expect(convertTime(undefined)).toBe(0);
  });

  it('should return 0 for unsupported types like boolean', () => {
    expect(convertTime(true)).toBe(0);
  });

  it('should produce consistent results for same instant in different formats', () => {
    const tz = 'America/Chicago'; // UTC-6 in winter
    const fromSeconds = convertTime(utcSeconds, tz);
    const fromMillis = convertTime(utcSeconds * 1000, tz);
    const fromNanos = convertTime(utcSeconds * 1e9, tz);
    const fromDate = convertTime(new Date('2024-01-01T00:00:00Z'), tz);
    expect(fromSeconds).toBe(fromMillis);
    expect(fromMillis).toBe(fromNanos);
    expect(fromNanos).toBe(fromDate);
  });

  it('should use cached formatter for same timezone (performance)', () => {
    // Call twice with same timezone — second call should be fast (cached)
    const r1 = convertTime(utcSeconds, 'Europe/London');
    const r2 = convertTime(utcSeconds + 86400, 'Europe/London');
    // Both should produce valid results (not testing speed, just correctness)
    expect(typeof r1).toBe('number');
    expect(typeof r2).toBe('number');
    expect(r1).not.toBe(r2); // Different input → different output
  });
});

describe('transformTableData', () => {
  // In production, time column values are pre-converted by the model's
  // timeTranslator (TZ-adjusted epoch seconds). Tests use raw epoch
  // seconds directly, matching what the model would produce for UTC.

  describe('OHLC series (Candlestick)', () => {
    const ohlcConfig: TvlSeriesConfig = {
      id: 'candle-1',
      type: 'Candlestick',
      options: {},
      dataMapping: {
        tableId: 0,
        columns: {
          time: 'Timestamp',
          open: 'Open',
          high: 'High',
          low: 'Low',
          close: 'Close',
        },
      },
    };

    it('should produce OHLC data points', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1704067200, 1704153600]],
        ['Open', [100, 105]],
        ['High', [110, 115]],
        ['Low', [95, 100]],
        ['Close', [105, 110]],
      ]);

      const result = transformTableData(ohlcConfig, columnData);
      expect(result).toEqual([
        {
          time: 1704067200,
          open: 100,
          high: 110,
          low: 95,
          close: 105,
        },
        {
          time: 1704153600,
          open: 105,
          high: 115,
          low: 100,
          close: 110,
        },
      ]);
    });

    it('should return empty array when time column is missing', () => {
      const columnData = new Map<string, unknown[]>([
        ['Open', [100]],
        ['High', [110]],
      ]);

      const result = transformTableData(ohlcConfig, columnData);
      expect(result).toEqual([]);
    });

    it('should handle object values by converting them to numbers', () => {
      // Simulate Deephaven BigDecimal-like objects with valueOf
      const bigVal = { valueOf: () => 123.45 };
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1704067200]],
        ['Open', [bigVal]],
        ['High', [bigVal]],
        ['Low', [bigVal]],
        ['Close', [bigVal]],
      ]);

      const result = transformTableData(ohlcConfig, columnData);
      expect(result).toHaveLength(1);
      // Object values should be converted via Number()
      expect((result[0] as Record<string, unknown>).open).toBe(Number(bigVal));
    });

    it('should handle empty column data', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', []],
        ['Open', []],
        ['High', []],
        ['Low', []],
        ['Close', []],
      ]);

      const result = transformTableData(ohlcConfig, columnData);
      expect(result).toEqual([]);
    });
  });

  describe('value-based series (Line, Area)', () => {
    const lineConfig: TvlSeriesConfig = {
      id: 'line-1',
      type: 'Line',
      options: {},
      dataMapping: {
        tableId: 0,
        columns: {
          time: 'Timestamp',
          value: 'Price',
        },
      },
    };

    it('should produce value data points', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1704067200, 1704153600]],
        ['Price', [100.5, 101.3]],
      ]);

      const result = transformTableData(lineConfig, columnData);
      expect(result).toEqual([
        { time: 1704067200, value: 100.5 },
        { time: 1704153600, value: 101.3 },
      ]);
    });

    it('should skip missing non-time columns gracefully', () => {
      // Only time column present, value column missing from map
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1704067200]],
      ]);

      const result = transformTableData(lineConfig, columnData);
      expect(result).toEqual([{ time: 1704067200 }]);
    });
  });

  describe('startIndex parameter', () => {
    const config: TvlSeriesConfig = {
      id: 'line-si',
      type: 'Line',
      options: {},
      dataMapping: {
        tableId: 0,
        columns: { time: 'Timestamp', value: 'Val' },
      },
    };

    it('should only process rows from startIndex onward', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1000, 2000, 3000, 4000]],
        ['Val', [10, 20, 30, 40]],
      ]);

      const result = transformTableData(config, columnData, undefined, 2);
      expect(result).toEqual([
        { time: 3000, value: 30 },
        { time: 4000, value: 40 },
      ]);
    });

    it('should return all rows when startIndex is 0', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1000, 2000]],
        ['Val', [10, 20]],
      ]);

      const all = transformTableData(config, columnData);
      const withZero = transformTableData(config, columnData, undefined, 0);
      expect(all).toEqual(withZero);
    });

    it('should return empty array when startIndex exceeds length', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1000, 2000]],
        ['Val', [10, 20]],
      ]);

      const result = transformTableData(config, columnData, undefined, 100);
      expect(result).toEqual([]);
    });

    it('should clamp negative startIndex to 0', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1000, 2000]],
        ['Val', [10, 20]],
      ]);

      const result = transformTableData(config, columnData, undefined, -5);
      expect(result).toHaveLength(2);
    });
  });

  describe('pre-converted time values', () => {
    const config: TvlSeriesConfig = {
      id: 'line-2',
      type: 'Line',
      options: {},
      dataMapping: {
        tableId: 0,
        columns: {
          time: 'Timestamp',
          value: 'Val',
        },
      },
    };

    it('should read pre-converted epoch seconds directly', () => {
      // Model's timeTranslator already produced TZ-adjusted seconds
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1704067200]],
        ['Val', [42]],
      ]);

      const result = transformTableData(config, columnData);
      expect(result).toEqual([{ time: 1704067200, value: 42 }]);
    });

    it('should floor fractional seconds', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', [1704067200.999]],
        ['Val', [42]],
      ]);

      const result = transformTableData(config, columnData);
      expect(result).toEqual([{ time: 1704067200, value: 42 }]);
    });

    it('should return 0 for non-numeric time values', () => {
      const columnData = new Map<string, unknown[]>([
        ['Timestamp', ['not-a-number']],
        ['Val', [42]],
      ]);

      const result = transformTableData(config, columnData);
      // First row (i=0) is included even with time=0
      expect(result).toHaveLength(1);
      expect((result[0] as Record<string, unknown>).time).toBe(0);
    });
  });
});

describe('getRequiredColumns', () => {
  it('should return all column names from the data mapping', () => {
    const config: TvlSeriesConfig = {
      id: 'test',
      type: 'Candlestick',
      options: {},
      dataMapping: {
        tableId: 0,
        columns: {
          time: 'Timestamp',
          open: 'Open',
          high: 'High',
          low: 'Low',
          close: 'Close',
        },
      },
    };

    const cols = getRequiredColumns(config);
    expect(cols).toEqual(['Timestamp', 'Open', 'High', 'Low', 'Close']);
  });
});

describe('getAllColumnsForTable', () => {
  it('should return unique columns for a specific table', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Candlestick',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'Timestamp', open: 'Open', close: 'Close' },
        },
      },
      {
        id: 's2',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'Timestamp', value: 'Volume' },
        },
      },
    ];

    const cols = getAllColumnsForTable(series, 0);
    // 'Timestamp' appears in both but should only be listed once
    expect(cols).toContain('Timestamp');
    expect(cols).toContain('Open');
    expect(cols).toContain('Close');
    expect(cols).toContain('Volume');
    expect(cols).toHaveLength(4);
  });

  it('should return columns only for the requested table', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'T', value: 'V1' },
        },
      },
      {
        id: 's2',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 1,
          columns: { time: 'T', value: 'V2' },
        },
      },
    ];

    const cols0 = getAllColumnsForTable(series, 0);
    expect(cols0).toEqual(['T', 'V1']);

    const cols1 = getAllColumnsForTable(series, 1);
    expect(cols1).toEqual(['T', 'V2']);
  });

  it('should return an empty array if no series match the table', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'T', value: 'V' },
        },
      },
    ];

    const cols = getAllColumnsForTable(series, 99);
    expect(cols).toEqual([]);
  });

  it('should include columns from dynamic price lines', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'T', value: 'V' },
        },
        priceLines: [
          { column: 'AvgPrice', color: 'blue', title: 'Avg' },
          { column: 'MaxPrice', color: 'green', title: 'Max' },
          { price: 100, color: 'gray', title: 'Static' },
        ],
      },
    ];

    const cols = getAllColumnsForTable(series, 0);
    expect(cols).toContain('T');
    expect(cols).toContain('V');
    expect(cols).toContain('AvgPrice');
    expect(cols).toContain('MaxPrice');
    expect(cols).toHaveLength(4);
  });

  it('should not duplicate columns shared between series data and price lines', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'T', value: 'Price' },
        },
        priceLines: [
          { column: 'Price', color: 'blue', title: 'Last' },
        ],
      },
    ];

    const cols = getAllColumnsForTable(series, 0);
    expect(cols).toContain('T');
    expect(cols).toContain('Price');
    expect(cols).toHaveLength(2);
  });
});

describe('transformTableData with yieldCurve chartType', () => {
  const config: TvlSeriesConfig = {
    id: 'yc-1',
    type: 'Line',
    options: {},
    dataMapping: {
      tableId: 0,
      columns: { time: 'Maturity', value: 'Yield' },
    },
  };

  it('should pass time values through as-is for yieldCurve', () => {
    const columnData = new Map<string, unknown[]>([
      ['Maturity', [1, 3, 6, 12, 24, 60, 120]],
      ['Yield', [4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1]],
    ]);
    const result = transformTableData(config, columnData, 'yieldCurve');
    expect(result).toEqual([
      { time: 1, value: 4.5 },
      { time: 3, value: 4.6 },
      { time: 6, value: 4.7 },
      { time: 12, value: 4.8 },
      { time: 24, value: 4.9 },
      { time: 60, value: 5.0 },
      { time: 120, value: 5.1 },
    ]);
  });

  it('should NOT apply timezone conversion for yieldCurve', () => {
    const columnData = new Map<string, unknown[]>([
      ['Maturity', [12]],
      ['Yield', [4.8]],
    ]);
    const result = transformTableData(config, columnData, 'yieldCurve');
    // Raw value 12 should be preserved, not timezone-shifted
    expect((result[0] as Record<string, unknown>).time).toBe(12);
  });

  it('should allow time value of 0 for yieldCurve', () => {
    const columnData = new Map<string, unknown[]>([
      ['Maturity', [0, 1, 3]],
      ['Yield', [4.0, 4.5, 4.6]],
    ]);
    const result = transformTableData(config, columnData, 'yieldCurve');
    expect(result).toHaveLength(3);
    expect((result[0] as Record<string, unknown>).time).toBe(0);
  });
});

describe('transformTableData with options chartType', () => {
  const config: TvlSeriesConfig = {
    id: 'opt-1',
    type: 'Line',
    options: {},
    dataMapping: {
      tableId: 0,
      columns: { time: 'Strike', value: 'Premium' },
    },
  };

  it('should pass strike prices through as-is', () => {
    const columnData = new Map<string, unknown[]>([
      ['Strike', [90, 95, 100, 105, 110]],
      ['Premium', [12.5, 8.3, 5.1, 3.2, 1.8]],
    ]);
    const result = transformTableData(config, columnData, 'options');
    expect(result).toEqual([
      { time: 90, value: 12.5 },
      { time: 95, value: 8.3 },
      { time: 100, value: 5.1 },
      { time: 105, value: 3.2 },
      { time: 110, value: 1.8 },
    ]);
  });

  it('should NOT apply timezone conversion for options', () => {
    const columnData = new Map<string, unknown[]>([
      ['Strike', [100]],
      ['Premium', [5.0]],
    ]);
    const result = transformTableData(config, columnData, 'options');
    expect((result[0] as Record<string, unknown>).time).toBe(100);
  });
});

describe('getAllColumnsForTable with markerSpec', () => {
  it('should include marker spec columns for matching tableId', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'T', value: 'V' },
        },
        markerSpec: {
          tableId: 1,
          columns: { time: 'SignalTime', text: 'Label' },
          defaults: { position: 'aboveBar', shape: 'circle', color: '#000' },
        },
      },
    ];

    const cols = getAllColumnsForTable(series, 1);
    expect(cols).toContain('SignalTime');
    expect(cols).toContain('Label');
    expect(cols).toHaveLength(2);
  });

  it('should not include marker spec columns for non-matching tableId', () => {
    const series: TvlSeriesConfig[] = [
      {
        id: 's1',
        type: 'Line',
        options: {},
        dataMapping: {
          tableId: 0,
          columns: { time: 'T', value: 'V' },
        },
        markerSpec: {
          tableId: 1,
          columns: { time: 'SignalTime', text: 'Label' },
          defaults: {},
        },
      },
    ];

    const cols = getAllColumnsForTable(series, 0);
    expect(cols).toContain('T');
    expect(cols).toContain('V');
    expect(cols).not.toContain('SignalTime');
    expect(cols).not.toContain('Label');
  });
});

describe('buildMarkersFromTableData', () => {
  const baseSpec: TvlMarkerSpec = {
    tableId: 1,
    columns: { time: 'Time' },
    defaults: {
      position: 'aboveBar',
      shape: 'circle',
      color: '#FF0000',
      text: 'Signal',
    },
  };

  it('should build markers with all fixed defaults', () => {
    // Time values are pre-converted epoch seconds (from model's timeTranslator)
    const columnData = new Map<string, unknown[]>([
      ['Time', [1704067200, 1704153600]],
    ]);

    const result = buildMarkersFromTableData(baseSpec, columnData);

    expect(result).toHaveLength(2);
    expect(result[0].position).toBe('aboveBar');
    expect(result[0].shape).toBe('circle');
    expect(result[0].color).toBe('#FF0000');
    expect(result[0].text).toBe('Signal');
  });

  it('should resolve per-row values from columns', () => {
    const spec: TvlMarkerSpec = {
      tableId: 1,
      columns: {
        time: 'Time',
        text: 'Label',
        color: 'Color',
        position: 'Pos',
      },
      defaults: { shape: 'arrowUp' },
    };

    const columnData = new Map<string, unknown[]>([
      ['Time', [1704067200, 1704153600]],
      ['Label', ['Buy', 'Sell']],
      ['Color', ['#00FF00', '#FF0000']],
      ['Pos', ['belowBar', 'aboveBar']],
    ]);

    const result = buildMarkersFromTableData(spec, columnData);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Buy');
    expect(result[0].color).toBe('#00FF00');
    expect(result[0].position).toBe('belowBar');
    expect(result[0].shape).toBe('arrowUp');
    expect(result[1].text).toBe('Sell');
    expect(result[1].color).toBe('#FF0000');
    expect(result[1].position).toBe('aboveBar');
  });

  it('should map snake_case position and shape from columns', () => {
    const spec: TvlMarkerSpec = {
      tableId: 1,
      columns: { time: 'Time', position: 'Pos', shape: 'Shape' },
      defaults: { text: 'X', color: '#000' },
    };

    const columnData = new Map<string, unknown[]>([
      ['Time', [1704067200]],
      ['Pos', ['below_bar']],
      ['Shape', ['arrow_up']],
    ]);

    const result = buildMarkersFromTableData(spec, columnData);

    expect(result).toHaveLength(1);
    expect(result[0].position).toBe('belowBar');
    expect(result[0].shape).toBe('arrowUp');
  });

  it('should sort markers by time', () => {
    const columnData = new Map<string, unknown[]>([
      ['Time', [1704153600, 1704067200]],
    ]);

    const result = buildMarkersFromTableData(baseSpec, columnData);

    expect(result).toHaveLength(2);
    expect((result[0].time as number)).toBeLessThan(result[1].time as number);
  });

  it('should return empty array when time column is missing', () => {
    const columnData = new Map<string, unknown[]>([
      ['Other', [1, 2, 3]],
    ]);

    const result = buildMarkersFromTableData(baseSpec, columnData);
    expect(result).toEqual([]);
  });

  it('should pass through numeric time for yieldCurve chart type', () => {
    const columnData = new Map<string, unknown[]>([
      ['Time', [12, 24, 60]],
    ]);

    const result = buildMarkersFromTableData(
      baseSpec,
      columnData,
      'yieldCurve'
    );

    expect(result).toHaveLength(3);
    expect(result[0].time).toBe(12);
    expect(result[1].time).toBe(24);
    expect(result[2].time).toBe(60);
  });

  it('should include size when provided from column', () => {
    const spec: TvlMarkerSpec = {
      tableId: 1,
      columns: { time: 'Time', size: 'Sz' },
      defaults: { text: 'X', color: '#000', position: 'aboveBar', shape: 'circle' },
    };

    const columnData = new Map<string, unknown[]>([
      ['Time', [1704067200]],
      ['Sz', [3]],
    ]);

    const result = buildMarkersFromTableData(spec, columnData);
    expect(result[0].size).toBe(3);
  });
});
