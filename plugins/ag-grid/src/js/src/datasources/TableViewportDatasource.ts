import {
  Column,
  FilterModel,
  IViewportDatasourceParams,
  SortModelItem,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';
import AgGridSortUtils from '../utils/AgGridSortUtils';
import AbstractViewportDatasource from './AbstractViewportDatasource';

const log = Log.module('@deephaven/js-plugin-ag-grid/TableViewportDatasource');

export class TableViewportDatasource extends AbstractViewportDatasource {
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
    super();
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  init(params: IViewportDatasourceParams): void {
    super.init(params);
    this.startListening();
    this.params?.setRowCount(this.table.size);
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

  private handleDisconnect(): void {
    log.info('Table disconnected, stopping listening');
    this.stopListening();
  }

  applyFilter(filterModel: FilterModel): void {
    log.debug('Applying filter model', filterModel);
    assertNotNull(this.gridApi);
    this.table.applyFilter(
      AgGridFilterUtils.parseFilterModel(
        this.dh,
        this.table,
        this.gridApi.getFilterModel()
      )
    );
  }

  applySort(sortModel: SortModelItem[]): void {
    log.debug('Applying sort model', sortModel);
    this.table.applySort(AgGridSortUtils.parseSortModel(this.table, sortModel));
  }

  applyViewport(firstRow: number, lastRow: number): void {
    log.debug('Applying viewport', firstRow, lastRow);
    this.table.setViewport(firstRow, lastRow);
  }

  destroy(): void {
    super.destroy();
    this.stopListening();
    // this.table.close();
  }
}

export default TableViewportDatasource;
