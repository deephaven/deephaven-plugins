import React, { useEffect, useMemo, useState } from 'react';
import { IrisGridProps, IrisGridUtils } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table, ColumnGroup } from '@deephaven/jsapi-types';
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
  const [hydratedSorts, setHydratedSorts] = useState<undefined>();

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

      const utils = new IrisGridUtils(dh);
      const { columns } = newTable;
      const { sorts = null } = elementProps;
      if (sorts != null) {
        log.debug('Hydrating sorts', element.props);
        setHydratedSorts(utils.hydrateSort(columns, sorts));
      }

      setTable(newTable);
    }
    loadModel();
    return () => {
      isCancelled = true;
    };
  }, [dh, element, elementProps]);

  const irisGridProps: Partial<IrisGridProps> = useMemo(() => {
    const { alwaysFetchColumns, onRowDoublePress, canSearch, filters } = elementProps;
    return {
      onDataSelected: onRowDoublePress,
      alwaysFetchColumns,
      showSearchBar: canSearch,
      sorts: hydratedSorts,
      filters,
    };
  }, [elementProps, hydratedSorts]);

  return table ? (
    <TableObject object={table} irisGridProps={irisGridProps} />
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
