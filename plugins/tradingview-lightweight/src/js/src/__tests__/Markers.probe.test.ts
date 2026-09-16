/**
 * Probe: reproduce the `live_candles` shape against the REAL lightweight-
 * charts library — whitespace scaffold + continuous (custom) candlestick +
 * aboveBar/belowBar markers — and force a paint. Chases the
 * `Error: Value is null` thrown from LWC's ensureNotNull during marker
 * layout.
 */
import path from 'path';
import type { Time } from 'lightweight-charts';
import ContinuousBarsSeries, {
  stampContinuousBarTimes,
} from '../ContinuousBarsSeries';

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
require(path.join(
  __dirname,
  '../../../../../../node_modules/lightweight-charts/dist/lightweight-charts.standalone.development.js'
));

type LwcChart = {
  addSeries: (
    def: unknown,
    opts?: unknown
  ) => Record<string, never> & {
    setData: (d: unknown[]) => void;
    update: (d: unknown) => void;
    priceScale: () => { applyOptions: (o: unknown) => void };
  };
  addCustomSeries: (
    view: unknown,
    opts?: unknown
  ) => {
    setData: (d: unknown[]) => void;
    priceToCoordinate: (p: number) => number | null;
  };
  timeScale: () => { fitContent: () => void };
  takeScreenshot: () => unknown;
  remove: () => void;
};
type Lwc = {
  createChart: (el: HTMLElement, opts?: unknown) => LwcChart;
  LineSeries: unknown;
  createSeriesMarkers: (series: unknown, markers: unknown[]) => unknown;
};
const lwc = (window as unknown as { LightweightCharts: Lwc }).LightweightCharts;

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

const DAY = 86400;
const T0 = 1_704_110_400; // 2024-01-01T12:00:00Z

function buildOhlc(count: number): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (let i = 0; i < count; i += 1) {
    const open = 100 + Math.sin(i * 0.5) * 5;
    const close = 100 + Math.sin(i * 0.5 + 1.2) * 5;
    out.push({
      time: T0 + i * DAY,
      open,
      close,
      high: Math.max(open, close) + 1.5,
      low: Math.min(open, close) - 1.5,
    });
  }
  return out;
}

