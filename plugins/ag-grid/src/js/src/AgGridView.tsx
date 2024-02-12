import React, { useEffect, useMemo, useState } from 'react';
import { ColDef, IServerSideDatasource } from '@ag-grid-community/core';
import styles from '@ag-grid-community/styles/ag-grid.css?inline'; // Core CSS
import quartzStyles from '@ag-grid-community/styles/ag-theme-quartz.css?inline'; // Theme
import { AgGridReact } from '@ag-grid-community/react';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import type { Table, Widget } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-ag-grid/AgGridView');

/**
 * Basic AgGrid view that loads a Deephaven table and displays it in AG Grid.
 *
 * Does not support value formatting, sorting, filtering, or basically any functionality beyond
 * just displaying the columns and rows of data.
 */
export function AgGridView(
  props: WidgetComponentProps<Widget>
): JSX.Element | null {
  const dh = useApi();
  const { fetch } = props;
  const [table, setTable] = useState<Table>();

  /** First we load the widget object. This is the object that is sent from the server in AgGridMessageStream. */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      log.debug('Fetching widget');
      const widget: Widget = await fetch();
      const newTable = (await widget.exportedObjects[0].fetch()) as Table;
      if (!cancelled) {
        log.info('AgGridView loaded table', newTable);
        setTable(newTable);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  const colDefs: ColDef[] = useMemo(
    () => table?.columns.map(c => ({ field: c.name })) ?? [],
    [table]
  );

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
