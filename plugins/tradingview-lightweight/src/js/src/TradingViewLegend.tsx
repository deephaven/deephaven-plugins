import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ISeriesApi,
  MouseEventParams,
  SeriesType,
  Time,
} from 'lightweight-charts';
import type { TvlLegendOptions } from './TradingViewTypes';
import {
  DEFAULT_MAX_ROWS,
  OHLC_KINDS,
  type TvlLegendEntry,
} from './TradingViewOverlayTypes';
import {
  formatPoint,
  latestTime,
  selectVisibleEntries,
} from './TradingViewLegendModel';
import {
  extractSeriesPoint,
  resolveFocusedSeriesPoint,
  type TvlSeriesPointData,
} from './TradingViewSeriesFocus';

/** Renderer surface the legend needs. Data only — no DOM. */
export interface TvlLegendSource {
  getLegendEntries: () => TvlLegendEntry[];
  getSeriesIdForApi: (series: ISeriesApi<SeriesType>) => string | undefined;
  /** A series' point at a time, or undefined when it has none there. */
  getSeriesPointAt: (id: string, time: unknown) => unknown;
  getLastSeriesPoint: (id: string) => unknown;
  formatTime: (time: unknown) => string;
  setSeriesVisible: (id: string, visible: boolean) => void;
  subscribeCrosshairMove: (
    handler: (params: MouseEventParams) => void
  ) => () => void;
  /** Fires when series or their data change (ticks, late `by=` keys). */
  subscribeOverlayUpdate: (handler: () => void) => () => void;
}

export interface TradingViewLegendProps {
  source: TvlLegendSource;
  options: TvlLegendOptions;
  /** Notified after a row hides or shows a series. */
  onToggle?: (id: string, visible: boolean) => void;
}

/**
 * The crosshair, reduced to what survives a series rebuild. The raw
 * `MouseEventParams` is keyed by series API and frozen at the last mouse move,
 * so after `configureSeries` swaps the APIs, or a tick rewrites the hovered
 * bar, it is stale until the cursor moves. Ids are stable, and values are
 * re-read from the renderer by id and time on every render instead.
 */
interface CrosshairSnapshot {
  time: Time;
  /** Id of the series vertically nearest the cursor, when one resolved. */
  focusedId: string | undefined;
}

/**
 * In-chart legend: a fixed overlay in the chart's top-left listing each series
 * with its color, title, and value at the crosshair.
 *
 * Rendered as a React sibling of the chart host, like the downsample scrim,
 * rather than as DOM built by the renderer.
 *
 * Two layouts, per `variant`. `rows` gives one entry per series — vertically
 * stacked, or flowed horizontally as chips — over a CSS grid so the value
 * column stays put as digits change. `detailed` is the large single-series
 * readout from the upstream legend tutorial.
 *
 * With no crosshair it shows each series' last value rather than going blank,
 * so it is populated on first paint. Under an active crosshair a series with
 * no point in the hovered slice shows nothing: its latest value belongs to a
 * different time than the one the legend displays. The time line at rest is
 * the latest of the displayed rows' times; under a crosshair, the hovered one.
 */
