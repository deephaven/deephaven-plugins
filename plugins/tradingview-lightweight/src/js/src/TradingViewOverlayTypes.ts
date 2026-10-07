import type { ISeriesApi, SeriesType } from 'lightweight-charts';
import type { TvlSeriesKind } from './TradingViewTypes';

/**
 * One legend-eligible series, as supplied by the renderer. Pure data — the
 * overlays that consume it are React components and own their own DOM.
 */
export interface TvlLegendEntry {
  /** Stable series id (`series_<n>`, plus a key suffix for `by=` charts). */
  id: string;
  series: ISeriesApi<SeriesType>;
  /** Python `title=` (or the partition key), falling back to the id. */
  title: string;
  /** Resolved primary color, used for the swatch. */
  color: string | undefined;
  kind: TvlSeriesKind;
  /** False when the series is currently hidden. */
  visible: boolean;
}

/** Series types whose point data is OHLC rather than a single value. */
export const OHLC_KINDS: ReadonlySet<TvlSeriesKind> = new Set<TvlSeriesKind>([
  'Candlestick',
  'Bar',
]);

/** Rows shown before the legend collapses into a "+N more" line. */
export const DEFAULT_MAX_ROWS = 6;

/**
 * Format one number with the series' own price formatter, so an overlay
 * agrees with the price axis. `price_format=` on the series is the single
 * lever for decimals.
 */
export function formatSeriesValue(
  series: ISeriesApi<SeriesType>,
  value: number
): string {
  try {
    return series.priceFormatter().format(value);
  } catch {
    return String(value);
  }
}
