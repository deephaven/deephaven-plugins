import type { Time } from 'lightweight-charts';
import ContinuousBarsSeries, {
  computeBarHalfWidths,
  isContinuousBarType,
  type ContinuousBarData,
} from '../ContinuousBarsSeries';

describe('computeBarHalfWidths', () => {
  it('returns empty for no bars', () => {
    expect(computeBarHalfWidths([], [], 10)).toEqual([]);
  });

  it('falls back to barSpacing/2 for a single bar', () => {
    expect(computeBarHalfWidths([100], [50], 8)).toEqual([
      { left: 4, right: 4 },
    ]);
  });

  it('tiles a uniform grid end-to-end (adjacent bars share midpoints)', () => {
    // 4 bars, 60s bins, 10px apart.
    const times = [0, 60, 120, 180];
    const xs = [10, 20, 30, 40];
    const halves = computeBarHalfWidths(times, xs, 6);
    halves.forEach(h => {
      expect(h.left).toBeCloseTo(5);
      expect(h.right).toBeCloseTo(5);
    });
    // Right edge of bar i == left edge of bar i+1 (no seams, no overlap).
    for (let i = 0; i < 3; i += 1) {
      expect(xs[i] + halves[i].right).toBeCloseTo(
        xs[i + 1] - halves[i + 1].left
      );
    }
  });

  it('handles scaffold pixel jitter: shared edges stay at the midpoint', () => {
    // Same 60s bins but pixel gaps jitter ±1 (scaffold index rounding).
    const times = [0, 60, 120, 180];
    const xs = [10, 21, 30, 41];
    const halves = computeBarHalfWidths(times, xs, 6);
    for (let i = 0; i < 3; i += 1) {
      const sharedEdge = xs[i] + halves[i].right;
      expect(sharedEdge).toBeCloseTo(xs[i + 1] - halves[i + 1].left);
      expect(sharedEdge).toBeCloseTo((xs[i] + xs[i + 1]) / 2);
    }
  });

  it('keeps multi-bin gaps proportional (each side fills half a bin)', () => {
    // 60s bins; a 3-bin empty gap between bars 1 and 2 (180s, 30px).
    const times = [0, 60, 240, 300];
    const xs = [10, 20, 50, 60];
    const halves = computeBarHalfWidths(times, xs, 6);
    // Contiguous pairs meet.
    expect(xs[0] + halves[0].right).toBeCloseTo(xs[1] - halves[1].left);
    expect(xs[2] + halves[2].right).toBeCloseTo(xs[3] - halves[3].left);
    // Across the gap, each neighbor extends half a bin (30px / (2*3) = 5).
    expect(halves[1].right).toBeCloseTo(5);
    expect(halves[2].left).toBeCloseTo(5);
    // A visible gap remains: right edge of bar 1 < left edge of bar 2.
    expect(xs[1] + halves[1].right).toBeLessThan(xs[2] - halves[2].left);
  });

  it('ignores far-off head/tail anchors when finding the bin width', () => {
    // Head anchor 1 day before a contiguous 60s body.
    const times = [0, 86400, 86460, 86520];
    const xs = [5, 100, 110, 120];
    const halves = computeBarHalfWidths(times, xs, 6);
    // Body bars still tile.
    expect(xs[1] + halves[1].right).toBeCloseTo(xs[2] - halves[2].left);
    expect(xs[2] + halves[2].right).toBeCloseTo(xs[3] - halves[3].left);
    // Anchor extends at most half a bin's pixel width into the gap.
    expect(halves[0].right).toBeLessThanOrEqual(5);
  });

  it('autobin anchors: a sub-bin anchor delta must not shrink body bars', () => {
    // Regression: hairline bars on hist_autobin. The head anchor sits at a
    // raw timestamp 7s before the first 300s-snapped bin; a plain min()
    // would take minDt=7 and divide every body gap into ~43 "bins".
    const times = [0, 7, 307, 607, 907];
    const xs = [10, 10.5, 40, 70, 100];
    const halves = computeBarHalfWidths(times, xs, 6);
    // Body bars tile end-to-end at the shared midpoints.
    expect(xs[1] + halves[1].right).toBeCloseTo(xs[2] - halves[2].left);
    expect(halves[2].left).toBeCloseTo((xs[2] - xs[1]) / 2);
    expect(halves[2].right).toBeCloseTo((xs[3] - xs[2]) / 2);
    expect(halves[3].right).toBeCloseTo((xs[4] - xs[3]) / 2);
  });

  it('collapses gaps the ordinal axis collapsed (no scaffold)', () => {
    // Regression: asymmetric/overlapping-looking candles on small tables.
    // Daily bars with a weekend hole, but the plain ordinal scale renders
    // every step 10px — the axis shows Fri/Mon adjacent, so bars must tile
    // them as adjacent (symmetric halves), not carve the step into thirds.
    const day = 86400;
    const times = [0, day, 2 * day, 5 * day, 6 * day];
    const xs = [10, 20, 30, 40, 50];
    const halves = computeBarHalfWidths(times, xs, 6);
    halves.forEach(h => {
      expect(h.left).toBeCloseTo(5);
      expect(h.right).toBeCloseTo(5);
    });
  });

  it('falls back to barSpacing when all times are identical', () => {
    const halves = computeBarHalfWidths([100, 100], [10, 10], 8);
    halves.forEach(h => {
      expect(h.left).toBe(4);
      expect(h.right).toBe(4);
    });
  });
});

