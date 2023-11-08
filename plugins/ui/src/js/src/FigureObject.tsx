import React, { useEffect, useState } from 'react';
import {
  Chart,
  ChartModel,
  ChartModelFactory,
  useChartTheme,
} from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Figure } from '@deephaven/jsapi-types';
import { View } from '@adobe/react-spectrum';

export interface FigureObjectProps {
  object: Figure;
}

function FigureObject({ object }: FigureObjectProps) {
  const dh = useApi();
  const [model, setModel] = useState<ChartModel>();
  const chartTheme = useChartTheme();

  useEffect(() => {
    async function loadModel() {
      const newModel = await ChartModelFactory.makeModel(
        dh,
        undefined,
        object,
        chartTheme
      );
      setModel(newModel);
    }
    loadModel();
  }, [chartTheme, dh, object]);

  return (
    <View flexGrow={1} flexShrink={1} overflow="hidden" position="relative">
      {model && <Chart model={model} />}
    </View>
  );
}

FigureObject.displayName = 'FigureObject';

export default FigureObject;
