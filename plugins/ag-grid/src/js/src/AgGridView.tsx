import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { WorkspaceSettings } from '@deephaven/redux';
import { createFormatterFromSettings } from '@deephaven/jsapi-utils';
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  GridSizeChangedEvent,
  FirstDataRenderedEvent,
} from '@ag-grid-community/core';
import { AgGridReact, AgGridReactProps } from '@ag-grid-community/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getColumnDefs, getSideBar } from './utils/AgGridTableUtils';
import AgGridFormatter from './utils/AgGridFormatter';
import DeephavenViewportDatasource from './datasources/DeephavenViewportDatasource';
import { getAutoGroupColumnDef } from './utils/AgGridRenderUtils';

type AgGridViewProps = {
  table: DhType.Table | DhType.TreeTable;
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

  log.debug('AgGridView rendering', table, table?.columns);

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
      sideBar={sideBar}
    />
  );
}

export default AgGridView;
