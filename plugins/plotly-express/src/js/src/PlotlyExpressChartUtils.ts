import type {
  Data,
  Delta,
  LayoutAxis,
  PlotlyDataLayoutConfig,
  PlotNumber,
  PlotType,
} from 'plotly.js';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ChartUtils } from '@deephaven/chart';

/**
 * Traces that are at least partially powered by WebGL and have no SVG equivalent.
 * https://plotly.com/python/webgl-vs-svg/
 */
const UNREPLACEABLE_WEBGL_TRACE_TYPES = new Set([
  'splom',
  'parcoords',
  'scatter3d',
  'surface',
  'mesh3d',
  'cone',
  'streamtube',
  'scattermapbox',
  'choroplethmapbox',
  'densitymapbox',
]);

/*
 * A map of trace type to attributes that should be set to a single value instead
 * of an array in the Figure object. The attributes should be relative to the trace
 * within the plotly/data/ array.
 */
const SINGLE_VALUE_REPLACEMENTS = {
  indicator: new Set(['value', 'delta/reference', 'title/text']),
} as Record<string, Set<string>>;

/**
 * A prefix for the number format to indicate it is in Java format and should be
 *  transformed to a d3 format
 */
export const FORMAT_PREFIX = 'DEEPHAVEN_JAVA_FORMAT';

export interface PlotlyChartWidget {
  getDataAsBase64: () => string;
  exportedObjects: { fetch: () => Promise<DhType.Table> }[];
  addEventListener: (
    type: string,
    fn: (event: CustomEvent<PlotlyChartWidget>) => () => void
  ) => void;
}

export interface PlotlyChartWidgetData {
  type: string;
  figure: {
    deephaven: {
      mappings: Array<{
        table: number;
        data_columns: Record<string, string[]>;
      }>;
      is_user_set_template: boolean;
      is_user_set_color: boolean;
    };
    plotly: PlotlyDataLayoutConfig;
  };
  revision: number;
  new_references: number[];
  removed_references: number[];
}

export function getWidgetData(
  widgetInfo: DhType.Widget
): PlotlyChartWidgetData {
  return JSON.parse(widgetInfo.getDataAsString());
}

export function getDataMappings(
  widgetData: PlotlyChartWidgetData
): Map<number, Map<string, string[]>> {
  const data = widgetData.figure;

  // Maps a reference index to a map of column name to an array of the paths where its data should be
  const tableColumnReplacementMap = new Map<number, Map<string, string[]>>();

  data.deephaven.mappings.forEach(
    ({ table: tableIndex, data_columns: dataColumns }) => {
      const existingColumnMap =
        tableColumnReplacementMap.get(tableIndex) ??
        new Map<string, string[]>();
      tableColumnReplacementMap.set(tableIndex, existingColumnMap);

      // For each { columnName: [replacePaths] } in the object, add to the tableColumnReplacementMap
      Object.entries(dataColumns).forEach(([columnName, paths]) => {
        const existingPaths = existingColumnMap.get(columnName);
        if (existingPaths !== undefined) {
          existingPaths.push(...paths);
        } else {
          existingColumnMap.set(columnName, [...paths]);
        }
      });
    }
  );

  return tableColumnReplacementMap;
}

/**
 * Removes the default colors from the data
 * Data color is not removed if the user set the color specifically or the plot type sets it
 *
 * This only checks if the marker or line color is set to a color in the colorway.
 * This means it is not possible to change the order of the colorway and use the same colors.
 *
 * @param colorway The colorway from plotly
 * @param data The data to remove the colorway from. This will be mutated
 */
export function removeColorsFromData(colorway: string[], data: Data[]): void {
  const plotlyColors = new Set(colorway.map(color => color.toUpperCase()));

  // Just check if the colors are in the colorway at any point
  // Plotly has many different ways to layer/order series
  for (let i = 0; i < data.length; i += 1) {
    const trace = data[i];

    // There are multiple datatypes in plotly and some don't contain marker or marker.color
    if (
      'marker' in trace &&
      trace.marker != null &&
      'color' in trace.marker &&
      typeof trace.marker.color === 'string'
    ) {
      if (plotlyColors.has(trace.marker.color.toUpperCase())) {
        delete trace.marker.color;
      }
    }

    if (
      'line' in trace &&
      trace.line != null &&
      'color' in trace.line &&
      typeof trace.line.color === 'string'
    ) {
      if (plotlyColors.has(trace.line.color.toUpperCase())) {
        delete trace.line.color;
      }
    }
  }
}

/**
 * Gets the path parts from a path replacement string from the widget data.
 * The parts start with the plotly data array as the root.
 * E.g. /plotly/data/0/x -> ['0', 'x']
 * @param path The path from the widget data
 * @returns The path parts within the plotly data array
 */
export function getPathParts(path: string): string[] {
  return path
    .split('/')
    .filter(part => part !== '' && part !== 'plotly' && part !== 'data');
}

/**
 * Checks if a plotly series is a line series without markers
 * @param data The plotly data to check
 * @returns True if the data is a line series without markers
 */
export function isLineSeries(data: Data): boolean {
  return (
    (data.type === 'scatter' || data.type === 'scattergl') &&
    data.mode === 'lines'
  );
}

/**
 * Checks if a plotly axis type is automatically determined based on the data
 * @param axis The plotly axis to check
 * @returns True if the axis type is determined based on the data
 */
export function isAutoAxis(axis: Partial<LayoutAxis>): boolean {
  return axis.type == null || axis.type === '-';
}

/**
 * Checks if a plotly axis type is linear
 * @param axis The plotly axis to check
 * @returns True if the axis is a linear axis
 */
