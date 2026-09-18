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
