import {
  type Data,
  type Delta,
  type LayoutAxis,
  type PlotlyDataLayoutConfig,
  type PlotNumber,
  type PlotType,
  type Layout,
} from 'plotly.js';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ChartUtils } from '@deephaven/chart';
import { Formatter } from '@deephaven/jsapi-utils';

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
  'scattermap',
  'choroplethmap',
  'densitymap',
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
export const FORMAT_PREFIX = 'DEEPHAVEN_JAVA_FORMAT=';

export interface PlotlyChartWidget {
  getDataAsBase64: () => string;
  exportedObjects: { fetch: () => Promise<DhType.Table> }[];
  addEventListener: (
    type: string,
    fn: (event: CustomEvent<PlotlyChartWidget>) => () => void
  ) => void;
}

interface DeephavenCalendarBusinessPeriod {
  open: string;
  close: string;
}

export interface FilterColumns {
  columns: Array<{
    type: string;
    name: string;
    required: boolean;
  }>;
}

export interface PlotlyChartDeephavenData {
  calendar?: {
    timeZone: string;
    businessDays: Array<string>;
    holidays: Array<{
      date: string;
      businessPeriods: Array<DeephavenCalendarBusinessPeriod>;
    }>;
    businessPeriods: Array<DeephavenCalendarBusinessPeriod>;
    name: string;
  };
  filterColumns?: FilterColumns;
  mappings: Array<{
    table: number;
    data_columns: Record<string, string[]>;
  }>;
  is_user_set_template: boolean;
  is_user_set_color: boolean;
}

export interface PlotlyChartWidgetData {
  type: string;
  figure: {
    deephaven: PlotlyChartDeephavenData;
    plotly: PlotlyDataLayoutConfig;
  };
  revision: number;
  new_references: number[];
  removed_references: number[];
}

/** Information that is needed to update the default value format in the data
 * The index is relative to the plotly/data/ array
 * The path within the trace has the valueformat to update
 * The typeFrom is a path to a variable that is mapped to a column type
 * The options indicate if the prefix and suffix should be set
 */
