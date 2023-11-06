import React, { useCallback, useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import {
  ChartPanel,
  type ChartPanelProps,
} from '@deephaven/dashboard-core-plugins';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';
import { type PlotlyChartWidget } from './PlotlyExpressChartUtils.js';

export interface PlotlyExpressChartPanelProps
  extends Pick<
    ChartPanelProps,
    | 'Plotly'
    | 'containerRef'
    | 'metadata'
    | 'glContainer'
    | 'glEventHub'
    | 'localDashboardId'
    | 'panelState'
  > {
  fetch(): Promise<PlotlyChartWidget>;
}

function PlotlyExpressChartPanel(props: PlotlyExpressChartPanelProps) {
  const dh = useApi();
  const { fetch, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<PlotlyExpressChartModel>();

  const makeModel = useCallback(async () => {
    const widgetData = await fetch();
    const m = new PlotlyExpressChartModel(dh, widgetData, fetch);
    setModel(m);
    return m;
  }, [dh, fetch]);

  useEffect(
    function handleSceneTicks() {
      // Plotly scenes and geo views reset when our data ticks
      // Pause rendering data updates when the user is manipulating a scene
      if (
        !model ||
        !containerRef.current ||
        !model.shouldPauseOnUserInteraction()
      ) {
        return;
      }

      const container = containerRef.current;

      function handleMouseDown() {
        model?.pauseUpdates();
        // The once option removes the listener after it is called
        window.addEventListener('mouseup', handleMouseUp, { once: true });
      }

      function handleMouseUp() {
        model?.resumeUpdates();
      }

      let wheelTimeout = 0;

      function handleWheel() {
        model?.pauseUpdates();
        window.clearTimeout(wheelTimeout);
        wheelTimeout = window.setTimeout(() => {
          model?.resumeUpdates();
        }, 300);
      }

      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('wheel', handleWheel);

      return () => {
        window.clearTimeout(wheelTimeout);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('wheel', handleWheel);
      };
    },
    [model]
  );

  return (
    <ChartPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      containerRef={containerRef}
      makeModel={makeModel}
      Plotly={Plotly}
    />
  );
}

PlotlyExpressChartPanel.displayName = 'PlotlyExpressChartPanel';

export default PlotlyExpressChartPanel;
