import {
  createChartEx,
  createYieldCurveChart,
  createOptionsChart,
  createSeriesMarkers,
  createTextWatermark,
  ColorType,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries,
  TickMarkType,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  IPriceLine,
  SeriesType,
  DeepPartial,
  ChartOptions,
  AutoscaleInfo,
  LogicalRange,
  YieldCurveChartOptions,
  PriceChartOptions,
  SeriesMarker,
  Time,
  SeriesPartialOptionsMap,
  ISeriesMarkersPluginApi,
  ITextWatermarkPluginApi,
  TextWatermarkOptions,
  MouseEventParams,
} from 'lightweight-charts';
import Log from '@deephaven/log';
import type {
  TvlChartType,
  TvlSeriesConfig,
  TvlMarkerData,
  TvlTooltipOptions,
} from './TradingViewTypes';
import { resolveColor, resolveColorsDeep } from './TradingViewColors';
import createTimeZoneHorzScaleBehavior, {
  type ZonedHorzScaleBehavior,
} from './TimeZoneHorzScaleBehavior';
import { getTimezoneOffsetSeconds } from './TradingViewUtils';
import { TradingViewTooltip } from './TradingViewTooltip';
import ContinuousBarsSeries, {
  isContinuousBarType,
  stampContinuousBarTimes,
} from './ContinuousBarsSeries';

const log = Log.module('TradingViewChartRenderer');

/**
 * Registry of predefined price formatters. These are referenced by name
 * from the Python API via `localization.priceFormatterName`.
 */
const PRICE_FORMATTERS: Record<string, (price: number) => string> = {
  currency_usd: (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price),
  currency_eur: (price: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price),
  currency_gbp: (price: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price),
  currency_jpy: (price: number) =>
    new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price),
  percent: (price: number) => `${price.toFixed(2)}%`,
  compact: (price: number) => {
    if (Math.abs(price) >= 1e9) return `${(price / 1e9).toFixed(1)}B`;
    if (Math.abs(price) >= 1e6) return `${(price / 1e6).toFixed(1)}M`;
    if (Math.abs(price) >= 1e3) return `${(price / 1e3).toFixed(1)}K`;
    return price.toFixed(2);
  },
  scientific: (price: number) => price.toExponential(2),
};

/**
 * Resolve `localization.priceFormatterName` (a string) into a real
 * `localization.priceFormatter` function, returning the remaining
 * chart options with the substitution applied.
 */
function resolveLocalization(
  opts: Record<string, unknown>
): Record<string, unknown> {
  const { localization: locRaw, ...rest } = opts;
  if (locRaw == null) return opts;

  const loc = locRaw as Record<string, unknown>;
  const { priceFormatterName, ...locRest } = loc;
  if (
    typeof priceFormatterName === 'string' &&
    PRICE_FORMATTERS[priceFormatterName] != null
  ) {
    return {
      ...rest,
      localization: {
        ...locRest,
        priceFormatter: PRICE_FORMATTERS[priceFormatterName],
      },
    };
  }
  return opts;
}

/** Default watermark font size when the user only provides text. */
const DEFAULT_WATERMARK_FONT_SIZE = 66;

/** Default watermark alpha applied to the chart's textColor. */
const DEFAULT_WATERMARK_ALPHA = 0.2;

/**
 * Shape of watermark options as serialized by the Python API.
 * The Python side sends a flat object; we convert it to the v5
 * `createTextWatermark` plugin format (which uses a `lines` array).
 */
interface WatermarkLineOptions {
  text: string;
  color?: string;
  fontSize?: number;
  fontStyle?: string;
  lineHeight?: number;
}

interface LegacyWatermarkOptions {
  text?: string;
  color?: string;
  visible?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  lineHeight?: number;
  horzAlign?: string;
  vertAlign?: string;
  lines?: WatermarkLineOptions[];
}

/**
 * Derive a semi-transparent watermark color from the chart's text color.
 * Handles hex (#RGB, #RRGGBB), rgb(), and rgba() formats.
 */
function deriveWatermarkColor(textColor: string): string {
  if (textColor.startsWith('#')) {
    let hex = textColor;
    // Expand shorthand #RGB to #RRGGBB
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return hexToRgba(hex, DEFAULT_WATERMARK_ALPHA);
  }

  // rgb(r, g, b) or rgba(r, g, b, a) — replace/add alpha
  const match = textColor.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
  );
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${DEFAULT_WATERMARK_ALPHA})`;
  }

  // Fallback: white at low opacity (works on dark and light backgrounds)
  return `rgba(255, 255, 255, ${DEFAULT_WATERMARK_ALPHA})`;
}

/**
 * Format a UTC-seconds timestamp as a date/time string.
 * @param utcSeconds UTC timestamp in seconds (as used by lightweight-charts Time)
 * @param includeMs If true, append .SSS milliseconds
 */
function formatDateTime(utcSeconds: number, includeMs: boolean): string {
  const d = new Date(utcSeconds * 1000);
  const YYYY = d.getUTCFullYear();
  const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  const ms = String(d.getUTCMilliseconds()).padStart(3, '0');

  const hasTime = hh !== '00' || mm !== '00' || ss !== '00' || ms !== '000';

  if (!hasTime) {
    return `${YYYY}-${MM}-${DD}`;
  }
  const base = `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
  return includeMs ? `${base}.${ms}` : base;
}

/**
 * Custom tick mark formatter that uses uniform precision per level.
 * Year/Month ticks show date only; DayOfMonth shows date; Time ticks
 * show HH:MM:SS consistently (no mixing HH:MM and HH:MM:SS).
 */
