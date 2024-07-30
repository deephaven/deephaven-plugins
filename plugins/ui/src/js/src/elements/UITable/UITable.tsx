import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  DehydratedQuickFilter,
  IrisGrid,
  type IrisGridType,
  type IrisGridContextMenuData,
  IrisGridModel,
  IrisGridModelFactory,
  IrisGridProps,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { TableUtils } from '@deephaven/jsapi-utils';
import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { getSettings, RootState } from '@deephaven/redux';
import { GridMouseHandler } from '@deephaven/grid';
import { UITableProps, wrapContextActions } from './UITableUtils';
import UITableMouseHandler from './UITableMouseHandler';
import JsTableProxy from './JsTableProxy';
import UITableContextMenuHandler from './UITableContextMenuHandler';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

export function UITable({
  onCellPress,
  onCellDoublePress,
  onColumnPress,
  onColumnDoublePress,
  onRowPress,
  onRowDoublePress,
  quickFilters,
  sorts,
  alwaysFetchColumns,
  table: exportedTable,
  showSearch: showSearchBar,
  showQuickFilters,
  reverse,
  frontColumns,
  backColumns,
  frozenColumns,
  hiddenColumns,
  columnGroups,
  density,
  contextMenu,
  contextHeaderMenu,
}: UITableProps): JSX.Element | null {
  const dh = useApi();
  const [irisGrid, setIrisGrid] = useState<IrisGridType | null>(null);
  const [model, setModel] = useState<IrisGridModel>();
  const [columns, setColumns] = useState<dh.Table['columns']>();
  const utils = useMemo(() => new IrisGridUtils(dh), [dh]);
  const settings = useSelector(getSettings<RootState>);
  const [layoutHints] = useState({
    frontColumns,
    backColumns,
    frozenColumns,
    hiddenColumns,
    columnGroups,
  });

  const hydratedSorts = useMemo(() => {
    if (sorts !== undefined && columns !== undefined) {
      log.debug('Hydrating sorts', sorts);

      return utils.hydrateSort(columns, sorts);
    }
    return undefined;
  }, [columns, utils, sorts]);

  const hydratedQuickFilters = useMemo(() => {
    if (
      quickFilters !== undefined &&
      model !== undefined &&
      columns !== undefined
    ) {
      log.debug('Hydrating filters', quickFilters);

      const dehydratedQuickFilters: DehydratedQuickFilter[] = [];

      Object.entries(quickFilters).forEach(([columnName, filter]) => {
        const columnIndex = model.getColumnIndexByName(columnName);
        if (columnIndex !== undefined) {
          dehydratedQuickFilters.push([columnIndex, { text: filter }]);
        }
      });

      return utils.hydrateQuickFilters(columns, dehydratedQuickFilters);
    }
    return undefined;
  }, [quickFilters, model, columns, utils]);

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      const reexportedTable = await exportedTable.reexport();
      const table = await reexportedTable.fetch();
      const newTable = new JsTableProxy({
        table: table as dh.Table,
        layoutHints,
      });
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
  }, [dh, exportedTable, layoutHints]);

  const mouseHandlers = useMemo(
    () =>
      model && irisGrid
        ? ([
            new UITableMouseHandler(
              model,
              irisGrid,
              onCellPress,
              onCellDoublePress,
              onColumnPress,
              onColumnDoublePress,
              onRowPress,
              onRowDoublePress
            ),
            new UITableContextMenuHandler(
              dh,
              irisGrid,
              model,
              contextMenu,
              contextHeaderMenu
            ),
          ] as readonly GridMouseHandler[])
        : undefined,
    [
      model,
      dh,
      irisGrid,
      onCellPress,
      onCellDoublePress,
      onColumnPress,
      onColumnDoublePress,
      onRowPress,
      onRowDoublePress,
      contextMenu,
      contextHeaderMenu,
    ]
  );

  const onContextMenu = useCallback(
    (data: IrisGridContextMenuData) =>
      wrapContextActions(contextMenu ?? [], data),
    [contextMenu]
  );

  const irisGridProps = useMemo(
    () =>
      ({
        mouseHandlers,
        alwaysFetchColumns,
        showSearchBar,
        sorts: hydratedSorts,
        quickFilters: hydratedQuickFilters,
        isFilterBarShown: showQuickFilters,
        reverseType: reverse
          ? TableUtils.REVERSE_TYPE.POST_SORT
          : TableUtils.REVERSE_TYPE.NONE,
        density,
        settings,
        onContextMenu,
      }) satisfies Partial<IrisGridProps>,
    [
      mouseHandlers,
      alwaysFetchColumns,
      showSearchBar,
      showQuickFilters,
      hydratedSorts,
      hydratedQuickFilters,
      reverse,
      density,
      settings,
      onContextMenu,
    ]
  );

  // We want to clean up the model when we unmount or get a new model
  useEffect(() => () => model?.close(), [model]);

  return model ? (
    <div className="ui-object-container">
      <IrisGrid
        ref={ref => setIrisGrid(ref)}
        model={model}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...irisGridProps}
      />
    </div>
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
