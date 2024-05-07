import type { Data, LayoutAxis, PlotlyDataLayoutConfig } from 'plotly.js';
import type { dh as DhType } from '@deephaven/jsapi-types';

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
 * @returns True if the data is a line series without marakers
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
