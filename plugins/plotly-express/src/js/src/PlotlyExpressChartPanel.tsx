import React, { useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import {
  ChartPanel,
  type ChartPanelProps,
} from '@deephaven/dashboard-core-plugins';
import { ChartTheme } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';
import {
  getWidgetData,
  getDataMappings,
  type PlotlyChartWidget,
} from './PlotlyExpressChartUtils.js';

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
