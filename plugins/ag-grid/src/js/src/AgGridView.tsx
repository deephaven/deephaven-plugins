import React, { useMemo } from 'react';
import { ColDef } from '@ag-grid-community/core';
import styles from '@ag-grid-community/styles/ag-grid.css?inline'; // Core CSS
import quartzStyles from '@ag-grid-community/styles/ag-theme-quartz.css?inline'; // Theme
import { AgGridReact } from '@ag-grid-community/react';
import { ViewportRowModelModule } from '@ag-grid-enterprise/viewport-row-model';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import ViewportDataSource from './datasources/ViewportRowDataSource';

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

type AgGridViewProps = { table: DhType.Table };

/**
 * Basic AgGrid view that uses a Deephaven table a data source and displays it in AG Grid.
 *
 * Does not support value formatting, sorting, filtering, or basically any functionality beyond
 * just displaying the columns and rows of data.
 */
export function AgGridView({ table }: AgGridViewProps): JSX.Element | null {
  const dh = useApi();

  log.info('AgGridView rendering', table, table?.columns);

  /** Map from Deephaven Table Columns to AG Grid ColDefs */
  const colDefs: ColDef[] = useMemo(
    () => table?.columns.map(c => ({ field: c.name })) ?? [],
    [table]
  );

  /** Create the ViewportDatasource to pass in to AG Grid based on the Deephaven Table */
  const datasource = useMemo(
    () => new ViewportDataSource(dh, table),
    [dh, table]
  );

  return (
    <div className="deephaven-ag-grid-view ag-theme-quartz-dark h-100">
      <style>{styles}</style>
      <style>{quartzStyles}</style>
      <AgGridReact
        columnDefs={colDefs}
        // viewportDatasource={datasource}
        viewportDatasource={datasource}
        rowModelType="viewport"
        // rowModel="viewport"
        modules={[ViewportRowModelModule]}
      />
    </div>
  );
}

export default AgGridView;
