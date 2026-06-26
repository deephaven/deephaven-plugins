import { TradingViewTooltip } from '../TradingViewTooltip';
import type { TradingViewTooltipDeps } from '../TradingViewTooltip';

/**
 * Minimal stand-in for an ISeriesApi. Only the members the tooltip touches
 * are implemented; cast to any at the call boundary.
 */
function makeSeries(opts: {
  title?: string;
  formatted?: string;
  coordinate?: number | null;
}) {
  return {
    options: () => ({ title: opts.title }),
    priceFormatter: () => ({
      format: (v: number) => opts.formatted ?? String(v),
    }),
    priceToCoordinate: () => opts.coordinate ?? null,
  };
}

/** A container whose client size and the tooltip's offset size are stubbed. */
function makeContainer(clientWidth = 800, clientHeight = 600): HTMLElement {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: clientWidth });
  Object.defineProperty(container, 'clientHeight', { value: clientHeight });
  document.body.appendChild(container);
  return container;
}

/** Build crosshair params with a seriesData Map keyed by the series stubs. */
function makeParams(
  entries: Array<[unknown, unknown]>,
  overrides: Record<string, unknown> = {}
): any {
  return {
    time: 1700000000,
    point: { x: 100, y: 100 },
    seriesData: new Map(entries),
    ...overrides,
  };
}

function deps(
  container: HTMLElement,
  series: Array<{ api: unknown; id: string; color?: string }>,
  options: TradingViewTooltipDeps['options'] = { visible: true }
): TradingViewTooltipDeps {
  const byApi = new Map(series.map(s => [s.api, s]));
  return {
    container,
    getSeriesId: s => byApi.get(s)?.id,
    getSeriesColor: id => series.find(s => s.id === id)?.color,
    formatTime: t => `T:${t}`,
    options,
  };
}

function tooltipEl(container: HTMLElement): HTMLElement {
  return container.querySelector('.tvl-tooltip') as HTMLElement;
}

