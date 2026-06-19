import type {
  MouseEventParams,
  ISeriesApi,
  SeriesType,
} from 'lightweight-charts';
import { unconvertTime } from './TradingViewUtils';

/**
 * JSON-safe payload for a press / double-press chart event. This is the exact
 * wire shape sent to Python via the EVENT widget message. No DOM or native
 * objects cross the wire.
 */
export interface TvlPressEventPayload {
  /** Event kind. */
  type: 'press' | 'doublePress';
  /** UTC time of the press in nanoseconds. Omitted for empty-area presses. */
  timeNs?: number;
  /** Series id of the hovered series (LWC native hit test). Omitted if none. */
  seriesId?: string;
  /** Per-series value/OHLC at the pressed location, keyed by series id. */
  seriesData: Record<
    string,
    number | { open: number; high: number; low: number; close: number }
  >;
  /** Price under the cursor on the hovered series' scale. Omitted if no series. */
  price?: number;
  /** Cursor location in chart pixels. Omitted if outside the chart. */
  point?: { x: number; y: number };
  /** Pane index where the press occurred. Omitted if unknown. */
  paneIndex?: number;
  /**
   * IANA timezone the chart is rendering in (from user settings). Lets the
   * server reconstruct a ZonedDateTime in the displayed zone when the source
   * time column is zoned. Omitted when unknown (chart defaults to UTC).
   */
  timeZone?: string;
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
 * @param getSeriesId reverse lookup from ISeriesApi to our series id
 * @param timeZone    IANA timezone used to undo the chart's TZ shift on time
 */
export function buildPressEventPayload(
  type: 'press' | 'doublePress',
  params: MouseEventParams,
  getSeriesId: (s: ISeriesApi<SeriesType>) => string | undefined,
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

  // Time: chart stores TZ-shifted epoch seconds. Undo the shift to get real
  // UTC seconds, then scale to integer nanoseconds. Omit for empty area.
  if (params.time != null) {
    const utcSec = unconvertTime(params.time as number, timeZone);
    payload.timeNs = Math.round(utcSec * 1e9);
    // Carry the display zone so the server can mirror a zoned time column.
    if (timeZone) {
      payload.timeZone = timeZone;
    }
  }

  // Hovered series: take the owning series of whatever was hit, as long as
  // that target is owned by a series (sourceKind === 'series'). This covers a
  // hit on the series line itself (objectKind 'series'), on one of its markers
  // ('series-marker'), or on its last-value/custom price line
  // ('custom-price-line') — all of which mean "this series was pressed".
  // A press between lines reports no hoveredInfo, so seriesId stays unset.
  // Deprecated aliases hoveredSeries / hoveredObjectId are intentionally unused.
  const hovered = params.hoveredInfo;
  let hoveredSeries: ISeriesApi<SeriesType> | undefined;
  if (hovered?.sourceKind === 'series' && hovered.series != null) {
    hoveredSeries = hovered.series;
    const id = getSeriesId(hoveredSeries);
    if (id != null) {
      payload.seriesId = id;
    }
  }

  // Per-series values: reverse-map the seriesData Map keyed by ISeriesApi.
  params.seriesData.forEach((dataItem, seriesApi) => {
    const id = getSeriesId(seriesApi);
    if (id == null) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = dataItem as any;
    if (typeof item.value === 'number') {
      payload.seriesData[id] = item.value;
    } else if (
      typeof item.open === 'number' &&
      typeof item.high === 'number' &&
      typeof item.low === 'number' &&
      typeof item.close === 'number'
    ) {
      payload.seriesData[id] = {
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      };
    }
  });

  // Point + price (price only meaningful with a hovered series).
  if (params.point != null) {
    payload.point = { x: params.point.x, y: params.point.y };
    if (hoveredSeries != null) {
      const price = hoveredSeries.coordinateToPrice(params.point.y);
      if (price != null) {
        payload.price = price;
      }
    }
  }

  // Pane index.
  const paneIndex = params.paneIndex ?? hovered?.paneIndex;
  if (paneIndex != null) {
    payload.paneIndex = paneIndex;
  }

  return payload;
}
