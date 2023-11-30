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

export interface UITableElementProps {
  aggregationSettings?: AggregationSettings
  alwaysFetchColumns?: string[];
  backColumns?: string[];
  canSearch?: boolean;
  columnGroups?: ColumnGroup[];
  colorColumns?: string[];
  frozenColumns?: string[];
  frontColumns?: string[];
  hiddenColumns?: string[];
  onRowPress?: (rows: number[]) => void;
  onRowDoublePress?: (rows: number[]) => void;
}

function UITable({ element }: UITableProps) {
  const dh = useApi();
  const [table, setTable] = useState<Table>();
  const { props: elementProps } = element;
  const [hydratedSorts, setHydratedSorts] = useState<undefined>();

  // Just load the object on mount
  useEffect(() => {
    async function loadModel() {
      log.debug('Loading table from props', element.props);
      const newTable = await element.props.table.fetch();

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
