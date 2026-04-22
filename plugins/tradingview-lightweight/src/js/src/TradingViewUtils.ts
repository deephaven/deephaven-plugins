import type {
  TvlChartType,
  TvlMarkerData,
  TvlMarkerSpec,
  TvlSeriesConfig,
} from './TradingViewTypes';

/**
 * Cache of Intl.DateTimeFormat instances keyed by timezone string.
 * Avoids re-constructing the formatter on every convertTime call.
 * The options are always identical; only the timezone varies.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Convert Deephaven table column data into lightweight-charts data points.
 *
 * For OHLC series: [{time, open, high, low, close}, ...]
 * For value series: [{time, value}, ...]
 *
 * Time column values are expected to be pre-converted by the model's
 * timeTranslator (TZ-adjusted epoch seconds for standard charts, raw
 * numbers for yieldCurve/options). No convertTime call is needed here.
 *
 * @param startIndex Optional index to start processing from. Used for
 *   append-only ticking updates to avoid re-processing old rows.
 */
export function transformTableData(
  seriesConfig: TvlSeriesConfig,
  columnData: Map<string, unknown[]>,
  chartType?: TvlChartType,
  startIndex = 0
): unknown[] {
  const { columns } = seriesConfig.dataMapping;
  const timeColumn = columnData.get(columns.time);
  if (!timeColumn) return [];

  const isNumericScale = chartType === 'yieldCurve' || chartType === 'options';
  const { length } = timeColumn;
  const result: unknown[] = [];
  const effectiveStart = Math.max(0, startIndex);

  for (let i = effectiveStart; i < length; i += 1) {
    // Time values are already converted by the model's translator:
    // - Standard charts: TZ-adjusted epoch seconds (number)
    // - Numeric scales: raw x-axis values (number)
    const rawTime = timeColumn[i];

    // Skip non-finite times (null/undefined/string/NaN/Infinity). A point
    // with NaN time was previously kept and confused lightweight-charts;
    // a point with an unparseable time was previously kept at i=0 with
    // time=0, which made the chart draw a line from epoch (1970) to the
    // first real point — visible as a near-vertical "spike" entering the
    // chart from the left edge when zoomed to recent data.
    if (typeof rawTime !== 'number' || !Number.isFinite(rawTime)) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const timeVal = Math.floor(rawTime);

    // For standard (time-based) charts, time=0 is essentially always a
    // sentinel for missing data — Instant columns don't represent epoch.
    // Skip at every index (including i=0) to avoid the same left-edge
    // spike as above. Numeric scales (yieldCurve, options) treat 0 as a
    // valid x-axis value and don't apply this filter.
    if (!isNumericScale && timeVal === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    const point: Record<string, unknown> = {
      time: timeVal,
    };

    // Map each non-time column
    Object.entries(columns).forEach(([field, colName]) => {
      if (field === 'time') return;
      const data = columnData.get(colName);
      if (data != null) {
        point[field] =
          typeof data[i] === 'object' && data[i] !== null
            ? Number(data[i])
            : data[i];
      }
    });

    result.push(point);
  }

  return result;
}

/**
 * Convert a time value to lightweight-charts UTCTimestamp (integer seconds).
 *
 * Lightweight-charts has no timezone support — it renders timestamps as-is.
 * To make the axis labels match the user's Deephaven timezone setting, we
 * shift the UTC timestamp by the timezone offset. This is the standard
 * approach recommended by the TradingView community.
 *
 * @param value The time value (millis, nanos, Date, or string)
 * @param timeZone The IANA timezone string from user settings (e.g. "America/New_York").
 *   Falls back to the browser's local timezone if not provided.
 */
export function convertTime(value: unknown, timeZone?: string): number {
  let utcSeconds: number;
  if (typeof value === 'number') {
    if (value > 1e15) {
      utcSeconds = Math.floor(value / 1e9);
    } else if (value > 1e12) {
      utcSeconds = Math.floor(value / 1e3);
    } else {
      utcSeconds = Math.floor(value);
    }
  } else if (value instanceof Date) {
    utcSeconds = Math.floor(value.getTime() / 1000);
  } else if (typeof value === 'string') {
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) return 0;
    utcSeconds = Math.floor(ms / 1000);
  } else {
    return 0;
  }

  // Shift by the user's timezone offset so axis labels display in their
  // configured timezone. Uses Intl API to resolve the offset for the
  // specific instant (handles DST correctly).
  const offsetSeconds = getTimezoneOffsetSeconds(utcSeconds * 1000, timeZone);
  return utcSeconds + offsetSeconds;
}