export function TradingViewLegend({
  source,
  options,
  onToggle,
}: TradingViewLegendProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState<CrosshairSnapshot | undefined>();
  /**
   * Bumped on a toggle and on every renderer update, so entries are re-read.
   * A counter rather than storing entries: the renderer owns them, and this
   * keeps the data path free of React state, which would otherwise loop.
   */
  const [entryTick, setEntryTick] = useState(0);

  useEffect(
    () => source.subscribeOverlayUpdate(() => setEntryTick(t => t + 1)),
    [source]
  );

  const variant = options.variant === 'detailed' ? 'detailed' : 'rows';
  const horizontal = options.orientation === 'horizontal';
  const interactive = options.interactive !== false;
  const showTime = options.showTime !== false;
  const showOhlc = options.showOhlc !== false;
  const followsCursor = options.followCursor !== false;
  const maxRows =
    options.maxRows != null && options.maxRows > 0
      ? options.maxRows
      : DEFAULT_MAX_ROWS;

  // With cursor-following off the legend is a fixed latest-value readout, so
  // it never subscribes at all rather than subscribing and discarding.
  useEffect(() => {
    if (!followsCursor) return undefined;
    return source.subscribeCrosshairMove(params => {
      if (params.time == null) {
        // Off the data LWC reports no time and an empty slice.
        setSnapshot(undefined);
        return;
      }
      // Resolve focus to an id now, while seriesData still holds live APIs.
      const focused = resolveFocusedSeriesPoint(params)?.series;
      setSnapshot({
        time: params.time,
        focusedId:
          focused != null ? source.getSeriesIdForApi(focused) : undefined,
      });
    });
  }, [source, followsCursor]);

  const entries = useMemo(
    () => source.getLegendEntries(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, entryTick]
  );

  const crosshair = followsCursor ? snapshot : undefined;

  const pointFor = useCallback(
    (entry: TvlLegendEntry): TvlSeriesPointData | undefined => {
      // Only fall back to the latest point when no crosshair is active. Under
      // one, a series missing from the slice has no value at that time, and
      // showing its latest point would put a value from another (possibly
      // later) time under the crosshair's timestamp.
      const item =
        crosshair != null
          ? source.getSeriesPointAt(entry.id, crosshair.time)
          : source.getLastSeriesPoint(entry.id);
      return extractSeriesPoint(item)?.data;
    },
    [crosshair, source]
  );

  const toggle = useCallback(
    (entry: TvlLegendEntry) => {
      const next = !entry.visible;
      source.setSeriesVisible(entry.id, next);
      onToggle?.(entry.id, next);
      setEntryTick(t => t + 1);
    },
    [source, onToggle]
  );

  if (entries.length === 0) return null;

  const focusedId = crosshair?.focusedId;
  const shown = selectVisibleEntries(entries, maxRows, focusedId, expanded);
  const hiddenCount = Math.max(0, entries.length - maxRows);

  // The detailed variant reads out one series: the focused one, else the first.
  const detailEntry =
    focusedId != null
      ? entries.find(e => e.id === focusedId) ?? entries[0]
      : entries[0];
  // Every row whose value is on screen; the time line describes exactly these.
  const displayed = variant === 'detailed' ? [detailEntry] : shown;

  let timeText = '';
  if (showTime) {
    const time =
      crosshair?.time ??
      latestTime(
        displayed.map(
          e => extractSeriesPoint(source.getLastSeriesPoint(e.id))?.time
        )
      );
    timeText = time != null ? source.formatTime(time) : '';
  }

  const className = [
    'tvl-legend',
    variant === 'detailed' ? 'tvl-legend-detailed' : 'tvl-legend-rows',
    horizontal ? 'tvl-legend-horizontal' : '',
    interactive ? 'tvl-legend-interactive' : '',
    expanded ? 'tvl-legend-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Test seam: publish the rendered text so Playwright can assert legend
  // content without screenshotting the canvas (matches data-tvl-tooltip).
  const seamParts: string[] = [];
  if (variant === 'detailed') {
    seamParts.push(
      `${detailEntry.title} ${formatPoint(
        detailEntry,
        pointFor(detailEntry),
        showOhlc
      )}`.trim()
    );
  } else {
    shown.forEach(entry => {
      const text = formatPoint(entry, pointFor(entry), showOhlc);
      seamParts.push(
        `${entry.title} ${text}${entry.visible ? '' : ' (hidden)'}`.trim()
      );
    });
    if (hiddenCount > 0) {
      seamParts.push(expanded ? 'Show less' : `+${hiddenCount} more`);
    }
  }
  if (timeText !== '') seamParts.push(timeText);

  if (variant === 'detailed') {
    return (
      <div className={className} data-tvl-legend={seamParts.join(' | ')}>
        <div className="tvl-legend-body">
          <div
            className="tvl-legend-detail-title"
            style={{ color: detailEntry.color }}
          >
            {detailEntry.title}
          </div>
          <div className="tvl-legend-detail-value">
            {formatPoint(detailEntry, pointFor(detailEntry), showOhlc)}
          </div>
        </div>
        {showTime && <div className="tvl-legend-time">{timeText}</div>}
      </div>
    );
  }

  return (
    <div className={className} data-tvl-legend={seamParts.join(' | ')}>
      <div className="tvl-legend-body">
        {shown.map(entry => {
          const rowClass = [
            'tvl-legend-row',
            entry.visible ? '' : 'tvl-legend-row-hidden',
            OHLC_KINDS.has(entry.kind) && showOhlc ? 'tvl-legend-row-ohlc' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const content = (
            <>
              <span
                className="tvl-legend-swatch"
                style={{ background: entry.color ?? 'currentColor' }}
              />
              <span className="tvl-legend-title">{entry.title}</span>
              <span className="tvl-legend-value">
                {formatPoint(entry, pointFor(entry), showOhlc)}
              </span>
            </>
          );
          return interactive ? (
            <button
              key={entry.id}
              type="button"
              className={rowClass}
              aria-pressed={entry.visible}
              onClick={() => toggle(entry)}
            >
              {content}
            </button>
          ) : (
            <div key={entry.id} className={rowClass}>
              {content}
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          className="tvl-legend-overflow"
          aria-expanded={expanded}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
      {showTime && <div className="tvl-legend-time">{timeText}</div>}
    </div>
  );
}

export default TradingViewLegend;
