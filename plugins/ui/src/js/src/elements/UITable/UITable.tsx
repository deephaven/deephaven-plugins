import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import {
  DehydratedQuickFilter,
  IrisGrid,
  type IrisGridType,
  type IrisGridContextMenuData,
  IrisGridProps,
  IrisGridUtils,
  IrisGridState,
  DehydratedIrisGridState,
} from '@deephaven/iris-grid';
import {
  ColorValues,
  colorValueStyle,
  resolveCssVariablesInRecord,
  useStyleProps,
  useTheme,
  viewStyleProps,
} from '@deephaven/components';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { TableUtils } from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { getSettings, RootState } from '@deephaven/redux';
import { GridMouseHandler } from '@deephaven/grid';
import { EMPTY_ARRAY, ensureArray } from '@deephaven/utils';
import {
  DatabarConfig,
  FormattingRule,
  getAggregationOperation,
  UITableProps,
} from './UITableUtils';
import UITableMouseHandler from './UITableMouseHandler';
import UITableContextMenuHandler, {
  ResolvableUIContextItem,
  wrapContextActions,
} from './UITableContextMenuHandler';
import UITableModel, { makeUiTableModel } from './UITableModel';
import { UITableLayoutHints } from './JsTableProxy';
import usePersistentState from '../hooks/usePersistentState';

const log = Log.module('@deephaven/js-plugin-ui/UITable');

const ALWAYS_FETCH_COLUMN_LIMIT = 500;

const EMPTY_OBJECT = Object.freeze({});

/**
 * Hook to throw an error during a render cycle so it is caught by the error boundary.
 * Useful to throw from async or callbacks that occur outside the render cycle.
 * @returns [throwError, clearError] to throw an error and clear it respectively
 */
function useThrowError(): [
  throwError: (error: unknown) => void,
  clearError: () => void,
] {
  const [error, setError] = useState<unknown>(null);
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  if (error != null) {
    // Re-throw the error so that the error boundary can catch it
    if (typeof error === 'string') {
      throw new Error(error);
    }
    throw error;
  }

  return [setError, clearError];
}

function useUITableModel({
  dh,
  databars,
  exportedTable,
  layoutHints,
  format,
  columnDisplayNames,
}: {
  dh: typeof DhType;
  databars: DatabarConfig[];
  exportedTable: DhType.WidgetExportedObject;
  layoutHints: UITableLayoutHints;
  format: FormattingRule[];
  columnDisplayNames: Record<string, string>;
}): UITableModel | undefined {
  const [model, setModel] = useState<UITableModel>();
  const [throwError, clearError] = useThrowError();

  // Just load the object on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadModel() {
      try {
        const reexportedTable = await exportedTable.reexport();
        const table = (await reexportedTable.fetch()) as DhType.Table;
        const newModel = await makeUiTableModel(
          dh,
          table,
          databars,
          layoutHints,
          format,
          columnDisplayNames
        );
        if (!isCancelled) {
          clearError();
          setModel(newModel);
        } else {
          newModel.close();
        }
      } catch (e) {
        if (!isCancelled) {
          // Errors thrown from an async useEffect are not caught
          // by the component's error boundary
          throwError(e);
        }
      }
    }
    loadModel();
    return () => {
      isCancelled = true;
    };
  }, [
    databars,
    dh,
    exportedTable,
    layoutHints,
    format,
    columnDisplayNames,
    clearError,
    throwError,
  ]);

  // We want to clean up the model when we unmount or get a new model
  useEffect(() => () => model?.close(), [model]);

  return model;
}

