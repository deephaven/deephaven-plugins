import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  DehydratedQuickFilter,
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { getSettings, RootState } from '@deephaven/redux';
import { EMPTY_ARRAY } from '@deephaven/utils';
import { UITableProps } from './UITableUtils';
import UITableMouseHandler from './UITableMouseHandler';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

function UITable({
  onCellPress,
  onCellDoublePress,
  onColumnPress,
  onColumnDoublePress,
  onRowPress,
  onRowDoublePress,
  filters,
  sorts,
  alwaysFetchColumns,
  table: exportedTable,
  showSearchBar,
  showQuickFilters,
}: UITableProps): JSX.Element | null {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const [columns, setColumns] = useState<dh.Table['columns']>();
  const utils = useMemo(() => new IrisGridUtils(dh), [dh]);
  const settings = useSelector(getSettings<RootState>);

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
      const newTable = (await reexportedTable.fetch()) as dh.Table;
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

  const mouseHandlers = useMemo(
    () =>
      model
        ? [
            new UITableMouseHandler(
              model,
              onCellPress,
              onCellDoublePress,
              onColumnPress,
              onColumnDoublePress,
              onRowPress,
              onRowDoublePress
            ),
          ]
        : EMPTY_ARRAY,
    [
      model,
      onCellPress,
      onCellDoublePress,
      onColumnPress,
      onColumnDoublePress,
      onRowPress,
      onRowDoublePress,
    ]
  );

  const irisGridProps: Partial<IrisGridProps> = useMemo(
    () => ({
      mouseHandlers,
      alwaysFetchColumns,
      showSearchBar,
      sorts: hydratedSorts,
      quickFilters: hydratedQuickFilters,
      isFilterBarShown: showQuickFilters,
      settings,
    }),
    [
      mouseHandlers,
      alwaysFetchColumns,
      showSearchBar,
      showQuickFilters,
      hydratedSorts,
      hydratedQuickFilters,
      settings,
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
