/**
 * Probe: how does the REAL lightweight-charts treat the values our transform
 * can emit from a Deephaven column? Deephaven columns produce nulls routinely,
 * and a null reaching setData is invalid input — dev builds assert, production
 * builds silently mis-render it. Nulls must become whitespace instead.
 */
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
require(path.join(
  __dirname,
  '../../../../../../node_modules/lightweight-charts/dist/lightweight-charts.standalone.development.js'
));

type Lwc = {
  createChart: (
    el: HTMLElement,
    opts?: unknown
  ) => {
    addSeries: (
      def: unknown,
      opts?: unknown
    ) => {
      setData: (d: unknown[]) => void;
      data: () => Array<Record<string, unknown>>;
    };
    timeScale: () => { fitContent: () => void };
    takeScreenshot: () => unknown;
    remove: () => void;
  };
  LineSeries: unknown;
  CandlestickSeries: unknown;
};
const lwc = (globalThis as unknown as { LightweightCharts: Lwc })
  .LightweightCharts;

const T0 = 1704067200;
const DAY = 86400;

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

function render(
  points: unknown[],
  def: unknown = lwc.LineSeries
): Array<Record<string, unknown>> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const chart = lwc.createChart(container, { width: 400, height: 300 });
  const series = chart.addSeries(def, {});
  try {
    series.setData(points);
    chart.timeScale().fitContent();
    chart.takeScreenshot();
    return series.data();
  } finally {
    chart.remove();
  }
}

describe('lightweight-charts sub-second time support', () => {
  it('keeps fractional-second timestamps as distinct points', () => {
    // The library's own docs use `(Date.now() / 1000) as UTCTimestamp`, which
    // is fractional. If these 20 points survive, whole-second truncation is
    // our constraint, not the library's.
    const points = [];
    for (let i = 0; i < 20; i += 1) {
      points.push({ time: T0 + i * 0.05, value: i + 1 });
    }

    const stored = render(points);

    expect(stored).toHaveLength(20);
    expect(stored.map(d => d.value)).toEqual(points.map(p => p.value));
  });

  it('orders fractional times correctly against whole seconds', () => {
    const stored = render([
      { time: T0, value: 1 },
      { time: T0 + 0.25, value: 2 },
      { time: T0 + 0.5, value: 3 },
      { time: T0 + 1, value: 4 },
    ]);

    expect(stored.map(d => d.value)).toEqual([1, 2, 3, 4]);
  });
});

describe('lightweight-charts treatment of Deephaven-shaped values', () => {
  it('rejects a null line value as invalid input', () => {
    // Production builds strip this assertion, so the null survives into the
    // plot row and paints as a point instead of a gap.
    expect(() =>
      render([
        { time: T0, value: 10 },
        { time: T0 + DAY, value: null },
        { time: T0 + 2 * DAY, value: 30 },
      ])
    ).toThrow(/value must be a number/);
  });

  it('rejects a null OHLC field as invalid input', () => {
    expect(() =>
      render(
        [
          { time: T0, open: 1, high: 2, low: 0.5, close: 1.5 },
          { time: T0 + DAY, open: null, high: 2, low: 0.5, close: 1.5 },
        ],
        lwc.CandlestickSeries
      )
    ).toThrow();
  });

  it('treats an omitted value as whitespace, which is a true gap', () => {
    // Whitespace rows hold their time slot but carry no value, so the line
    // breaks instead of connecting through. data() excludes them entirely.
    const stored = render([
      { time: T0, value: 10 },
      { time: T0 + DAY },
      { time: T0 + 2 * DAY, value: 30 },
    ]);

    expect(stored.map(d => d.value)).toEqual([10, 30]);
  });
});
