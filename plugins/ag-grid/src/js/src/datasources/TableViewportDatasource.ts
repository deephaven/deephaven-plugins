import {
  GridApi,
  IViewportDatasource,
  IViewportDatasourceParams,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';
import AgGridSortUtils, { isSortModelItem } from '../utils/AgGridSortUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/ViewportDatasource');

export class TableViewportDatasource implements IViewportDatasource {
  private params?: IViewportDatasourceParams;

  private gridApi?: GridApi;

  private currentViewport?: {
    firstRow: number;
    lastRow: number;
  };

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
    this.handleFilterChanged = this.handleFilterChanged.bind(this);
    this.handleSortChanged = this.handleSortChanged.bind(this);
  }

  init(params: IViewportDatasourceParams): void {
    log.debug('Initializing ViewportDatasource', params);
    this.params = params;
    this.startListening();
    // Set the initial size
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

  // eslint-disable-next-line class-methods-use-this
  private handleDisconnect(): void {
    log.info('Table disconnected, stopping listening');
    this.stopListening();
  }

  setGridApi(gridApi: GridApi): void {
    log.debug('Setting grid API', gridApi);
    this.gridApi = gridApi;
    this.gridApi.addEventListener('filterChanged', this.handleFilterChanged);
    this.gridApi.addEventListener('sortChanged', this.handleSortChanged);
  }

  private handleFilterChanged(event: unknown): void {
    log.debug('Filter changed', event);
    assertNotNull(this.gridApi);
    this.table.applyFilter(
      AgGridFilterUtils.parseFilterModel(
        this.dh,
        this.table,
        this.gridApi.getFilterModel()
      )
    );
    this.refreshViewport();
  }

  private handleSortChanged(event: unknown): void {
    log.debug('Sort changed', event);
    assertNotNull(this.gridApi);
    const columnState = this.gridApi.getColumnState();
    const sortModel = columnState.filter(isSortModelItem);
    this.table.applySort(AgGridSortUtils.parseSortModel(this.table, sortModel));
    this.refreshViewport();
  }

  refreshViewport(): void {
    if (this.currentViewport == null) {
      log.warn('No current viewport to refresh');
      return;
    }
    const { firstRow, lastRow } = this.currentViewport;
    this.table.setViewport(firstRow, lastRow);
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    log.debug('setViewportRange', firstRow, lastRow);
    this.currentViewport = { firstRow, lastRow };
    this.table.setViewport(firstRow, lastRow);
  }

  destroy(): void {
    this.stopListening();
    this.table.close();
  }
}

export default TableViewportDatasource;