export interface FormatUpdate {
  index: number;
  path: string;
  typeFrom: string[];
  options: Record<string, boolean>;
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
 * Create rangebreaks from a business calendar
 * @param formatter The formatter to use for the rangebreak calculations
 * @param calendar The business calendar to create the rangebreaks from
 * @param layout The layout to update with the rangebreaks
 * @param chartUtils The chart utils to use for the rangebreaks
 * @returns The updated layout with the rangebreaks added
 */
export function setRangebreaksFromCalendar(
  formatter: Formatter | null,
  calendar: DhType.calendar.BusinessCalendar | null,
  layout: Partial<Layout>,
  chartUtils: ChartUtils
): Partial<Layout> | null {
  if (formatter != null && calendar != null) {
    const layoutUpdate: Partial<Layout> = {};

    Object.keys(layout)
      .filter(key => key.includes('axis'))
      .forEach(key => {
        const axis = layout[key as keyof Layout];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rangebreaks = (axis as any)?.rangebreaks ?? [];
        const updatedRangebreaks =
          chartUtils.createRangeBreaksFromBusinessCalendar(calendar, formatter);
        const updatedAxis = {
          ...(typeof axis === 'object' ? axis : {}),
          rangebreaks: [...rangebreaks, ...updatedRangebreaks],
        };

        (layoutUpdate as Record<string, unknown>)[key] = updatedAxis;
      });

    return layoutUpdate;
  }
  return null;
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
 * Set the default value formats for all traces that require it
 * @param plotlyData The plotly data to update
 * @param defaultValueFormatSet The set of updates to make
 * @param dataTypeMap The map of path to column type to pull the correct default format from
 * @param formatter The formatter to use to get the default format
 */
export function setDefaultValueFormat(
  plotlyData: Data[],
  defaultValueFormatSet: Set<FormatUpdate>,
  dataTypeMap: Map<string, string>,
  formatter: Formatter | null = null
): void {
  defaultValueFormatSet.forEach(({ index, path, typeFrom, options }) => {
    const types = typeFrom.map(type => dataTypeMap.get(`${index}/${type}`));
    let columnType = null;
    if (types.some(type => type === 'double')) {
      // if any of the types are decimal, use decimal since it's the most specific
      columnType = 'double';
    } else if (types.some(type => type === 'int')) {
      columnType = 'int';
    }
    if (columnType == null) {
      return;
    }
    const typeFormatter = formatter?.getColumnTypeFormatter(columnType);
    if (typeFormatter == null || !('defaultFormatString' in typeFormatter)) {
      return;
    }

    const valueFormat = typeFormatter.defaultFormatString as string;

    if (valueFormat == null) {
      return;
    }

    const trace = plotlyData[index];

    // This object should be safe to cast to PlotNumber or Delta due
    // to the checks when originally added to the set
    const convertData = trace[path as keyof Data] as
      | Partial<PlotNumber>
      | Partial<Delta>;

    convertToPlotlyNumberFormat(convertData, valueFormat, options);
  });
}

/**
 * Convert the number format to a d3 number format
 * @param data The data to update
 * @param valueFormat The number format to convert to a d3 format
 * @param options Options of what to update
 */

export function convertToPlotlyNumberFormat(
  data: Partial<PlotNumber> | Partial<Delta>,
  valueFormat: string,
  options: Record<string, boolean> = {}
): void {
  // by default, everything should be updated dependent on updateFormat
  const updateFormat = options?.format ?? true;
  const updatePrefix = options?.prefix ?? updateFormat;
  const updateSuffix = options?.suffix ?? updateFormat;

  const formatResults = ChartUtils.getPlotlyNumberFormat(null, '', valueFormat);
  if (
    updateFormat &&
    formatResults?.tickformat != null &&
    formatResults?.tickformat !== ''
  ) {
    // eslint-disable-next-line no-param-reassign
    data.valueformat = formatResults.tickformat;
  }
  if (updatePrefix) {
    // there may be no prefix now, so remove the preexisting one
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-param-reassign
    (data as any).prefix = '';

    // prefix and suffix might already be set, which should take precedence
    if (formatResults?.tickprefix != null && formatResults?.tickprefix !== '') {
      // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
      (data as any).prefix = formatResults.tickprefix;
    }
  }
  if (updateSuffix) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-param-reassign
    (data as any).suffix = '';

    // prefix and suffix might already be set, which should take precedence
    if (formatResults?.ticksuffix != null && formatResults?.ticksuffix !== '') {
      // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
      (data as any).suffix = formatResults.ticksuffix;
    }
  }
}

/**
 * Transform the number format to a d3 number format, which is used by Plotly
 * @param numberFormat The number format to transform
 * @returns The d3 number format
 */
export function transformValueFormat(
  data: Partial<PlotNumber> | Partial<Delta>
): Record<string, boolean> {
  let valueFormat = data?.valueformat;
  if (valueFormat == null) {
    // if there's no format, note this so that the default format can be used
    // prefix and suffix should only be updated if the default format is used and they are not already set
    return {
      format: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prefix: (data as any)?.prefix == null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suffix: (data as any)?.suffix == null,
    };
  }

  if (valueFormat.startsWith(FORMAT_PREFIX)) {
    valueFormat = valueFormat.substring(FORMAT_PREFIX.length);
  } else {
    // don't transform if it's not a deephaven format
    return {
      format: false,
    };
  }

  // transform once but don't transform again, so false is returned for format
  const options = {
    format: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prefix: (data as any)?.prefix == null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suffix: (data as any)?.suffix == null,
  };
  convertToPlotlyNumberFormat(data, valueFormat, options);
  return {
    format: false,
  };
}

/**
 * Replace the number formats in the data with a d3 number format
 * @param data The data to update
 */
export function replaceValueFormat(plotlyData: Data[]): Set<FormatUpdate> {
  const defaultValueFormatSet: Set<FormatUpdate> = new Set();

  plotlyData.forEach((trace, i) => {
    if (trace.type === 'indicator') {
      if (trace?.number == null) {
        // eslint-disable-next-line no-param-reassign
        trace.number = {};
      }

      const numberFormatOptions = transformValueFormat(trace.number);

      if (numberFormatOptions.format) {
        defaultValueFormatSet.add({
          index: i,
          path: 'number',
          typeFrom: ['value', 'delta/reference'],
          options: numberFormatOptions,
        });
      }

      if (trace?.delta == null) {
        // eslint-disable-next-line no-param-reassign
        trace.delta = {};
      }

      const deltaFormatOptions = transformValueFormat(trace.delta);

      if (deltaFormatOptions.format) {
        defaultValueFormatSet.add({
          index: i,
          path: 'delta',
          typeFrom: ['value', 'delta/reference'],
          options: deltaFormatOptions,
        });
      }
    }
  });
  return defaultValueFormatSet;
}

/**
 * Get the types of variables assocated with columns in the data
 * For example, if the path /plotly/data/0/value is associated with a column of type int,
 * the map will have the entry '0/value' -> 'int'
 * @param deephavenData The deephaven data from the widget to get path and column name from
 * @param tableReferenceMap The map of table index to table reference.
 * Types are pulled from the table reference
 * @returns A map of path to column type
 */
export function getDataTypeMap(
  deephavenData: PlotlyChartDeephavenData,
  tableReferenceMap: Map<number, DhType.Table>
): Map<string, string> {
  const dataTypeMap: Map<string, string> = new Map();

  const { mappings } = deephavenData;

  mappings.forEach(({ table: tableIndex, data_columns: dataColumns }) => {
    const table = tableReferenceMap.get(tableIndex);
    Object.entries(dataColumns).forEach(([columnName, paths]) => {
      const column = table?.findColumn(columnName);
      if (column == null) {
        return;
      }
      const columnType = column.type;
      paths.forEach(path => {
        const cleanPath = getPathParts(path).join('/');
        dataTypeMap.set(cleanPath, columnType);
      });
    });
  });
  return dataTypeMap;
}

/**
 * Check if WebGL is supported in the current environment.
 * Most modern browsers do support WebGL, but it's possible to disable it and it is also not available
 * in some headless environments, which can affect e2e tests.
 *
 * https://github.com/microsoft/playwright/issues/13146
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1375585
 *
 * @returns True if WebGL is supported, false otherwise
 */
export function isWebGLSupported(): boolean {
  try {
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Detect_WebGL
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl != null && gl instanceof WebGLRenderingContext;
  } catch (e) {
    return false;
  }
}

export const IS_WEBGL_SUPPORTED = isWebGLSupported();
