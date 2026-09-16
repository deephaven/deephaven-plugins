import path from 'path';
import { createBehaviorClass } from '../TimeZoneHorzScaleBehavior';

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
require(path.join(
  __dirname,
  '../../../../../../node_modules/lightweight-charts/dist/lightweight-charts.standalone.development.js'
));
const lwc = (globalThis as never as { LightweightCharts: never })
  .LightweightCharts as never as Record<string, never>;

beforeAll(() => {
  const w = window as unknown as { ResizeObserver?: unknown };
  if (w.ResizeObserver == null) {
    const noop = (): void => undefined;
    w.ResizeObserver = function Shim(): Record<string, () => void> {
      return { observe: noop, unobserve: noop, disconnect: noop };
    };
  }
});

it('changing the behavior zone changes what the axis renders', () => {
  const received: number[] = [];
  const Behavior = createBehaviorClass(
    (
      lwc as never as { defaultHorzScaleBehavior: () => never }
    ).defaultHorzScaleBehavior() as never
  );
  const behavior = new Behavior() as never as {
    setTimeZone: (t: string) => void;
  };
  behavior.setTimeZone('America/New_York');

  const container = document.createElement('div');
  document.body.appendChild(container);
  const chart = (
    lwc as never as {
      createChartEx: (c: HTMLElement, b: unknown, o: unknown) => never;
    }
  ).createChartEx(container, behavior, {
    width: 1200,
    height: 300,
    timeScale: {
      timeVisible: true,
      tickMarkFormatter: (t: number) => {
        received.push(t);
        return 'X';
      },
    },
  }) as never as {
    addSeries: (d: unknown, o: unknown) => { setData: (x: unknown[]) => void };
    timeScale: () => { fitContent: () => void };
    takeScreenshot: () => unknown;
    remove: () => void;
  };

  const s = chart.addSeries(
    (lwc as never as { LineSeries: never }).LineSeries,
    {}
  );
  const base = Date.UTC(2024, 0, 1, 0, 0, 0) / 1000;
  s.setData(
    Array.from({ length: 48 }, (_, i) => ({ time: base + i * 3600, value: i }))
  );
  chart.timeScale().fitContent();
  chart.takeScreenshot();
  const ny = [...received];

  received.length = 0;
  behavior.setTimeZone('America/Chicago');
  // Formatted tick labels are cached per weight; only the time scale's own
  // applyOptions clears that cache. Without this the axis keeps the old zone's
  // labels forever.
  (chart as never as { applyOptions: (o: unknown) => void }).applyOptions({
    timeScale: {},
  });
  chart.takeScreenshot();
  const chi = [...received];

  // eslint-disable-next-line no-console
  console.log('NY sample:', ny.slice(0, 3), 'CHI sample:', chi.slice(0, 3));
  expect(ny.length).toBeGreaterThan(0);
  expect(chi.length).toBeGreaterThan(0);
  expect(chi[0] - ny[0]).toBe(-3600);
  chart.remove();
});
