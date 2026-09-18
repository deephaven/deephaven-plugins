import { createRef } from 'react';
import { render, act } from '@testing-library/react';
import type { MouseEventParams } from 'lightweight-charts';
import {
  TradingViewTooltip,
  type TvlTooltipSource,
} from '../TradingViewTooltip';
import type { TvlTooltipOptions } from '../TradingViewTypes';

/** Minimal stand-in for an ISeriesApi: only what the tooltip touches. */
function makeSeries(opts: { title?: string; coordinate?: number | null } = {}) {
  return {
    options: () => ({ title: opts.title }),
    priceFormatter: () => ({ format: (v: number) => v.toFixed(2) }),
    priceToCoordinate: () => opts.coordinate ?? null,
  };
}

function makeParams(
  entries: Array<[unknown, unknown]>,
  overrides: Record<string, unknown> = {}
): MouseEventParams {
  return {
    time: 1700000000,
    point: { x: 100, y: 100 },
    seriesData: new Map(entries),
    ...overrides,
  } as unknown as MouseEventParams;
}

function setup(
  series: Array<{ api: unknown; id: string; color?: string }>,
  options: TvlTooltipOptions = {}
) {
  const byApi = new Map(series.map(s => [s.api, s]));
  let handler: ((p: MouseEventParams) => void) | undefined;
  const source: TvlTooltipSource = {
    getSeriesIdForApi: s => byApi.get(s)?.id,
    getSeriesColor: id => series.find(s => s.id === id)?.color,
    formatTime: t => `T:${t}`,
    subscribeCrosshairMove: h => {
      handler = h;
      return () => {
        handler = undefined;
      };
    },
  };

  // A host with a stubbed client size, standing in for the chart host.
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { value: 800 });
  Object.defineProperty(host, 'clientHeight', { value: 600 });
  document.body.appendChild(host);
  const hostRef = createRef<HTMLDivElement>();
  (hostRef as { current: HTMLDivElement }).current = host;

  render(
    <TradingViewTooltip source={source} options={options} hostRef={hostRef} />
  );
  return { emit: (p: MouseEventParams) => act(() => handler?.(p)) };
}

function el(): HTMLElement | null {
  return document.querySelector('.tvl-tooltip');
}

/** The box stays mounted and hides with `display`, so "hidden" is a style. */
function isHidden(): boolean {
  return el()?.style.display === 'none';
}

describe('TradingViewTooltip', () => {
  it('stays hidden until the crosshair is over the data', () => {
    setup([]);
    expect(el()).not.toBeNull();
    expect(isHidden()).toBe(true);
    expect(el()?.getAttribute('data-tvl-tooltip')).toBe('');
  });

  it.each([
    ['no point', { point: undefined }],
    ['no time', { time: undefined }],
    ['x out of bounds', { point: { x: 5000, y: 100 } }],
    ['y out of bounds', { point: { x: 100, y: 5000 } }],
  ])('stays hidden when %s', (_label, override) => {
    const api = makeSeries({ title: 'A' });
    const { emit } = setup([{ api, id: 'a' }]);
    emit(makeParams([[api, { value: 1 }]], override));
    expect(isHidden()).toBe(true);
  });

  it('shows the focused series title, value and time', () => {
    const api = makeSeries({ title: 'Price', coordinate: 100 });
    const { emit } = setup([{ api, id: 'p', color: '#ff0000' }]);
    emit(makeParams([[api, { value: 1.5 }]]));

    expect(el()).not.toBeNull();
    expect(el()?.querySelector('.tvl-tooltip-title')?.textContent).toBe(
      'Price'
    );
    expect(el()?.querySelector('.tvl-tooltip-value')?.textContent).toBe('1.50');
    expect(el()?.querySelector('.tvl-tooltip-date')?.textContent).toBe(
      'T:1700000000'
    );
  });

  it('falls back to the series id when untitled', () => {
    const api = makeSeries({ coordinate: 100 });
    const { emit } = setup([{ api, id: 'series_0' }]);
    emit(makeParams([[api, { value: 1 }]]));
    expect(el()?.querySelector('.tvl-tooltip-title')?.textContent).toBe(
      'series_0'
    );
  });

  it('tints the title with the series color', () => {
    const api = makeSeries({ title: 'P', coordinate: 100 });
    const { emit } = setup([{ api, id: 'p', color: 'rgb(255, 0, 0)' }]);
    emit(makeParams([[api, { value: 1 }]]));
    const title = el()?.querySelector('.tvl-tooltip-title') as HTMLElement;
    expect(title.style.color).toBe('rgb(255, 0, 0)');
  });

  it('hides lines disabled via options', () => {
    const api = makeSeries({ title: 'X', coordinate: 100 });
    const { emit } = setup([{ api, id: 'x' }], {
      showTitle: false,
      showDate: false,
    });
    emit(makeParams([[api, { value: 1 }]]));
    expect(el()?.querySelector('.tvl-tooltip-title')).toBeNull();
    expect(el()?.querySelector('.tvl-tooltip-date')).toBeNull();
    expect(el()?.querySelector('.tvl-tooltip-value')).not.toBeNull();
  });

  it('formats the value with the series price formatter', () => {
    const api = makeSeries({ title: 'P', coordinate: 100 });
    const { emit } = setup([{ api, id: 'p' }]);
    emit(makeParams([[api, { value: 1.23456 }]]));
    expect(el()?.querySelector('.tvl-tooltip-value')?.textContent).toBe('1.23');
  });

  it('publishes rendered text to the data-tvl-tooltip seam', () => {
    const api = makeSeries({ title: 'P', coordinate: 100 });
    const { emit } = setup([{ api, id: 'p' }]);
    emit(makeParams([[api, { value: 2 }]]));
    expect(el()?.getAttribute('data-tvl-tooltip')).toBe(
      'P | 2.00 | T:1700000000'
    );
  });

  it('hides again when the cursor leaves the data', () => {
    const api = makeSeries({ title: 'P', coordinate: 100 });
    const { emit } = setup([{ api, id: 'p' }]);
    emit(makeParams([[api, { value: 2 }]]));
    expect(isHidden()).toBe(false);
    emit(makeParams([], { time: undefined }));
    expect(isHidden()).toBe(true);
    expect(el()?.querySelector('.tvl-tooltip-value')).toBeNull();
  });
});
