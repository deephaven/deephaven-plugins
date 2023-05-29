import React, { useCallback } from 'react';
import type { PlotlyDataLayoutConfig } from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import {
  ChartPanel,
  type ChartPanelProps,
} from '@deephaven/dashboard-core-plugins';
import type { Table } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
import { ChartTheme } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel';

export interface PlotlyChartWidget {
  getDataAsBase64(): string;
  exportedObjects: { fetch(): Promise<Table> }[];
}

interface PlotlyChartWidgetData {
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

function getWidgetData(widgetInfo: PlotlyChartWidget): PlotlyChartWidgetData {
  return JSON.parse(atob(widgetInfo.getDataAsBase64()));
}

async function getDataMappings(
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

export interface PlotlyExpressChartPanelProps extends ChartPanelProps {
  fetch(): Promise<PlotlyChartWidget>;
}

function PlotlyExpressChartPanel(props: PlotlyExpressChartPanelProps) {
  const dh = useApi();
  const { fetch, ...rest } = props;

  const makeModel = useCallback(async () => {
    const widgetInfo = await fetch();
    const data = getWidgetData(widgetInfo);
    const { plotly, deephaven } = data;
    const isDefaultTemplate = !deephaven.is_user_set_template;
    const tableColumnReplacementMap = await getDataMappings(widgetInfo);
    return new PlotlyExpressChartModel(
      dh,
      tableColumnReplacementMap,
      plotly.data,
      plotly.layout ?? {},
      isDefaultTemplate,
      ChartTheme
    );
  }, [dh, fetch]);

  return (
    <ChartPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      makeModel={makeModel}
      Plotly={Plotly}
    />
  );
}

PlotlyExpressChartPanel.displayName = 'PlotlyExpressChartPanel';

export default PlotlyExpressChartPanel;
