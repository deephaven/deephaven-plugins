import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Chart, ChartModel, ChartModelFactory } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Figure } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { View } from '@adobe/react-spectrum';
import {
  ReactSpectrumComponent,
  extractSpectrumHTMLElement,
} from '@deephaven/react-hooks';
import useResizeObserver from './useResizeObserver';

const log = Log.module('@deephaven/js-plugin-ui/FigureObject');

export interface FigureObjectProps {
  object: Figure;
}

function FigureObject({ object }: FigureObjectProps) {
  const dh = useApi();
  const [model, setModel] = useState<ChartModel>();
  const chart = useRef<Chart>(null);
  const viewComponent = useRef<ReactSpectrumComponent>(null);
  const viewElement = extractSpectrumHTMLElement(viewComponent.current);

  useEffect(() => {
    async function loadModel() {
      const newModel = await ChartModelFactory.makeModel(dh, undefined, object);
      setModel(newModel);
    }
    loadModel();
  }, [dh, object]);

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      log.debug2('handleResize', entries);
      chart.current?.updateDimensions();
    },
    [chart]
  );

  useResizeObserver(viewElement, handleResize);

  return (
    <View
      flexGrow={1}
      flexShrink={1}
      overflow="hidden"
      position="relative"
      ref={viewComponent}
    >
      {model && <Chart model={model} ref={chart} />}
    </View>
  );
}

FigureObject.displayName = 'FigureObject';

export default FigureObject;
