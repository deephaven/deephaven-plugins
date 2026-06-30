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
  type ChartBuilderSettings,
  type DehydratedQuickFilter,
  IrisGrid,
  type IrisGridModel,
  type IrisGridType,
  type IrisGridContextMenuData,
  type IrisGridProps,
  IrisGridUtils,
  IrisGridCacheUtils,
  type IrisGridState,
  type DehydratedIrisGridState,
  type DehydratedGridState,
  isIrisGridTableModelTemplate,
} from '@deephaven/iris-grid';
import {
  ColorValues,
  colorValueStyle,
  LoadingOverlay,
  resolveCssVariablesInRecord,
  useStyleProps,
  useTheme,
  viewStyleProps,
} from '@deephaven/components';
import {
  InputFilterEvent,
  IrisGridEvent,
  useDashboardColumnFilters,
  useGridLinker,
  useTablePlugin,
} from '@deephaven/dashboard-core-plugins';
import {
  useDhId,
  useLayoutManager,
  useListener,
  usePersistentState,
} from '@deephaven/dashboard';
import { type dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { getSettings, type RootState } from '@deephaven/redux';
import {
  type GridMouseHandler,
  type GridRange,
  type GridState,
} from '@deephaven/grid';
import { EMPTY_ARRAY, ensureArray } from '@deephaven/utils';
import { useDebouncedCallback, useIsEqualMemo } from '@deephaven/react-hooks';
import deepEqual from 'fast-deep-equal';
import {
  type FormattingRule,
  getAggregationOperation,
  getSelectionDataMap,
  type UITableProps,
} from './UITableUtils';
import UITableMouseHandler from './UITableMouseHandler';
import UITableContextMenuHandler, {
  type ResolvableUIContextItem,
  wrapContextActions,
} from './UITableContextMenuHandler';
import type UITableModel from './UITableModel';
import { makeUiTableModel } from './UITableModel';
import { type UITableLayoutHints } from './JsTableProxy';
import { useExportedObject } from '../hooks';
import WidgetErrorView from '../../widget/WidgetErrorView';

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
  table,
  layoutHints,
  format,
  columnDisplayNames,
}: {
  dh: typeof DhType | null;
  table: DhType.Table | DhType.TreeTable | null;
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
      if (dh == null || table == null) {
        return;
      }
      try {
        const newModel = await makeUiTableModel(
          dh,
          table,
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
    dh,
    table,
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

/**
 * Hydrate the `quick_filters` dict from the server into the quick filter map
 * IrisGrid expects. Returns undefined if the filters or grid are not ready.
 */
function hydrateUITableQuickFilters(
  quickFilters: Record<string, string> | undefined,
  model: UITableModel | undefined,
  columns: readonly DhType.Column[],
  utils: IrisGridUtils | null
): ReturnType<IrisGridUtils['hydrateQuickFilters']> | undefined {
  if (quickFilters === undefined || utils == null || model == null) {
    return undefined;
  }
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

export function UITable({
  format_: formatProp = EMPTY_ARRAY as unknown as FormattingRule[],
  onCellPress,
  onCellDoublePress,
  onColumnPress,
  onColumnDoublePress,
  onRowPress,
  onRowDoublePress,
  onSelectionChange,
  quickFilters,
  defaultQuickFilters,
  sorts,
  defaultSorts,
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
  ...userStyleProps
}: UITableProps): JSX.Element | null {
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

  const { eventHub } = useLayoutManager();

  const {
    widget: table,
    api: dh,
    isLoading,
    error,
  } = useExportedObject<DhType.Table | DhType.TreeTable>(exportedTable);

  const theme = useTheme();
  const [irisGrid, setIrisGrid] = useState<IrisGridType | null>(null);
  const utils = useMemo(
    () => (dh != null ? new IrisGridUtils(dh) : null),
    [dh]
  );
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
    log.debug('Theme changed, updating color map', theme);
    const colorSet = new Set<string>();

    format.forEach(rule => {
      const { mode } = rule;
      if (mode?.type === 'dataBar') {
        const { color, markers } = mode;
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
      }

      [rule.color, rule.background_color].forEach(config => {
        if (
          config != null &&
          typeof config !== 'string' &&
          config.type === 'heatmap'
        ) {
          const { gradient } = config;
          if (Array.isArray(gradient)) {
            gradient.forEach(c => {
              colorSet.add(typeof c === 'string' ? c : c[1]);
            });
          }
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
  }, [theme, format]);

  const model = useUITableModel({
    dh,
    table,
    layoutHints,
    format,
    columnDisplayNames,
  });
  const columns = model?.columns ?? EMPTY_ARRAY;

  if (model) {
    model.setColorMap(colorMap);
  }

  const {
    alwaysFetchColumns: linkerAlwaysFetchColumns,
    columnSelectionValidator,
    isSelectingColumn,
    onColumnSelected,
    onDataSelected,
  } = useGridLinker(model ?? null, irisGrid);

  // This is used by deprecated table plugin props
  const irisGridRef = useRef<IrisGridType | null>(irisGrid);
  irisGridRef.current = irisGrid;

  const [selection, setSelection] = useState<readonly GridRange[]>([]);

  const {
    Plugin,
    customFilters,
    alwaysFetchColumns: pluginFetchColumns,
    onContextMenu: pluginOnContextMenu,
  } = useTablePlugin({
    model,
    irisGridRef,
    irisGridUtils: utils ?? undefined,
    selectedRanges: selection,
  });

  const [dehydratedState, setDehydratedState] = usePersistentState<
    (DehydratedIrisGridState & DehydratedGridState) | undefined
  >(undefined, { type: 'UITable', version: 1 });
  const initialState = useRef(dehydratedState);

  const memoizedStateFn = useMemo(
    () => IrisGridCacheUtils.makeMemoizedCombinedGridStateDehydrator(),
    []
  );

  const onStateChange = useCallback(
    (irisGridState: IrisGridState, gridState: GridState) => {
      if (model == null) {
        return;
      }
      setDehydratedState(memoizedStateFn(model, irisGridState, gridState));
    },
    [memoizedStateFn, model, setDehydratedState]
  );

  // Controlled `sorts`/`quickFilters` are applied as live IrisGrid props and
  // re-applied whenever their value changes. We stabilize them by content so an
  // unrelated re-render (new reference, identical content) does not re-apply and
  // clobber changes the user made in the UI.
  const stableSorts = useIsEqualMemo(sorts, deepEqual);
  const hydratedSorts = useMemo(() => {
    if (stableSorts === undefined || utils == null || columns.length === 0) {
      return undefined;
    }
    log.debug('Hydrating sorts', stableSorts);
    return utils.hydrateSort(columns, stableSorts);
  }, [stableSorts, utils, columns]);

  const stableQuickFilters = useIsEqualMemo(quickFilters, deepEqual);
  const hydratedQuickFilters = useMemo(
    () => hydrateUITableQuickFilters(stableQuickFilters, model, columns, utils),
    [stableQuickFilters, model, columns, utils]
  );

  // Uncontrolled `defaultSorts`/`defaultQuickFilters` are hydrated once (after
  // the columns load) and seeded as the initial grid state. Changes the user
  // makes afterwards are kept by IrisGrid and persisted via onStateChange.
  const hydratedDefaultSortsRef = useRef<IrisGridProps['sorts'] | undefined>(
    undefined
  );
  if (
    hydratedDefaultSortsRef.current === undefined &&
    utils != null &&
    defaultSorts !== undefined &&
    columns.length > 0
  ) {
    hydratedDefaultSortsRef.current = utils.hydrateSort(columns, defaultSorts);
  }
  const hydratedDefaultSorts = hydratedDefaultSortsRef.current;

  const hydratedDefaultQuickFiltersRef = useRef<
    ReturnType<IrisGridUtils['hydrateQuickFilters']> | undefined
  >(undefined);
  if (
    hydratedDefaultQuickFiltersRef.current === undefined &&
    defaultQuickFilters !== undefined &&
    model != null &&
    columns.length > 0
  ) {
    hydratedDefaultQuickFiltersRef.current = hydrateUITableQuickFilters(
      defaultQuickFilters,
      model,
      columns,
      utils
    );
  }
  const hydratedDefaultQuickFilters = hydratedDefaultQuickFiltersRef.current;

  const initialHydratedState = useMemo(() => {
    if (model && utils && initialState.current != null) {
      return {
        ...utils.hydrateIrisGridState(model, initialState.current),
        ...IrisGridUtils.hydrateGridState(model, initialState.current),
      };
    }
    // No persisted client state: seed the uncontrolled defaults as the initial
    // grid state so they apply once on load. Changes the user makes afterwards
    // are kept in IrisGrid's own state and persisted via onStateChange.
    if (
      model &&
      utils &&
      (hydratedDefaultSorts !== undefined ||
        hydratedDefaultQuickFilters !== undefined)
    ) {
      return {
        ...(hydratedDefaultSorts !== undefined
          ? { sorts: hydratedDefaultSorts }
          : {}),
        ...(hydratedDefaultQuickFilters !== undefined
          ? { quickFilters: hydratedDefaultQuickFilters }
          : {}),
      };
    }
  }, [model, utils, hydratedDefaultSorts, hydratedDefaultQuickFilters]);

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

  const alwaysFetchColumnsPropArray = useMemo(() => {
    if (alwaysFetchColumnsProp === true) {
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
    if (alwaysFetchColumnsProp === false || alwaysFetchColumnsProp == null) {
      return [];
    }
    return [...ensureArray(alwaysFetchColumnsProp)];
  }, [alwaysFetchColumnsProp, columns, throwError]);

  const alwaysFetchColumns = useMemo(
    () => [
      // Deduplicate alwaysFetchColumns
      ...new Set([
        ...alwaysFetchColumnsPropArray,
        ...formatColumnSources,
        ...linkerAlwaysFetchColumns,
        ...pluginFetchColumns,
      ]),
    ],
    [
      alwaysFetchColumnsPropArray,
      formatColumnSources,
      linkerAlwaysFetchColumns,
      pluginFetchColumns,
    ]
  );

  const mouseHandlers = useMemo(
    () =>
      model && dh && irisGrid
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
    (data: IrisGridContextMenuData) => [
      ...wrapContextActions(contextMenu, data, alwaysFetchColumns),
      ...pluginOnContextMenu(data),
    ],
    [contextMenu, alwaysFetchColumns, pluginOnContextMenu]
  );

  // Some of the server props rely on the model existing,
  // so we need to start as undefined and set it in the useMemo below once we have a model
  const initialIrisGridServerProps = useRef<Partial<IrisGridProps> | undefined>(
    undefined
  );

  const irisGridServerProps = useMemo(() => {
    if (model == null) {
      return;
    }
    const props = {
      mouseHandlers,
      alwaysFetchColumns,
      showSearchBar,
      sorts: hydratedSorts,
      quickFilters: hydratedQuickFilters,
      isFilterBarShown: showQuickFilters,
      reverse,
      density,
      settings: { ...settings, showExtraGroupColumn: showGroupingColumn },
      onContextMenu,
      aggregationSettings:
        aggregations != null
          ? {
              aggregations: ensureArray(aggregations).map(agg => {
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
              }),
              showOnTop: aggregationsPosition === 'top',
            }
          : undefined,
    } satisfies Partial<IrisGridProps>;

    // Remove any explicit undefined values so we can use client state if available
    (
      Object.entries(props) as [
        keyof typeof props,
        (typeof props)[keyof typeof props],
      ][]
    ).forEach(([key, value]) => {
      if (value === undefined) {
        delete props[key];
      }
    });

    initialIrisGridServerProps.current ??= props;

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
    model,
  ]);

  const handleSelectionChanged = useCallback(
    async (ranges: readonly GridRange[]) => {
      if (model == null || irisGrid == null || onSelectionChange == null) {
        return;
      }

      const selected = getSelectionDataMap(
        ranges,
        model,
        irisGrid,
        alwaysFetchColumnsPropArray
      );

      setSelection(ranges);
      onSelectionChange(selected);
    },
    [irisGrid, model, onSelectionChange, alwaysFetchColumnsPropArray]
  );

  const debouncedHandleSelectionChanged = useDebouncedCallback(
    handleSelectionChanged,
    250
  );

  /**
   * We want to set the props based on a combination of server state and client state.
   * If the server state is the same as its initial state, then we are rehydrating and
   * the client state should take precedence.
   * Otherwise, we have received changes from the server and we should use those over client state.
   * In the future we may want to do a smarter merge of these.
   */
  const mergedIrisGridProps = useMemo(
    () =>
      initialIrisGridServerProps.current === irisGridServerProps
        ? {
            ...irisGridServerProps,
            ...(initialHydratedState ?? {}),
          }
        : {
            ...(initialHydratedState ?? {}),
            ...irisGridServerProps,
          },
    [irisGridServerProps, initialHydratedState]
  );

  const inputFilters = useDashboardColumnFilters(
    model?.columns ?? null,
    model?.table
  );

  const sourcePanelId = useDhId();

  const handleCreateChart = useCallback(
    (
      chartBuilderSettings: ChartBuilderSettings,
      irisGridModel: IrisGridModel
    ) => {
      const tableSettings = dehydratedState
        ? {
            quickFilters: dehydratedState.quickFilters,
            advancedFilters: dehydratedState.advancedFilters,
            sorts: dehydratedState.sorts,
            inputFilters,
          }
        : {};

      eventHub.emit(IrisGridEvent.CREATE_CHART, {
        metadata: {
          settings: chartBuilderSettings,
          sourcePanelId,
          table: irisGridModel.description || 'Table',
          tableSettings,
        },
        table: isIrisGridTableModelTemplate(irisGridModel)
          ? irisGridModel.table
          : undefined,
      });
    },
    [eventHub, sourcePanelId, dehydratedState, inputFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    if (irisGrid == null) {
      return;
    }
    irisGrid.clearAllFilters();
  }, [irisGrid]);

  useListener(
    eventHub,
    InputFilterEvent.CLEAR_ALL_FILTERS,
    handleClearAllFilters
  );

  return (
    <div
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      className={classNames('ui-table-container', styleProps.className)}
    >
      {error != null && <WidgetErrorView error={error} />}
      {error == null && !model && <LoadingOverlay isLoading={isLoading} />}
      {error == null && model && (
        <IrisGrid
          ref={ref => setIrisGrid(ref)}
          model={model}
          onCreateChart={handleCreateChart}
          onStateChange={onStateChange}
          onSelectionChanged={debouncedHandleSelectionChanged}
          columnSelectionValidator={columnSelectionValidator}
          isSelectingColumn={isSelectingColumn}
          onColumnSelected={onColumnSelected}
          onDataSelected={onDataSelected}
          customFilters={customFilters}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...mergedIrisGridProps}
          inputFilters={inputFilters}
        >
          {Plugin}
        </IrisGrid>
      )}
    </div>
  );
}

UITable.displayName = 'TableElementView';

export default UITable;
