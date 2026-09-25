import {
  formatSeriesValue,
  type TvlLegendEntry,
} from './TradingViewOverlayTypes';
import type { TvlSeriesPointData } from './TradingViewSeriesFocus';

/**
 * Render a point as legend text. OHLC series expand to all four values unless
 * `showOhlc` is disabled, in which case they show the close.
 */
export function formatPoint(
  entry: TvlLegendEntry,
  data: TvlSeriesPointData | undefined,
  showOhlc: boolean
): string {
  if (data == null) return '';
  if (typeof data === 'number') {
    return formatSeriesValue(entry.series, data);
  }
  if (!showOhlc) return formatSeriesValue(entry.series, data.close);
  return [
    `O ${formatSeriesValue(entry.series, data.open)}`,
    `H ${formatSeriesValue(entry.series, data.high)}`,
    `L ${formatSeriesValue(entry.series, data.low)}`,
    `C ${formatSeriesValue(entry.series, data.close)}`,
  ].join('  ');
}

/**
 * Which entries get a row: the first `maxRows`, except that the series under
 * the cursor is always shown. Promotion *replaces* the last visible row rather
 * than appending, so the legend's height never changes as the cursor moves.
 */
export function selectVisibleEntries(
  entries: TvlLegendEntry[],
  maxRows: number,
  focusedId: string | undefined,
  expanded: boolean
): TvlLegendEntry[] {
  if (expanded || entries.length <= maxRows) return entries;
  const shown = entries.slice(0, maxRows);
  if (focusedId != null && !shown.some(e => e.id === focusedId)) {
    const focused = entries.find(e => e.id === focusedId);
    if (focused != null) shown[shown.length - 1] = focused;
  }
  return shown;
}

/**
 * The time to print under rows that each show their own series' latest point.
 * Independent or sparse series need not agree on when that was, so it is the
 * latest of them: the moment the readout as a whole is current as of. Chart
 * times are UTC epoch seconds (see convertTime); anything else is ignored.
 */
export function latestTime(times: unknown[]): number | undefined {
  const numeric = times.filter((t): t is number => typeof t === 'number');
  return numeric.length > 0 ? Math.max(...numeric) : undefined;
}
