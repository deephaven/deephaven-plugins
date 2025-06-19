import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { WorkspaceSettings } from '@deephaven/redux';
import { createFormatterFromSettings } from '@deephaven/jsapi-utils';
import { ColDef, GridReadyEvent } from '@ag-grid-community/core';
import {
  AgGridReact,
  AgGridReactProps,
  CustomCellRendererProps,
} from '@ag-grid-community/react';
import { useCallback, useMemo } from 'react';
import { getColumnDefs } from './utils/AgGridTableUtils';
import AgGridFormatter from './utils/AgGridFormatter';
import TreeCellRenderer from './renderers/TreeCellRenderer';
import DeephavenViewportDatasource from './datasources/DeephavenViewportDatasource';

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

  const treeCellRenderer = useMemo(
    () =>
      function customTreeCellRenderer(props: CustomCellRendererProps) {
        return (
          <TreeCellRenderer
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            datasource={datasource}
          />
        );
      },
    [datasource]
  );

  const autoGroupColumnDef = useMemo(
    () =>
      ({
        cellRenderer: treeCellRenderer,
        cellRendererParams: {
          totalValueGetter: params => {
            log.debug('autoGroupColumnDef cellRendererParams', params);
            return `xxx ${params.value} (${params.node.allChildrenCount})`;
          },
        },
      }) satisfies ColDef,
    [treeCellRenderer]
  );

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      log.debug('handleGridReady', event);
      datasource.setGridApi(event.api);
    },
    [datasource]
  );

  const sideBar = useMemo(
    () => ({
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
        },
      ],
      defaultToolPanel: 'columns',
    }),
    []
  );

  return (
    <AgGridReact
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...agGridProps}
      onGridReady={handleGridReady}
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
