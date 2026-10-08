import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
  ISeriesApi,
  MouseEventParams,
  SeriesType,
} from 'lightweight-charts';
import type { TvlTooltipOptions } from './TradingViewTypes';
import { formatSeriesValue } from './TradingViewOverlayTypes';
import { resolveFocusedSeriesPoint } from './TradingViewSeriesFocus';

/** Gap in pixels between the cursor and the tooltip box (from the LWC tutorial). */
const TOOLTIP_MARGIN = 15;

/** Renderer surface the tooltip needs. Data only — no DOM. */
export interface TvlTooltipSource {
  getSeriesIdForApi: (series: ISeriesApi<SeriesType>) => string | undefined;
  getSeriesColor: (id: string) => string | undefined;
  formatTime: (time: unknown) => string;
  subscribeCrosshairMove: (
    handler: (params: MouseEventParams) => void
  ) => () => void;
}

export interface TradingViewTooltipProps {
  source: TvlTooltipSource;
  options: TvlTooltipOptions;
  /** The chart host, used to bound the tooltip's position. */
  hostRef: React.RefObject<HTMLDivElement>;
}

interface TooltipState {
  title: string;
  color: string | undefined;
  value: string;
  date: string;
  x: number;
  y: number;
}

/**
 * Tracking tooltip: a cursor-following overlay that displays a single focused
 * series. In a multi-series chart the focused series is whichever line's value
 * is vertically nearest the cursor within the hovered time slice, so moving
 * the cursor up and down switches between overlaid series.
 *
 * Rendered as a React sibling of the chart host, like the downsample scrim,
 * rather than as DOM built by the renderer. Colors come from the active
 * Deephaven theme (via CSS), with the title tinted by the series color.
 */
export function TradingViewTooltip({
  source,
  options,
  hostRef,
}: TradingViewTooltipProps): JSX.Element | null {
  const [state, setState] = useState<TooltipState | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      source.subscribeCrosshairMove((params: MouseEventParams) => {
        const host = hostRef.current;
        const { point } = params;
        if (
          host == null ||
          point == null ||
          params.time == null ||
          point.x < 0 ||
          point.x > host.clientWidth ||
          point.y < 0 ||
          point.y > host.clientHeight
        ) {
          setState(null);
          return;
        }
        const focused = resolveFocusedSeriesPoint(params);
        if (focused == null) {
          setState(null);
          return;
        }
        const id = source.getSeriesIdForApi(focused.series);
        // ISeriesApi.options().title is set from the Python `title=`; fall back
        // to the series id when untitled so the line is never empty.
        const opts = focused.series.options() as { title?: string };
        const title =
          opts?.title != null && opts.title !== '' ? opts.title : id ?? '';
        setState({
          title,
          color: id != null ? source.getSeriesColor(id) : undefined,
          value: formatSeriesValue(focused.series, focused.price),
          date: source.formatTime(params.time),
          x: point.x,
          y: point.y,
        });
      }),
    [source, hostRef]
  );

  // Position after layout so the box's measured size is used for clamping,
  // flipping to the other side of the cursor when it would overflow.
  useLayoutEffect(() => {
    const el = elRef.current;
    const host = hostRef.current;
    if (el == null || host == null || state == null) return;
    const width = el.offsetWidth;
    const height = el.offsetHeight;

    let left = state.x + TOOLTIP_MARGIN;
    if (left > host.clientWidth - width) {
      left = state.x - TOOLTIP_MARGIN - width;
    }
    if (left < 0) left = 0;

    let top = state.y + TOOLTIP_MARGIN;
    if (top > host.clientHeight - height) {
      top = state.y - height - TOOLTIP_MARGIN;
    }
    if (top < 0) top = 0;

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [state, hostRef]);

  const showTitle = options.showTitle !== false;
  const showValue = options.showValue !== false;
  const showDate = options.showDate !== false;

  // Test seam: the rendered text, so Playwright can assert content without
  // screenshotting the canvas.
  const seam =
    state == null
      ? ''
      : [
          showTitle ? state.title : '',
          showValue ? state.value : '',
          showDate ? state.date : '',
        ]
          .filter(t => t !== '')
          .join(' | ');

  // The box stays mounted and toggles `display` rather than unmounting, so
  // "off the data" is observable as a hidden element instead of a missing one
  // — the contract the e2e specs read.
  return (
    <div
      ref={elRef}
      className="tvl-tooltip"
      style={{ display: state == null ? 'none' : 'block' }}
      data-tvl-tooltip={seam}
    >
      {state != null && showTitle && (
        <div className="tvl-tooltip-title" style={{ color: state.color }}>
          {state.title}
        </div>
      )}
      {state != null && showValue && (
        <div className="tvl-tooltip-value">{state.value}</div>
      )}
      {state != null && showDate && (
        <div className="tvl-tooltip-date">{state.date}</div>
      )}
    </div>
  );
}

export default TradingViewTooltip;
