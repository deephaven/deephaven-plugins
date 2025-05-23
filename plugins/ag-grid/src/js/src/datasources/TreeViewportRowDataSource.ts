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

const log = Log.module(
  '@deephaven/js-plugin-ag-grid/TreeViewportRowDataSource'
);

export const TREE_NODE_KEY = '__dhTreeNodeKey__';
export type TreeNode = {
  hasChildren: boolean;
  isExpanded: boolean;
  depth: number;
  index: number;
};
export class TreeViewportDatasource implements IViewportDatasource {
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
   * @param table Deephaven tree table to use
   */
  constructor(
    private dh: typeof DhType,
    private table: DhType.TreeTable
  ) {
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleFilterChanged = this.handleFilterChanged.bind(this);
    this.handleSortChanged = this.handleSortChanged.bind(this);
  }

  init(params: IViewportDatasourceParams): void {
    log.debug('Initializing TreeViewportDataSource', params);
    this.params = params;
    this.startListening();
    // Set the initial size
    this.params?.setRowCount(Math.max(this.table.size, 1));
  }

  private startListening() {
    this.table.addEventListener(
      this.dh.TreeTable.EVENT_UPDATED,
      this.handleUpdate
    );
    this.table.addEventListener(
      this.dh.TreeTable.EVENT_DISCONNECT,
      this.handleDisconnect
    );
  }

  private stopListening() {
    this.table.removeEventListener(
      this.dh.TreeTable.EVENT_UPDATED,
      this.handleUpdate
    );
    this.table.removeEventListener(
      this.dh.TreeTable.EVENT_DISCONNECT,
      this.handleDisconnect
    );
  }

  private handleUpdate(event: DhType.Event<DhType.TreeViewportData>): void {
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
    row: DhType.TreeRow,
    columns: DhType.Column[]
  ): { [key: string]: unknown } {
    const data: Record<string, unknown> = {};
    for (let c = 0; c < columns.length; c += 1) {
      const column = columns[c];
      data[column.name] = row.get(column);
    }

    data[TREE_NODE_KEY] = {
      hasChildren: row.hasChildren,
      isExpanded: row.isExpanded,
      depth: row.depth,
      index: row.index.asNumber(),
    } satisfies TreeNode;

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

  /**
   * Expand or collapse a row in the tree table.
   *
   * @param row Row to expand or collapse
   * @param isExpanded Whether to expand or collapse the row
   */
  setExpanded(row: DhType.TreeRow | number, isExpanded: boolean): void {
    log.debug('setExpanded', row);
    this.table.setExpanded(row, isExpanded);
  }
}

export default TreeViewportDatasource;
