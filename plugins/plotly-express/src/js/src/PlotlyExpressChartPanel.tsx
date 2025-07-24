import React, { useCallback, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { ChartPanel, ChartPanelProps } from '@deephaven/dashboard-core-plugins';
import type { dh } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';
import { useHandleSceneTicks } from './useHandleSceneTicks.js';

export function PlotlyExpressChartPanel(
  props: WidgetPanelProps<dh.Widget>
): JSX.Element {
  const dh = useApi();
  const { fetch, metadata = {}, ...rest } = props;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [model, setModel] = useState<PlotlyExpressChartModel>();

  const makeModel = useCallback(async () => {
    const widgetData = await fetch();
    const m = new PlotlyExpressChartModel(dh, widgetData, fetch);
    setModel(m);
    return m;
  }, [dh, fetch]);

  useHandleSceneTicks(model, container);

  return (
    <ChartPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...(rest as ChartPanelProps)}
      containerRef={setContainer}
      makeModel={makeModel}
      // @ts-ignore
      Plotly={Plotly}
      metadata={metadata as ChartPanelProps['metadata']}
    />
  );
}

export default PlotlyExpressChartPanel;
