import type { MouseEventParams } from 'lightweight-charts';
import { resolveFocusedSeriesPoint } from '../TradingViewSeriesFocus';

function makeSeries(coordinate: number | null): {
  priceToCoordinate: (price: number) => number | null;
} {
  return { priceToCoordinate: () => coordinate };
}

describe('resolveFocusedSeriesPoint', () => {
  it('prefers the series nearest the cursor', () => {
    const near = makeSeries(105);
    const far = makeSeries(200);
    const seriesData = new Map<unknown, unknown>([
      [far, { value: 2 }],
      [near, { value: 1 }],
    ]);

    const result = resolveFocusedSeriesPoint({
      seriesData,
      point: { x: 0, y: 100 },
    } as unknown as MouseEventParams);

    expect(result?.series).toBe(near);
  });

  it('does not let an unprojectable series outrank one with a coordinate', () => {
    // An off-scale series has no y coordinate. Treating that as distance 0
    // made it beat every visible series regardless of cursor position.
    const offScale = makeSeries(null);
    const visible = makeSeries(150);
    const seriesData = new Map<unknown, unknown>([
      [offScale, { value: 2 }],
      [visible, { value: 1 }],
    ]);

    const result = resolveFocusedSeriesPoint({
      seriesData,
      point: { x: 0, y: 100 },
    } as unknown as MouseEventParams);

    expect(result?.series).toBe(visible);
  });

  it('still resolves a lone unprojectable series', () => {
    const offScale = makeSeries(null);
    const seriesData = new Map<unknown, unknown>([[offScale, { value: 1 }]]);

    const result = resolveFocusedSeriesPoint({
      seriesData,
      point: { x: 0, y: 100 },
    } as unknown as MouseEventParams);

    expect(result?.series).toBe(offScale);
  });
});
