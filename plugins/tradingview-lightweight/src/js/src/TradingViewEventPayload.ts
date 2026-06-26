import type {
  MouseEventParams,
  ISeriesApi,
  SeriesType,
} from 'lightweight-charts';
import { unconvertTime } from './TradingViewUtils';
import { extractSeriesPoint } from './TradingViewSeriesFocus';

/**
 * Per-series data at the event location, mirroring the shape of the
 * lightweight-charts data the series was given: `{ value }` for
 * line / area / baseline / histogram, OHLC for candlestick / bar.
 */
export type TvlWireSeriesData =
  | { value: number }
  | { open: number; high: number; low: number; close: number };

/**
 * JSON-safe payload for a press / double-press chart event. This intentionally
 * mirrors lightweight-charts' `MouseEventParams` (time, point, logical,
 * paneIndex, seriesData, the hovered series, and the source event's modifier
 * keys) rather than inventing a chart model of its own. Two deliberate
 * deviations, because a DOM/native object cannot cross the wire:
 *
 * - the hovered `ISeriesApi` is replaced by our string series identity
 *   (`hoveredSeries` friendly key + `hoveredSeriesId` stable id), and
 *   `seriesData` is keyed by the friendly id;
 * - `time` travels as `timeNs` and is rebuilt server-side as a Deephaven
 *   timestamp matching the source column type.
 */
export interface TvlPressEventPayload {
  /** Event kind. */
  type: 'press' | 'doublePress';
  /**
   * Time of the data at the event location, in UTC nanoseconds. Mirrors
   * `MouseEventParams.time`; omitted when the event is outside the data range.
   */
  timeNs?: number;
  /**
   * IANA timezone the chart is rendering in, so the server can rebuild a
   * `ZonedDateTime` in the displayed zone. Omitted when unknown.
   */
  timeZone?: string;
  /** Pixel location of the event in the chart. Omitted if outside the chart. */
  point?: { x: number; y: number };
  /** Logical index at the event location (`MouseEventParams.logical`). */
  logical?: number;
  /** Index of the pane the event occurred in. */
  paneIndex?: number;
  /** Friendly id of the hovered series (title / by-key, falling back to the stable id). */
  hoveredSeries?: string;
  /** Stable internal id (`series_<n>`) of the hovered series, for server-side lookup. */
  hoveredSeriesId?: string;
  /** Data of every series at the event location, keyed by friendly series id. */
  seriesData: Record<string, TvlWireSeriesData>;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/**
 * Build the wire payload for a press / double-press event from the LWC
 * MouseEventParams. Pure: no side effects, JSON-safe output.
 *
 * @param type        'press' or 'doublePress'
 * @param params      LWC mouse event params
 * @param getSeriesId reverse lookup from ISeriesApi to our stable series id
 * @param getSeriesTitle user-facing title lookup from ISeriesApi
 * @param timeZone    IANA timezone used to undo the chart's TZ shift on time
 */
export function buildPressEventPayload(
  type: 'press' | 'doublePress',
  params: MouseEventParams,
  getSeriesId: (s: ISeriesApi<SeriesType>) => string | undefined,
  getSeriesTitle: (s: ISeriesApi<SeriesType>) => string | undefined,
  timeZone: string
): TvlPressEventPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source = params.sourceEvent as any;
  const payload: TvlPressEventPayload = {
    type,
    seriesData: {},
    shiftKey: source?.shiftKey ?? false,
    ctrlKey: source?.ctrlKey ?? false,
    metaKey: source?.metaKey ?? false,
    altKey: source?.altKey ?? false,
  };

  // seriesData: every series' data at the event location, keyed by friendly id.
  params.seriesData.forEach((dataItem, seriesApi) => {
    const label = resolveSeriesLabel(seriesApi, getSeriesId, getSeriesTitle);
    const extracted = extractSeriesPoint(dataItem);
    if (label == null || extracted == null) return;
    payload.seriesData[label] =
      typeof extracted.data === 'number'
        ? { value: extracted.data }
        : extracted.data;
  });

  // Hovered series: LWC's own hit-test result, mapped to our string identity.
  const hovered = params.hoveredInfo?.series;
  if (hovered != null) {
    const label = resolveSeriesLabel(hovered, getSeriesId, getSeriesTitle);
    const internalId = getSeriesId(hovered);
    if (label != null) payload.hoveredSeries = label;
    if (internalId != null) payload.hoveredSeriesId = internalId;
  }

  if (params.point != null) {
    payload.point = { x: params.point.x, y: params.point.y };
  }
  if (params.logical != null) {
    payload.logical = params.logical as number;
  }
  const paneIndex = params.paneIndex ?? params.hoveredInfo?.paneIndex;
  if (paneIndex != null) {
    payload.paneIndex = paneIndex;
  }

  // Time: the crosshair time at the event. Chart stores TZ-shifted epoch
  // seconds; undo the shift before sending UTC nanoseconds.
  const { time } = params;
  if (time != null && typeof time === 'number') {
    const utcSec = unconvertTime(time, timeZone);
    payload.timeNs = Math.round(utcSec * 1e9);
    if (timeZone) {
      payload.timeZone = timeZone;
    }
  }

  return payload;
}

function resolveSeriesLabel(
  series: ISeriesApi<SeriesType>,
  getSeriesId: (s: ISeriesApi<SeriesType>) => string | undefined,
  getSeriesTitle: (s: ISeriesApi<SeriesType>) => string | undefined
): string | undefined {
  const title = getSeriesTitle(series);
  if (title != null && title !== '') return title;
  return getSeriesId(series);
}
