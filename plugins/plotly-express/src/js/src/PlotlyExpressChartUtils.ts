import type { Data, PlotlyDataLayoutConfig } from 'plotly.js';
import type { Table } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartUtils');

export interface PlotlyChartWidget {
  getDataAsBase64(): string;
  exportedObjects: { fetch(): Promise<Table> }[];
  addEventListener(
    type: string,
    fn: (event: CustomEvent<PlotlyChartWidget>) => () => void
  ): void;
}

export interface PlotlyChartWidgetData {
  deephaven: {
    mappings: Array<{
      table: number;
      data_columns: Record<string, string[]>;
    }>;
    is_user_set_template: boolean;
    is_user_set_color: boolean;
  };
  plotly: PlotlyDataLayoutConfig;
}

export function getWidgetData(
  widgetInfo: PlotlyChartWidget
): PlotlyChartWidgetData {
  return JSON.parse(atob(widgetInfo.getDataAsBase64()));
}

export async function getDataMappings(
  widgetInfo: PlotlyChartWidget
): Promise<Map<Table, Map<string, string[]>>> {
  const data = getWidgetData(widgetInfo);
  const tables = await Promise.all(
    widgetInfo.exportedObjects.map(obj => obj.fetch())
  );

  // Maps a table to a map of column name to an array of the paths where its data should be
  const tableColumnReplacementMap = new Map<Table, Map<string, string[]>>();
  tables.forEach(table => tableColumnReplacementMap.set(table, new Map()));

  data.deephaven.mappings.forEach(
    ({ table: tableIndex, data_columns: dataColumns }) => {
      const table = tables[tableIndex];
      const existingColumnMap = tableColumnReplacementMap.get(table);
      assertNotNull(existingColumnMap);

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
 * Applies the colorway to the data unless the data color is not its default value
 * Data color is not default if the user set the color specifically or the plot type sets it
 *
 * @param colorway The colorway from the web UI
 * @param plotlyColorway The colorway from plotly
 * @param data The data to apply the colorway to. This will be mutated
 */
export function applyColorwayToData(
  colorway: string[],
  plotlyColorway: string[],
  data: Data[]
): void {
  if (colorway.length === 0) {
    return;
  }

  if (plotlyColorway.length > colorway.length) {
    log.warn(
      "Plotly's colorway is longer than the web UI colorway. May result in incorrect colors for some series"
    );
  }

  const colorMap = new Map(
    plotlyColorway.map((color, i) => [
      color.toUpperCase(),
      colorway[i] ?? color,
    ])
  );

  const plotlyColors = new Set(
    plotlyColorway.map(color => color.toUpperCase())
  );

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
        trace.marker.color = colorMap.get(trace.marker.color.toUpperCase());
      }
    }

    if (
      'line' in trace &&
      trace.line != null &&
      'color' in trace.line &&
      typeof trace.line.color === 'string'
    ) {
      if (plotlyColors.has(trace.line.color.toUpperCase())) {
        trace.line.color = colorMap.get(trace.line.color.toUpperCase());
      }
    }
  }
}
