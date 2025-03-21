import { IServerSideDatasource } from '@ag-grid-community/core';
import type { Table } from '@deephaven/jsapi-types';

export function createDataSource(table: Table): IServerSideDatasource {
  return {
    async getRows(params) {
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

      success({ rowData, rowCount: table.size });
    },
    // rowCount: table?.size ?? 0,
  };
}

export default createDataSource;
