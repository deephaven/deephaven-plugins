import React, { useEffect, useMemo, useState } from 'react';
import { IrisGridProps, IrisGridUtils } from '@deephaven/iris-grid';
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
  const { filters } = elementProps;

  const hydratedSorts = useMemo(() => {
    const { sorts = null } = elementProps;

    if (sorts !== null && table !== undefined) {
      log.debug('Hydrating sorts', sorts);

      const { columns } = table;
      const utils = new IrisGridUtils(dh);

      return utils.hydrateSort(columns, sorts);
    }
    return undefined;
  }, [elementProps, table, dh]);

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      log.debug('Loading table from props', element.props);
      const newTable = (await element.props.table.fetch()) as Table;
      if (isCancelled) {
        newTable.close();
      }

      setTable(newTable);
    }
    loadModel();
    return () => {
      isCancelled = true;
    };
  }, [dh, element, elementProps]);

  const irisGridProps: Partial<IrisGridProps> = useMemo(() => {
    const { alwaysFetchColumns, onRowDoublePress, canSearch } = elementProps;
    return {
      onDataSelected: onRowDoublePress,
      alwaysFetchColumns,
      showSearchBar: canSearch,
      sorts: hydratedSorts,
    };
  }, [elementProps, hydratedSorts]);

  return table ? (
    <TableObject
      object={table}
      irisGridProps={irisGridProps}
      filters={filters}
    />
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
