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
  position: 'aboveBar' | 'belowBar' | 'inBar';
  shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
  color: string;
  text: string;
  size?: number;
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
      /** Number of rows added in this update */
      addedCount: number;
      /** Number of rows removed in this update */
      removedCount: number;
      /** Number of rows modified in this update */
      modifiedCount: number;
      /** If true, the chart should save/restore the visible range around the data update. */
      preserveVisibleRange: boolean;
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
  /** Visible x-axis range as [min, max] epoch millis, or null for autorange. */
  range: [string, string] | null;
}
