/**
 * ContinuousBarsSeries — a custom lightweight-charts series that renders
 * Histogram / Candlestick / Bar items on a time-proportional layout:
 * histogram bars span their full time bin (edge-to-edge, no 1px borders),
 * while candle/bar bodies keep the built-in ~80%-of-bin proportions but are
 * positioned so real time gaps stay open (the chart enables the whitespace
 * scaffold for continuous series, so missing data renders as missing).
 *
 * Geometry is derived from each item's *time* (exact integer epoch seconds
 * or numeric x) cross-checked against pixel deltas. On the dense whitespace
 * scaffold the pixel distance between adjacent bins jitters ±1 scaffold
 * slot, so a purely pixel-based width is wrong at some zoom levels; on a
 * plain ordinal scale (small tables, no scaffold) real time gaps collapse
 * to one index step, so a purely time-based width over-divides them.
 *
 *   minDt          = smallest positive adjacent time delta that is at least
 *                    half the median delta (median-filtered so sub-bin
 *                    head/tail anchor rows from autobin can't shrink it)
 *   timeCount(gap) = round(dt / minDt)
 *   pxCount(gap)   = round(dx / medianDx)
 *   binCount(gap)  = max(1, min(timeCount, max(1, pxCount)))
 *   halfFill(gap)  = dxPixels / (2 * binCount)
 *
 * min() is the right combiner: scaffold jitter can only inflate pxCount
 * (timeCount wins), and ordinal gap-collapse can only deflate it (pxCount
 * wins). Adjacent bins (binCount = 1) meet at the exact shared pixel
 * midpoint, so contiguous bars tile with no borders or overlap; an n-bin
 * empty gap leaves each neighbor extending exactly half a bin into it,
 * keeping gaps time-proportional.
 */
import type {
  CanvasRenderingTarget2D,
  BitmapCoordinatesRenderingScope,
} from 'fancy-canvas';
import { customSeriesDefaultOptions } from 'lightweight-charts';
import type {
  CustomData,
  CustomSeriesOptions,
  CustomSeriesPricePlotValues,
  CustomSeriesWhitespaceData,
  ICustomSeriesPaneRenderer,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  PriceToCoordinateConverter,
  Time,
} from 'lightweight-charts';

export type ContinuousSeriesType = 'Histogram' | 'Candlestick' | 'Bar';

const CONTINUOUS_BAR_TYPES: ReadonlySet<string> = new Set([
  'Histogram',
  'Candlestick',
  'Bar',
]);

export function isContinuousBarType(
  type: string
): type is ContinuousSeriesType {
  return CONTINUOUS_BAR_TYPES.has(type);
}

/**
 * Candle/bar bodies fill this fraction of their bin (matching the built-in
 * renderers' proportions), so adjacent candles keep a small gap and only
 * histogram bars actually touch.
 */
export const CANDLE_BODY_FRACTION = 0.7;

/** True when any series in the list renders via ContinuousBarsSeries. */
export function hasContinuousBarSeries(
  series: ReadonlyArray<{ type: string; continuous?: boolean }>
): boolean {
  return series.some(
    s => isContinuousBarType(s.type) && s.continuous !== false
  );
}

/** Data item shape — matches transformTableData output for the 3 types. */
export interface ContinuousBarData extends CustomData<Time> {
  value?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  color?: string;
  borderColor?: string;
  wickColor?: string;
  /**
   * Duplicate of `time`. LWC strips `time` and `color` out of the object it
   * hands back as `originalData` (getCustomSeriesPlotRow destructures them
   * away), so the timestamp must ride along under a different key for the
   * renderer's bin-width math. Stamped by stampContinuousBarTimes.
   */
  ts?: number;
}

/**
 * Stamp each data item's timestamp into `ts` so it survives LWC's `time`
 * strip (see ContinuousBarData.ts). Call on every array passed to setData /
 * update for a continuous series. Mutates in place; items are throwaway
 * transforms.
 */
export function stampContinuousBarTimes(data: unknown[]): void {
  for (let i = 0; i < data.length; i += 1) {
    const item = data[i] as { time?: unknown; ts?: number };
    if (item != null && typeof item.time === 'number') {
      item.ts = item.time;
    }
  }
}

