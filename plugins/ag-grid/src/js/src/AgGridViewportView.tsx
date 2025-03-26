import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { ColDef } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { ViewportRowModelModule } from '@ag-grid-enterprise/viewport-row-model';
import { useMemo } from 'react';
import ViewportDatasource from './datasources/ViewportRowDatasource';

type AgGridViewportViewProps = {
  table: DhType.Table;
};

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

export function AgGridViewportView({
  table,
}: AgGridViewportViewProps): JSX.Element | null {
  const dh = useApi();

  log.debug('AgGridView rendering', table, table?.columns);

  /** Map from Deephaven Table Columns to AG Grid ColDefs */
  const colDefs: ColDef[] = useMemo(
    () => table?.columns.map(c => ({ field: c.name })) ?? [],
    [table]
  );

  /** Create the ViewportDatasource to pass in to AG Grid based on the Deephaven Table */
  const datasource = useMemo(
    () => new ViewportDatasource(dh, table),
    [dh, table]
  );

  return (
    <AgGridReact
      columnDefs={colDefs}
      viewportDatasource={datasource}
      rowModelType="viewport"
      modules={[ViewportRowModelModule]}
    />
  );
}

export default AgGridViewportView;
