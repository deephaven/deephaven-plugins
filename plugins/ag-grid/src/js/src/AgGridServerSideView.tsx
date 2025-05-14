import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { WorkspaceSettings } from '@deephaven/redux';
import { createFormatterFromSettings } from '@deephaven/jsapi-utils';
import { ColDef } from '@ag-grid-community/core';
import { AgGridReact, AgGridReactProps } from '@ag-grid-community/react';
import { useMemo } from 'react';
import ServerSideDatasource from './datasources/ServerSideDatasource';
import ViewportDatasource from './datasources/ViewportRowDataSource';
import AgGridTableUtils from './utils/AgGridTableUtils';
import AgGridFormatter from './utils/AgGridFormatter';

type AgGridServerSideViewProps = {
  table: DhType.Table;
  settings?: WorkspaceSettings;
  agGridProps?: AgGridReactProps;
};

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

/**
 * AgGrid view that uses the Server-Side Row Model and a Deephaven table as a data source to display
 * in AG Grid, with support for value formatting, sorting, and basic filtering operations.
 */
export function AgGridServerSideView({
  table,
  settings,
  agGridProps,
}: AgGridServerSideViewProps): JSX.Element | null {
  const dh = useApi();

  log.debug('AgGridView rendering', table, table?.columns);

  /** Map from Deephaven Table Columns to AG Grid ColDefs */
  const colDefs: ColDef[] = useMemo(
    () =>
      table?.columns.map(c => {
        const templateColDef: Partial<ColDef> = {
          field: c.name,
        };
        return AgGridTableUtils.convertColumnToColDef(c, templateColDef);
      }) ?? [],
    [table]
  );

  /** Create the ViewportDatasource to pass in to AG Grid based on the Deephaven Table */
  const datasource = useMemo(
    () => new ViewportDatasource(dh, table),
    [dh, table]
  );

  // Create the formatter used to format cell values, currently just a
  // wrapper around jsapi-utils Formatter, but more functionality could be added.
  const formatter = useMemo(
    () => new AgGridFormatter(createFormatterFromSettings(dh, settings)),
    [dh, settings]
  );

  return (
    <AgGridReact
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...agGridProps}
      onGridReady={event => {
        log.debug('Grid ready', event);
        datasource.setGridApi(event.api);
      }}
      columnDefs={colDefs}
      dataTypeDefinitions={formatter.cellDataTypeDefinitions}
      viewportDatasource={datasource}
      rowModelType="viewport"
    />
  );
}

export default AgGridServerSideView;