export function UITable({
  format_: formatProp = EMPTY_ARRAY as unknown as FormattingRule[],
  onCellPress,
  onCellDoublePress,
  onColumnPress,
  onColumnDoublePress,
  onRowPress,
  onRowDoublePress,
  quickFilters,
  sorts,
  aggregations,
  aggregationsPosition = 'bottom',
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
  columnDisplayNames = EMPTY_OBJECT,
  density,
  contextMenu = EMPTY_ARRAY as unknown as ResolvableUIContextItem[],
  contextHeaderMenu,
  // TODO: #981 move databars to format and rewire for databar support
  databars = EMPTY_ARRAY as unknown as DatabarConfig[],
  ...userStyleProps
}: UITableProps): JSX.Element | null {
  const id = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  console.log('render table', id);
  const [throwError] = useThrowError();

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
  const utils = useMemo(() => new IrisGridUtils(dh), [dh]);
  const settings = useSelector(getSettings<RootState>);
  const format = useMemo(() => ensureArray(formatProp), [formatProp]);
  const layoutHints = useMemo(
    () => ({
      frontColumns,
      backColumns,
      frozenColumns,
      hiddenColumns,
      columnGroups,
    }),
    [frontColumns, backColumns, frozenColumns, hiddenColumns, columnGroups]
  );

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

    const colorRecord: Record<string, string> = {};
    ColorValues.forEach(c => {
      colorRecord[c] = colorValueStyle(c);
    });
    colorSet.forEach(c => {
      colorRecord[c] = colorValueStyle(c);
    });

    const resolvedColors = resolveCssVariablesInRecord(colorRecord);
    const newColorMap = new Map<string, string>();
    Object.entries(resolvedColors).forEach(([key, value]) => {
      newColorMap.set(key, value);
    });
    return newColorMap;
  }, [theme, databars]);

  const model = useUITableModel({
    dh,
    databars,
    exportedTable,
    layoutHints,
    format,
    columnDisplayNames,
  });
  const columns = model?.columns ?? EMPTY_ARRAY;

  if (model) {
    model.setColorMap(colorMap);
  }

  const prevState = useRef<IrisGridState | undefined>();
  const [dehydratedState, setDehydratedState] = usePersistentState<
    DehydratedIrisGridState | undefined
  >(undefined);
  const initialState = useRef(dehydratedState);

  const onStateChange = useCallback(
    (newState: IrisGridState) => {
      if (
        model == null ||
        newState.metrics == null ||
        newState === prevState.current ||
        newState.sorts === prevState.current?.sorts
      ) {
        return;
      }
      // console.log('onStateChange', newState);
      prevState.current = newState;
      setDehydratedState(
        utils.dehydrateIrisGridState(model, {
          ...newState,
          metrics: {
            userColumnWidths: newState.metrics.userColumnWidths,
            userRowHeights: newState.metrics.userRowHeights,
          },
        })
      );
    },
    [model, setDehydratedState, utils]
  );

  const hydratedState = useMemo(() => {
    if (model && initialState.current) {
      return utils.hydrateIrisGridState(model, initialState.current);
    }
  }, [model, utils]);

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

  // Get any format values that match column names
  // Assume the format value is derived from the column
  const formatColumnSources = useMemo(() => {
    if (columns == null || format.length === 0) {
      return [];
    }
    const columnSet = new Set(columns.map(column => column.name));
    const alwaysFetch: string[] = [];
    format.forEach(rule => {
      Object.entries(rule).forEach(([key, value]) => {
        if (
          key !== 'cols' &&
          key !== 'if_' &&
          typeof value === 'string' &&
          columnSet.has(value)
        ) {
          alwaysFetch.push(value);
        }
      });
    });
    return alwaysFetch;
  }, [format, columns]);

  const alwaysFetchColumnsArray = useMemo(
    () => [...ensureArray(alwaysFetchColumnsProp), ...formatColumnSources],
    [alwaysFetchColumnsProp, formatColumnSources]
  );

  const alwaysFetchColumns = useMemo(() => {
    if (alwaysFetchColumnsArray[0] === true) {
      if (columns.length > ALWAYS_FETCH_COLUMN_LIMIT) {
        throwError(
          `Table has ${columns.length} columns, which is too many to always fetch. ` +
            `If you want to always fetch more than ${ALWAYS_FETCH_COLUMN_LIMIT} columns, pass the full array of column names you want to fetch. ` +
            'This will likely be slow and use a lot of memory. ' +
            'table.column_names contains all columns in a Deephaven table.'
        );
      }
      return columns.map(column => column.name);
    }
    if (alwaysFetchColumnsArray[0] === false) {
      return [];
    }
    return alwaysFetchColumnsArray.filter(
      // This v is string can be removed when we're on a newer TS version. 5.7 infers this properly at least
      (v): v is string => typeof v === 'string'
    );
  }, [alwaysFetchColumnsArray, columns, throwError]);

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
      wrapContextActions(contextMenu, data, alwaysFetchColumns),
    [contextMenu, alwaysFetchColumns]
  );

  const irisGridProps = useMemo(() => {
    const props = {
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
      aggregationSettings: {
        aggregations:
          aggregations != null
            ? ensureArray(aggregations).map(agg => {
                if (agg.cols != null && agg.ignore_cols != null) {
                  throw new Error(
                    'Cannot specify both cols and ignore_cols in a UI table aggregation'
                  );
                }
                return {
                  operation: getAggregationOperation(agg.agg),
                  selected: ensureArray(agg.cols ?? agg.ignore_cols ?? []),
                  // If agg.cols is set, we don't want to invert
                  // If it is not set, then the only other options are ignore_cols or neither
                  // In both cases, we want to invert since we are either ignoring, or selecting all as [] inverted
                  invert: agg.cols == null,
                };
              })
            : [],
        showOnTop: aggregationsPosition === 'top',
      },
    } satisfies Partial<IrisGridProps>;

    // Remove any explicit undefined values
    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined) {
        delete props[key];
      }
    });

    return props;
  }, [
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
    aggregations,
    aggregationsPosition,
  ]);

  return model ? (
    <div
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      className={classNames('ui-table-container', styleProps.className)}
    >
      <IrisGrid
        ref={ref => setIrisGrid(ref)}
        model={model}
        onStateChange={onStateChange}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...hydratedState}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...irisGridProps}
      />
    </div>
  ) : null;
}

UITable.displayName = 'TableElementView';

export default UITable;
