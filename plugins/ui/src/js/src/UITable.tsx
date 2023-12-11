import React, { useEffect, useMemo, useState } from 'react';
import { IrisGridProps } from '@deephaven/iris-grid';
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
  const [table, setTable] = useState<Table>();
  const { props: elementProps } = element;

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      log.debug('Loading table from props', element.props);
      const reexportedTable = await element.props.table.reexport();
      const newTable = (await reexportedTable.fetch()) as Table;
      if (isCancelled) {
        newTable.close();
      }
      setTable(newTable);
    }
    loadModel();
    return () => {
      isCancelled = true;
    };
  }, [dh, element]);

  const irisGridProps: Partial<IrisGridProps> = useMemo(() => {
    const { onRowDoublePress } = elementProps;
    return { onDataSelected: onRowDoublePress };
  }, [elementProps]);

  return table ? (
    <TableObject object={table} irisGridProps={irisGridProps} />
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
