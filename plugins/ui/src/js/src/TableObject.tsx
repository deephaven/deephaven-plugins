import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { View } from '@adobe/react-spectrum';
import {
  ReactSpectrumComponent,
  extractSpectrumHTMLElement,
} from '@deephaven/react-hooks';
import useResizeObserver from './useResizeObserver';

const log = Log.module('@deephaven/js-plugin-ui/TableObject');

export interface TableObjectProps {
  /** Table object to render */
  object: Table;

  /** Props to add to the IrisGrid instance */
  irisGridProps?: Partial<IrisGridProps>;
}

/**
 * Displays an IrisGrid for a Deephaven Table object.
 */
export function TableObject({ irisGridProps, object }: TableObjectProps) {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const irisGrid = useRef<IrisGrid>(null);
  const viewComponent = useRef<ReactSpectrumComponent>(null);
  const viewElement = extractSpectrumHTMLElement(viewComponent.current);

  useEffect(() => {
    async function loadModel() {
      const newModel = await IrisGridModelFactory.makeModel(dh, object);
      setModel(newModel);
    }
    loadModel();
  }, [dh, object]);

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      log.debug2('handleResize', entries);
      irisGrid.current?.grid?.handleResize();
    },
    [irisGrid]
  );

  useResizeObserver(viewElement, handleResize);

  return (
    <View
      width="100%"
      height="100%"
      overflow="hidden"
      position="relative"
      ref={viewComponent}
    >
      {model && (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <IrisGrid model={model} {...irisGridProps} ref={irisGrid} />
      )}
    </View>
  );
}

TableObject.displayName = 'TableObject';

export default TableObject;
