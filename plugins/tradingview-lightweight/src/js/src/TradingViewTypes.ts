import type { dh as DhType } from '@deephaven/jsapi-types';

// Message types from Python
export interface NewFigureMessage {
  type: 'NEW_FIGURE';
  figure: TvlFigureData;
  revision: number;
  new_references: number[];
  removed_references: number[];
}

/** Response from Python after a ZOOM or RESET message. */
export interface DownsampleReadyMessage {
  type: 'DOWNSAMPLE_READY';
  tables: Record<
    string,
    {
      refIndex: number;
      tableSize: number;
      viewport: [number, number];
      fullRange: [number, number] | null;
      isReset?: boolean;
    }
  >;
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

/** Per-table info about Python-side downsampling. */
export interface TvlDownsampleTableInfo {
  tableSize: number;
  fullRange: [number, number] | null;
  isDownsampled: boolean;
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
  /** Present when Python-side downsampling is active. Keyed by table ref ID. */
  downsampleInfo?: Record<string, TvlDownsampleTableInfo>;
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
      /** Number of rows added */
      addedCount: number;
      /** Number of rows removed */
      removedCount: number;
      /** Number of rows modified */
      modifiedCount: number;
      /** True when this update follows a RESET (double-click). */
      isResetView?: boolean;
    }
  | { type: 'ERROR'; message: string };

export type ModelEventListener = (event: ModelEvent) => void;
