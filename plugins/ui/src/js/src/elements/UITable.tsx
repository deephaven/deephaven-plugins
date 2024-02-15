import React, { useEffect, useMemo, useState } from 'react';
import {
  DehydratedQuickFilter,
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { UITableProps } from './UITableUtils';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

function UITable({
  onRowDoublePress,
  canSearch,
  filters,
  sorts,
  alwaysFetchColumns,
  table: exportedTable,
}: UITableProps) {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const [columns, setColumns] = useState<Table['columns']>();
  const utils = useMemo(() => new IrisGridUtils(dh), [dh]);

  const hydratedSorts = useMemo(() => {
    if (sorts !== undefined && columns !== undefined) {
      log.debug('Hydrating sorts', sorts);

      return utils.hydrateSort(columns, sorts);
    }
    return undefined;
  }, [columns, utils, sorts]);

  const hydratedQuickFilters = useMemo(() => {
    if (filters !== undefined && model !== undefined && columns !== undefined) {
      log.debug('Hydrating filters', filters);

      const dehydratedQuickFilters: DehydratedQuickFilter[] = [];

      Object.entries(filters).forEach(([columnName, filter]) => {
        const columnIndex = model.getColumnIndexByName(columnName);
        if (columnIndex !== undefined) {
          dehydratedQuickFilters.push([columnIndex, { text: filter }]);
        }
      });

      return utils.hydrateQuickFilters(columns, dehydratedQuickFilters);
    }
    return undefined;
  }, [filters, model, columns, utils]);

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      const reexportedTable = await exportedTable.reexport();
      const newTable = (await reexportedTable.fetch()) as Table;
      const newModel = await IrisGridModelFactory.makeModel(dh, newTable);
      if (!isCancelled) {
        setColumns(newTable.columns);
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
    () => ({
      onDataSelected: onRowDoublePress,
      alwaysFetchColumns,
      showSearchBar: canSearch,
      sorts: hydratedSorts,
      quickFilters: hydratedQuickFilters,
    }),
    [
      onRowDoublePress,
      alwaysFetchColumns,
      canSearch,
      hydratedSorts,
      hydratedQuickFilters,
    ]
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
