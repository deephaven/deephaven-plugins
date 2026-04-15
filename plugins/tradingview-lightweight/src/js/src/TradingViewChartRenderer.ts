import {
  createChart,
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
  YieldCurveChartOptions,
  PriceChartOptions,
  SeriesMarker,
  Time,
  SeriesPartialOptionsMap,
  ISeriesMarkersPluginApi,
  ITextWatermarkPluginApi,
  TextWatermarkOptions,
} from 'lightweight-charts';
import Log from '@deephaven/log';
import type {
  TvlChartType,
  TvlSeriesConfig,
  TvlMarkerData,
} from './TradingViewTypes';

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
    PRICE_FORMATTERS[priceFormatterName]
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

  private seriesMap: Map<string, ISeriesApi<SeriesType>> = new Map();

  private markersMap: Map<string, ISeriesMarkersPluginApi<Time>> = new Map();

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

  /**
   * Hidden companion series that establishes the time grid for downsampled
   * body regions. Uses `visible: false` so it draws nothing but its time
   * points create bar slots in the shared time scale.
   */
  private whitespaceSeries: ISeriesApi<SeriesType> | null = null;

  constructor(
    container: HTMLElement,
    options: DeepPartial<ChartOptions> = {},
    chartType: TvlChartType = 'standard'
  ) {
    this.container = container;
    this.chartType = chartType;

    // Extract watermark and resolve localization before passing to createChart
    const { watermark: wmRaw, ...rawOpts } = options as Record<string, unknown>;
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
        tickMarkFormatter: defaultTickMarkFormatter,
        ...(chartOpts.timeScale as Record<string, unknown>),
      },
      localization: {
        timeFormatter: crosshairTimeFormatter,
        ...(chartOpts.localization as Record<string, unknown>),
      },
      autoSize: true,
    };

    switch (chartType) {
      case 'yieldCurve':
        this.chart = createYieldCurveChart(
          container,
          commonOpts as DeepPartial<YieldCurveChartOptions>
        ) as unknown as IChartApi;
        break;
      case 'options':
        this.chart = createOptionsChart(
          container,
          commonOpts as DeepPartial<PriceChartOptions>
        ) as unknown as IChartApi;
        break;
      default:
        this.chart = createChart(
          container,
          commonOpts as DeepPartial<ChartOptions>
        );
        break;
    }

    if (wmRaw != null) {
      this.applyWatermark(wmRaw as LegacyWatermarkOptions);
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
              text: wm.text!,
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
    colorway: string[] = [],
    ohlcColors?: { upColor: string; downColor: string }
  ): void {
    // Store theme colors for marker resolution
    this.colorway = colorway;
    this.ohlcColors = ohlcColors;

    // Remove existing series
    // Detach marker plugins before removing series
    this.markersMap.forEach(plugin => {
      try {
        plugin.detach();
      } catch {
        // Plugin may already be detached if series was removed
      }
    });
    this.markersMap.clear();
    this.seriesMap.forEach(series => {
      this.chart.removeSeries(series);
    });
    this.seriesMap.clear();
    this.dynamicPriceLines.clear();

    // Create new series
    let colorIndex = 0;
    seriesConfigs.forEach(config => {
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

        // Apply per-series price scale options (autoScale, scaleMargins)
        if (config.priceScaleOptions) {
          series.priceScale().applyOptions(config.priceScaleOptions);
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
  }

  /**
   * Replace all data for a specific series. Use only for initial load
   * or full reconfiguration — NOT for ticking updates.
   */
  setSeriesData(seriesId: string, data: unknown[]): void {
    const series = this.seriesMap.get(seriesId);
    if (!series) {
      log.warn('Series not found:', seriesId);
      return;
    }
    series.setData(data as Parameters<typeof series.setData>[0]);
  }

  /**
   * Update the last bar or append a new bar to a series.
   * This is the performant way to handle ticking/streaming data
   * per the TradingView docs — avoids replacing the entire dataset.
   */
  updateSeriesPoint(seriesId: string, point: unknown): void {
    const series = this.seriesMap.get(seriesId);
    if (!series) {
      log.warn('Series not found for update:', seriesId);
      return;
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

  setSeriesMarkers(seriesId: string, markers: TvlMarkerData[]): void {
    const series = this.seriesMap.get(seriesId);
    if (!series) return;

    const chartMarkers: SeriesMarker<Time>[] = markers.map(m => ({
      time: m.time as Time,
      position: m.position,
      shape: m.shape,
      color: this.resolveMarkerColor(m),
      text: m.text,
      size: m.size,
      ...(m.price != null ? { price: m.price } : {}),
    })) as SeriesMarker<Time>[];

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
    const { watermark: wmRaw, ...rawOpts } = options as Record<string, unknown>;
    const chartOpts = resolveLocalization(rawOpts);

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

  // ---- Downsampling v2: whitespace companion series & time scale wrappers ----

  /**
   * Set data on the hidden whitespace companion series (creates it lazily).
   * The whitespace series provides the time grid for the body region so
   * lightweight-charts spaces body bars proportionally in time.
   */
  setWhitespaceData(data: Array<{ time: number }>): void {
    if (this.whitespaceSeries == null) {
      // Must be visible:true so fitContent() includes its bars when
      // computing the full data extent. Use transparent color + lineWidth 0
      // so nothing is actually drawn. priceScaleId '' avoids creating a
      // price scale for it.
      this.whitespaceSeries = this.chart.addSeries(LineSeries, {
        color: 'transparent',
        lineWidth: 1 as const,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        priceScaleId: '',
      });
    }
    this.whitespaceSeries.setData(
      data as Parameters<ISeriesApi<SeriesType>['setData']>[0]
    );
  }

  /** Clear the whitespace series (used on reset-to-full). */
  clearWhitespaceData(): void {
    if (this.whitespaceSeries != null) {
      this.whitespaceSeries.setData([]);
    }
  }

  /** Plot-area width in pixels (excludes price scale). */
  getTimeScaleWidth(): number {
    return this.chart.timeScale().width();
  }

  /** Subscribe to visible logical range changes (zoom/pan detection). */
  subscribeVisibleLogicalRangeChange(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (range: any) => void
  ): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ts = this.chart.timeScale() as any;
    ts.subscribeVisibleLogicalRangeChange(handler);
    return () => ts.unsubscribeVisibleLogicalRangeChange(handler);
  }

  /** Subscribe to chart size changes (resize detection). */
  subscribeSizeChange(handler: () => void): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ts = this.chart.timeScale() as any;
    ts.subscribeSizeChange(handler);
    return () => ts.unsubscribeSizeChange(handler);
  }

  /**
   * Dispose of the chart and clean up resources.
   */
  dispose(): void {
    this.seriesMap.clear();
    this.markersMap.clear();
    this.dynamicPriceLines.clear();
    if (this.whitespaceSeries) {
      this.whitespaceSeries = null;
    }
    if (this.watermarkPlugin) {
      this.watermarkPlugin.detach();
      this.watermarkPlugin = null;
    }
    this.chart.remove();
  }
}

export default TradingViewChartRenderer;
