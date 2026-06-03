import type { dh as DhType } from '@deephaven/jsapi-types';

// Message types from Python
export interface NewFigureMessage {
  type: 'NEW_FIGURE';
  figure: TvlFigureData;
  revision: number;
  new_references: number[];
  removed_references: number[];
}

export type TvlChartType = 'standard' | 'yieldCurve' | 'options';

/**
 * Per-series partition template. Each series with `by=` on the Python
 * side gets one of these. The JS partition-watcher uses the series'
 * own `dataMapping.columns`, `options`, `type`, `paneIndex`, and
 * `priceScaleOptions` as the template — only `byColumn` and `refIndex`
 * are unique to the partition block.
 */
export interface TvlSeriesPartition {
  /** Column name used for partitioning. */
  byColumn: string;
  /** Index into the exported references for this series' PartitionedTable.
   *  Patched in by the Python listener at serialize time. */
  refIndex?: number;
}

/** Per-table metadata for JS-side downsampling via runChartDownsample. */
export interface TvlDownsampleMeta {
  tableSize: number;
  timeCol: string;
  valueCols: string[];
  seriesTypes: string[];
}

/** Per-source-table metadata for server-side auto-bin aggregation. */
export interface TvlAutoBinMeta {
  /** Time column name on the source table. */
  timeCol: string;
  /** Current aggregation bin width in nanoseconds. */
  binWidthNs: number;
  /** [minNs, maxNs] full extent of the raw source table. */
  fullRangeNs: [number, number];
  /** Target bin count used to compute the initial bin width. */
  targetBins: number;
  /** Per-series aggregation spec. Keyed by series id. */
  series: Record<
    string,
    {
      type: 'Histogram' | 'Candlestick' | 'Bar';
      agg: 'sum' | 'count' | 'avg' | 'last' | 'ohlc';
      valueCols: string[];
    }
  >;
}

/** Server response to AUTOBIN_ZOOM / AUTOBIN_RESET. */
export interface AutoBinFigureMessage {
  type: 'AUTOBIN_FIGURE';
  revision: number;
  /** Source-table ref the zoom request was for. */
  tableRef: number;
  /** New bin width in nanoseconds for that table. */
  binWidthNs: number;
  /** Updated full autoBinMeta map. */
  autoBinMeta: Record<string, TvlAutoBinMeta>;
  /** New reference list (parallels NEW_FIGURE). Empty when noop is true. */
  new_references: number[];
  /** True when the server determined no re-aggregation was needed. */
  noop?: boolean;
}

export interface TvlFigureData {
  chartType?: TvlChartType;
  chartOptions: Record<string, unknown>;
  series: TvlSeriesConfig[];
  paneStretchFactors?: number[];
  deephaven: {
    mappings: TvlDataMapping[];
  };
  /** Present when tables are eligible for JS-side downsampling. Keyed by table ref ID. */
  downsampleMeta?: Record<string, TvlDownsampleMeta>;
  /** Present when source tables are server-side auto-binned. Keyed by source-table ref ID. */
  autoBinMeta?: Record<string, TvlAutoBinMeta>;
}

export interface TvlSeriesConfig {
  id: string;
  type: 'Candlestick' | 'Bar' | 'Line' | 'Area' | 'Baseline' | 'Histogram';
  options: Record<string, unknown>;
  dataMapping: {
    tableId: number;
    columns: Record<string, string>; // e.g. { time: "Timestamp", open: "Open", ... }
  };
  markers?: TvlMarkerData[];
  markerSpec?: TvlMarkerSpec;
  priceLines?: TvlPriceLineData[];
  priceScaleOptions?: Record<string, unknown>;
  paneIndex?: number;
  /** Set when the series is a partition template (Python-side `by=`).
   *  The JS partition-watcher creates one runtime series per partition
   *  key using this series' options/dataMapping/type/paneIndex as the
   *  template. The series itself is NOT rendered directly. */
  partition?: TvlSeriesPartition;
}

export interface TvlDataMapping {
  table: number;
  dataColumns: Record<string, string[]>; // column name -> series field paths
}

export interface TvlMarkerData {
  time: string | number;
  position:
    | 'aboveBar'
    | 'belowBar'
    | 'inBar'
    | 'atPriceTop'
    | 'atPriceBottom'
    | 'atPriceMiddle';
  shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
  color?: string;
  text: string;
  size?: number;
  /** Required when position is atPriceTop / atPriceBottom / atPriceMiddle. */
  price?: number;
}

export interface TvlMarkerSpec {
  tableId: number;
  /** Column names for per-row marker properties. `time` is always present. */
  columns: Record<string, string>;
  /** Fixed defaults for properties not sourced from columns. */
  defaults: {
    position?: 'aboveBar' | 'belowBar' | 'inBar';
    shape?: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
    color?: string;
    text?: string;
    size?: number;
  };
}

export interface TvlPriceLineData {
  /** Static price value. Mutually exclusive with `column`. */
  price?: number;
  /** Column name whose last-row value drives the price line dynamically. */
  column?: string;
  color?: string;
  lineWidth?: number;
  lineStyle?: number;
  axisLabelVisible?: boolean;
  title?: string;
}

// Model events
export type ModelEvent =
  | { type: 'FIGURE_UPDATED'; figure: TvlFigureData; tables: DhType.Table[] }
  | {
      type: 'DATA_UPDATED';
      tableId: number;
      isInitialLoad: boolean;
      /** Number of rows added */
      addedCount: number;
      /** Number of rows removed */
      removedCount: number;
      /** Number of rows modified */
      modifiedCount: number;
      /** True when this update follows a RESET (double-click). */
      isResetView?: boolean;
      /** True when this is the first data from a fresh downsample (not a tick). */
      isDownsampleSwap?: boolean;
    }
  | { type: 'ERROR'; message: string }
  | { type: 'DOWNSAMPLE_PENDING'; pending: boolean }
  | { type: 'DISCONNECTED'; connected: boolean };

export type ModelEventListener = (event: ModelEvent) => void;
