import React, { useEffect, useState } from 'react';
import { Chart, ChartModel, ChartModelFactory } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Figure } from '@deephaven/jsapi-types';
import shortid from 'shortid';

export interface FigureObjectProps {
  object: Figure;
}

function FigureObject(props: FigureObjectProps) {
  const { object } = props;
  const dh = useApi();
  const [model, setModel] = useState<ChartModel>();
  const [key, setKey] = useState(shortid());

  useEffect(() => {
    async function loadModel() {
      const newModel = await ChartModelFactory.makeModel(dh, undefined, object);
      setModel(newModel);

      // TODO: Chart.tsx doesn't handle the case where the model has been updated. Update the key so we get a new chart every time the model updates.
      setKey(shortid());
    }
    loadModel();
  }, [dh, object]);

  return (
    <div className="ui-figure-object">
      {model && <Chart model={model} key={key} />}
    </div>
  );
}

FigureObject.displayName = 'FigureObject';

export default FigureObject;
