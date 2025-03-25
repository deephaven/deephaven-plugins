import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-ag-grid/ServerSideDataSource');

export class ServerSideDatasource implements IServerSideDatasource {
  /**
   * Create a Server Side Datasource that can be used with AG Grid.
   *
   * https://www.ag-grid.com/react-data-grid/server-side-model-datasource/
   *
   * @param dh Deephaven API instance to use
   * @param table Deephaven table to use
   */
  constructor(
    private dh: typeof DhType,
    private table: DhType.Table
  ) {
    // this.handleUpdate = this.handleUpdate.bind(this);
    // this.handleDisconnect = this.handleDisconnect.bind(this);
    // this.startListening();
  }

  // private startListening() {
  //   this.table.addEventListener(this.dh.Table.EVENT_UPDATED, this.handleUpdate);
  //   this.table.addEventListener(
  //     this.dh.Table.EVENT_DISCONNECT,
  //     this.handleDisconnect
  //   );
  // }

  // private stopListening() {
  //   this.table.removeEventListener(
  //     this.dh.Table.EVENT_UPDATED,
  //     this.handleUpdate
  //   );
  //   this.table.removeEventListener(
  //     this.dh.Table.EVENT_DISCONNECT,
  //     this.handleDisconnect
  //   );
  // }

  // private handleUpdate(event: DhType.Event<DhType.ViewportData>): void {
  //   const newData: Record<number, unknown> = {};

  //   const { detail: data } = event;
  //   const { columns, offset } = data;
  //   for (let r = 0; r < data.rows.length; r += 1) {
  //     const row = data.rows[r];
  //     newData[offset + r] = this.extractViewportRow(row, columns);
  //   }

  //   log.debug('Updating viewport data', this.table.size, newData);
  //   this.params?.setRowData(newData);
  //   this.params?.setRowCount(this.table.size);
  // }

  // // eslint-disable-next-line class-methods-use-this
  // private extractViewportRow(
  //   row: DhType.Row,
  //   columns: DhType.Column[]
  // ): { [key: string]: unknown } {
  //   const data: Record<string, unknown> = {};
  //   for (let c = 0; c < columns.length; c += 1) {
  //     const column = columns[c];
  //     data[column.name] = row.get(column);
  //   }

  //   return data;
  // }

  // private handleDisconnect(): void {
  //   this.destroy?.();
  // }

  async getRows(params: IServerSideGetRowsParams): Promise<void> {
    const { fail, request, success } = params;
    if (this.table == null) {
      fail();
      return;
    }
    log.debug('getRows', request);

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
