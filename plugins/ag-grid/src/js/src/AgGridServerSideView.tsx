import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { ColDef } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { useMemo } from 'react';
import ServerSideDatasource from './datasources/ServerSideDatasource';
import AgGridTableUtils from './utils/AgGridTableUtils';
import AgGridFormatter from './utils/AgGridFormatter';
import { WorkspaceSettings } from '@deephaven/redux';
import { createFormatterFromSettings } from '@deephaven/jsapi-utils';

type AgGridServerSideViewProps = {
  table: DhType.Table;
  settings?: WorkspaceSettings;
};

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

export function AgGridServerSideView({
  table,
  settings,
}: AgGridServerSideViewProps): JSX.Element | null {
  const dh = useApi();

  log.debug('AgGridView rendering', table, table?.columns);

  /** Map from Deephaven Table Columns to AG Grid ColDefs */
  const colDefs: ColDef[] = useMemo(
    () =>
      table?.columns.map(c => {
        const templateColDef: Partial<ColDef> = {
          field: c.name,
          filterParams: {
            buttons: ['reset', 'apply'],
          },
        };
        return AgGridTableUtils.convertColumnToColDef(c, templateColDef);
      }) ?? [],
    [table]
  );

  /** Create the ViewportDatasource to pass in to AG Grid based on the Deephaven Table */
  const datasource = useMemo(
    () => new ServerSideDatasource(dh, table),
    [dh, table]
  );

  const formatter = useMemo(() => {
    return new AgGridFormatter(createFormatterFromSettings(dh, settings));
  }, [dh, settings]);

  return (
    <AgGridReact
      columnDefs={colDefs}
      dataTypeDefinitions={formatter.cellDataTypeDefinitions}
      serverSideDatasource={datasource}
      rowModelType="serverSide"
      modules={[ServerSideRowModelModule]}
    />
  );
}

export default AgGridServerSideView;
