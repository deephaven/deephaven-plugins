/* eslint-disable class-methods-use-this */
import {
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  ViewportChangedEvent,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import AgGridSortUtils from '../utils/AgGridSortUtils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';

const log = Log.module(
  '@deephaven/js-plugin-ag-grid/TreeTableServerSideDataSource'
);

/**
 * Server Side Datasource that can be used with AG Grid.
 *
 * https://www.ag-grid.com/react-data-grid/server-side-model-datasource/
 *
 * Because of the way AG Grid is set up, this uses two subscriptions on the Deephaven table:
 * - A "getRows" subscription, where it requests the rows it needs. This just gets the viewport data, but does not listen for any updates on that subscription.
 * - A "viewport" subscription, where it listens for updates to the viewport data and updates the AG Grid accordingly. This subscription will be updated as the users viewport moves.
 */
export class TreeTableServerSideDatasource implements IServerSideDatasource {
  private sizeListenerCleanup?: () => void;

  private viewportStartRow?: number;

  private viewportEndRow?: number;

  private filters?: DhType.FilterCondition[];

  private sorts?: DhType.Sort[];

  private api?: GridApi;

  private dataPromise?: Promise<DhType.TreeViewportData>;

  /**
   * Create a Server Side Datasource that can be used with AG Grid.
   *
   * @param dh Deephaven API instance to use
   * @param table Deephaven table to use
   */
  constructor(
    private dh: typeof DhType,
    private table: DhType.TreeTable
  ) {
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleViewportChanged = this.handleViewportChanged.bind(this);
    this.startListening();
    this.initTreeData();
  }

  private startListening() {
    this.table.addEventListener(
      this.dh.TreeTable.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    this.table.addEventListener(
      this.dh.TreeTable.EVENT_UPDATED,
      this.handleTableUpdated
    );
    this.table.addEventListener(
      this.dh.Table.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  private stopListening() {
    this.table.removeEventListener(
      this.dh.TreeTable.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    this.table.removeEventListener(
      this.dh.TreeTable.EVENT_UPDATED,
      this.handleTableUpdated
    );
    this.table.removeEventListener(
      this.dh.Table.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  // TODO: We should be more efficient, but for now we're just fetching ALL the tree data in one shot.
  // AG Grid's model of requesting server rows does not map to our tree table model very well.
  private initTreeData(): void {
    this.table.expandAll();
    this.table.setViewport(0, this.table.size);
    this.dataPromise = this.table.getViewportData();
  }

  private extractViewportRow(
    row: DhType.TreeRow,
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
    log.debug('Table disconnected');
  }

  private handleRequestFailed({ detail: error }: DhType.Event<unknown>): void {
    log.error('Request failed:', error);
  }

  private handleTableUpdated = (
    event: DhType.Event<DhType.TreeViewportData>
  ): void => {
    const { detail: data } = event;
    log.debug('Table updated', data);
    if (this.api == null) {
      return;
    }

    // TODO: Need to actually set children in the data
    // https://www.ag-grid.com/react-data-grid/server-side-model-tree-data/
    const rowUpdates = new Map<number, unknown>();
    data.rows.forEach((row, index) => {
      rowUpdates.set(
        index + (this.viewportStartRow ?? 0),
        this.extractViewportRow(row, data.columns)
      );
    });
    this.api.forEachNode((node, index) => {
      if (rowUpdates.has(index)) {
        node.setData(rowUpdates.get(index));
      }
    });
    this.api.setRowCount(Math.max(0, this.table.size));
  };

  private updateFilters(newFilters: DhType.FilterCondition[]): boolean {
    if (AgGridFilterUtils.areFiltersEqual(this.filters ?? [], newFilters)) {
      return false;
    }
    log.debug2('Filters changed', newFilters);
    this.filters = newFilters;
    return true;
  }

  private updateSorts(newSorts: DhType.Sort[]): boolean {
    if (AgGridSortUtils.areSortsEqual(this.sorts ?? [], newSorts)) {
      return false;
    }
    log.debug2('Sorts changed', newSorts);
    this.sorts = newSorts;
    return true;
  }

  async getRows(params: IServerSideGetRowsParams): Promise<void> {
    const { api, fail, request, success } = params;
    if (this.table == null) {
      log.warn('Failing getRows table is null for request:', request);
      fail();
      return;
    }
    log.debug2('getRows', request);

    // Get the viewport data for the requested rows
    // We don't need to worry about cancelling this request, as even if the next request comes in we should still be able to use the data
    const startRow = request.startRow ?? 0;
    const endRow = Math.max(startRow, (request.endRow ?? this.table.size) - 1);

    if (this.viewportStartRow == null || this.viewportEndRow == null) {
      this.viewportStartRow = startRow;
      this.viewportEndRow = endRow;
    }

    if (this.api !== api) {
      // this.api?.removeEventListener(
      //   'viewportChanged',
      //   this.handleViewportChanged
      // );

      this.api = api;
      // We need to set the row count here, as AG Grid doesn't know how many rows there are
      // api.setRowCount(Math.max(0, this.table.size));
      // api.addEventListener('viewportChanged', this.handleViewportChanged);
      // TODO: We need to map this to the correct Deephaven table viewport...
      // this.table.setViewport(startRow, endRow);
    }

    // TODO: We need to somehow map the start/end rows here to the correct Deephaven table viewport. Since it'll request at a specific depth.
    // this.table.setViewport(startRow, endRow);

    // const viewportData = await this.table.getViewportData();
    const treeData = await this.dataPromise;

    // Now we need to find the offset within the viewport data of where these group keys start
    // const viewportOffset =
    // const rowData = [];
    // for (let i = startRow; i <= endRow; i += 1) {

    // }

    // this.extractViewportRow

    // TODO: Sorting and filtering
    // const newSorts = AgGridSortUtils.parseSortModel(
    //   this.table,
    //   request.sortModel
    // );
    // const newFilters = AgGridFilterUtils.parseFilterModel(
    //   this.dh,
    //   this.table,
    //   request.filterModel
    // );

    // if (this.filters) this.table.applyFilter(this.filters);
    // if (this.sorts) this.table.applySort(this.sorts);

    // if (this.filters || this.sorts) {
    //   this.table.setViewport(this.viewportStartRow, this.viewportEndRow);
    // }

    // Just return a stub of data. We'll get the actual data with a viewport update
    // const rowData = [];
    // for (let i = startRow; i <= endRow; i += 1) {
    //   const row: Record<string, unknown> = {};
    //   for (let c = 0; c < this.table.columns.length; c += 1) {
    //     const column = this.table.columns[c];
    //     row[column.name] = undefined;
    //   }
    //   rowData.push(row);
    // }

    // success({ rowData, rowCount: this.table.size });
  }

  handleViewportChanged(event: ViewportChangedEvent<unknown>): void {
    const { firstRow, lastRow } = event;
    if (lastRow < firstRow) {
      log.debug('Ignoring invalid viewport range', firstRow, lastRow);
      return;
    }

    log.debug('Viewport changed', firstRow, lastRow);

    // Cache viewport bounds so the viewport subscription can be swapped out when filtering/sorting
    this.viewportStartRow = firstRow;
    this.viewportEndRow = lastRow;
    this.table.setViewport(firstRow, lastRow);
  }

  destroy(): void {
    log.debug('Destroying server side datasource');
    this.sizeListenerCleanup?.();
    this.stopListening();
    this.table.close();
  }
}

export default TreeTableServerSideDatasource;
