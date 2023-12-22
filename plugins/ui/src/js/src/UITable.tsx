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

  const hydratedSorts = useMemo(() => {
    if (sorts !== undefined && columns !== undefined) {
      log.debug('Hydrating sorts', sorts);

      const utils = new IrisGridUtils(dh);

      return utils.hydrateSort(columns, sorts);
    }
    return undefined;
  }, [columns, dh, sorts]);

  const hydratedQuickFilters = useMemo(() => {
    let quickFilters;

    if (filters !== undefined && model !== undefined && columns !== undefined) {
      log.debug('Hydrating filters', filters);

      const dehydratedQuickFilters: DehydratedQuickFilter[] = [];
      quickFilters = {};
      const utils = new IrisGridUtils(dh);

      Object.entries(filters).forEach(([columnName, filter]) => {
        const columnIndex = model.getColumnIndexByName(columnName);
        if (columnIndex !== undefined) {
          dehydratedQuickFilters.push([columnIndex, { text: filter }]);
        }
      });

      quickFilters = utils.hydrateQuickFilters(columns, dehydratedQuickFilters);
    }
    return quickFilters;
  }, [filters, model, columns, dh]);

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      const reexportedTable = await exportedTable.reexport();
      const newTable = (await reexportedTable.fetch()) as Table;
      const newModel = await IrisGridModelFactory.makeModel(dh, newTable);
      if (!isCancelled) {
        setModel(newModel);
        setColumns(newTable.columns);
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
