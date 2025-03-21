import React, { useMemo } from 'react';
import { ColDef } from '@ag-grid-community/core';
import styles from '@ag-grid-community/styles/ag-grid.css?inline'; // Core CSS
import quartzStyles from '@ag-grid-community/styles/ag-theme-quartz.css?inline'; // Theme
import { AgGridReact } from '@ag-grid-community/react';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import createDataSource from './DeephavenServerSideDataSource';

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

type AgGridViewProps = { table: Table };

/**
 * Basic AgGrid view that uses a Deephaven table a data source and displays it in AG Grid.
 *
 * Does not support value formatting, sorting, filtering, or basically any functionality beyond
 * just displaying the columns and rows of data.
 */
export function AgGridView({ table }: AgGridViewProps): JSX.Element | null {
  log.info('AgGridView rendering', table, table?.columns);

  /** Map from Deephaven Table Columns to AG Grid ColDefs */
  const colDefs: ColDef[] = useMemo(
    () => table?.columns.map(c => ({ field: c.name })) ?? [],
    [table]
  );

  /** Create the ServerSideDatasource to pass in to AG Grid based on the Deephaven Table */
  const datasource = useMemo(() => createDataSource(table), [table]);

  return (
    <div className="deephaven-ag-grid-view ag-theme-quartz-dark h-100">
      <style>{styles}</style>
      <style>{quartzStyles}</style>
      <AgGridReact
        columnDefs={colDefs}
        serverSideDatasource={datasource}
        rowModelType="serverSide"
        modules={[ServerSideRowModelModule]}
      />
    </div>
  );
}

export default AgGridView;
