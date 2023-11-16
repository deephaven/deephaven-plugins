import React, { useCallback, useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { ChartPanel, ChartPanelProps } from '@deephaven/dashboard-core-plugins';
import { Chart } from '@deephaven/chart';
import {
  type WidgetComponentProps,
  type WidgetPanelProps,
} from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';

function useHandleSceneTicks(
  model: PlotlyExpressChartModel | undefined,
  container: HTMLDivElement | null
) {
  useEffect(() => {
    // Plotly scenes and geo views reset when our data ticks
    // Pause rendering data updates when the user is manipulating a scene
    if (!model || !container || !model.shouldPauseOnUserInteraction()) {
      return;
    }

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
  }, [model, container]);
}

export function PlotlyExpressChart(
  props: WidgetComponentProps
): JSX.Element | null {
  const dh = useApi();
  const { fetch } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<PlotlyExpressChartModel>();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const widgetData = await fetch();
      if (!cancelled) {
        setModel(new PlotlyExpressChartModel(dh, widgetData, fetch));
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  useHandleSceneTicks(model, containerRef.current);

  return model ? (
    <Chart
      // eslint-disable-next-line react/jsx-props-no-spreading, @typescript-eslint/ban-ts-comment
      // @ts-ignore
      containerRef={containerRef}
      model={model}
      Plotly={Plotly}
    />
  ) : null;
}

export function PlotlyExpressChartPanel(props: WidgetPanelProps) {
  const dh = useApi();
  const { fetch, metadata = {}, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<PlotlyExpressChartModel>();

  const makeModel = useCallback(async () => {
    const widgetData = await fetch();
    const m = new PlotlyExpressChartModel(dh, widgetData, fetch);
    setModel(m);
    return m;
  }, [dh, fetch]);

  useHandleSceneTicks(model, containerRef.current);

  return (
    <ChartPanel
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...(rest as ChartPanelProps)}
      containerRef={containerRef}
      makeModel={makeModel}
      Plotly={Plotly}
      metadata={metadata as ChartPanelProps['metadata']}
    />
  );
}