export interface ContinuousBarsSeriesOptions extends CustomSeriesOptions {
  color: string;
  base: number;
  upColor: string;
  downColor: string;
  borderVisible: boolean;
  borderColor?: string;
  borderUpColor?: string;
  borderDownColor?: string;
  wickVisible: boolean;
  wickColor?: string;
  wickUpColor?: string;
  wickDownColor?: string;
  openVisible: boolean;
  thinBars: boolean;
}

const DEFAULT_OPTIONS: ContinuousBarsSeriesOptions = {
  ...customSeriesDefaultOptions,
  color: '#26a69a',
  base: 0,
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: true,
  wickVisible: true,
  openVisible: true,
  thinBars: true,
};

/** Half-widths (media px) a bar's body extends left/right of its center x. */
export interface BarHalfWidths {
  left: number;
  right: number;
}

function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute per-bar half-widths from bar times and pixel positions.
 *
 * @param times Numeric time per bar (epoch seconds or numeric x), ascending.
 * @param xs Pixel x-coordinate per bar (media space).
 * @param barSpacing Fallback width (px) when adjacency can't be derived.
 */
export function computeBarHalfWidths(
  times: readonly number[],
  xs: readonly number[],
  barSpacing: number
): BarHalfWidths[] {
  const n = times.length;
  if (n === 0) return [];
  const fallback = Math.max(1, barSpacing) / 2;
  if (n === 1) return [{ left: fallback, right: fallback }];

  const dts: number[] = [];
  const dxs: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const dt = times[i + 1] - times[i];
    if (dt > 0) dts.push(dt);
    const dx = xs[i + 1] - xs[i];
    if (dx > 0) dxs.push(dx);
  }
  const medianDt = medianOf(dts);
  if (medianDt == null) {
    return times.map(() => ({ left: fallback, right: fallback }));
  }

  // Bin width = smallest delta that isn't a sub-bin artifact. Autobin's
  // head/tail anchor rows sit at raw timestamps a fraction of a bin from
  // the first/last snapped bin; a plain min() would collapse to that
  // fraction and turn every body bar into a hairline.
  let minDt = Infinity;
  for (let i = 0; i < dts.length; i += 1) {
    const dt = dts[i];
    if (dt >= medianDt / 2 && dt < minDt) minDt = dt;
  }
  const medianDx = medianOf(dxs);

  const result: BarHalfWidths[] = times.map(() => ({ left: 0, right: 0 }));
  for (let i = 0; i < n - 1; i += 1) {
    const dt = times[i + 1] - times[i];
    const dx = xs[i + 1] - xs[i];
    const timeCount = Math.round(dt / minDt);
    // Pixel-space cap: on a plain ordinal scale (no scaffold) real time
    // gaps collapse to one index step; the axis shows them adjacent, so
    // the bars must tile them as adjacent too.
    const pxCount =
      medianDx != null && medianDx > 0
        ? Math.max(1, Math.round(dx / medianDx))
        : timeCount;
    const binCount = Math.max(1, Math.min(timeCount, pxCount));
    const halfFill = dx / (2 * binCount);
    result[i].right = halfFill;
    result[i + 1].left = halfFill;
  }
  // Edge bars mirror their one known side.
  result[0].left = result[0].right;
  result[n - 1].right = result[n - 1].left;
  return result;
}

interface RendererState {
  data: PaneRendererCustomData<Time, ContinuousBarData> | null;
  options: ContinuousBarsSeriesOptions | null;
}

function toY(
  scope: BitmapCoordinatesRenderingScope,
  priceConverter: PriceToCoordinateConverter,
  price: number
): number | null {
  const y = priceConverter(price);
  if (y == null) return null;
  return Math.round(y * scope.verticalPixelRatio);
}

function drawHistogramBar(
  scope: BitmapCoordinatesRenderingScope,
  priceConverter: PriceToCoordinateConverter,
  options: ContinuousBarsSeriesOptions,
  item: ContinuousBarData,
  barColor: string,
  xL: number,
  w: number
): void {
  const { value } = item;
  if (value == null) return;
  const yVal = toY(scope, priceConverter, value);
  const yBase = toY(scope, priceConverter, options.base ?? 0);
  if (yVal == null || yBase == null) return;
  const top = Math.min(yVal, yBase);
  const h = Math.max(1, Math.abs(yBase - yVal));
  const { context: ctx } = scope;
  // LWC strips per-item `color` from originalData and round-trips it as
  // bar.barColor (falling back to options.color), so barColor is the fill.
  ctx.fillStyle = barColor !== '' ? barColor : options.color;
  ctx.fillRect(xL, top, w, h);
}

