import {
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
import { AggregatedColumn } from '../utils/AgGridAggUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/TreeViewportDatasource');

export const TREE_NODE_KEY = '__dhTreeNodeKey__';
export type TreeNode = {
  hasChildren: boolean;
  isExpanded: boolean;
  depth: number;
  index: number;
};
export class TreeViewportDatasource extends AbstractViewportDatasource {
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
    super();
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  init(params: IViewportDatasourceParams): void {
    super.init(params);
    this.startListening();

    // If we set the size to 0 right away, AG Grid never gives us a viewport to listen to.
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

  private handleDisconnect(): void {
    log.info('Table disconnected, stopping listening');
    this.stopListening();
  }

  applyFilter(filterModel: FilterModel): void {
    log.debug('Applying filter', filterModel);
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

  // eslint-disable-next-line class-methods-use-this
  applyAggregatedColumns(aggregatedColumns: AggregatedColumn[]): void {
    // TODO: Need to remove this
    // log.debug('Applying aggregated columns', aggregatedColumns);
    // assertNotNull(this.gridApi);
  }

  destroy(): void {
    super.destroy();
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
