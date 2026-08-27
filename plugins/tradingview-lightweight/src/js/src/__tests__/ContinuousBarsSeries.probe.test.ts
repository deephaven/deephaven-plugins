/**
 * Probe: drive the REAL lightweight-charts library (standalone build, which
 * bypasses the jest mock's `^lightweight-charts$` mapping) with the exact
 * data shape the autobin path produces: a dense whitespace scaffold series
 * plus a custom ContinuousBarsSeries with snapped bins and sub-bin anchors.
 * Asserts on what the library actually feeds the pane view.
 */
import path from 'path';
import ContinuousBarsSeries, {
  computeBarHalfWidths,
  stampContinuousBarTimes,
} from '../ContinuousBarsSeries';

// Absolute path dodges both the jest mock mapping and the package "exports"
// restriction on dist subpaths.
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
require(path.join(
  __dirname,
  '../../../../../../node_modules/lightweight-charts/dist/lightweight-charts.standalone.development.js'
));

type LwcChart = {
  addSeries: (
    def: unknown,
    opts?: unknown
  ) => { setData: (d: unknown[]) => void };
  addCustomSeries: (
    view: unknown,
    opts?: unknown
  ) => { setData: (d: unknown[]) => void };
  timeScale: () => { fitContent: () => void };
  takeScreenshot: () => unknown;
  remove: () => void;
};
type LwcGlobal = {
  createChart: (el: HTMLElement, opts?: unknown) => LwcChart;
  LineSeries: unknown;
  HistogramSeries: unknown;
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

const WIDTH = 1600;

function buildChart() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const chart = lwc.createChart(container, {
    width: WIDTH,
    height: 300,
    timeScale: { minBarSpacing: 0.01 },
  });
  return chart;
}

/** Autobin shape: bins snapped to 300s + raw-timestamp anchors, dense scaffold. */
function autobinFixture() {
  const t0 = 1_700_000_007; // raw head anchor (7s off the 300s grid)
  const binStart = 1_700_000_100; // first snapped bin
  const binWidth = 300;
  const binCount = 120;
  const data: Array<{ time: number; value?: number }> = [];
  data.push({ time: t0, value: 5 }); // head anchor
  for (let i = 0; i < binCount; i += 1) {
    data.push({ time: binStart + i * binWidth, value: 8000 + (i % 7) * 30 });
  }
  const tEnd = binStart + (binCount - 1) * binWidth + 113; // raw tail anchor
  data.push({ time: tEnd, value: 3 });

  // Dense scaffold whitespace, like updateScaffold: max(1000, width*2) points.
  const scaffoldCount = Math.max(1000, WIDTH * 2);
  const scaffold: Array<{ time: number }> = [];
  const span = tEnd - t0;
  const seen = new Set<number>();
  for (let i = 0; i < scaffoldCount; i += 1) {
    const t = Math.round(t0 + (span * i) / (scaffoldCount - 1));
    if (!seen.has(t)) {
      seen.add(t);
      scaffold.push({ time: t });
    }
  }
  return { data, scaffold };
}

describe('real LWC + ContinuousBarsSeries on the autobin shape', () => {
  it('feeds the pane view bars whose computed halves tile the body', () => {
    const chart = buildChart();
    const view = new ContinuousBarsSeries('Histogram');
    const updateSpy = jest.spyOn(view, 'update');

    const { data, scaffold } = autobinFixture();

    // Scaffold first (as configureSeries does), then the custom series.
    const scaffoldSeries = chart.addSeries(lwc.LineSeries, {
      visible: true,
      color: 'transparent',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    scaffoldSeries.setData(scaffold);

    const series = chart.addCustomSeries(view, {});
    stampContinuousBarTimes(data);
    series.setData(data);
    chart.timeScale().fitContent();

    // Force a synchronous paint so the pane view's update() runs.
    chart.takeScreenshot();

    expect(updateSpy).toHaveBeenCalled();
    const lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
    const paneData = lastCall[0];
    const { bars, barSpacing } = paneData;

    // The library must feed us exactly the non-whitespace items — no
    // scaffold points may leak into the custom series' bars.
    expect(bars.length).toBe(data.length);

    // LWC strips `time` out of originalData (getCustomSeriesPlotRow); the
    // stamped `ts` must survive — this is what the bin-width math runs on.
    expect((bars[5].originalData as { time?: number }).time).toBeUndefined();
    expect(Number.isFinite(bars[5].originalData.ts)).toBe(true);

    const times = bars.map(b =>
      Number(
        (b.originalData as { ts?: number; time?: number }).ts ??
          (b.originalData as { ts?: number; time?: number }).time
      )
    );
    const xs = bars.map(b => b.x);
    const halves = computeBarHalfWidths(times, xs, barSpacing);

    // Body bins (indexes 1..120) must tile: shared edges at midpoints.
    for (let i = 2; i < bars.length - 2; i += 1) {
      const dxRight = xs[i + 1] - xs[i];
      expect(halves[i].right).toBeCloseTo(dxRight / 2, 3);
      expect(halves[i + 1].left).toBeCloseTo(dxRight / 2, 3);
    }
    // Bars must be substantially wider than hairlines: full body width
    // is ~WIDTH/121 px; assert at least half that.
    const bodyWidth = halves[5].left + halves[5].right;
    expect(bodyWidth).toBeGreaterThan(WIDTH / 121 / 2);

    chart.remove();
  });
});
