import { useApi } from '@deephaven/jsapi-bootstrap';
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
} from 'ag-grid-community';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AgGridFormatter,
  getAutoGroupColumnDef,
  getColumnDefs,
  getSideBar,
  isPivotTable,
  toGroupKeyString,
  TREE_NODE_KEY,
  TreeNode,
} from '../utils';
import { DeephavenViewportDatasource } from '../datasources';
import { AgGridTableType } from '../types';

export type AgGridViewProps = {
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
  const autoSizedColumnsRef = useRef<Set<string>>(new Set());

  const [isVisible, setIsVisible] = useState(false);
  const [isFirstDataRendered, setIsFirstDataRendered] = useState(false);

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
    const allColumnIds = [
      ...(gridApi.getColumns() ?? []),
      ...(gridApi.getPivotResultColumns() ?? []),
    ].map(c => c.getColId());
    // Only auto-size columns that haven't been auto-sized yet
    const columnsToAutoSize = allColumnIds.filter(
      colId => !autoSizedColumnsRef.current.has(colId)
    );

    log.debug2('autoSizeAllColumns resizing', columnsToAutoSize);
    if (columnsToAutoSize.length > 0) {
      gridApi.autoSizeColumns(columnsToAutoSize);
      columnsToAutoSize.forEach(colId =>
        autoSizedColumnsRef.current.add(colId)
      );
    }
    // Remove any columns that are no longer present in the grid from the auto-sized set
    autoSizedColumnsRef.current.forEach(colId => {
      if (!allColumnIds.includes(colId)) {
        autoSizedColumnsRef.current.delete(colId);
      }
    });
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
    if (isVisible && isFirstDataRendered) {
      autoSizeAllColumns();
    }
  }, [isVisible, isFirstDataRendered]);

  const getRowId = useCallback(
    (params: GetRowIdParams): string => {
      const { data } = params;
      if (data == null) {
        log.warn('getRowId called with null data', params);
        return '';
      }

      if (isPivotTable(table)) {
        const groupKeys = [];
        for (let i = 0; i < table.rowSources.length; i += 1) {
          const rowSource = table.rowSources[i];
          if (data[rowSource.name] != null) {
            groupKeys.push(String(data[rowSource.name]));
          }
        }
        return toGroupKeyString(groupKeys);
      }

      const treeNode: TreeNode | undefined = data?.[TREE_NODE_KEY];
      return `${treeNode?.index ?? ''}`;
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
      getRowId={getRowId}
      sideBar={sideBar}
    />
  );
}

export default AgGridView;