describe('markers on a continuous (custom) series, real LWC', () => {
  it('rejects unsorted line data, which production builds turn into Value is null', () => {
    // LWC binary-searches its plot rows by index, so unsorted input makes the
    // bar colorer miss a row the pane view just enumerated. Dev builds assert
    // on the ordering; production builds throw 'Value is null' instead.
    const run = (ascending: boolean): (() => void) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const chart = lwc.createChart(container, {
        width: 400,
        height: 300,
        timeScale: { minBarSpacing: 0.01 },
      });
      const line = chart.addSeries(lwc.LineSeries, {});
      const points: Array<{ time: number; value: number }> = [];
      for (let i = 0; i < 500; i += 1) {
        points.push({
          time: T0 + i * 60,
          value: 100 + Math.sin(i * 0.01) * 10,
        });
      }
      if (!ascending) {
        [points[100], points[400]] = [points[400], points[100]];
      }
      return () => {
        line.setData(points);
        chart.timeScale().fitContent();
        chart.takeScreenshot();
        chart.remove();
      };
    };

    expect(run(false)).toThrow();
    expect(run(true)).not.toThrow();
  });

  it('out-of-order update() on a line series is rejected by LWC', () => {
    // LWC's update() only appends or replaces the LAST point; an earlier
    // time throws outright. Resampled tables can gain rows anywhere in time
    // order, so the chart must rebuild wholesale instead of update()-ing.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = lwc.createChart(container, { width: 800, height: 300 });
    const line = chart.addSeries(lwc.LineSeries, {});

    line.setData([
      { time: T0, value: 1 },
      { time: T0 + DAY, value: 2 },
      { time: T0 + 2 * DAY, value: 3 },
    ]);
    chart.timeScale().fitContent();
    chart.takeScreenshot();

    // An in-order append is fine.
    expect(() => {
      line.update({ time: T0 + 3 * DAY, value: 4 });
      chart.takeScreenshot();
    }).not.toThrow();

    // An out-of-order update is not.
    expect(() => {
      line.update({ time: T0 + DAY, value: 99 });
    }).toThrow(/Cannot update oldest data/);

    chart.remove();
  });

  it('whitespace-only scaffold does not break autoscale', () => {
    // LWC's cached min/max walk does
    //   ensureNotNull(firstIndex()) / ensureNotNull(lastIndex())
    // guarded only by isEmpty(), with the source comment "could fail after
    // whitespaces implementation". A scaffold series holds whitespace ONLY,
    // so it is non-empty with null first/last data indices — the
    // `Error: Value is null` seen in the console.
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = lwc.createChart(container, { width: 800, height: 300 });

    const scaffold = chart.addSeries(lwc.LineSeries, {
      visible: false,
      priceScaleId: '',
    });
    const data = buildOhlc(30);
    const first = data[0].time as number;
    const last = data[data.length - 1].time as number;
    const scaffoldPoints: Array<{ time: number }> = [];
    for (let i = 0; i < 500; i += 1) {
      scaffoldPoints.push({
        time: Math.round(first + ((last - first) * i) / 499),
      });
    }

    expect(() => {
      scaffold.setData(scaffoldPoints);
      const view = new ContinuousBarsSeries('Candlestick');
      const series = chart.addCustomSeries(view, {});
      stampContinuousBarTimes(data);
      series.setData(data);
      chart.timeScale().fitContent();
      chart.takeScreenshot();
      // Autoscale over the scaffold's own price scale.
      scaffold.priceScale().applyOptions({ autoScale: true });
      chart.takeScreenshot();
    }).not.toThrow();

    chart.remove();
  });

  it('does not throw when markers are applied and painted', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = lwc.createChart(container, {
      width: 800,
      height: 300,
      timeScale: { minBarSpacing: 0.01, ignoreWhitespaceIndices: true },
    });

    // Scaffold first, as configureSeries does.
    const scaffold = chart.addSeries(lwc.LineSeries, {
      color: 'transparent',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const data = buildOhlc(30);
    const first = data[0].time as number;
    const last = data[data.length - 1].time as number;
    const scaffoldPoints: Array<{ time: number }> = [];
    for (let i = 0; i < 500; i += 1) {
      scaffoldPoints.push({
        time: Math.round(first + ((last - first) * i) / 499),
      });
    }
    scaffold.setData(scaffoldPoints);

    const view = new ContinuousBarsSeries('Candlestick');
    const series = chart.addCustomSeries(view, {});
    stampContinuousBarTimes(data);
    series.setData(data);
    chart.timeScale().fitContent();
    chart.takeScreenshot();

    // Sanity: the custom series can convert a price once it has data.
    const coord = series.priceToCoordinate(data[3].low as number);
    expect(coord).not.toBeNull();

    // Markers WITHOUT an explicit price: LWC infers it from the row.
    expect(() => {
      lwc.createSeriesMarkers(series, [
        {
          time: data[3].time as Time,
          position: 'belowBar',
          shape: 'arrowUp',
          text: 'Buy',
        },
        {
          time: data[10].time as Time,
          position: 'aboveBar',
          shape: 'arrowDown',
          text: 'Sell',
        },
      ]);
      chart.takeScreenshot();
    }).not.toThrow();

    chart.remove();
  });

  it('does not throw when markers carry an explicit price', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = lwc.createChart(container, { width: 800, height: 300 });

    const view = new ContinuousBarsSeries('Candlestick');
    const series = chart.addCustomSeries(view, {});
    const data = buildOhlc(30);
    stampContinuousBarTimes(data);
    series.setData(data);
    chart.timeScale().fitContent();
    chart.takeScreenshot();

    expect(() => {
      lwc.createSeriesMarkers(series, [
        {
          time: data[3].time as Time,
          position: 'belowBar',
          shape: 'arrowUp',
          text: 'Buy',
          price: data[3].low as number,
        },
      ]);
      chart.takeScreenshot();
    }).not.toThrow();

    chart.remove();
  });
});
