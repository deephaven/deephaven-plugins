import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { WorkspaceSettings } from '@deephaven/redux';
import { createFormatterFromSettings } from '@deephaven/jsapi-utils';
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  GridSizeChangedEvent,
  FirstDataRenderedEvent,
  GetRowIdParams,
} from '@ag-grid-community/core';
import { AgGridReact, AgGridReactProps } from '@ag-grid-community/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getColumnDefs,
  getSideBar,
  isPivotTable,
} from './utils/AgGridTableUtils';
import AgGridFormatter from './utils/AgGridFormatter';
import DeephavenViewportDatasource from './datasources/DeephavenViewportDatasource';
import { getAutoGroupColumnDef } from './utils/AgGridRenderUtils';
import AgGridTableType from './AgGridTableType';

type AgGridViewProps = {
  table: AgGridTableType;
  settings?: WorkspaceSettings;
  agGridProps?: AgGridReactProps;
};

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

/**
 * AgGrid view that uses the Server-Side Row Model and a Deephaven table as a data source to display
 * in AG Grid, with support for value formatting, sorting, and basic filtering operations.
 */
export function AgGridView({
  table,
  settings,
  agGridProps,
}: AgGridViewProps): JSX.Element | null {
  const dh = useApi();

  const gridApiRef = useRef<GridApi | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isFirstDataRendered, setIsFirstDataRendered] = useState(false);
  const [isColumnsSized, setIsColumnsSized] = useState(false);

  log.debug('AgGridView rendering', table);

  /** Map from Deephaven Table Columns to AG Grid ColDefs */
  const colDefs: ColDef[] = useMemo(() => getColumnDefs(table), [table]);

  /** Create the ViewportDatasource to pass in to AG Grid based on the Deephaven Table */
  const datasource = useMemo(
    () => new DeephavenViewportDatasource(dh, table),
    [dh, table]
  );

  // Create the formatter used to format cell values, currently just a
  // wrapper around jsapi-utils Formatter, but more functionality could be added.
  const formatter = useMemo(
    () => new AgGridFormatter(createFormatterFromSettings(dh, settings)),
    [dh, settings]
  );

  const autoGroupColumnDef = useMemo(
    () => getAutoGroupColumnDef(datasource),
    [datasource]
  );

  const sideBar = useMemo(() => getSideBar(table), [table]);

  // Workaround to auto-size columns based on their contents, as ag-grid ignores virtual columns
  // that are not visible in the viewport
  const autoSizeAllColumns = () => {
    const gridApi = gridApiRef.current;
    if (!gridApi) return;
    gridApi.sizeColumnsToFit();
    const columns = gridApi.getColumns();
    if (!columns) return;
    const allColumnIds = columns.map(col => col.getColId());
    gridApi.autoSizeColumns(allColumnIds);
  };

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      log.debug('handleGridReady', event);
      datasource.setGridApi(event.api);
      gridApiRef.current = event.api;
    },
    [datasource]
  );

  const handleFirstDataRendered = (event: FirstDataRenderedEvent) => {
    log.debug('handleFirstDataRendered', event);
    setIsFirstDataRendered(true);
  };

  const handleGridSizeChanged = (event: GridSizeChangedEvent) => {
    log.debug('handleGridSizeChanged', event);
    setIsVisible(event.clientHeight > 0 && event.clientWidth > 0);
  };

  useEffect(() => {
    if (isVisible && isFirstDataRendered && !isColumnsSized) {
      setIsColumnsSized(true);
      autoSizeAllColumns();
    }
  }, [isVisible, isFirstDataRendered, isColumnsSized]);

  const getRowId = useCallback(
    (params: GetRowIdParams): string => {
      const { data } = params;
      if (data == null) {
        log.warn('getRowId called with null data', params);
        return '';
      }
      if (isPivotTable(table)) {
        let key = ``;
        for (let i = 0; i < table.rowSources.length; i += 1) {
          const rowSource = table.rowSources[i];
          if (data[rowSource.name] != null) {
            if (key.length > 0) {
              key += '/';
            }
            key += `${data[rowSource.name]}`;
          }
        }
        return key;
      }
      // if (data[PIVOT_ROW_KEY] != null) {
      //   return (data[PIVOT_ROW_KEY] as string[]).join('/');
      // }
      if (data.__row_id == null) {
        // eslint-disable-line no-underscore-dangle
        log.warn('getRowId called with data without id', params);
        return '';
      }
      return String(data.__row_id); // eslint-disable-line no-underscore-dangle
    },
    [table]
  );

  return (
    <AgGridReact
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...agGridProps}
      onGridReady={handleGridReady}
      onFirstDataRendered={handleFirstDataRendered}
      onGridSizeChanged={handleGridSizeChanged}
      autoGroupColumnDef={autoGroupColumnDef}
      columnDefs={colDefs}
      dataTypeDefinitions={formatter.cellDataTypeDefinitions}
      viewportDatasource={datasource}
      rowModelType="viewport"
      // serverSideDatasource={datasource as unknown as PivotDatasource}
      // rowModelType="serverSide"
      pivotMode
      getRowId={getRowId}
      // Set this to true, otherwise AG Grid will try and re-sort columns when we expand/collapse pivots
      enableStrictPivotColumnOrder
      // We use a different separator because the default `_` is used often in column names.
      // `/` is not a valid Java identifier so is good as a separator.
      serverSidePivotResultFieldSeparator="/"
      suppressAggFuncInHeader
      // pivotMode={isPivotTable(table)}
      // sideBar={sideBar}
    />
  );
}

export default AgGridView;
