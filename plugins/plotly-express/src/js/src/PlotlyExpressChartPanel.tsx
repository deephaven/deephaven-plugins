import React, { useCallback, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { ChartPanel, ChartPanelProps } from '@deephaven/dashboard-core-plugins';
import type { Widget } from '@deephaven/jsapi-types';
import { type WidgetPanelProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';
import { useHandleSceneTicks } from './useHandleSceneTicks.js';

export function PlotlyExpressChartPanel(props: WidgetPanelProps<Widget>) {
  const dh = useApi();
  const { fetch, metadata = {}, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<PlotlyExpressChartModel>();
  const [widgetRevision, setWidgetRevision] = useState(0); // Used to force a clean chart state on widget change

  const makeModel = useCallback(async () => {
    const widgetData = await fetch();
    const m = new PlotlyExpressChartModel(dh, widgetData, fetch);
    setModel(m);
    setWidgetRevision(r => r + 1);
    return m;
  }, [dh, fetch]);

  useHandleSceneTicks(model, containerRef.current);

  return (
    <ChartPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...(rest as ChartPanelProps)}
      key={widgetRevision}
      containerRef={containerRef}
      makeModel={makeModel}
      Plotly={Plotly}
      metadata={metadata as ChartPanelProps['metadata']}
    />
  );
}

export default PlotlyExpressChartPanel;