function drawCandle(
  scope: BitmapCoordinatesRenderingScope,
  priceConverter: PriceToCoordinateConverter,
  options: ContinuousBarsSeriesOptions,
  item: ContinuousBarData,
  barColor: string,
  centerX: number,
  xL: number,
  w: number
): void {
  const { open, high, low, close } = item;
  if (open == null || high == null || low == null || close == null) return;
  const isUp = close >= open;
  const directionColor = isUp ? options.upColor : options.downColor;
  const bodyColor = barColor !== '' ? barColor : directionColor;
  const { context: ctx, horizontalPixelRatio: hpr } = scope;

  // Wick — centered vertical line spanning high..low.
  if (options.wickVisible !== false) {
    const yHigh = toY(scope, priceConverter, high);
    const yLow = toY(scope, priceConverter, low);
    if (yHigh != null && yLow != null) {
      const wickColor =
        item.wickColor ??
        (isUp ? options.wickUpColor : options.wickDownColor) ??
        options.wickColor ??
        bodyColor;
      const wickW = Math.max(1, Math.round(hpr));
      const xC = Math.round(centerX * hpr) - Math.floor(wickW / 2);
      ctx.fillStyle = wickColor;
      ctx.fillRect(xC, yHigh, wickW, Math.max(1, yLow - yHigh));
    }
  }

  // Body — spans the full bin width.
  const yOpen = toY(scope, priceConverter, open);
  const yClose = toY(scope, priceConverter, close);
  if (yOpen == null || yClose == null) return;
  const top = Math.min(yOpen, yClose);
  const h = Math.max(1, Math.abs(yClose - yOpen));
  ctx.fillStyle = bodyColor;
  ctx.fillRect(xL, top, w, h);

  if (options.borderVisible !== false) {
    const borderColor =
      item.borderColor ??
      (isUp ? options.borderUpColor : options.borderDownColor) ??
      options.borderColor ??
      bodyColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(1, Math.round(hpr));
    ctx.strokeRect(xL + 0.5, top + 0.5, Math.max(1, w - 1), h);
  }
}

function drawOhlcBar(
  scope: BitmapCoordinatesRenderingScope,
  priceConverter: PriceToCoordinateConverter,
  options: ContinuousBarsSeriesOptions,
  item: ContinuousBarData,
  barColor: string,
  centerX: number,
  xL: number,
  w: number
): void {
  const { open, high, low, close } = item;
  if (open == null || high == null || low == null || close == null) return;
  const isUp = close >= open;
  const directionColor = isUp ? options.upColor : options.downColor;
  const color = barColor !== '' ? barColor : directionColor;
  const { context: ctx, horizontalPixelRatio: hpr } = scope;

  const yHigh = toY(scope, priceConverter, high);
  const yLow = toY(scope, priceConverter, low);
  const yOpen = toY(scope, priceConverter, open);
  const yClose = toY(scope, priceConverter, close);
  if (yHigh == null || yLow == null || yOpen == null || yClose == null) {
    return;
  }

  const lineW =
    options.thinBars !== false
      ? Math.max(1, Math.round(hpr))
      : Math.max(1, Math.round(2 * hpr));
  const xC = Math.round(centerX * hpr) - Math.floor(lineW / 2);
  ctx.fillStyle = color;
  // Center stick: high..low.
  ctx.fillRect(xC, yHigh, lineW, Math.max(1, yLow - yHigh));
  // Open tick: left bin edge to center.
  if (options.openVisible !== false) {
    ctx.fillRect(xL, yOpen, Math.max(1, xC - xL), lineW);
  }
  // Close tick: center to right bin edge.
  ctx.fillRect(xC, yClose, Math.max(1, xL + w - xC), lineW);
}

