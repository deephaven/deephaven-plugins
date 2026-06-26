import type {
  MouseEventParams,
  ISeriesApi,
  SeriesType,
} from 'lightweight-charts';
import { buildPressEventPayload } from '../TradingViewEventPayload';

// Lightweight fake ISeriesApi objects. The payload builder only uses them as
// identity keys for the id/title resolvers.
type FakeSeries = {
  title?: string;
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

function makeTitleResolver(): (
  s: ISeriesApi<SeriesType>
) => string | undefined {
  return (s: ISeriesApi<SeriesType>) =>
    (s as unknown as FakeSeries).title ?? undefined;
}

function buildPayload(
  type: 'press' | 'doublePress',
  params: MouseEventParams,
  getSeriesId: (s: ISeriesApi<SeriesType>) => string | undefined,
  timeZone = 'UTC'
) {
  return buildPressEventPayload(
    type,
    params,
    getSeriesId,
    makeTitleResolver(),
    timeZone
  );
}

/** An empty resolver (resolves nothing). */
function resolver0(): (s: ISeriesApi<SeriesType>) => string | undefined {
  return () => undefined;
}

describe('buildPressEventPayload', () => {
  describe('seriesData', () => {
    it('maps line value to { value } and OHLC to an object, skips unknown', () => {
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
      const params = { seriesData } as unknown as MouseEventParams;

      const payload = buildPayload('press', params, resolver);
      expect(payload.seriesData).toEqual({
        'line-1': { value: 42.5 },
        'ohlc-1': { open: 1, high: 4, low: 0.5, close: 3 },
      });
    });

    it('keys seriesData by the series title when present', () => {
      const series: FakeSeries = { title: 'AAA' };
      const resolver = makeResolver([[series, 'series_0_AAA']]);
      const seriesData = new Map<ISeriesApi<SeriesType>, unknown>([
        [asSeries(series), { value: 7 }],
      ]);
      const params = { seriesData } as unknown as MouseEventParams;

      const payload = buildPayload('press', params, resolver);
      expect(payload.seriesData).toEqual({ AAA: { value: 7 } });
    });

    it('skips whitespace items with neither value nor OHLC', () => {
      const series: FakeSeries = {};
      const resolver = makeResolver([[series, 'a']]);
      const seriesData = new Map<ISeriesApi<SeriesType>, unknown>([
        [asSeries(series), { time: 123 }],
      ]);
      const params = { seriesData } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver);
      expect(payload.seriesData).toEqual({});
    });
  });

  describe('hovered series', () => {
    it('emits friendly id and stable id from hoveredInfo.series', () => {
      const series: FakeSeries = { title: 'AAA' };
      const resolver = makeResolver([[series, 'series_0_AAA']]);
      const params = {
        seriesData: new Map(),
        hoveredInfo: { series: asSeries(series) },
      } as unknown as MouseEventParams;

      const payload = buildPayload('press', params, resolver);
      expect(payload.hoveredSeries).toBe('AAA');
      expect(payload.hoveredSeriesId).toBe('series_0_AAA');
    });

    it('falls back to the stable id as the friendly key when no title', () => {
      const series: FakeSeries = {};
      const resolver = makeResolver([[series, 'series_0']]);
      const params = {
        seriesData: new Map(),
        hoveredInfo: { series: asSeries(series) },
      } as unknown as MouseEventParams;

      const payload = buildPayload('press', params, resolver);
      expect(payload.hoveredSeries).toBe('series_0');
      expect(payload.hoveredSeriesId).toBe('series_0');
    });

    it('omits hovered fields when no series is hovered', () => {
      const params = {
        seriesData: new Map(),
      } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect('hoveredSeries' in payload).toBe(false);
      expect('hoveredSeriesId' in payload).toBe(false);
    });
  });

  describe('point / logical / paneIndex', () => {
    it('passes through point coordinates', () => {
      const params = {
        seriesData: new Map(),
        point: { x: 100, y: 50 },
      } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect(payload.point).toEqual({ x: 100, y: 50 });
    });

    it('omits point when outside the chart', () => {
      const params = { seriesData: new Map() } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect('point' in payload).toBe(false);
    });

    it('passes through logical index', () => {
      const params = {
        seriesData: new Map(),
        logical: 1234,
      } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect(payload.logical).toBe(1234);
    });

    it('uses params.paneIndex, then hoveredInfo.paneIndex', () => {
      const a = {
        seriesData: new Map(),
        paneIndex: 2,
      } as unknown as MouseEventParams;
      expect(buildPayload('press', a, resolver0()).paneIndex).toBe(2);

      const b = {
        seriesData: new Map(),
        hoveredInfo: { paneIndex: 1 },
      } as unknown as MouseEventParams;
      expect(buildPayload('press', b, resolver0()).paneIndex).toBe(1);
    });
  });

  describe('time conversion', () => {
    it('converts the crosshair time (UTC seconds) to nanoseconds', () => {
      const params = {
        seriesData: new Map(),
        time: 1700000000,
      } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect(payload.timeNs).toBe(1700000000 * 1e9);
    });

    it('reverses TZ shift for a non-UTC zone', () => {
      const params = {
        seriesData: new Map(),
        time: 1700000000,
      } as unknown as MouseEventParams;
      const ny = buildPayload('press', params, resolver0(), 'America/New_York');
      const utc = buildPayload('press', params, resolver0(), 'UTC');
      const expectedDiffSec = 5 * 3600; // NY is UTC-5 in winter
      expect((utc.timeNs as number) - (ny.timeNs as number)).toBe(
        -expectedDiffSec * 1e9
      );
    });

    it('omits timeNs when time is undefined (outside data range)', () => {
      const params = { seriesData: new Map() } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect('timeNs' in payload).toBe(false);
    });

    it('carries the display timeZone alongside timeNs', () => {
      const params = {
        seriesData: new Map(),
        time: 1700000000,
      } as unknown as MouseEventParams;
      const payload = buildPayload(
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
      const payload = buildPayload('press', params, resolver0(), '');
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
      const payload = buildPayload('press', params, resolver0());
      expect(payload.shiftKey).toBe(true);
      expect(payload.ctrlKey).toBe(false);
      expect(payload.metaKey).toBe(true);
      expect(payload.altKey).toBe(false);
    });

    it('defaults all modifiers to false when sourceEvent missing', () => {
      const params = { seriesData: new Map() } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
      expect(payload.shiftKey).toBe(false);
      expect(payload.ctrlKey).toBe(false);
      expect(payload.metaKey).toBe(false);
      expect(payload.altKey).toBe(false);
    });
  });

  describe('empty-area press', () => {
    it('produces a minimal shape with type, empty seriesData + modifiers', () => {
      const params = { seriesData: new Map() } as unknown as MouseEventParams;
      const payload = buildPayload('press', params, resolver0());
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
      const params = { seriesData: new Map() } as unknown as MouseEventParams;
      const payload = buildPayload('doublePress', params, resolver0());
      expect(payload.type).toBe('doublePress');
    });
  });
});
