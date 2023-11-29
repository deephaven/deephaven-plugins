import React, { useEffect, useMemo, useState } from 'react';
import {
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { UITableNode } from './UITableUtils';
import TableObject from './TableObject';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

export interface UITableProps {
  element: UITableNode;
}

function UITable({ element }: UITableProps) {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const { props: elementProps } = element;

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      log.debug('Loading table from props', elementProps);
      const newTable = (await elementProps.table.fetch()) as Table;
      const newModel = await IrisGridModelFactory.makeModel(dh, newTable);
      if (!isCancelled) {
        setModel(newModel);
      } else {
        newModel.close();
      }
    }
    loadModel();
    return () => {
      isCancelled = true;
    };
  }, [dh, elementProps]);

  const irisGridProps: Partial<IrisGridProps> = useMemo(() => {
    const { onRowDoublePress } = elementProps;
    return { onDataSelected: onRowDoublePress };
  }, [elementProps]);

  // We want to clean up the model when we unmount or get a new model
  useEffect(() => () => model?.close(), [model]);

  return table ? (
    <TableObject object={table} irisGridProps={irisGridProps} />
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