function defaultTickMarkFormatter(
  time: unknown,
  tickMarkType: TickMarkType
): string | null {
  const t = time as number;
  const d = new Date(t * 1000);

  switch (tickMarkType) {
    case TickMarkType.Year:
      return String(d.getUTCFullYear());
    case TickMarkType.Month:
      return d.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    case TickMarkType.DayOfMonth: {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }
    case TickMarkType.Time:
    case TickMarkType.TimeWithSeconds:
    default: {
      // Always show HH:MM:SS for uniform precision
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
  }
}

/**
 * Tick mark formatter for the yield-curve chart. LWC's createYieldCurveChart
 * treats horizontal-axis values as months and internally maps them to seconds
 * from the unix epoch, so the default time-axis formatter would render
 * Tenor=240 as "1990-01-01" (i.e. 240 months after 1970). We override the
 * formatter so the axis reads as "Xm" / "Xy" instead.
 */
function yieldCurveTickMarkFormatter(time: unknown): string {
  const months = Number(time) || 0;
  if (months >= 12 && months % 12 === 0) return `${months / 12}y`;
  if (months >= 12) return `${(months / 12).toFixed(1)}y`;
  return `${months}m`;
}

/**
 * Crosshair time formatter for yield-curve charts: format the maturity
 * value (months) as a duration instead of a date.
 */
function yieldCurveCrosshairFormatter(time: unknown): string {
  return yieldCurveTickMarkFormatter(time);
}

/**
 * Tick mark formatter for the options / custom-numeric chart. LWC's
 * createOptionsChart maps each x-value to seconds-from-epoch, so the
 * default time-axis formatter renders X=5 as "1970-01-01 00:00:05". We
 * override it so the axis reads back the raw numeric value (with light
 * formatting so 100000 renders as "100,000").
 */
function optionsTickMarkFormatter(time: unknown): string {
  const n = Number(time);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function optionsCrosshairFormatter(time: unknown): string {
  return optionsTickMarkFormatter(time);
}

/**
 * Crosshair / tooltip time formatter — always shows full precision
 * including milliseconds: "YYYY-MM-DD HH:MM:SS.mmm"
 */
function crosshairTimeFormatter(time: unknown): string {
  return formatDateTime(time as number, true);
}

// Map series type string to series definition constant
const SERIES_DEFINITIONS: Record<string, unknown> = {
  Candlestick: CandlestickSeries,
  Bar: BarSeries,
  Line: LineSeries,
  Area: AreaSeries,
  Baseline: BaselineSeries,
  Histogram: HistogramSeries,
};

/**
 * Series types whose color comes from OHLC up/down theme colors
 * rather than the colorway palette.
 */
const OHLC_TYPES = new Set<string>(['Candlestick', 'Bar']);

/**
 * Map of non-OHLC series type to the option key for its primary color.
 */
const PRIMARY_COLOR_KEY: Partial<Record<TvlSeriesConfig['type'], string>> = {
  Line: 'color',
  Area: 'lineColor',
  Histogram: 'color',
  Baseline: 'topLineColor',
};

/**
 * Convert a hex color (#RRGGBB) to an rgba string with the given alpha.
 */
function hexToRgba(color: string, alpha: number): string {
  // Handle #RGB shorthand
  let hex = color;
  if (hex.startsWith('#') && hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (hex.startsWith('#') && hex.length >= 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Handle rgb(r, g, b) / rgba(r, g, b, a) — replace alpha
  const match = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
  );
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  }
  // Unrecognized format — return as-is rather than producing NaN
  return color;
}

/**
 * Imperative wrapper around TradingView Lightweight Charts.
 * Manages chart and series lifecycle, data updates, and theming.
 */
class TradingViewChartRenderer {
  private chart: IChartApi;

  private chartType: TvlChartType;

  /** Display zone for axis ticks/labels; the data coordinate stays UTC. */
  private timeZone: string | undefined;

  private horzScaleBehavior: ZonedHorzScaleBehavior | null = null;

  private seriesMap: Map<string, ISeriesApi<SeriesType>> = new Map();

  /** Resolved primary color per series id, used to tint the tracking tooltip. */
  private seriesColors: Map<string, string> = new Map();

  /**
   * Up/down colors per continuous Candlestick/Bar series id. LWC colors a
   * custom series' last-value line from each item's `color` field, so
   * direction colors are injected per data item (see injectOhlcItemColors).
   */
  private continuousOhlcColors: Map<string, { up: string; down: string }> =
    new Map();

  /** Ids of series rendered by ContinuousBarsSeries (need `ts` stamping). */
  private continuousSeriesIds: Set<string> = new Set();

  /**
   * Ascending data items per series, captured as we set the data.
   *
   * Markers are anchored against these (see setSeriesMarkers). LWC derives a
   * marker's vertical position from the series row at its index, and returns
   * without setting `y` when the row shape isn't recognized — which parks
   * markers at the top of the pane on custom (continuous) series. Supplying
   * an explicit `price` short-circuits that lookup entirely.
   */
  private seriesDataItems: Map<string, Array<Record<string, unknown>>> =
    new Map();

  /** Active tracking tooltip, when enabled via chartOptions.tooltip.visible. */
  private tooltip: TradingViewTooltip | null = null;

  private markersMap: Map<string, ISeriesMarkersPluginApi<Time>> = new Map();

  /** Last markers applied per series, so new data can re-anchor them. */
  private lastMarkers: Map<string, TvlMarkerData[]> = new Map();

  /** Dynamic price lines that track a column's last-row value. */
  private dynamicPriceLines: Map<
    string,
    Array<{ priceLine: IPriceLine; column: string }>
  > = new Map();

  private watermarkPlugin: ITextWatermarkPluginApi<Time> | null = null;

  private textColor: string;

  private colorway: string[] = [];

  private ohlcColors: { upColor: string; downColor: string } | undefined;

  private gridColor = '';

  private container: HTMLElement;

  /** Hidden whitespace series for proportional time spacing when downsampled. */
  private scaffoldSeries: ISeriesApi<SeriesType> | null = null;

  /** Whether scaffold is currently enabled. */
  private scaffoldEnabled = false;

  /** Built-in scale ids frozen at chart level via autoScale:false. */
  private frozenScaleIds: Set<string> = new Set();

  /**
   * Captured autoscale ranges for frozen scales, keyed by series id.
   * Kept across configureSeries rebuilds so a frozen axis survives figure
   * updates; cleared by resetPriceScales (double-click) to re-fit + re-freeze.
   */
  private frozenRanges: Map<string, { info: AutoscaleInfo | null }> = new Map();

  /**
   * Watermark options captured at construction (or via the most recent
   * setChartType call). Used to re-apply the watermark after the chart is
   * rebuilt for a different chartType.
   */
  private constructorWatermark: LegacyWatermarkOptions | null = null;

  /**
   * Resolved chart options at construction time, kept so setChartType can
   * rebuild the underlying chart with the new chartType while preserving
   * theme/layout config.
   */
  private resolvedChartOpts: Record<string, unknown>;

  constructor(
    container: HTMLElement,
    options: DeepPartial<ChartOptions> = {},
    chartType: TvlChartType = 'standard',
    timeZone?: string
  ) {
    this.container = container;
    this.chartType = chartType;
    this.timeZone = timeZone;

    // Extract watermark and resolve localization before passing to createChart.
    // Resolve DH theme color names (e.g. "accent-300") to canvas-paintable
    // values; lightweight-charts paints to canvas and can't resolve
    // var(--dh-color-*) / theme tokens itself.
    const { watermark: wmRaw, ...rawOpts } = resolveColorsDeep(
      options as Record<string, unknown>
    );
    const chartOpts = resolveLocalization(rawOpts);

    const resolvedTextColor =
      ((chartOpts.layout as Record<string, unknown>)?.textColor as string) ??
      '#D1D4DC';
    this.textColor = resolvedTextColor;

    this.gridColor =
      ((
        (chartOpts.grid as Record<string, unknown>)?.vertLines as Record<
          string,
          unknown
        >
      )?.color as string) ?? '';

    this.resolvedChartOpts = chartOpts;
    this.constructorWatermark = (wmRaw as LegacyWatermarkOptions) ?? null;
    this.chart = this.buildChart(chartType);

    if (wmRaw != null) {
      this.applyWatermark(wmRaw as LegacyWatermarkOptions);
    }
  }

  /**
   * Build the underlying lightweight-charts instance for ``chartType`` using
   * the already-resolved chart options. Called from the constructor and from
   * :meth:`setChartType` when the chart needs to be torn down and rebuilt.
   */
  private buildChart(chartType: TvlChartType): IChartApi {
    const chartOpts = this.resolvedChartOpts;
    const resolvedTextColor = this.textColor;
    let tickMarkFormatter = defaultTickMarkFormatter;
    // localization.timeFormatter is called by the library with the raw chart
    // time, outside the horizontal scale behavior, so it has to apply the zone
    // shift itself. Read this.timeZone at call time so a zone change takes
    // effect without rebuilding the chart.
    let timeFormatter = (time: unknown): string =>
      crosshairTimeFormatter(
        (time as number) +
          getTimezoneOffsetSeconds((time as number) * 1000, this.timeZone)
      );
    if (chartType === 'yieldCurve') {
      tickMarkFormatter = yieldCurveTickMarkFormatter;
      timeFormatter = yieldCurveCrosshairFormatter;
    } else if (chartType === 'options') {
      tickMarkFormatter = optionsTickMarkFormatter;
      timeFormatter = optionsCrosshairFormatter;
    }
    const commonOpts = {
      ...chartOpts,
      layout: {
        ...(chartOpts.layout as Record<string, unknown>),
        background: (chartOpts.layout as Record<string, unknown>)
          ?.background ?? {
          type: ColorType.Solid,
          color: '#1E222D',
        },
        textColor: resolvedTextColor,
        attributionLogo: false,
      },
      timeScale: {
        timeVisible: true,
        // Allow extreme compression so fitContent can show all data points.
        // The default minBarSpacing (0.5px) limits the chart to ~width*2 bars,
        // which is too few for downsampled tables (runChartDownsample output
        // can be much larger than the requested pixel count).
        minBarSpacing: 0.01,
        // The continuous (time-proportional) axis fills the chart with
        // whitespace scaffold slots. Without this, the crosshair / magnet /
        // press hit-testing snaps to the nearest *index* — almost always an
        // empty scaffold slot with no seriesData — and grid lines / tick
        // marks land on whitespace too. No-op on charts with no whitespace.
        ignoreWhitespaceIndices: true,
        // Render every time-axis label at the same (regular) weight. By default
        // lightweight-charts draws the highest-weight tick (e.g. the year) in
        // bold, which requests Fira Sans 700 — a weight the app's FontBootstrap
        // does not preload. Canvas text does not trigger a font load, so that
        // one bold label races the font and renders in a fallback face,
        // producing nondeterministic axis-label screenshots.
        allowBoldLabels: false,
        tickMarkFormatter,
        ...(chartOpts.timeScale as Record<string, unknown>),
      },
      localization: {
        timeFormatter,
        ...(chartOpts.localization as Record<string, unknown>),
      },
      autoSize: true,
    };

    switch (chartType) {
      case 'yieldCurve': {
        // LWC's createYieldCurveChart uses its own horzScaleBehavior that
        // ignores timeScale.tickMarkFormatter and localization.timeFormatter.
        // The maturity-axis formatter lives on yieldCurve.formatTime.
        const yieldOpts: Record<string, unknown> = {
          ...commonOpts,
          yieldCurve: {
            ...((commonOpts as Record<string, unknown>).yieldCurve as
              | Record<string, unknown>
              | undefined),
            formatTime: yieldCurveTickMarkFormatter,
          },
        };
        return createYieldCurveChart(
          this.container,
          yieldOpts as DeepPartial<YieldCurveChartOptions>
        ) as unknown as IChartApi;
      }
      case 'options':
        return createOptionsChart(
          this.container,
          commonOpts as DeepPartial<PriceChartOptions>
        ) as unknown as IChartApi;
      default:
        // Zone-aware behavior keeps the data coordinate in true UTC while day
        // ticks still land on local midnight. Shifting the data instead makes
        // the coordinate local wall-clock time, which is ambiguous across a
        // DST fall back and silently drops a row.
        this.horzScaleBehavior = createTimeZoneHorzScaleBehavior(this.timeZone);
        return createChartEx(
          this.container,
          this.horzScaleBehavior,
          commonOpts as DeepPartial<ChartOptions>
        );
    }
  }

  /** Re-label and re-tick for a new zone without rebuilding the chart. */
  setTimeZone(timeZone: string | undefined): void {
    this.timeZone = timeZone;
    this.horzScaleBehavior?.setTimeZone(timeZone);
    // Formatted tick labels are cached per weight. Only the time scale's own
    // applyOptions clears that cache, and the chart only forwards to it when
    // a timeScale key is actually present — an empty object is enough.
    this.chart.applyOptions({ timeScale: {} });
  }

  /**
   * Switch the chart's horzScaleBehavior at runtime. Tears down the existing
   * chart and rebuilds it. Intended to be called once during initial connect,
   * before any series are added (the chartType arrives in the figure message,
   * which is parsed *after* the renderer is constructed). No-op when ``ct``
   * matches the current chart type.
   */
  setChartType(ct: TvlChartType): void {
    if (ct === this.chartType) return;
    if (this.seriesMap.size > 0) {
      log.warn(
        'setChartType called after series were added; ignoring change from',
        this.chartType,
        'to',
        ct
      );
      return;
    }
    if (this.watermarkPlugin) {
      this.watermarkPlugin.detach();
      this.watermarkPlugin = null;
    }
    this.chart.remove();
    this.chartType = ct;
    this.chart = this.buildChart(ct);
    if (this.constructorWatermark != null) {
      this.applyWatermark(this.constructorWatermark);
    }
  }

  /**
   * Create or update the text watermark plugin from legacy flat options.
   * Fills in sensible defaults so that `watermark_text="AAPL"` alone
   * produces a large, centered, theme-aware watermark.
   */
  private applyWatermark(wm: LegacyWatermarkOptions): void {
    const hasText =
      (wm.text != null && wm.text !== '') ||
      (wm.lines != null && wm.lines.length > 0);
    if (wm.visible === false || !hasText) {
      if (this.watermarkPlugin) {
        this.watermarkPlugin.detach();
        this.watermarkPlugin = null;
      }
      return;
    }

    // Build lines array — either from explicit multi-line or legacy single-line
    const lines =
      wm.lines != null
        ? wm.lines.map(line => ({
            text: line.text,
            color: line.color ?? deriveWatermarkColor(this.textColor),
            fontSize: line.fontSize ?? DEFAULT_WATERMARK_FONT_SIZE,
            fontStyle: line.fontStyle,
            lineHeight: line.lineHeight,
          }))
        : [
            {
              text: wm.text ?? '',
              color: wm.color ?? deriveWatermarkColor(this.textColor),
              fontSize: wm.fontSize ?? DEFAULT_WATERMARK_FONT_SIZE,
              fontStyle: wm.fontStyle,
              lineHeight: wm.lineHeight,
            },
          ];

    const wmOptions: DeepPartial<TextWatermarkOptions> = {
      visible: wm.visible ?? true,
      horzAlign:
        (wm.horzAlign as TextWatermarkOptions['horzAlign']) ?? 'center',
      vertAlign:
        (wm.vertAlign as TextWatermarkOptions['vertAlign']) ?? 'center',
      lines,
    };

    if (this.watermarkPlugin) {
      this.watermarkPlugin.applyOptions(wmOptions);
    } else {
      this.watermarkPlugin = createTextWatermark(
        this.chart.panes()[0],
        wmOptions
      );
    }
  }

  /**
   * Configure series from figure data.
   * Removes old series and creates new ones.
   *
   * When a colorway is provided, series that have no user-specified primary
   * color will be assigned colors from the palette in order.  OHLC types
   * (Candlestick / Bar) use the separate ohlcColors instead.
   */
  configureSeries(
    seriesConfigs: TvlSeriesConfig[],
    colorwayInput: string[] = [],
    ohlcColorsInput?: { upColor: string; downColor: string },
    enableScaffold = false
  ): void {
    // Resolve any DH theme color names in user-supplied options up front so
    // canvas drawing calls receive concrete CSS color strings (hex/rgba).
    // Work on copies: these configs belong to the model and are re-used on a
    // theme change, so the original tokens have to survive to be re-resolved.
    const resolvedConfigs = seriesConfigs.map(cfg => ({
      ...cfg,
      options: resolveColorsDeep(cfg.options),
      priceLines: cfg.priceLines?.map(pl =>
        pl.color != null ? { ...pl, color: resolveColor(pl.color) } : pl
      ),
    }));
    const colorway = colorwayInput.map(c => resolveColor(c) ?? c);
    const ohlcColors =
      ohlcColorsInput != null
        ? {
            upColor:
              resolveColor(ohlcColorsInput.upColor) ?? ohlcColorsInput.upColor,
            downColor:
              resolveColor(ohlcColorsInput.downColor) ??
              ohlcColorsInput.downColor,
          }
        : undefined;

    // Store theme colors for marker resolution
    this.colorway = colorway;
    this.ohlcColors = ohlcColors;
    this.scaffoldEnabled = enableScaffold;

    // Remove existing series (including scaffold)
    // Detach marker plugins before removing series
    this.markersMap.forEach(plugin => {
      try {
        plugin.detach();
      } catch {
        // Plugin may already be detached if series was removed
      }
    });
    this.markersMap.clear();
    if (this.scaffoldSeries) {
      try {
        this.chart.removeSeries(this.scaffoldSeries);
      } catch {
        // ignore
      }
      this.scaffoldSeries = null;
    }
    this.seriesMap.forEach(series => {
      this.chart.removeSeries(series);
    });
    this.seriesMap.clear();
    this.seriesColors.clear();
    this.continuousOhlcColors.clear();
    this.continuousSeriesIds.clear();
    this.seriesDataItems.clear();
    this.dynamicPriceLines.clear();

    // Create scaffold FIRST so it occupies base time positions
    if (enableScaffold) {
      this.createScaffold();
    }

    // Create new series. Skip partition templates — those are NOT
    // rendered directly; the model's partition-watcher clones each
    // template into one runtime series per partition key (with a
    // synthesized id) and pushes those into figureData.series.
    let colorIndex = 0;
    resolvedConfigs.forEach(config => {
      if (config.partition != null) {
        return;
      }
      const options: Record<string, unknown> = { ...config.options };

      if (OHLC_TYPES.has(config.type)) {
        // Apply OHLC theme defaults when not user-specified
        if (ohlcColors) {
          if (options.upColor == null) options.upColor = ohlcColors.upColor;
          if (options.downColor == null) {
            options.downColor = ohlcColors.downColor;
          }
          // Derive border and wick colors from up/down so the library
          // defaults (blue-ish tint) don't bleed through.
          const up = (options.upColor as string) ?? ohlcColors.upColor;
          const down = (options.downColor as string) ?? ohlcColors.downColor;
          if (options.borderUpColor == null) options.borderUpColor = up;
          if (options.borderDownColor == null) options.borderDownColor = down;
          if (options.wickUpColor == null) options.wickUpColor = up;
          if (options.wickDownColor == null) options.wickDownColor = down;
        }
      } else if (colorway.length > 0) {
        const colorKey =
          PRIMARY_COLOR_KEY[config.type as keyof typeof PRIMARY_COLOR_KEY];
        if (colorKey != null && options[colorKey] == null) {
          const color = colorway[colorIndex % colorway.length];
          options[colorKey] = color;

          // Derive semi-transparent fill colors for area series
          if (config.type === 'Area') {
            if (options.topColor == null) {
              options.topColor = hexToRgba(color, 0.4);
            }
            if (options.bottomColor == null) {
              options.bottomColor = hexToRgba(color, 0);
            }
          }

          // Derive fill colors for baseline regions
          if (config.type === 'Baseline') {
            // Above baseline: from colorway
            if (options.topFillColor1 == null) {
              options.topFillColor1 = hexToRgba(color, 0.3);
            }
            if (options.topFillColor2 == null) {
              options.topFillColor2 = hexToRgba(color, 0);
            }
            // Below baseline: from OHLC decrease color
            if (ohlcColors) {
              if (options.bottomLineColor == null) {
                options.bottomLineColor = ohlcColors.downColor;
              }
              if (options.bottomFillColor1 == null) {
                options.bottomFillColor1 = hexToRgba(
                  ohlcColors.downColor,
                  0.05
                );
              }
              if (options.bottomFillColor2 == null) {
                options.bottomFillColor2 = hexToRgba(
                  ohlcColors.downColor,
                  0.28
                );
              }
            }
          }
        }
        colorIndex += 1;
      }

      // Theme the baseline reference line (percentage/indexed modes)
      if (options.baseLineColor == null && this.gridColor) {
        options.baseLineColor = this.gridColor;
      }

      const series = this.createSeries({
        ...config,
        options,
      });
      if (series) {
        this.seriesMap.set(config.id, series);

        // Record the resolved primary color for the tracking tooltip's title
        // tint. OHLC types have no single line color, so use the up color.
        const tooltipColorKey = OHLC_TYPES.has(config.type)
          ? 'upColor'
          : PRIMARY_COLOR_KEY[config.type as keyof typeof PRIMARY_COLOR_KEY];
        const seriesColor =
          tooltipColorKey != null
            ? (options[tooltipColorKey] as string | undefined)
            : undefined;
        if (seriesColor != null && seriesColor !== '') {
          this.seriesColors.set(config.id, seriesColor);
        }

        // Apply per-series price scale options (autoScale, scaleMargins).
        // autoScale:false means "fit once, then hold": the scale itself must
        // stay auto (freezing before data hides the series), so the hold is
        // implemented with an autoscaleInfoProvider (see freezeSeriesScale).
        const pso = config.priceScaleOptions as
          | Record<string, unknown>
          | undefined;
        if (pso != null) {
          if (pso.autoScale === false) {
            series.priceScale().applyOptions({ ...pso, autoScale: true });
            this.freezeSeriesScale(config.id, series);
          } else {
            series.priceScale().applyOptions(pso);
          }
        }
        // Chart-level autoScale:false on a built-in scale freezes every
        // series attached to it.
        if (pso?.autoScale !== false) {
          const scaleId = (options.priceScaleId as string) ?? 'right';
          if (this.frozenScaleIds.has(scaleId)) {
            this.freezeSeriesScale(config.id, series);
          }
        }

        // Apply price lines (static and dynamic)
        if (config.priceLines) {
          const dynamicEntries: Array<{
            priceLine: IPriceLine;
            column: string;
          }> = [];

          config.priceLines.forEach(pl => {
            const priceLine = series.createPriceLine({
              price: pl.price ?? 0,
              color: pl.color ?? this.textColor,
              lineWidth: pl.lineWidth as 1 | 2 | 3 | 4 | undefined,
              lineStyle: pl.lineStyle,
              axisLabelVisible: pl.axisLabelVisible,
              title: pl.title,
            });

            if (pl.column != null && pl.column !== '') {
              dynamicEntries.push({ priceLine, column: pl.column });
            }
          });

          if (dynamicEntries.length > 0) {
            this.dynamicPriceLines.set(config.id, dynamicEntries);
          }
        }
      }
    });
  }

  private createSeries(config: TvlSeriesConfig): ISeriesApi<SeriesType> | null {
    // Continuous (end-to-end) rendering is the default for the ordinal bar
    // types: bodies span their full time bin via a custom series instead of
    // the built-in fixed pixel width. Opt out with continuous=False.
    try {
      if (config.continuous !== false && isContinuousBarType(config.type)) {
        this.continuousSeriesIds.add(config.id);
        if (config.type !== 'Histogram') {
          const opts = config.options;
          this.continuousOhlcColors.set(config.id, {
            up: (opts.upColor as string) ?? '#26a69a',
            down: (opts.downColor as string) ?? '#ef5350',
          });
        }
        return this.chart.addCustomSeries(
          new ContinuousBarsSeries(config.type),
          config.options as never,
          config.paneIndex
        ) as unknown as ISeriesApi<SeriesType>;
      }

      const definition = SERIES_DEFINITIONS[config.type];
      if (definition == null) {
        log.warn('Unknown series type:', config.type);
        return null;
      }

      const options = config.options as SeriesPartialOptionsMap[SeriesType];
      return this.chart.addSeries(
        definition as Parameters<typeof this.chart.addSeries>[0],
        options,
        config.paneIndex
      );
    } catch (e) {
      log.error(
        'Failed to create series',
        JSON.stringify({
          id: config.id,
          type: config.type,
          pane: config.paneIndex,
          continuous: config.continuous,
        }),
        e
      );
      return null;
    }
  }

  /**
   * Stamp the direction color onto continuous OHLC items that don't carry a
   * per-row color already. Matches what the renderer paints, so bodies are
   * unchanged; it exists so LWC's last-value line/label picks the same color.
   */
  private injectOhlcItemColors(seriesId: string, point: unknown): void {
    const colors = this.continuousOhlcColors.get(seriesId);
    if (colors == null) return;
    const item = point as {
      open?: number;
      close?: number;
      color?: string;
    };
    if (item.color == null && item.open != null && item.close != null) {
      item.color = item.close >= item.open ? colors.up : colors.down;
    }
  }

  /**
   * All data series (never the hidden scaffold), for press-event snapping.
   */
  getDataSeriesList(): ISeriesApi<SeriesType>[] {
    return Array.from(this.seriesMap.values());
  }

  /**
   * Time of the last point currently rendered for a series, or undefined
   * when it has no data. Callers use this to decide whether an incoming
   * batch can go through the incremental `update()` path.
   */
  getLastSeriesTime(seriesId: string): number | undefined {
    const items = this.seriesDataItems.get(seriesId);
    if (items == null || items.length === 0) return undefined;
    const t = items[items.length - 1].time;
    return typeof t === 'number' ? t : undefined;
  }

  /**
   * Replace all data for a specific series. Use only for initial load
   * or full reconfiguration — NOT for ticking updates.
   */
  setSeriesData(seriesId: string, data: unknown[]): void {
    const series = this.seriesMap.get(seriesId);
    if (!series) {
      // Data can arrive before the figure is configured; the figure update
      // replays everything once the series exist.
      log.debug2('setSeriesData before series exists:', seriesId);
      return;
    }
    data.forEach(point => this.injectOhlcItemColors(seriesId, point));
    if (this.continuousSeriesIds.has(seriesId)) {
      stampContinuousBarTimes(data);
    }
    const sorted = TradingViewChartRenderer.sortByTime(data);
    this.seriesDataItems.set(
      seriesId,
      sorted.filter(
        (d): d is Record<string, unknown> =>
          typeof (d as { time?: unknown })?.time === 'number'
      )
    );
    series.setData(sorted as Parameters<typeof series.setData>[0]);

    // Markers anchor to a bar, so any applied while this series was empty (a
    // reset swaps data in table by table) are parked at the top of the pane.
    // Re-apply them now, in the same frame, so they never paint unanchored.
    const pending = this.lastMarkers.get(seriesId);
    if (pending != null) this.setSeriesMarkers(seriesId, pending);
  }

  /**
   * LWC binary-searches its plot rows by index, so unsorted input makes it
   * fail to find a row it just enumerated and throw 'Value is null' from the
   * bar colorer. Production builds drop the ascending-order assertion that
   * would otherwise report this, and Deephaven snapshots (notably downsample
   * swaps) are not guaranteed to arrive in time order.
   */
  private static sortByTime(data: unknown[]): unknown[] {
    const timeOf = (d: unknown): number => {
      const t = (d as { time?: unknown })?.time;
      return typeof t === 'number' ? t : Number.NEGATIVE_INFINITY;
    };
    let ascending = true;
    for (let i = 1; i < data.length; i += 1) {
      if (timeOf(data[i]) < timeOf(data[i - 1])) {
        ascending = false;
        break;
      }
    }
    return ascending ? data : [...data].sort((a, b) => timeOf(a) - timeOf(b));
  }

  /**
   * Update the last bar or append a new bar to a series.
   * This is the performant way to handle ticking/streaming data
   * per the TradingView docs — avoids replacing the entire dataset.
   */
  updateSeriesPoint(seriesId: string, point: unknown): void {
    const series = this.seriesMap.get(seriesId);
    if (!series) {
      log.debug2('updateSeriesPoint before series exists:', seriesId);
      return;
    }
    this.injectOhlcItemColors(seriesId, point);
    if (this.continuousSeriesIds.has(seriesId)) {
      stampContinuousBarTimes([point]);
    }
    const t = (point as { time?: unknown }).time;
    if (typeof t === 'number') {
      const items = this.seriesDataItems.get(seriesId);
      const item = point as Record<string, unknown>;
      if (items == null) {
        this.seriesDataItems.set(seriesId, [item]);
      } else {
        const last = items[items.length - 1];
        if (last != null && last.time === t) items[items.length - 1] = item;
        else items.push(item);
      }
    }
    series.update(point as Parameters<typeof series.update>[0]);
  }

  /**
   * Set markers on a specific series.
   */
  /**
   * Resolve a theme-aware default color for a marker.
   * - Up-arrow markers (belowBar + arrowUp) → OHLC increase color
   * - Down-arrow markers (aboveBar + arrowDown) → OHLC decrease color
   * - All others → first colorway color, then text color as final fallback
   */
  private resolveMarkerColor(m: TvlMarkerData): string {
    if (m.color != null && m.color !== '') return m.color;
    if (this.ohlcColors != null) {
      if (m.position === 'belowBar' && m.shape === 'arrowUp') {
        return this.ohlcColors.upColor;
      }
      if (m.position === 'aboveBar' && m.shape === 'arrowDown') {
        return this.ohlcColors.downColor;
      }
    }
    if (this.colorway.length > 0) return this.colorway[0];
    return this.textColor;
  }

  /**
   * Best-effort conversion of a marker time to epoch seconds. Markers accept
   * a number, a `YYYY-MM-DD` string, or a `{year, month, day}` business day;
   * series data times are always numbers.
   */
  private markerTimeToNumber(time: Time): number | null {
    if (typeof time === 'number') return time;
    // A calendar day means that day in the DISPLAY zone, so resolve it to the
    // instant of local midnight. Chart times are UTC; using UTC midnight here
    // would snap the marker to whichever bar is nearest that instant, which
    // for a zone behind UTC is the previous day's bar.
    const localMidnight = (utcMidnightSec: number): number =>
      utcMidnightSec -
      getTimezoneOffsetSeconds(utcMidnightSec * 1000, this.timeZone);

    if (typeof time === 'string') {
      const isDay = /^\d{4}-\d{2}-\d{2}$/.test(time);
      const ms = Date.parse(isDay ? `${time}T00:00:00Z` : time);
      if (Number.isNaN(ms)) return null;
      return isDay ? localMidnight(ms / 1000) : ms / 1000;
    }
    const bd = time as { year?: number; month?: number; day?: number };
    if (bd?.year != null && bd.month != null && bd.day != null) {
      return localMidnight(Date.UTC(bd.year, bd.month - 1, bd.day) / 1000);
    }
    return null;
  }

  /**
   * Snap a marker time to the nearest real data point on the series.
   *
   * On a continuous (scaffolded) chart most time-scale indices are
   * whitespace slots. LWC re-anchors markers through `dataByIndex`, which
   * returns null for whitespace, so a marker whose time lands on a
   * scaffold slot jumps to a neighboring bar and snaps back on the next
   * update — visible as markers hopping while data ticks in and the
   * scaffold is rebuilt. Anchoring to an actual data time keeps them put.
   * Date-string marker times need this too: midnight essentially never
   * coincides with the bar's real timestamp.
   */
  private snapMarkerTime(time: Time, dataTimes: readonly number[]): Time {
    if (dataTimes.length === 0) return time;
    const target = this.markerTimeToNumber(time);
    if (target == null) return time;
    // dataTimes is ascending (series data is time-ordered).
    let lo = 0;
    let hi = dataTimes.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (dataTimes[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const after = dataTimes[lo];
    const before = lo > 0 ? dataTimes[lo - 1] : after;

    // A calendar day resolves to local midnight, and that day's bar is always
    // after it. Nearest-wins would pick the PREVIOUS day's bar whenever the
    // session opens later in the day than the gap behind it (e.g. daily bars
    // at 10:00 are 9h behind midnight but 15h ahead of it).
    if (
      TradingViewChartRenderer.isCalendarDay(time) &&
      after >= target &&
      after - target < 86400
    ) {
      return after as Time;
    }
    return (
      Math.abs(after - target) < Math.abs(target - before) ? after : before
    ) as Time;
  }

  /** Markers given as `YYYY-MM-DD` or `{year, month, day}` mean a whole day. */
  private static isCalendarDay(time: Time): boolean {
    if (typeof time === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(time);
    const bd = time as { year?: number; month?: number; day?: number };
    return bd?.year != null && bd.month != null && bd.day != null;
  }

  /**
   * Price a marker should anchor to, given the bar it sits on. Mirrors LWC's
   * own rule (high for above, low for below, close/value otherwise).
   */
  private static markerPrice(
    item: Record<string, unknown> | undefined,
    position: TvlMarkerData['position']
  ): number | undefined {
    if (item == null) return undefined;
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    if (position === 'aboveBar' || position === 'atPriceTop') {
      return num(item.high) ?? num(item.value) ?? num(item.close);
    }
    if (position === 'belowBar' || position === 'atPriceBottom') {
      return num(item.low) ?? num(item.value) ?? num(item.close);
    }
    return num(item.close) ?? num(item.value);
  }

  setSeriesMarkers(seriesId: string, markers: TvlMarkerData[]): void {
    const series = this.seriesMap.get(seriesId);
    if (!series) return;
    this.lastMarkers.set(seriesId, markers);

    // Snap onto real data times. A `YYYY-MM-DD` marker time resolves to UTC
    // midnight, which never equals a bar's timestamp, so LWC cannot anchor
    // it and parks the marker at the chart edge; on continuous series a raw
    // time also tends to land on a whitespace slot, where re-anchoring
    // through dataByIndex returns null and the marker jumps.
    const items = this.seriesDataItems.get(seriesId) ?? [];
    const dataTimes = items.map(d => d.time as number);

    const chartMarkers: SeriesMarker<Time>[] = markers.map(m => {
      const raw = this.resolveMarkerColor(m);
      const time = this.snapMarkerTime(m.time as Time, dataTimes);
      // Explicit price: LWC otherwise infers it from the series row and
      // silently leaves the marker unpositioned when the row shape isn't one
      // it recognizes (the custom-series case).
      const price =
        m.price ??
        TradingViewChartRenderer.markerPrice(
          items[dataTimes.indexOf(time as number)],
          m.position
        );
      return {
        time,
        position: m.position,
        shape: m.shape,
        color: resolveColor(raw) ?? raw,
        text: m.text,
        size: m.size,
        ...(price != null ? { price } : {}),
      };
    }) as SeriesMarker<Time>[];
    // Use createSeriesMarkers API for v5
    let markerPlugin = this.markersMap.get(seriesId);
    if (!markerPlugin) {
      markerPlugin = createSeriesMarkers(series, chartMarkers);
      this.markersMap.set(seriesId, markerPlugin);
    } else {
      markerPlugin.setMarkers(chartMarkers);
    }
  }

  /**
   * Re-map every series' markers onto the current time-scale indices.
   * LWC caches a logical index per marker and resolves it with an exact
   * dataByIndex match, so anything that shifts indices must trigger this.
   */
  refreshMarkers(): void {
    this.lastMarkers.forEach((markers, seriesId) => {
      this.setSeriesMarkers(seriesId, markers);
    });
  }

  /**
   * Update dynamic price lines for a series by reading the last-row
   * value of each tracked column from the current table data.
   */
  updateDynamicPriceLines(
    seriesId: string,
    columnData: Map<string, unknown[]>
  ): void {
    const entries = this.dynamicPriceLines.get(seriesId);
    if (!entries) return;

    entries.forEach(({ priceLine, column }) => {
      const data = columnData.get(column);
      if (data && data.length > 0) {
        const lastValue = data[data.length - 1];
        if (typeof lastValue === 'number' && !Number.isNaN(lastValue)) {
          priceLine.applyOptions({ price: lastValue });
        }
      }
    });
  }

  /**
   * Apply new chart-level options (e.g., on theme change).
   */
  applyOptions(options: DeepPartial<ChartOptions>): void {
    const { watermark: wmRaw, ...rawOpts } = resolveColorsDeep(
      options as Record<string, unknown>
    );
    const chartOpts = resolveLocalization(rawOpts);

    // A built-in scale set to autoScale:false up front freezes at a default
    // range with the data off-screen (LWC can't seed a frozen scale with a
    // fitted range). Keep the scale auto and freeze it after the first fit
    // instead, via each attached series' autoscaleInfoProvider.
    (
      [
        ['rightPriceScale', 'right'],
        ['leftPriceScale', 'left'],
      ] as const
    ).forEach(([key, scaleId]) => {
      const ps = (chartOpts as Record<string, unknown>)[key] as
        | Record<string, unknown>
        | undefined;
      if (ps != null && ps.autoScale === false) {
        (chartOpts as Record<string, unknown>)[key] = {
          ...ps,
          autoScale: true,
        };
        this.frozenScaleIds.add(scaleId);
        // Freeze series already attached to this scale — applyOptions can
        // arrive after configureSeries (theme changes, reconnects).
        this.seriesMap.forEach((series, id) => {
          const sid = (series.options().priceScaleId as string) ?? 'right';
          if (sid === scaleId) {
            this.freezeSeriesScale(id, series);
          }
        });
      }
    });

    // Update cached theme colors so derived defaults use the new values
    const newTextColor = (chartOpts.layout as Record<string, unknown>)
      ?.textColor as string | undefined;
    if (newTextColor != null && newTextColor !== '') {
      this.textColor = newTextColor;
    }
    const newGridColor = (
      (chartOpts.grid as Record<string, unknown>)?.vertLines as Record<
        string,
        unknown
      >
    )?.color as string | undefined;
    if (newGridColor != null && newGridColor !== '') {
      this.gridColor = newGridColor;
    }

    // Merge into the cached options so consumers that read resolvedChartOpts
    // later (hasTooltip(), and setChartType's rebuild) see the figure's
    // chartOptions — which arrive here via applyOptions, not the constructor.
    this.resolvedChartOpts = { ...this.resolvedChartOpts, ...chartOpts };

    this.chart.applyOptions(chartOpts as DeepPartial<ChartOptions>);
    if (wmRaw != null) {
      this.applyWatermark(wmRaw as LegacyWatermarkOptions);
    }
  }

  /**
   * Resize the chart to fill its container.
   */
  resize(width: number, height: number): void {
    this.chart.resize(width, height);
  }

  /**
   * Fit all data into view.
   */
  fitContent(): void {
    this.chart.timeScale().fitContent();
  }

  /**
   * Apply stretch factors to panes to control their relative sizes.
   * Must be called after configureSeries() since panes are created
   * implicitly by addSeries(def, opts, paneIndex).
   */
  applyPaneStretchFactors(factors: number[]): void {
    const panes = this.chart.panes();
    for (let i = 0; i < factors.length && i < panes.length; i += 1) {
      panes[i].setStretchFactor(factors[i]);
    }
  }

  /**
   * Get the chart type.
   */
  getChartType(): TvlChartType {
    return this.chartType;
  }

  /**
   * Get the chart's current text color (for theme-aware defaults).
   */
  getTextColor(): string {
    return this.textColor;
  }

  /**
   * Get the underlying chart API for advanced use.
   */
  getChart(): IChartApi {
    return this.chart;
  }

  /**
   * Convert a TZ-shifted epoch-seconds time to an x coordinate (pane-relative
   * pixels), or null if outside the visible range. Test-only: used by the
   * Playwright inversion-oracle to compute deterministic clicks.
   */
  timeToCoordinate(timeSec: number): number | null {
    return this.chart.timeScale().timeToCoordinate(timeSec as Time);
  }

  /**
   * Convert a price on a series' scale to a y coordinate (pane-relative
   * pixels), or null if the series is unknown. Test-only companion to
   * {@link timeToCoordinate}.
   */
  priceToCoordinate(seriesId: string, price: number): number | null {
    const series = this.seriesMap.get(seriesId);
    if (!series) return null;
    return series.priceToCoordinate(price);
  }

  /** Current series ids (insertion order). Test-only. */
  getSeriesIds(): string[] {
    return Array.from(this.seriesMap.keys());
  }

  /**
   * Whether the series currently holds any data points. Unknown series
   * counts as empty.
   */
  seriesHasData(seriesId: string): boolean {
    const series = this.seriesMap.get(seriesId);
    if (!series) return false;
    try {
      return series.data().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * First/last data time (TZ-shifted epoch seconds) and point count per
   * series. Test-only: lets interaction tests see the loaded window behind
   * the viewport.
   */
  getDataExtent(): Record<
    string,
    { first: number | null; last: number | null; count: number }
  > {
    const out: Record<
      string,
      { first: number | null; last: number | null; count: number }
    > = {};
    this.seriesMap.forEach((series, id) => {
      const data = series.data();
      const first = data.length > 0 ? (data[0].time as number) : null;
      const last =
        data.length > 0 ? (data[data.length - 1].time as number) : null;
      out[id] = { first, last, count: data.length };
    });
    return out;
  }

  /**
   * Freeze a series' price scale: LWC keeps autoscaling, but the provider
   * caches the first fit that yields a real price range and returns it on
   * every later recompute, pinning the axis. LWC computes the range lazily
   * during paint, so hooking its own recompute is the only race-free way to
   * "fit once then hold" (there is no public set-price-range API).
   */
  private freezeSeriesScale(
    seriesId: string,
    series: ISeriesApi<SeriesType>
  ): void {
    let cache = this.frozenRanges.get(seriesId);
    if (cache == null) {
      cache = { info: null };
      this.frozenRanges.set(seriesId, cache);
    }
    const cacheRef = cache;
    series.applyOptions({
      autoscaleInfoProvider: (
        original: () => AutoscaleInfo | null
      ): AutoscaleInfo | null => {
        if (cacheRef.info == null) {
          const info = original();
          if (info?.priceRange != null) {
            cacheRef.info = info;
          }
          return info;
        }
        return cacheRef.info;
      },
    });
  }

  /** Reset all price scales to auto-fit visible data. */
  resetPriceScales(): void {
    // Drop captured ranges so frozen scales re-fit once, then re-freeze.
    // Mutate in place (not replace): provider closures hold these objects.
    this.frozenRanges.forEach(cache => {
      // eslint-disable-next-line no-param-reassign
      cache.info = null;
    });
    this.seriesMap.forEach(series => {
      try {
        series.priceScale().setAutoScale(true);
      } catch {
        // series may not be ready
      }
    });
  }

  /** Plot-area width in pixels (excludes price scale). */
  getTimeScaleWidth(): number {
    return this.chart.timeScale().width();
  }

  /** Subscribe to visible logical range changes (zoom/pan detection). */
  subscribeVisibleLogicalRangeChange(
    handler: (range: LogicalRange | null) => void
  ): () => void {
    const ts = this.chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(handler);
    return () => ts.unsubscribeVisibleLogicalRangeChange(handler);
  }

  /** Subscribe to chart single-click (press detection). */
  subscribeClick(handler: (params: MouseEventParams) => void): () => void {
    this.chart.subscribeClick(handler);
    return () => this.chart.unsubscribeClick(handler);
  }

  /**
   * Subscribe to chart double-click. Accepts a handler taking the LWC
   * MouseEventParams; a plain `() => void` (used by the internal reset
   * subscriber) is assignable and remains backward compatible.
   */
  subscribeDblClick(handler: (params: MouseEventParams) => void): () => void {
    this.chart.subscribeDblClick(handler);
    return () => this.chart.unsubscribeDblClick(handler);
  }

  /** Resolved primary color for a series id (for the tracking tooltip). */
  getSeriesColor(id: string): string | undefined {
    return this.seriesColors.get(id);
  }

  /** Format a crosshair time the same way this chart's time axis does. */
  private formatCrosshairTime(time: unknown): string {
    switch (this.chartType) {
      case 'yieldCurve':
        return yieldCurveCrosshairFormatter(time);
      case 'options':
        return optionsCrosshairFormatter(time);
      default:
        return crosshairTimeFormatter(time);
    }
  }

  /** True when the figure requested a tracking tooltip. */
  hasTooltip(): boolean {
    const tooltip = this.resolvedChartOpts.tooltip as
      | TvlTooltipOptions
      | undefined;
    return tooltip?.visible === true;
  }

  /**
   * Create the tracking tooltip and subscribe it to crosshair moves. Returns
   * a cleanup that unsubscribes and removes the tooltip element. No-op (returns
   * a no-op cleanup) when the figure did not request a tooltip. Must be called
   * after :meth:`configureSeries` so series colors are known.
   */
  setupTooltip(): () => void {
    if (!this.hasTooltip()) {
      return () => undefined;
    }
    const options = this.resolvedChartOpts.tooltip as TvlTooltipOptions;
    this.tooltip = new TradingViewTooltip({
      container: this.container,
      getSeriesId: s => this.getSeriesIdForApi(s),
      getSeriesColor: id => this.getSeriesColor(id),
      formatTime: time => this.formatCrosshairTime(time),
      options,
    });
    const handler = (params: MouseEventParams): void => {
      this.tooltip?.handleCrosshairMove(params);
    };
    this.chart.subscribeCrosshairMove(handler);
    return () => {
      this.chart.unsubscribeCrosshairMove(handler);
      this.tooltip?.destroy();
      this.tooltip = null;
    };
  }

  /** Reverse lookup: find our series id for a given ISeriesApi. */
  getSeriesIdForApi(series: ISeriesApi<SeriesType>): string | undefined {
    let found: string | undefined;
    this.seriesMap.forEach((value, id) => {
      if (value === series) {
        found = id;
      }
    });
    return found;
  }

  /** User-facing title for a series API, when set. */
  getSeriesTitleForApi(series: ISeriesApi<SeriesType>): string | undefined {
    if (this.getSeriesIdForApi(series) == null) return undefined;
    try {
      const opts = series.options() as { title?: string };
      const title = opts?.title;
      return title != null && title !== '' ? title : undefined;
    } catch {
      return undefined;
    }
  }

  /** Subscribe to chart size changes (resize detection). */
  subscribeSizeChange(handler: () => void): () => void {
    const ts = this.chart.timeScale();
    ts.subscribeSizeChange(handler);
    return () => ts.unsubscribeSizeChange(handler);
  }

  /** Whether scaffold is currently active. */
  isScaffoldEnabled(): boolean {
    return this.scaffoldEnabled && this.scaffoldSeries != null;
  }

  /**
   * Create the hidden scaffold LineSeries.
   * Must be called before data series are created so it occupies
   * base time positions for proportional spacing.
   */
  private createScaffold(): void {
    this.scaffoldSeries = this.chart.addSeries(LineSeries, {
      visible: false,
      priceScaleId: '',
    } as SeriesPartialOptionsMap[SeriesType]);
  }

  /**
   * Set whitespace data on the scaffold series to establish proportional
   * time spacing across the data range.
   *
   * @param minTime Minimum time in TZ-shifted epoch seconds
   * @param maxTime Maximum time in TZ-shifted epoch seconds
   * @param count Number of whitespace entries to generate
   */
  setScaffoldData(minTime: number, maxTime: number, count: number): void {
    if (!this.scaffoldSeries) return;
    if (minTime >= maxTime || count <= 0) return;

    const cappedCount = Math.min(30000, count);
    const step = (maxTime - minTime) / cappedCount;
    const data: Array<{ time: number }> = [];
    for (let i = 0; i <= cappedCount; i += 1) {
      data.push({ time: minTime + step * i });
    }
    this.scaffoldSeries.setData(
      data as Parameters<typeof this.scaffoldSeries.setData>[0]
    );
  }

  /**
   * Dispose of the chart and clean up resources.
   */
  dispose(): void {
    this.seriesMap.clear();
    this.markersMap.clear();
    this.dynamicPriceLines.clear();
    this.scaffoldSeries = null;
    this.seriesColors.clear();
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
    if (this.watermarkPlugin) {
      this.watermarkPlugin.detach();
      this.watermarkPlugin = null;
    }
    this.chart.remove();
  }
}

export default TradingViewChartRenderer;
