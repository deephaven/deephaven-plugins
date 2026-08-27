import type {
  ISeriesApi,
  MouseEventParams,
  SeriesType,
  Time,
} from 'lightweight-charts';
import type { TvlTooltipOptions } from './TradingViewTypes';
import {
  resolveFocusedSeriesPoint,
  type FocusedSeriesPoint,
} from './TradingViewSeriesFocus';

/** Gap in pixels between the cursor and the tooltip box (from the LWC tutorial). */
const TOOLTIP_MARGIN = 15;

/**
 * Dependencies injected into the tooltip so the module stays pure and
 * testable — it never reaches into the renderer's internals directly.
 */
export interface TradingViewTooltipDeps {
  /** Chart container the tooltip is positioned within and appended to. */
  container: HTMLElement;
  /** Reverse lookup from an ISeriesApi to our stable series id. */
  getSeriesId: (series: ISeriesApi<SeriesType>) => string | undefined;
  /** Resolved primary color for a series id (used to tint the title line). */
  getSeriesColor: (id: string) => string | undefined;
  /** Format a crosshair time the same way the chart's time axis does. */
  formatTime: (time: Time) => string;
  /** Tooltip options as emitted by the Python API. */
  options: TvlTooltipOptions;
}

/**
 * Tracking tooltip: a cursor-following overlay that displays a single focused
 * series. In a multi-series chart the focused series is whichever line's value
 * is vertically nearest the cursor within the hovered time slice, so moving the
 * cursor up and down switches between overlaid series. Colors come from the
 * active Deephaven theme (via CSS), with the title tinted by the series color.
 */
export class TradingViewTooltip {
  private deps: TradingViewTooltipDeps;

  private el: HTMLDivElement;

  private titleEl: HTMLDivElement;

  private valueEl: HTMLDivElement;

  private dateEl: HTMLDivElement;

  constructor(deps: TradingViewTooltipDeps) {
    this.deps = deps;

    const doc = deps.container.ownerDocument;
    this.el = doc.createElement('div');
    this.el.className = 'tvl-tooltip';
    this.el.style.display = 'none';

    this.titleEl = doc.createElement('div');
    this.titleEl.className = 'tvl-tooltip-title';
    this.valueEl = doc.createElement('div');
    this.valueEl.className = 'tvl-tooltip-value';
    this.dateEl = doc.createElement('div');
    this.dateEl.className = 'tvl-tooltip-date';

    // Default-on: a line is shown unless the option explicitly disables it.
    const { showTitle, showValue, showDate } = deps.options;
    if (showTitle === false) this.titleEl.style.display = 'none';
    if (showValue === false) this.valueEl.style.display = 'none';
    if (showDate === false) this.dateEl.style.display = 'none';

    this.el.appendChild(this.titleEl);
    this.el.appendChild(this.valueEl);
    this.el.appendChild(this.dateEl);
    deps.container.appendChild(this.el);
  }

  /**
   * Crosshair-move handler. Hides the tooltip when the cursor leaves the
   * chart or there is nothing to show; otherwise renders the focused series
   * and positions the box near the cursor, clamped to the container.
   */
  handleCrosshairMove(params: MouseEventParams): void {
    const { container } = this.deps;
    const { point } = params;
    if (
      point == null ||
      params.time == null ||
      point.x < 0 ||
      point.x > container.clientWidth ||
      point.y < 0 ||
      point.y > container.clientHeight
    ) {
      this.hide();
      return;
    }

    const focused = resolveFocusedSeriesPoint(params);
    if (focused == null) {
      this.hide();
      return;
    }

    this.render(focused, params.time);
    this.position(point.x, point.y);
  }

  /** Remove the tooltip element from the DOM. */
  destroy(): void {
    this.el.remove();
  }

  private hide(): void {
    this.el.style.display = 'none';
  }

  private render(focused: FocusedSeriesPoint, time: Time): void {
    const { getSeriesId, getSeriesColor, formatTime, options } = this.deps;
    const { series, price } = focused;
    const id = getSeriesId(series);

    if (options.showTitle !== false) {
      // ISeriesApi.options().title is set from the Python `title=`; fall back
      // to the series id when untitled so the line is never empty.
      const opts = series.options() as { title?: string };
      const seriesTitle = opts?.title;
      let title = '';
      if (seriesTitle != null && seriesTitle !== '') {
        title = seriesTitle;
      } else if (id != null) {
        title = id;
      }
      this.titleEl.textContent = title;
      const color = id != null ? getSeriesColor(id) : undefined;
      // Empty string clears any prior inline color → falls back to CSS theme.
      this.titleEl.style.color = color ?? '';
    }

    if (options.showValue !== false) {
      this.valueEl.textContent = this.formatValue(series, price);
    }

    if (options.showDate !== false) {
      this.dateEl.textContent = formatTime(time);
    }

    this.el.style.display = 'block';
    // Test seam: expose the rendered text so Playwright can assert content
    // without screenshotting the canvas (matches data-tvl-last-event).
    this.el.setAttribute(
      'data-tvl-tooltip',
      [
        this.titleEl.textContent,
        this.valueEl.textContent,
        this.dateEl.textContent,
      ]
        .filter(t => t != null && t !== '')
        .join(' | ')
    );
  }

  /**
   * Format the value line: an explicit ``valuePrecision`` wins; otherwise use
   * the series' own price formatter so the tooltip matches the price axis.
   */
  private formatValue(series: ISeriesApi<SeriesType>, value: number): string {
    const { valuePrecision } = this.deps.options;
    if (valuePrecision != null) {
      return value.toFixed(valuePrecision);
    }
    try {
      return series.priceFormatter().format(value);
    } catch {
      return String(value);
    }
  }

  /**
   * Place the box near the cursor with a margin, flipping to the other side
   * of the cursor when it would overflow the container (LWC tutorial logic).
   */
  private position(x: number, y: number): void {
    const { container } = this.deps;
    const width = this.el.offsetWidth;
    const height = this.el.offsetHeight;

    let left = x + TOOLTIP_MARGIN;
    if (left > container.clientWidth - width) {
      left = x - TOOLTIP_MARGIN - width;
    }
    if (left < 0) left = 0;

    let top = y + TOOLTIP_MARGIN;
    if (top > container.clientHeight - height) {
      top = y - height - TOOLTIP_MARGIN;
    }
    if (top < 0) top = 0;

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }
}

export default TradingViewTooltip;
