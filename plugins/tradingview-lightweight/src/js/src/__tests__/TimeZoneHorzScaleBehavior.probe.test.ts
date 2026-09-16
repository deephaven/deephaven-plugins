/**
 * Probe: drive the zone-aware horizontal scale behavior through the REAL
 * lightweight-charts base class. Proves the point of the exercise — the chart
 * coordinate stays true UTC (so a DST "fall back" no longer collapses two
 * instants) while day ticks still land on LOCAL midnight, not UTC midnight.
 */
import path from 'path';
import { createBehaviorClass } from '../TimeZoneHorzScaleBehavior';

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
require(path.join(
  __dirname,
  '../../../../../../node_modules/lightweight-charts/dist/lightweight-charts.standalone.development.js'
));

type Behavior = {
  convertHorzItemToInternal: (t: number) => unknown;
  fillWeightsForPoints: (
    points: Array<{ time: unknown; timeWeight: number }>,
    startIndex: number
  ) => void;
  setTimeZone: (tz: string | undefined) => void;
};
type Lwc = {
  defaultHorzScaleBehavior: () => new () => Behavior;
  createChartEx: (
    el: HTMLElement,
    behavior: unknown,
    opts?: unknown
  ) => {
    addSeries: (
      def: unknown,
      opts?: unknown
    ) => { setData: (d: unknown[]) => void; data: () => unknown[] };
    timeScale: () => { fitContent: () => void };
    takeScreenshot: () => unknown;
    remove: () => void;
  };
  LineSeries: unknown;
};
const lwc = (globalThis as unknown as { LightweightCharts: Lwc })
  .LightweightCharts;

const NY = 'America/New_York';
const HOUR = 3600;
const WEIGHT_DAY = 50;

beforeAll(() => {
  const w = window as unknown as { ResizeObserver?: unknown };
  if (w.ResizeObserver == null) {
    const noop = (): void => undefined;
    w.ResizeObserver = function ResizeObserverShim(): Record<
      string,
      () => void
    > {
      return { observe: noop, unobserve: noop, disconnect: noop };
    };
  }
});

function makeBehavior(timeZone: string): Behavior {
  const Behavior = createBehaviorClass(lwc.defaultHorzScaleBehavior() as never);
  const behavior = new Behavior() as unknown as Behavior;
  behavior.setTimeZone(timeZone);
  return behavior;
}

/** Evenly spaced UTC seconds. */
function series(startUtcSec: number, count: number, stepSec: number): number[] {
  return Array.from({ length: count }, (_, i) => startUtcSec + i * stepSec);
}

/** Run a behavior's weighting over the given times. */
function weightsFor(behavior: Behavior, times: number[]): number[] {
  const points = times.map(t => ({
    time: behavior.convertHorzItemToInternal(t),
    timeWeight: 0,
  }));
  behavior.fillWeightsForPoints(points, 0);
  return points.map(p => p.timeWeight);
}

/** UTC hour -> weight, for hourly inputs. */
function byUtcHour(times: number[], weights: number[]): Map<number, number> {
  const out = new Map<number, number>();
  times.forEach((t, i) => {
    out.set(new Date(t * 1000).getUTCHours(), weights[i]);
  });
  return out;
}

describe('zone-aware horizontal scale behavior, real LWC', () => {
  // 2024-01-01T12:00Z + 36h. New York is UTC-5 in January, so local midnight
  // (the day boundary) falls at 05:00 UTC.
  const winter = series(Date.UTC(2024, 0, 1, 12, 0, 0) / 1000, 36, HOUR);

  it('places the day boundary at local midnight', () => {
    const weights = byUtcHour(winter, weightsFor(makeBehavior(NY), winter));

    expect(weights.get(5)).toBeGreaterThanOrEqual(WEIGHT_DAY); // 00:00 NY
    expect(weights.get(0)).toBeLessThan(WEIGHT_DAY); // 19:00 NY
  });

  it('differs from the stock behavior, which uses UTC midnight', () => {
    const stock = new (lwc.defaultHorzScaleBehavior())();
    const weights = byUtcHour(winter, weightsFor(stock, winter));

    expect(weights.get(0)).toBeGreaterThanOrEqual(WEIGHT_DAY); // 00:00 UTC
    expect(weights.get(5)).toBeLessThan(WEIGHT_DAY);
  });

  it('tracks the offset across a DST transition', () => {
    // In July New York is UTC-4, so local midnight moves to 04:00 UTC.
    const summer = series(Date.UTC(2024, 6, 1, 12, 0, 0) / 1000, 36, HOUR);
    const weights = byUtcHour(summer, weightsFor(makeBehavior(NY), summer));

    expect(weights.get(4)).toBeGreaterThanOrEqual(WEIGHT_DAY); // 00:00 EDT
    expect(weights.get(5)).toBeLessThan(WEIGHT_DAY);
  });

  it('handles a half-hour offset zone', () => {
    // Kolkata is UTC+5:30, so local midnight is 18:30 UTC the previous day.
    const times = series(Date.UTC(2024, 0, 1, 12, 0, 0) / 1000, 72, 1800);
    const weights = weightsFor(makeBehavior('Asia/Kolkata'), times);

    const dayIdx = weights.findIndex(w => w >= WEIGHT_DAY);
    expect(dayIdx).toBeGreaterThan(-1);
    const d = new Date(times[dayIdx] * 1000);
    expect(d.getUTCHours()).toBe(18);
    expect(d.getUTCMinutes()).toBe(30);
  });

  it('keeps both instants of a DST fall-back hour', () => {
    // 05:30Z is 01:30 EDT and 06:30Z is 01:30 EST. Under the old shifted
    // coordinate these collapsed onto one chart time and a row was dropped.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = lwc.createChartEx(container, makeBehavior(NY), {
      width: 800,
      height: 300,
      timeScale: { timeVisible: true },
    });
    const line = chart.addSeries(lwc.LineSeries, {});

    const base = Date.UTC(2024, 10, 3, 4, 30, 0) / 1000;
    line.setData([
      { time: base, value: 1 }, // 00:30 EDT
      { time: base + HOUR, value: 2 }, // 01:30 EDT
      { time: base + 2 * HOUR, value: 3 }, // 01:30 EST (repeat)
      { time: base + 3 * HOUR, value: 4 }, // 02:30 EST
    ]);
    chart.timeScale().fitContent();
    chart.takeScreenshot();

    expect(line.data()).toHaveLength(4);
    chart.remove();
  });
});