/**
 * Reverse the TZ shift applied by convertTime. Given a TZ-shifted epoch
 * seconds value (as stored in the chart's data and returned by
 * getVisibleRange), return the real UTC epoch seconds.
 *
 * convertTime does: realUTC + offset → tzShifted
 * unconvertTime does: tzShifted - offset → realUTC
 *
 * Uses the shifted value as an approximation for the offset lookup, which
 * is correct except at DST boundaries (where the error is ≤1 hour).
 */
export function unconvertTime(
  tzShiftedSeconds: number,
  timeZone?: string
): number {
  if (
    timeZone == null ||
    timeZone === '' ||
    timeZone === 'UTC' ||
    timeZone === 'Etc/UTC'
  ) {
    return tzShiftedSeconds;
  }
  // Use the shifted value as an approximation to compute the offset
  const offsetSeconds = getTimezoneOffsetSeconds(
    tzShiftedSeconds * 1000,
    timeZone
  );
  return tzShiftedSeconds - offsetSeconds;
}

/**
 * Get the timezone offset in seconds for a given instant and timezone.
 * Positive = east of UTC (e.g. +9 for Tokyo), negative = west (e.g. -5 for NY).
 */
function getTimezoneOffsetSeconds(epochMs: number, timeZone?: string): number {
  if (timeZone == null || timeZone === '') {
    // Fall back to browser local timezone
    return -(new Date(epochMs).getTimezoneOffset() * 60);
  }
  // Use Intl.DateTimeFormat to compute the offset for the given timezone.
  // The formatter is cached per timezone — only formatToParts varies per instant.
  const utcDate = new Date(epochMs);
  let formatter = formatterCache.get(timeZone);
  if (formatter == null) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    formatterCache.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(utcDate);
  const get = (type: string) =>
    Number(parts.find(p => p.type === type)?.value ?? 0);
  const localDate = new Date(
    Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second')
    )
  );
  return Math.round((localDate.getTime() - utcDate.getTime()) / 1000);
}

/**
 * Deduplicate data points by time, keeping the last value for each time.
 * Lightweight-charts requires strictly ascending unique time values for setData().
 * For sub-second ticking data where multiple rows share the same second,
 * we keep only the most recent value per second.
 */
export function deduplicateByTime(
  data: Record<string, unknown>[]
): Record<string, unknown>[] {
  if (data.length === 0) return data;

  const seen = new Map<unknown, number>();
  for (let i = 0; i < data.length; i += 1) {
    seen.set(data[i].time, i);
  }

  // If no duplicates, return as-is
  if (seen.size === data.length) return data;

  // Build deduplicated array keeping last occurrence of each time
  const result: Record<string, unknown>[] = [];
  const usedIndices = new Set(seen.values());
  for (let i = 0; i < data.length; i += 1) {
    if (usedIndices.has(i)) {
      result.push(data[i]);
    }
  }
  return result;
}

/**
 * Get the column names needed for a series subscription.
 */
export function getRequiredColumns(seriesConfig: TvlSeriesConfig): string[] {
  return Object.values(seriesConfig.dataMapping.columns);
}

/**
 * Get all unique column names across all series for a given table.
 */
