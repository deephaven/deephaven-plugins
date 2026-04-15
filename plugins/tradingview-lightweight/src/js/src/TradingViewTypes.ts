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

export interface TvlPartitionSpec {
  /** Index into the exported references for the PartitionedTable. */
  refIndex: number;
  /** Column name used for partitioning. */
  byColumn: string;
  /** Series type to create for each partition. */
  seriesType: TvlSeriesConfig['type'];
  /** Column mapping for each partition's series. */
  columns: Record<string, string>;
}

export interface TvlFigureData {
  chartType?: TvlChartType;
  chartOptions: Record<string, unknown>;
  series: TvlSeriesConfig[];
  partitionSpec?: TvlPartitionSpec;
  paneStretchFactors?: number[];
  deephaven: {
    mappings: TvlDataMapping[];
  };
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
      /** Number of rows added (non-downsampled path only) */
      addedCount: number;
      /** Number of rows removed (non-downsampled path only) */
      removedCount: number;
      /** Number of rows modified (non-downsampled path only) */
      modifiedCount: number;
      /** @deprecated No longer used — native fitContent handles reset. */
      isResetView?: boolean;
      /**
       * For downsampled tables: pre-classified data with whitespace grid
       * and gap markers. When present, the chart uses this instead of
       * calling transformTableData itself.
       */
      downsampledData?: DownsampledData;
    }
  | { type: 'ERROR'; message: string };

export type ModelEventListener = (event: ModelEvent) => void;

/** Stored info about a downsampled table, used for re-sampling on zoom/pan. */
export interface DownsampleInfo {
  /** The original (full-size) table before downsampling. */
  originalTable: unknown; // DhType.Table
  /** The x-axis column name (must be Instant or long). */
  xCol: string;
  /** The y-axis column names to downsample. */
  yCols: string[];
  /** The chart plot-area width in pixels (= target number of output points). */
  width: number;
  /** Visible x-axis range as [from, to] in TZ-shifted epoch seconds, or null for full-range. */
  range: [number, number] | null;
}

/** Pre-classified downsample result with whitespace grid and gap markers. */
export interface DownsampledData {
  /** Whitespace grid points for body region time axis (companion series). */
  whitespaceGrid: Array<{ time: number }>;
  /**
   * Data series with whitespace gap markers inserted at head→body and
   * body→tail transitions. Ready for series.setData().
   */
  dataWithGaps: Record<string, unknown>[];
}
