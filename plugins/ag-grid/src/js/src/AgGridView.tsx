import React, { useMemo } from 'react';
import { ColDef, IServerSideDatasource } from '@ag-grid-community/core';
import styles from '@ag-grid-community/styles/ag-grid.css?inline'; // Core CSS
import quartzStyles from '@ag-grid-community/styles/ag-theme-quartz.css?inline'; // Theme
import { AgGridReact } from '@ag-grid-community/react';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import type { Table } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

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
  const datasource: IServerSideDatasource = useMemo(
    () => ({
      async getRows(params) {
        log.debug('getRows', params);
        const { fail, request, success } = params;
        if (table == null) {
          fail();
          return;
        }

        const { startRow, endRow } = request;
        table.setViewport(startRow ?? 0, (endRow ?? table.size) - 1);

        const viewportData = await table.getViewportData();
        log.debug('getRows viewportData', viewportData);
        const rowData = viewportData.rows.map(row => {
          const result: Record<string, unknown> = {};
          for (let i = 0; i < viewportData.columns.length; i += 1) {
            result[table.columns[i].name] = row.get(viewportData.columns[i]);
          }
          return result;
        });

        log.debug('getRows returning data', rowData);

        success({ rowData, rowCount: table.size });
      },
      rowCount: table?.size ?? 0,
    }),
    [table]
  );

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
