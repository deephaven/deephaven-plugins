import React, { useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import {
  ChartPanel,
  type ChartPanelProps,
} from '@deephaven/dashboard-core-plugins';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';
import { type PlotlyChartWidget } from './PlotlyExpressChartUtils.js';

export interface PlotlyExpressChartPanelProps extends ChartPanelProps {
  fetch(): Promise<PlotlyChartWidget>;
}

function PlotlyExpressChartPanel(props: PlotlyExpressChartPanelProps) {
  const dh = useApi();
  const { fetch, ...rest } = props;

  const makeModel = useCallback(async () => {
    const widgetData = await fetch();
    return new PlotlyExpressChartModel(dh, widgetData, fetch);
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
