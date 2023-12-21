import React, { useEffect, useMemo, useState } from 'react';
import {
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { UITableProps } from './UITableUtils';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

function UITable({ onRowDoublePress, table: exportedTable }: UITableProps) {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      log.debug('Loading table from props', exportedTable);
      const reexportedTable = await exportedTable.reexport();
      const newTable = (await reexportedTable.fetch()) as Table;
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
  }, [dh, exportedTable]);

  const irisGridProps: Partial<IrisGridProps> = useMemo(
    () => ({ onDataSelected: onRowDoublePress }),
    [onRowDoublePress]
  );

  // We want to clean up the model when we unmount or get a new model
  useEffect(() => () => model?.close(), [model]);

  return model ? (
    <div className="ui-object-container">
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <IrisGrid model={model} {...irisGridProps} />
    </div>
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
