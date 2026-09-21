/**
 * Probe: press-event resolution on a scaffolded (continuous-axis) chart,
 * driven by the REAL lightweight-charts library. Reproduces the e2e events
 * fixture shape: two flat line series (A ~10, B ~90) sharing 5 daily
 * timestamps, plus a dense whitespace scaffold. LWC builds click params at
 * the raw pointer index (no whitespace skip), so seriesData arrives empty;
 * snapPressParamsToData must re-resolve at the nearest real data point.
 */
import path from 'path';
import type {
  ISeriesApi,
  MouseEventParams,
  SeriesType,
  Time,
} from 'lightweight-charts';
import {
  buildPressEventPayload,
  snapPressParamsToData,
} from '../TradingViewEventPayload';

// Absolute path dodges both the jest mock mapping and the package "exports"
// restriction on dist subpaths.
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
require(path.join(
  __dirname,
  '../../../../../../node_modules/lightweight-charts/dist/lightweight-charts.standalone.development.js'
));

type LwcGlobal = {
  createChart: (
    el: HTMLElement,
    opts?: unknown
  ) => {
    addSeries: (
      def: unknown,
      opts?: unknown
    ) => ISeriesApi<SeriesType> & { setData: (d: unknown[]) => void };
    timeScale: () => {
      fitContent: () => void;
      timeToCoordinate: (t: Time) => number | null;
      coordinateToLogical: (x: number) => number | null;
    };
    takeScreenshot: () => unknown;
    remove: () => void;
  };
  LineSeries: unknown;
};
const lwc = (window as unknown as { LightweightCharts: LwcGlobal })
  .LightweightCharts;

beforeAll(() => {
  // jsdom lacks ResizeObserver; LWC needs it even with fixed sizes.
  const w = window as unknown as { ResizeObserver?: unknown };
  if (w.ResizeObserver == null) {
    const noop = (): void => undefined;
    w.ResizeObserver = function ResizeObserverShim(): {
      observe: () => void;
      unobserve: () => void;
      disconnect: () => void;
    } {
      return { observe: noop, unobserve: noop, disconnect: noop };
    };
  }
});

const DAY = 86400;
const T0 = 1_717_423_200; // 2024-06-03T14:00:00Z, matches the e2e fixture
const TIMES = [T0, T0 + DAY, T0 + 2 * DAY, T0 + 3 * DAY, T0 + 4 * DAY];

describe('press snapping on a scaffolded chart (real LWC)', () => {
  it('resolves seriesId/value/time at the nearest data point', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = lwc.createChart(container, {
      width: 1600,
      height: 300,
      timeScale: { minBarSpacing: 0.01, ignoreWhitespaceIndices: true },
    });

    // Scaffold first (as configureSeries does): dense whitespace.
    const scaffold = chart.addSeries(lwc.LineSeries, {
      color: 'transparent',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const scaffoldPoints: Array<{ time: number }> = [];
    const span = TIMES[4] - TIMES[0];
    for (let i = 0; i < 1000; i += 1) {
      scaffoldPoints.push({
        time: Math.round(TIMES[0] + (span * i) / 999),
      });
    }
    scaffold.setData(scaffoldPoints);

    const seriesA = chart.addSeries(lwc.LineSeries, {});
    seriesA.setData(TIMES.map(t => ({ time: t, value: 10 })));
    const seriesB = chart.addSeries(lwc.LineSeries, {});
    seriesB.setData(TIMES.map(t => ({ time: t, value: 90 })));

    chart.timeScale().fitContent();
    chart.takeScreenshot(); // force a synchronous layout/paint

    const timeScale = chart.timeScale();
    const x = timeScale.timeToCoordinate(TIMES[0] as Time);
    expect(x).not.toBeNull();
    const yA = seriesA.priceToCoordinate(10);
    expect(yA).not.toBeNull();
    const logical = timeScale.coordinateToLogical(x as number);
    expect(logical).not.toBeNull();

    // What LWC's click path produces on a scaffolded chart: raw index,
    // empty seriesData (whitespace slot), no hovered info.
    const rawParams = {
      time: undefined,
      logical,
      point: { x: x as number, y: yA as number },
      paneIndex: 0,
      hoveredSeries: undefined,
      hoveredObject: undefined,
      hoveredInfo: undefined,
      seriesData: new Map(),
      sourceEvent: { shiftKey: false },
    } as unknown as MouseEventParams;

    const snapped = snapPressParamsToData(rawParams, [seriesA, seriesB], t =>
      timeScale.timeToCoordinate(t)
    );

    // Both series have data at the snapped time.
    expect(snapped.seriesData.size).toBe(2);
    expect(snapped.time).toBe(TIMES[0]);

    const ids = new Map<unknown, string>([
      [seriesA, 'series_0_A'],
      [seriesB, 'series_0_B'],
    ]);
    const payload = buildPressEventPayload(
      'press',
      snapped,
      s => ids.get(s),
      () => undefined,
      ''
    );

    // The press at y(10) must resolve to series A with value ~10.
    expect(payload.hoveredSeriesId).toBe('series_0_A');
    const hit = payload.seriesData[payload.hoveredSeries as string];
    expect(hit != null && 'value' in hit ? hit.value : NaN).toBe(10);
    expect(payload.timeNs).toBe(TIMES[0] * 1e9);

    // Params that already carry data pass through untouched.
    const withData = {
      ...rawParams,
      seriesData: new Map([[seriesA, { time: TIMES[1], value: 10 }]]),
    } as unknown as MouseEventParams;
    expect(
      snapPressParamsToData(withData, [seriesA, seriesB], t =>
        timeScale.timeToCoordinate(t)
      )
    ).toBe(withData);

    chart.remove();
  });
});
