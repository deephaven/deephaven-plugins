import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from '@ag-grid-community/core';
import type { Table } from '@deephaven/jsapi-types';

export class ServerSideDatasource implements IServerSideDatasource {
  constructor(private table: Table) {}

  async getRows(params: IServerSideGetRowsParams): Promise<void> {
    const { fail, request, success } = params;
    if (this.table == null) {
      fail();
      return;
    }

    const { startRow, endRow } = request;
    this.table.setViewport(startRow ?? 0, (endRow ?? this.table.size) - 1);

    const viewportData = await this.table.getViewportData();
    const rowData = viewportData.rows.map(row => {
      const result: Record<string, unknown> = {};
      for (let i = 0; i < viewportData.columns.length; i += 1) {
        result[this.table.columns[i].name] = row.get(viewportData.columns[i]);
      }
      return result;
    });

    success({ rowData, rowCount: this.table.size });
  }

  destroy?(): void {
    this.table.close();
  }
}

export default ServerSideDatasource;
