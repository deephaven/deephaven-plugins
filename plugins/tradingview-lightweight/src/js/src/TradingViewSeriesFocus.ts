import type {
  ISeriesApi,
  MouseEventParams,
  SeriesType,
  Time,
} from 'lightweight-charts';

export interface TvlOhlcPointData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TvlSeriesPointData = number | TvlOhlcPointData;

export interface ExtractedSeriesPoint {
  /** JSON-safe point data exposed to event handlers. */
  data: TvlSeriesPointData;
  /** Single comparable/display price: value for line-like data, close for OHLC. */
  price: number;
  /** Original LWC time for this data item, when present. */
  time?: Time;
}

export interface FocusedSeriesPoint extends ExtractedSeriesPoint {
  series: ISeriesApi<SeriesType>;
}

/**
 * Pull comparable point data out of a crosshair data item. Line / Area /
 * Baseline / Histogram carry ``value``; OHLC carries ``open/high/low/close``
 * and uses ``close`` as the comparable price.
 */
export function extractSeriesPoint(
  dataItem: unknown
): ExtractedSeriesPoint | undefined {
  if (dataItem == null || typeof dataItem !== 'object') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = dataItem as any;
  const time = item.time as Time | undefined;
  if (typeof item.value === 'number') {
    return { data: item.value, price: item.value, time };
  }
  if (
    typeof item.open === 'number' &&
    typeof item.high === 'number' &&
    typeof item.low === 'number' &&
    typeof item.close === 'number'
  ) {
    return {
      data: {
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      },
      price: item.close,
      time,
    };
  }
  return undefined;
}

/**
 * Within the crosshair's time slice, choose the series whose rendered point is
 * vertically nearest the cursor. Used by the x-driven tracking tooltip.
 */
export function resolveFocusedSeriesPoint(
  params: MouseEventParams
): FocusedSeriesPoint | undefined {
  const { seriesData, point } = params;

  let best: FocusedSeriesPoint | undefined;
  let bestDist = Infinity;
  seriesData.forEach((dataItem, series) => {
    const extracted = extractSeriesPoint(dataItem);
    if (extracted == null) return;
    const y =
      typeof series.priceToCoordinate === 'function'
        ? series.priceToCoordinate(extracted.price)
        : null;
    // No coordinate (e.g. value off-scale): treat distance as 0 so a series
    // can still resolve, which matters for single-series charts.
    const dist = y == null || point == null ? 0 : Math.abs(y - point.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = { series, ...extracted };
    }
  });
  return best;
}