export function isLinearAxis(axis: Partial<LayoutAxis>): boolean {
  return axis.type === 'linear' || axis.type === 'date';
}

/**
 * Check if 2 axis ranges are the same
 * A null range indicates an auto range
 * @param range1 The first axis range options
 * @param range2 The second axis range options
 * @returns True if the range options describe the same range
 */
export function areSameAxisRange(
  range1: unknown[] | null,
  range2: unknown[] | null
): boolean {
  return (
    (range1 === null && range2 === null) ||
    (range1 != null &&
      range2 != null &&
      range1[0] === range2[0] &&
      range1[1] === range2[1])
  );
}

export interface DownsampleInfo {
  type: 'linear';
  /**
   * The original table before downsampling.
   */
  originalTable: DhType.Table;
  /**
   * The x column to downsample.
   */
  xCol: string;
  /**
   * The y columns to downsample.
   */
  yCols: string[];
  /**
   * The width of the x-axis in pixels.
   */
  width: number;
  /**
   * The range of the x-axis. Null if set to autorange.
   */
  range: string[] | null;

  /**
   * If the range is a datae or number
   */
  rangeType: 'date' | 'number';
}

export function downsample(
  dh: typeof DhType,
  info: DownsampleInfo
): Promise<DhType.Table> {
  return dh.plot.Downsample.runChartDownsample(
    info.originalTable,
    info.xCol,
    info.yCols,
    info.width,
    info.range?.map(val =>
      info.rangeType === 'date'
        ? dh.DateWrapper.ofJsDate(new Date(val))
        : dh.LongWrapper.ofString(val)
    )
  );
}

/**
 * Get the indexes of the replaceable WebGL traces in the data
 * A replaceable WebGL has a type that ends with 'gl' which indicates it has a SVG equivalent
 * @param data The data to check
 * @returns The indexes of the WebGL traces
 */
export function getReplaceableWebGlTraceIndices(data: Data[]): Set<number> {
  const webGlTraceIndexes = new Set<number>();
  data.forEach((trace, index) => {
    if (trace.type && trace.type.endsWith('gl')) {
      webGlTraceIndexes.add(index);
    }
  });
  return webGlTraceIndexes;
}

/**
 * Check if the data contains any traces that are at least partially powered by WebGL and have no SVG equivalent.
 * @param data The data to check for WebGL traces
 * @returns True if the data contains any unreplaceable WebGL traces
 */
export function hasUnreplaceableWebGlTraces(data: Data[]): boolean {
  return data.some(
    trace => trace.type && UNREPLACEABLE_WEBGL_TRACE_TYPES.has(trace.type)
  );
}

/**
 * Set traces to use WebGL if WebGL is enabled and the trace was originally WebGL
 * or swap out WebGL for SVG if WebGL is disabled and the trace was originally WebGL
 * @param data The plotly figure data to update
 * @param webgl True if WebGL is enabled
 * @param webGlTraceIndices The indexes of the traces that are originally WebGL traces
 */
export function setWebGlTraceType(
  data: Data[],
  webgl: boolean,
  webGlTraceIndices: Set<number>
): void {
  webGlTraceIndices.forEach(index => {
    const trace = data[index];
    if (webgl && trace.type && !trace.type.endsWith('gl')) {
      // If WebGL is enabled and the trace is not already a WebGL trace, make it one
      trace.type = `${trace.type}gl` as PlotType;
    } else if (!webgl && trace.type && trace.type.endsWith('gl')) {
      // If WebGL is disabled and the trace is a WebGL trace, remove the 'gl'
      trace.type = trace.type.substring(0, trace.type.length - 2) as PlotType;
    }
  });
}

/**
 * Check if the data at the selector should be replaced with a single value instead of an array
 * @param data The data to check
 * @param selector The selector to check
 * @returns True if the data at the selector should be replaced with a single value
 */
export function isSingleValue(data: Data[], selector: string[]): boolean {
  const index = parseInt(selector[0], 10);
  const type = data[index].type as string;
  const path = selector.slice(1).join('/');
  return SINGLE_VALUE_REPLACEMENTS[type]?.has(path) ?? false;
}

/**
 * Transform the number format to a d3 number format, which is used by Plotly
 * @param numberFormat The number format to transform
 * @returns The d3 number format
 */
export function transformValueFormat(
  data: Partial<PlotNumber> | Partial<Delta>
): void {
  let valueFormat = data?.valueformat;
  if (valueFormat == null) {
    return;
  }

  if (valueFormat.startsWith(FORMAT_PREFIX)) {
    valueFormat = valueFormat.substring(FORMAT_PREFIX.length);
  } else {
    // don't transform if it's not a deephaven format
    return;
  }

  const formatResults = ChartUtils.getPlotlyNumberFormat(null, '', valueFormat);
  if (formatResults?.tickformat != null && formatResults?.tickformat !== '') {
    // eslint-disable-next-line no-param-reassign
    data.valueformat = formatResults.tickformat;
  }
  // prefix and suffix might already be set, which should take precedence
  if (formatResults?.tickprefix != null && formatResults?.tickprefix !== '') {
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
    (data as any).prefix ??= formatResults.tickprefix;
  }
  if (formatResults?.ticksuffix != null && formatResults?.ticksuffix !== '') {
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
    (data as any).suffix ??= formatResults.ticksuffix;
  }
}

/**
 * Replace the number formats in the data with a d3 number format
 * @param data The data to update
 */
export function replaceValueFormat(data: Data[]): void {
  for (let i = 0; i < data.length; i += 1) {
    const trace = data[i];

    if (trace.type === 'indicator') {
      if (trace.number != null) {
        transformValueFormat(trace.number);
      }
      if (trace.delta != null) {
        transformValueFormat(trace.delta);
      }
    }
  }
}