describe('TradingViewTooltip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a hidden tooltip element in the container', () => {
    const container = makeContainer();
    // eslint-disable-next-line no-new
    new TradingViewTooltip(deps(container, []));
    const el = tooltipEl(container);
    expect(el).not.toBeNull();
    expect(el.style.display).toBe('none');
    expect(el.querySelector('.tvl-tooltip-title')).not.toBeNull();
    expect(el.querySelector('.tvl-tooltip-value')).not.toBeNull();
    expect(el.querySelector('.tvl-tooltip-date')).not.toBeNull();
  });

  it.each([
    ['no point', { point: undefined }],
    ['no time', { time: undefined }],
    ['x out of bounds', { point: { x: 5000, y: 100 } }],
    ['y out of bounds', { point: { x: 100, y: 5000 } }],
  ])('hides when %s', (_label, override) => {
    const container = makeContainer();
    const api = makeSeries({ title: 'A', formatted: '1.00' });
    const tt = new TradingViewTooltip(deps(container, [{ api, id: 'a' }]));
    tt.handleCrosshairMove(makeParams([[api, { value: 1 }]], override));
    expect(tooltipEl(container).style.display).toBe('none');
  });

  it('renders the hovered series title, value, and date', () => {
    const container = makeContainer();
    const api = makeSeries({ title: 'Acme', formatted: '42.50' });
    const tt = new TradingViewTooltip(
      deps(container, [{ api, id: 'a', color: '#ff0000' }])
    );
    tt.handleCrosshairMove(
      makeParams([[api, { value: 42.5 }]], {
        hoveredInfo: { sourceKind: 'series', series: api },
      })
    );
    const el = tooltipEl(container);
    expect(el.style.display).toBe('block');
    expect(el.querySelector('.tvl-tooltip-title')?.textContent).toBe('Acme');
    expect(el.querySelector('.tvl-tooltip-value')?.textContent).toBe('42.50');
    expect(el.querySelector('.tvl-tooltip-date')?.textContent).toBe(
      'T:1700000000'
    );
    // Title tinted with the series color.
    expect(
      (el.querySelector('.tvl-tooltip-title') as HTMLElement).style.color
    ).toBe('rgb(255, 0, 0)');
    // Test seam for Playwright.
    expect(el.getAttribute('data-tvl-tooltip')).toBe(
      'Acme | 42.50 | T:1700000000'
    );
  });

  it('falls back to series id when the series is untitled', () => {
    const container = makeContainer();
    const api = makeSeries({ formatted: '1' });
    const tt = new TradingViewTooltip(
      deps(container, [{ api, id: 'series_0' }])
    );
    tt.handleCrosshairMove(
      makeParams([[api, { value: 1 }]], {
        hoveredInfo: { sourceKind: 'series', series: api },
      })
    );
    expect(
      tooltipEl(container).querySelector('.tvl-tooltip-title')?.textContent
    ).toBe('series_0');
  });

  it('uses the close value for OHLC series', () => {
    const container = makeContainer();
    const api = makeSeries({ title: 'C', formatted: '99' });
    const tt = new TradingViewTooltip(deps(container, [{ api, id: 'c' }]));
    tt.handleCrosshairMove(
      makeParams([[api, { open: 90, high: 100, low: 80, close: 99 }]], {
        hoveredInfo: { sourceKind: 'series', series: api },
      })
    );
    expect(
      tooltipEl(container).querySelector('.tvl-tooltip-value')?.textContent
    ).toBe('99');
  });

  it('picks the nearest series by price when nothing is hovered', () => {
    const container = makeContainer();
    // near's value maps to y=105 (5px from cursor y=100); far maps to y=400.
    const near = makeSeries({ title: 'near', coordinate: 105, formatted: 'N' });
    const far = makeSeries({ title: 'far', coordinate: 400, formatted: 'F' });
    const tt = new TradingViewTooltip(
      deps(container, [
        { api: near, id: 'near' },
        { api: far, id: 'far' },
      ])
    );
    tt.handleCrosshairMove(
      makeParams([
        [far, { value: 10 }],
        [near, { value: 20 }],
      ])
    );
    expect(
      tooltipEl(container).querySelector('.tvl-tooltip-title')?.textContent
    ).toBe('near');
  });

  it('picks the vertically nearest series even when another is hovered', () => {
    const container = makeContainer();
    // cursor y=100. hovered maps to y=400 (far); near maps to y=105 (close).
    const hovered = makeSeries({
      title: 'hovered',
      coordinate: 400,
      formatted: 'H',
    });
    const near = makeSeries({ title: 'near', coordinate: 105, formatted: 'N' });
    const tt = new TradingViewTooltip(
      deps(container, [
        { api: hovered, id: 'hovered' },
        { api: near, id: 'near' },
      ])
    );
    tt.handleCrosshairMove(
      makeParams(
        [
          [hovered, { value: 10 }],
          [near, { value: 20 }],
        ],
        // LWC reports `hovered` as the hovered series, but `near` sits closer
        // to the cursor's y — the tooltip must track `near`.
        { hoveredInfo: { sourceKind: 'series', series: hovered } }
      )
    );
    expect(
      tooltipEl(container).querySelector('.tvl-tooltip-title')?.textContent
    ).toBe('near');
  });

  it('honors valuePrecision over the series formatter', () => {
    const container = makeContainer();
    const api = makeSeries({ title: 'P', formatted: 'IGNORED' });
    const tt = new TradingViewTooltip(
      deps(container, [{ api, id: 'p' }], { visible: true, valuePrecision: 3 })
    );
    tt.handleCrosshairMove(
      makeParams([[api, { value: 1.23456 }]], {
        hoveredInfo: { sourceKind: 'series', series: api },
      })
    );
    expect(
      tooltipEl(container).querySelector('.tvl-tooltip-value')?.textContent
    ).toBe('1.235');
  });

  it('hides lines disabled via options', () => {
    const container = makeContainer();
    const api = makeSeries({ title: 'X', formatted: '1' });
    const tt = new TradingViewTooltip(
      deps(container, [{ api, id: 'x' }], {
        visible: true,
        showDate: false,
        showValue: false,
      })
    );
    tt.handleCrosshairMove(
      makeParams([[api, { value: 1 }]], {
        hoveredInfo: { sourceKind: 'series', series: api },
      })
    );
    const el = tooltipEl(container);
    expect(
      (el.querySelector('.tvl-tooltip-date') as HTMLElement).style.display
    ).toBe('none');
    expect(
      (el.querySelector('.tvl-tooltip-value') as HTMLElement).style.display
    ).toBe('none');
    expect(
      (el.querySelector('.tvl-tooltip-title') as HTMLElement).style.display
    ).not.toBe('none');
  });

  it('positions near the cursor, flipping when it would overflow', () => {
    const container = makeContainer(200, 200);
    const api = makeSeries({ title: 'X', formatted: '1' });
    const tt = new TradingViewTooltip(deps(container, [{ api, id: 'x' }]));
    const el = tooltipEl(container);
    Object.defineProperty(el, 'offsetWidth', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(el, 'offsetHeight', {
      value: 80,
      configurable: true,
    });
    // Cursor near the right/bottom edge → tooltip flips to the other side.
    tt.handleCrosshairMove(
      makeParams([[api, { value: 1 }]], {
        point: { x: 180, y: 180 },
        hoveredInfo: { sourceKind: 'series', series: api },
      })
    );
    // left = 180 + 15 = 195 > (200 - 100) → flip to 180 - 15 - 100 = 65
    expect(el.style.left).toBe('65px');
    // top = 180 + 15 = 195 > (200 - 80) → flip to 180 - 80 - 15 = 85
    expect(el.style.top).toBe('85px');
  });

  it('removes the element on destroy', () => {
    const container = makeContainer();
    const tt = new TradingViewTooltip(deps(container, []));
    expect(tooltipEl(container)).not.toBeNull();
    tt.destroy();
    expect(tooltipEl(container)).toBeNull();
  });
});
