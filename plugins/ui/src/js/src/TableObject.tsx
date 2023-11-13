import React, { useEffect, useState } from 'react';
import {
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import { View } from '@adobe/react-spectrum';

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

  useEffect(() => {
    async function loadModel() {
      const newModel = await IrisGridModelFactory.makeModel(dh, object);
      setModel(newModel);
    }
    loadModel();
  }, [dh, object]);

  return (
    <View flexGrow={1} flexShrink={1} overflow="hidden" position="relative">
      {model && (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <IrisGrid model={model} {...irisGridProps} />
      )}
    </View>
  );
}

TableObject.displayName = 'TableObject';

export default TableObject;