function drawSeries(
  seriesType: ContinuousSeriesType,
  state: RendererState,
  scope: BitmapCoordinatesRenderingScope,
  priceConverter: PriceToCoordinateConverter
): void {
  const { data, options } = state;
  if (data == null || options == null) return;
  const { bars, visibleRange, barSpacing } = data;
  if (bars.length === 0 || visibleRange == null) return;

  // `ts` is the stamped timestamp; `time` on originalData is stripped by
  // LWC, and bar.time is the logical index (useless for bin widths).
  const times = bars.map(b => Number(b.originalData.ts ?? b.originalData.time));
  const xs = bars.map(b => b.x);
  const halves = computeBarHalfWidths(times, xs, barSpacing);
  const { horizontalPixelRatio: hpr } = scope;

  for (let i = visibleRange.from; i < visibleRange.to; i += 1) {
    const bar = bars[i];
    const half = halves[i];
    const barColor = bar.barColor ?? '';
    if (seriesType === 'Histogram') {
      // Histogram bars tile edge-to-edge. Adjacent bars share the exact
      // media-space midpoint, so rounding yields identical edges: no seams.
      const xL = Math.round((bar.x - half.left) * hpr);
      const xR = Math.round((bar.x + half.right) * hpr);
      const w = Math.max(1, xR - xL);
      drawHistogramBar(
        scope,
        priceConverter,
        options,
        bar.originalData,
        barColor,
        xL,
        w
      );
    } else {
      // Candles/bars keep the built-in look: a symmetric body around the
      // wick at ~80% of the bin, leaving a small gap between neighbors.
      const bodyHalf = Math.min(half.left, half.right) * CANDLE_BODY_FRACTION;
      const xL = Math.round((bar.x - bodyHalf) * hpr);
      const xR = Math.round((bar.x + bodyHalf) * hpr);
      const w = Math.max(1, xR - xL);
      if (seriesType === 'Candlestick') {
        drawCandle(
          scope,
          priceConverter,
          options,
          bar.originalData,
          barColor,
          bar.x,
          xL,
          w
        );
      } else {
        drawOhlcBar(
          scope,
          priceConverter,
          options,
          bar.originalData,
          barColor,
          bar.x,
          xL,
          w
        );
      }
    }
  }
}

/**
 * Custom pane view rendering Histogram / Candlestick / Bar items whose
 * bodies span their full time bin (end-to-end / "continuous" layout).
 */
export class ContinuousBarsSeries
  implements
    ICustomSeriesPaneView<Time, ContinuousBarData, ContinuousBarsSeriesOptions>
{
  private seriesType: ContinuousSeriesType;

  private state: RendererState = { data: null, options: null };

  private paneRenderer: ICustomSeriesPaneRenderer;

  constructor(seriesType: ContinuousSeriesType) {
    this.seriesType = seriesType;
    this.paneRenderer = {
      draw: (
        target: CanvasRenderingTarget2D,
        priceConverter: PriceToCoordinateConverter
      ): void => {
        target.useBitmapCoordinateSpace(scope =>
          drawSeries(this.seriesType, this.state, scope, priceConverter)
        );
      },
    };
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this.paneRenderer;
  }

  update(
    data: PaneRendererCustomData<Time, ContinuousBarData>,
    seriesOptions: ContinuousBarsSeriesOptions
  ): void {
    this.state.data = data;
    this.state.options = seriesOptions;
  }

  priceValueBuilder(plotRow: ContinuousBarData): CustomSeriesPricePlotValues {
    if (this.seriesType === 'Histogram') {
      const base = this.state.options?.base ?? 0;
      return [base, plotRow.value ?? base];
    }
    return [
      plotRow.high ?? plotRow.close ?? 0,
      plotRow.low ?? plotRow.close ?? 0,
      plotRow.close ?? 0,
    ];
  }

  isWhitespace(
    data: ContinuousBarData | CustomSeriesWhitespaceData<Time>
  ): data is CustomSeriesWhitespaceData<Time> {
    const d = data as ContinuousBarData;
    return this.seriesType === 'Histogram' ? d.value == null : d.close == null;
  }

  defaultOptions(): ContinuousBarsSeriesOptions {
    return { ...DEFAULT_OPTIONS, ...this.typeDefaults };
  }

  /** Per-type default overrides (none today; keeps defaults instance-bound). */
  private typeDefaults: Partial<ContinuousBarsSeriesOptions> = {};
}

export default ContinuousBarsSeries;
