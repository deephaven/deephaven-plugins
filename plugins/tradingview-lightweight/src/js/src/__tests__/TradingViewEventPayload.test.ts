import type {
  MouseEventParams,
  ISeriesApi,
  SeriesType,
} from 'lightweight-charts';
import { buildPressEventPayload } from '../TradingViewEventPayload';

// Lightweight fake ISeriesApi objects. The payload builder only ever uses
// them as Map keys / identity references plus coordinateToPrice, so plain
// objects with an optional coordinateToPrice fn are sufficient.
type FakeSeries = {
  coordinateToPrice?: (y: number) => number | null;
};

function asSeries(s: FakeSeries): ISeriesApi<SeriesType> {
  return s as unknown as ISeriesApi<SeriesType>;
}

/** Build a getSeriesId resolver backed by a Map you control. */
function makeResolver(
  entries: Array<[FakeSeries, string]>
): (s: ISeriesApi<SeriesType>) => string | undefined {
  const map = new Map<FakeSeries, string>(entries);
  return (s: ISeriesApi<SeriesType>) =>
    map.get(s as unknown as FakeSeries) ?? undefined;
}

describe('buildPressEventPayload', () => {
  describe('seriesId from hoveredInfo', () => {
    it('resolves seriesId when sourceKind === "series" and series set', () => {
      const seriesA: FakeSeries = {};
      const resolver = makeResolver([[seriesA, 'series-a']]);
      const params = {
        seriesData: new Map(),
        hoveredInfo: {
          sourceKind: 'series',
          objectKind: 'series',
          series: asSeries(seriesA),
        },
      } as unknown as MouseEventParams;

      const payload = buildPressEventPayload('press', params, resolver, 'UTC');
      expect(payload.seriesId).toBe('series-a');
    });

    it('resolves seriesId for a series-owned price line (objectKind custom-price-line)', () => {
      // A flat line coincides with its last-value price line, so the native
      // hit reports objectKind 'custom-price-line' but sourceKind 'series'.
      // It still means "this series was pressed".
      const seriesA: FakeSeries = {};
      const resolver = makeResolver([[seriesA, 'series-a']]);
      const params = {
        seriesData: new Map(),
        hoveredInfo: {
          sourceKind: 'series',
          objectKind: 'custom-price-line',
          series: asSeries(seriesA),
        },
      } as unknown as MouseEventParams;

      const payload = buildPressEventPayload('press', params, resolver, 'UTC');
      expect(payload.seriesId).toBe('series-a');
    });

    it('omits seriesId when sourceKind is not "series"', () => {
      const seriesA: FakeSeries = {};
      const resolver = makeResolver([[seriesA, 'series-a']]);
      const params = {
        seriesData: new Map(),
        hoveredInfo: {
          sourceKind: 'pane-primitive',
          objectKind: 'primitive',
          series: asSeries(seriesA),
        },
      } as unknown as MouseEventParams;

      const payload = buildPressEventPayload('press', params, resolver, 'UTC');
      expect(payload.seriesId).toBeUndefined();
    });

    it('omits seriesId when no hoveredInfo present', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;

      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.seriesId).toBeUndefined();
    });
  });

  describe('seriesData reverse-map', () => {
    it('maps line value to a number and OHLC to an object, skips unknown', () => {
      const seriesLine: FakeSeries = {};
      const seriesOhlc: FakeSeries = {};
      const seriesUnknown: FakeSeries = {};
      const resolver = makeResolver([
        [seriesLine, 'line-1'],
        [seriesOhlc, 'ohlc-1'],
        // seriesUnknown intentionally not registered
      ]);

      const seriesData = new Map<ISeriesApi<SeriesType>, unknown>([
        [asSeries(seriesLine), { value: 42.5 }],
        [asSeries(seriesOhlc), { open: 1, high: 4, low: 0.5, close: 3 }],
        [asSeries(seriesUnknown), { value: 99 }],
      ]);

      const params = {
        seriesData,
      } as unknown as MouseEventParams;

      const payload = buildPressEventPayload('press', params, resolver, 'UTC');
      expect(payload.seriesData).toEqual({
        'line-1': 42.5,
        'ohlc-1': { open: 1, high: 4, low: 0.5, close: 3 },
      });
    });

    it('skips data items with neither value nor OHLC (whitespace)', () => {
      const seriesA: FakeSeries = {};
      const resolver = makeResolver([[seriesA, 'a']]);
      const seriesData = new Map<ISeriesApi<SeriesType>, unknown>([
        [asSeries(seriesA), { time: 123 }],
      ]);
      const params = { seriesData } as unknown as MouseEventParams;
      const payload = buildPressEventPayload('press', params, resolver, 'UTC');
      expect(payload.seriesData).toEqual({});
    });
  });

  describe('time conversion', () => {
    it('converts UTC seconds to nanoseconds with timeZone=UTC', () => {
      const params = {
        seriesData: new Map(),
        time: 1700000000,
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.timeNs).toBe(1700000000 * 1e9);
    });

    it('reverses TZ shift for a non-UTC zone', () => {
      // New York is UTC-5 (no DST) in winter. The chart stores a TZ-shifted
      // value (real UTC + offset). unconvertTime removes the offset, then we
      // scale to nanoseconds. We assert the field is a finite multiple of 1e9
      // and differs from the naive UTC interpretation by the NY offset.
      const tzShifted = 1700000000; // chart seconds
      const utcParams = {
        seriesData: new Map(),
        time: tzShifted,
      } as unknown as MouseEventParams;
      const ny = buildPressEventPayload(
        'press',
        utcParams,
        resolver0(),
        'America/New_York'
      );
      const utc = buildPressEventPayload(
        'press',
        utcParams,
        resolver0(),
        'UTC'
      );
      // NY in winter is 5h behind UTC => unconvertTime subtracts -5h*3600
      const expectedDiffSec = 5 * 3600;
      expect((utc.timeNs as number) - (ny.timeNs as number)).toBe(
        -expectedDiffSec * 1e9
      );
    });

    it('omits timeNs when time is undefined (empty area)', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.timeNs).toBeUndefined();
      expect('timeNs' in payload).toBe(false);
    });

    it('carries the display timeZone alongside timeNs', () => {
      const params = {
        seriesData: new Map(),
        time: 1700000000,
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'America/New_York'
      );
      expect(payload.timeZone).toBe('America/New_York');
    });

    it('omits timeZone when none is supplied (empty string)', () => {
      const params = {
        seriesData: new Map(),
        time: 1700000000,
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload('press', params, resolver0(), '');
      expect('timeZone' in payload).toBe(false);
    });

    it('omits timeZone on empty-area press (no time)', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'America/New_York'
      );
      expect('timeZone' in payload).toBe(false);
    });
  });

  describe('modifier keys', () => {
    it('extracts modifiers from sourceEvent', () => {
      const params = {
        seriesData: new Map(),
        sourceEvent: {
          shiftKey: true,
          ctrlKey: false,
          metaKey: true,
          altKey: false,
        },
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.shiftKey).toBe(true);
      expect(payload.ctrlKey).toBe(false);
      expect(payload.metaKey).toBe(true);
      expect(payload.altKey).toBe(false);
    });

    it('defaults all modifiers to false when sourceEvent missing', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.shiftKey).toBe(false);
      expect(payload.ctrlKey).toBe(false);
      expect(payload.metaKey).toBe(false);
      expect(payload.altKey).toBe(false);
    });
  });

  describe('point and price', () => {
    it('includes point and price from coordinateToPrice when hovered', () => {
      const seriesA: FakeSeries = {
        coordinateToPrice: (y: number) => y * 2,
      };
      const resolver = makeResolver([[seriesA, 'a']]);
      const params = {
        seriesData: new Map(),
        point: { x: 100, y: 50 },
        hoveredInfo: {
          sourceKind: 'series',
          objectKind: 'series',
          series: asSeries(seriesA),
        },
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload('press', params, resolver, 'UTC');
      expect(payload.point).toEqual({ x: 100, y: 50 });
      expect(payload.price).toBe(100);
    });

    it('omits price when no hovered series even if point present', () => {
      const params = {
        seriesData: new Map(),
        point: { x: 10, y: 20 },
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.point).toEqual({ x: 10, y: 20 });
      expect(payload.price).toBeUndefined();
    });

    it('omits point when point is undefined', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.point).toBeUndefined();
    });
  });

  describe('paneIndex', () => {
    it('uses params.paneIndex when set', () => {
      const params = {
        seriesData: new Map(),
        paneIndex: 2,
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.paneIndex).toBe(2);
    });

    it('falls back to hoveredInfo.paneIndex', () => {
      const params = {
        seriesData: new Map(),
        hoveredInfo: { objectKind: 'series', paneIndex: 1 },
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.paneIndex).toBe(1);
    });

    it('omits paneIndex when neither present', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.paneIndex).toBeUndefined();
    });
  });

  describe('empty-area press', () => {
    it('produces a minimal shape with type + modifiers only', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'press',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload).toEqual({
        type: 'press',
        seriesData: {},
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      });
    });
  });

  describe('type passthrough', () => {
    it('carries doublePress through', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPressEventPayload(
        'doublePress',
        params,
        resolver0(),
        'UTC'
      );
      expect(payload.type).toBe('doublePress');
    });
  });
});

/** An empty resolver (resolves nothing). */
function resolver0(): (s: ISeriesApi<SeriesType>) => string | undefined {
  return () => undefined;
}