describe('isContinuousBarType', () => {
  it.each(['Histogram', 'Candlestick', 'Bar'])('accepts %s', type => {
    expect(isContinuousBarType(type)).toBe(true);
  });

  it.each(['Line', 'Area', 'Baseline', 'Custom'])('rejects %s', type => {
    expect(isContinuousBarType(type)).toBe(false);
  });
});

describe('ContinuousBarsSeries pane view', () => {
  it('reports whitespace for items with no value/close', () => {
    const view = new ContinuousBarsSeries('Histogram');
    expect(view.isWhitespace({ time: 1 as Time })).toBe(true);
    expect(view.isWhitespace({ time: 1 as Time, value: 5 })).toBe(false);
    const ohlcView = new ContinuousBarsSeries('Candlestick');
    expect(ohlcView.isWhitespace({ time: 1 as Time, close: 2 })).toBe(false);
  });

  it('builds histogram price values from base to value', () => {
    const view = new ContinuousBarsSeries('Histogram');
    expect(view.priceValueBuilder({ time: 1 as Time, value: 7 })).toEqual([
      0, 7,
    ]);
  });

  it('builds OHLC price values as [high, low, close]', () => {
    const view = new ContinuousBarsSeries('Candlestick');
    const row: ContinuousBarData = {
      time: 1 as Time,
      open: 2,
      high: 9,
      low: 1,
      close: 5,
    };
    expect(view.priceValueBuilder(row)).toEqual([9, 1, 5]);
  });

  it('renders through the bitmap coordinate space with bin-spanning rects', () => {
    const view = new ContinuousBarsSeries('Histogram');
    const fillRect = jest.fn();
    const ctx = {
      fillRect,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;
    const scope = {
      context: ctx,
      horizontalPixelRatio: 1,
      verticalPixelRatio: 1,
      bitmapSize: { width: 100, height: 100 },
      mediaSize: { width: 100, height: 100 },
    };
    const target = {
      useBitmapCoordinateSpace: (cb: (s: typeof scope) => void) => cb(scope),
    };
    const bars = [
      {
        x: 10,
        time: 0,
        originalData: { time: 0 as Time, value: 5 },
        barColor: '',
      },
      {
        x: 20,
        time: 1,
        originalData: { time: 60 as Time, value: 3 },
        barColor: '',
      },
      {
        x: 30,
        time: 2,
        originalData: { time: 120 as Time, value: 4 },
        barColor: '',
      },
    ];
    view.update(
      {
        bars: bars as never,
        barSpacing: 6,
        visibleRange: { from: 0, to: 3 },
        conflationFactor: 1,
      },
      view.defaultOptions()
    );
    const priceConverter = (price: number) => (100 - price * 10) as never;
    view.renderer().draw(target as never, priceConverter, false);

    expect(fillRect).toHaveBeenCalledTimes(3);
    // Middle bar spans exactly from midpoint(10,20)=15 to midpoint(20,30)=25.
    const [x, y, w, h] = fillRect.mock.calls[1];
    expect(x).toBe(15);
    expect(w).toBe(10);
    expect(y).toBe(70); // value 3 -> y=70
    expect(h).toBe(30); // base 0 -> y=100, height 30
  });

  it('insets candle bodies to ~80% of the bin so neighbors keep a gap', () => {
    const view = new ContinuousBarsSeries('Candlestick');
    const fillRect = jest.fn();
    const strokeRect = jest.fn();
    const ctx = {
      fillRect,
      strokeRect,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D;
    const scope = {
      context: ctx,
      horizontalPixelRatio: 1,
      verticalPixelRatio: 1,
      bitmapSize: { width: 100, height: 100 },
      mediaSize: { width: 100, height: 100 },
    };
    const target = {
      useBitmapCoordinateSpace: (cb: (s: typeof scope) => void) => cb(scope),
    };
    const ohlc = { open: 2, high: 9, low: 1, close: 5 };
    const bars = [
      {
        x: 10,
        time: 0,
        originalData: { time: 0 as Time, ...ohlc },
        barColor: '',
      },
      {
        x: 20,
        time: 1,
        originalData: { time: 60 as Time, ...ohlc },
        barColor: '',
      },
      {
        x: 30,
        time: 2,
        originalData: { time: 120 as Time, ...ohlc },
        barColor: '',
      },
    ];
    view.update(
      {
        bars: bars as never,
        barSpacing: 6,
        visibleRange: { from: 0, to: 3 },
        conflationFactor: 1,
      },
      view.defaultOptions()
    );
    const priceConverter = (price: number) => (100 - price * 10) as never;
    view.renderer().draw(target as never, priceConverter, false);

    // Per bar: wick fillRect then body fillRect. Middle bar body is call 3.
    expect(fillRect).toHaveBeenCalledTimes(6);
    const [bx, , bw] = fillRect.mock.calls[3];
    // Half-bin = 5px; bodyHalf = 5 * 0.7 = 3.5 → body [17, 24] after
    // rounding: a ≥3px gap remains between adjacent bodies.
    expect(bx).toBe(17);
    expect(bw).toBe(7);
    // Wick stays centered on the bar's x.
    const [wx] = fillRect.mock.calls[2];
    expect(wx).toBe(20);
  });
});
