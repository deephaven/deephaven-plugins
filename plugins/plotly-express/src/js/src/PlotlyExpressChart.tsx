import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Plotly from 'plotly.js';
import { Chart } from '@deephaven/chart';
import type { dh } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { getSettings, type RootState } from '@deephaven/redux';
import PlotlyExpressChartModel from './PlotlyExpressChartModel.js';
import { useHandleSceneTicks } from './useHandleSceneTicks.js';

export function PlotlyExpressChart(
  props: WidgetComponentProps<dh.Widget>
): JSX.Element | null {
  const dh = useApi();
  const { fetch } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<PlotlyExpressChartModel>();
  const settings = useSelector(getSettings<RootState>);
  const [widgetRevision, setWidgetRevision] = useState(0); // Used to force a clean chart state on widget change

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const widgetData = await fetch();
      if (!cancelled) {
        setModel(new PlotlyExpressChartModel(dh, widgetData, fetch));
        setWidgetRevision(r => r + 1);
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
      key={widgetRevision}
      containerRef={containerRef}
      model={model}
      settings={settings}
      Plotly={Plotly}
    />
  ) : null;
}

export default PlotlyExpressChart;
