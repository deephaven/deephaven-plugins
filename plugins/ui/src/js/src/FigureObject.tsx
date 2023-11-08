import React, { useEffect, useState } from 'react';
import { Chart, ChartModel, ChartModelFactory } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Figure } from '@deephaven/jsapi-types';
import { View } from '@adobe/react-spectrum';

export interface FigureObjectProps {
  object: Figure;
}

function FigureObject({ object }: FigureObjectProps) {
  const dh = useApi();
  const [model, setModel] = useState<ChartModel>();

  useEffect(() => {
    async function loadModel() {
      const newModel = await ChartModelFactory.makeModel(dh, undefined, object);
      setModel(newModel);
    }
    loadModel();
  }, [dh, object]);

  return (
    <View flexGrow={1} flexShrink={1} overflow="hidden" position="relative">
      {model && <Chart model={model} />}
    </View>
  );
}

FigureObject.displayName = 'FigureObject';

export default FigureObject;
