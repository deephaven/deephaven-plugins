import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import {
  DehydratedQuickFilter,
  IrisGrid,
  type IrisGridType,
  type IrisGridContextMenuData,
  IrisGridProps,
  IrisGridUtils,
} from '@deephaven/iris-grid';
import {
  colorValueStyle,
  resolveCssVariablesInRecord,
  useStyleProps,
  useTheme,
  viewStyleProps,
} from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { TableUtils } from '@deephaven/jsapi-utils';
import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { getSettings, RootState } from '@deephaven/redux';
import { GridMouseHandler } from '@deephaven/grid';
import { EMPTY_ARRAY, ensureArray } from '@deephaven/utils';
import { UITableProps } from './UITableUtils';
import UITableMouseHandler from './UITableMouseHandler';
import UITableContextMenuHandler, {
  wrapContextActions,
} from './UITableContextMenuHandler';
import UITableModel, { makeUiTableModel } from './UITableModel';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

/**
 * Returns a stable array if none of the elements have changed.
 * Mostly put this here to avoid ignoring the exhaustive-deps rule where there are more deps in the component.
 * @param array The array to make stable
 * @returns A stable array if none of the elements have changed
 */
function useStableArray<T>(array: T[]): T[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableArray = useMemo(() => array, [...array]);
  return stableArray;
}

export function UITable({
  format_: formatProp,
  onCellPress,
  onCellDoublePress,
  onColumnPress,
  onColumnDoublePress,
  onRowPress,
  onRowDoublePress,
  quickFilters,
  sorts,
  alwaysFetchColumns: alwaysFetchColumnsProp,
  table: exportedTable,
  showSearch: showSearchBar,
  showQuickFilters,
  showGroupingColumn,
  reverse,
  frontColumns,
  backColumns,
  frozenColumns,
  hiddenColumns,
  columnGroups,
  density,
  contextMenu,
  contextHeaderMenu,
  databars: databarsProp,
  ...userStyleProps
}: UITableProps): JSX.Element | null {
  const [error, setError] = useState<unknown>(null);

  if (error != null) {
    // Re-throw the error so that the error boundary can catch it
    if (typeof error === 'string') {
      throw new Error(error);
    }
    throw error;
  }

  // Margin looks wrong with ui.table, so we want to map margin to padding instead
  const {
    margin,
    marginTop,
    marginBottom,
    marginStart,
    marginEnd,
    marginX,
    marginY,
    ...restStyleProps
  } = userStyleProps ?? {};
  const { styleProps } = useStyleProps(
    {
      padding: margin,
      paddingTop: marginTop,
      paddingBottom: marginBottom,
      paddingStart: marginStart,
      paddingEnd: marginEnd,
      paddingX: marginX,
      paddingY: marginY,
      ...restStyleProps,
      // Add min and max height if the user set height or width explicitly
      // This fixes issues in flex boxes where one table is auto sized and the other explicit
      // The explicit table will never reach its size because the auto sized table has width/height 100%
      // We don't want to set flex-shrink because it could be the cross-axis value that is explicitly set
      minHeight: restStyleProps.minHeight ?? restStyleProps.height,
      maxHeight: restStyleProps.maxHeight ?? restStyleProps.height,
      minWidth: restStyleProps.minWidth ?? restStyleProps.width,
      maxWidth: restStyleProps.maxWidth ?? restStyleProps.width,
    },
    viewStyleProps // Needed so spectrum applies styles from view instead of base which doesn't have padding
  );

  const dh = useApi();
  const theme = useTheme();
  const [irisGrid, setIrisGrid] = useState<IrisGridType | null>(null);
  const [model, setModel] = useState<UITableModel>();
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

  // TODO: #982 respond to prop changes here
  const [format] = useState(formatProp != null ? ensureArray(formatProp) : []);
  // TODO: #981 move databars to format and rewire for databar support
  const [databars] = useState(databarsProp ?? []);

  const colorMap = useMemo(() => {
    log.debug('Theme changed, updating databar color map', theme);
    const colorSet = new Set<string>();
    databars?.forEach(databar => {
      const { color, markers } = databar;
      if (color != null) {
        if (typeof color === 'string' || Array.isArray(color)) {
          [color].flat().forEach(c => colorSet.add(c));
        } else {
          if (color.positive != null) {
            [color.positive].flat().forEach(c => colorSet.add(c));
          }

          if (color.negative != null) {
            [color.negative].flat().forEach(c => colorSet.add(c));
          }
        }
      }

      markers?.forEach(marker => {
        if (marker.color != null) {
          colorSet.add(marker.color);
        }
      });
    });

    format.forEach(rule => {
      const { color, background_color: backgroundColor } = rule;
      if (color != null) {
        colorSet.add(color);
      }
      if (backgroundColor != null) {
        colorSet.add(backgroundColor);
      }
    });

    const colorRecord: Record<string, string> = {};
    colorSet.forEach(c => {
      colorRecord[c] = colorValueStyle(c);
    });

    const resolvedColors = resolveCssVariablesInRecord(colorRecord);
    const newColorMap = new Map<string, string>();
    Object.entries(resolvedColors).forEach(([key, value]) => {
      newColorMap.set(key, value);
    });
    return newColorMap;
  }, [databars, format, theme]);

  if (model) {
    model.setColorMap(colorMap);
  }

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
      try {
        const reexportedTable = await exportedTable.reexport();
        const table = (await reexportedTable.fetch()) as dh.Table;
        const newModel = await makeUiTableModel(
          dh,
          table,
          databars,
          layoutHints,
          format
        );
        if (!isCancelled) {
          setError(null);
          setColumns(newModel.table.columns);
          setModel(newModel);
        } else {
          newModel.close();
        }
      } catch (e) {
        if (!isCancelled) {
          // Errors thrown from an async useEffect are not caught
          // by the component's error boundary
          setError(e);
        }
      }
    }
    loadModel();
    return () => {
      isCancelled = true;
    };
  }, [databars, dh, exportedTable, layoutHints, format]);

  const modelColumns = model?.columns ?? EMPTY_ARRAY;

  const alwaysFetchColumnsArray = useStableArray(
    ensureArray(alwaysFetchColumnsProp)
  );

  const alwaysFetchColumns = useMemo(() => {
    if (alwaysFetchColumnsArray[0] === true) {
      if (modelColumns.length > 500) {
        setError(
          `Table has ${modelColumns.length} columns, which is too many to always fetch. ` +
            'If you want to always fetch more than 500 columns, pass the full array of column names you want to fetch. ' +
            'This will likely be slow and use a lot of memory. ' +
            'table.column_names contains all columns in a Deephaven table.'
        );
      }
      return modelColumns.map(column => column.name);
    }
    if (alwaysFetchColumnsArray[0] === false) {
      return [];
    }
    return alwaysFetchColumnsArray.filter(v => typeof v === 'string');
  }, [alwaysFetchColumnsArray, modelColumns]);

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
              contextHeaderMenu,
              alwaysFetchColumns
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
      alwaysFetchColumns,
    ]
  );

  const onContextMenu = useCallback(
    (data: IrisGridContextMenuData) =>
      wrapContextActions(contextMenu ?? [], data, alwaysFetchColumns),
    [contextMenu, alwaysFetchColumns]
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
        settings: { ...settings, showExtraGroupColumn: showGroupingColumn },
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
      showGroupingColumn,
      onContextMenu,
    ]
  );

  // We want to clean up the model when we unmount or get a new model
  useEffect(() => () => model?.close(), [model]);

  return model ? (
    <div
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      className={classNames('ui-table-container', styleProps.className)}
    >
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
