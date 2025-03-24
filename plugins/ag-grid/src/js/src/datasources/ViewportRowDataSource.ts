import {
  IViewportDatasource,
  IViewportDatasourceParams,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-ag-grid/ViewportRowDataSource');

export class ViewportDataSource implements IViewportDatasource {
  private params?: IViewportDatasourceParams;

  /**
   * Create a Viewport Row Model data source that can be used with AG Grid.
   *
   * https://www.ag-grid.com/react-data-grid/viewport/
   *
   * @param dh Deephaven API instance to use
   * @param table Deephaven table to use
   */
  constructor(
    private dh: typeof DhType,
    private table: DhType.Table
  ) {
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  init(params: IViewportDatasourceParams): void {
    log.debug('Initializing ViewportDataSource', params);
    this.params = params;
    this.startListening();
    // Just set an initial viewport...
    this.table.setViewport(0, 100);
  }

  private startListening() {
    this.table.addEventListener(this.dh.Table.EVENT_UPDATED, this.handleUpdate);
    this.table.addEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
  }

  private stopListening() {
    this.table.removeEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleUpdate
    );
    this.table.removeEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
  }

  private handleUpdate(event: DhType.Event<DhType.ViewportData>): void {
    const newData: Record<number, unknown> = {};

    const { detail: data } = event;
    const { columns, offset } = data;
    for (let r = 0; r < data.rows.length; r += 1) {
      const row = data.rows[r];
      newData[offset + r] = this.extractViewportRow(row, columns);
    }

    log.debug('Updating viewport data', this.table.size, newData);
    this.params?.setRowData(newData);
    this.params?.setRowCount(this.table.size);
  }

  // eslint-disable-next-line class-methods-use-this
  private extractViewportRow(
    row: DhType.Row,
    columns: DhType.Column[]
  ): { [key: string]: unknown } {
    const data: Record<string, unknown> = {};
    for (let c = 0; c < columns.length; c += 1) {
      const column = columns[c];
      data[column.name] = row.get(column);
    }

    return data;
  }

  // eslint-disable-next-line class-methods-use-this
  private handleDisconnect(): void {
    log.info('Table disconnected, stopping listening');
    this.stopListening();
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    log.debug('setViewportRange', firstRow, lastRow);
    this.table.setViewport(firstRow, lastRow);
  }

  destroy(): void {
    this.stopListening();
    this.table.close();
  }
}

export default ViewportDataSource;