export function getAllColumnsForTable(
  series: TvlSeriesConfig[],
  tableId: number
): string[] {
  const columns = new Set<string>();
  series.forEach(s => {
    // Series data columns
    if (s.dataMapping.tableId === tableId) {
      Object.values(s.dataMapping.columns).forEach(colName => {
        columns.add(colName);
      });
      // Include columns referenced by dynamic price lines
      s.priceLines?.forEach(pl => {
        if (pl.column) {
          columns.add(pl.column);
        }
      });
    }
    // Marker spec columns (may reference a different table)
    if (s.markerSpec?.tableId === tableId) {
      Object.values(s.markerSpec.columns).forEach(colName => {
        columns.add(colName);
      });
    }
  });
  return Array.from(columns);
}

/**
 * Mapping from Python-friendly position names to camelCase.
 */
const POSITION_MAP: Record<string, TvlMarkerData['position']> = {
  above_bar: 'aboveBar',
  below_bar: 'belowBar',
  in_bar: 'inBar',
  at_price_top: 'atPriceTop',
  at_price_bottom: 'atPriceBottom',
  at_price_middle: 'atPriceMiddle',
  aboveBar: 'aboveBar',
  belowBar: 'belowBar',
  inBar: 'inBar',
  atPriceTop: 'atPriceTop',
  atPriceBottom: 'atPriceBottom',
  atPriceMiddle: 'atPriceMiddle',
};

/**
 * Mapping from Python-friendly shape names to camelCase.
 */
const SHAPE_MAP: Record<string, TvlMarkerData['shape']> = {
  circle: 'circle',
  square: 'square',
  arrow_up: 'arrowUp',
  arrow_down: 'arrowDown',
  arrowUp: 'arrowUp',
  arrowDown: 'arrowDown',
};

/**
 * Resolve a marker property from a column value or a default.
 */
function resolveMarkerField(
  spec: TvlMarkerSpec,
  field: string,
  columnData: Map<string, unknown[]>,
  rowIndex: number
): unknown {
  const colName = spec.columns[field];
  if (colName) {
    const data = columnData.get(colName);
    const val = data?.[rowIndex];
    return val ?? (spec.defaults as Record<string, unknown>)[field];
  }
  return (spec.defaults as Record<string, unknown>)[field];
}

/**
 * Build TvlMarkerData[] from a marker table's column data.
 * Each row in the marker table produces one marker.
 *
 * Time column values are expected to be pre-converted by the model's
 * timeTranslator (same as transformTableData).
 */
export function buildMarkersFromTableData(
  markerSpec: TvlMarkerSpec,
  columnData: Map<string, unknown[]>,
  chartType?: TvlChartType,
  defaultColor?: string
): TvlMarkerData[] {
  const timeColName = markerSpec.columns.time;
  const timeCol = columnData.get(timeColName);
  if (!timeCol) return [];

  const isNumericScale = chartType === 'yieldCurve' || chartType === 'options';
  const markers: TvlMarkerData[] = [];

  for (let i = 0; i < timeCol.length; i += 1) {
    // Time values are already converted by the model's translator
    const timeVal =
      typeof timeCol[i] === 'number' ? Math.floor(timeCol[i] as number) : 0;

    // Skip invalid times
    if (!isNumericScale && timeVal === 0 && i > 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const rawPosition = resolveMarkerField(
      markerSpec,
      'position',
      columnData,
      i
    ) as string;
    const rawShape = resolveMarkerField(
      markerSpec,
      'shape',
      columnData,
      i
    ) as string;
    const color = (resolveMarkerField(markerSpec, 'color', columnData, i) ??
      defaultColor) as string | undefined;
    const text = (resolveMarkerField(markerSpec, 'text', columnData, i) ??
      '') as string;
    const size = resolveMarkerField(markerSpec, 'size', columnData, i) as
      | number
      | undefined;

    const position = POSITION_MAP[rawPosition] ?? 'aboveBar';
    const shape = SHAPE_MAP[rawShape] ?? 'circle';

    markers.push({
      time: timeVal,
      position,
      shape,
      ...(color != null ? { color } : {}),
      text,
      ...(size != null ? { size: Number(size) } : {}),
    });
  }

  // lightweight-charts requires markers sorted by time ascending
  markers.sort((a, b) => (a.time as number) - (b.time as number));
  return markers;
}
