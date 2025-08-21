import {
  ColumnGroupOpenedEvent,
  ColumnRowGroupChangedEvent,
  ColumnValueChangedEvent,
  FilterChangedEvent,
  FilterModel,
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  LoadSuccessParams,
  RowGroupOpenedEvent,
  SortChangedEvent,
  SortModelItem,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { TableUtils } from '@deephaven/jsapi-utils';
import { assertNotNull, Pending } from '@deephaven/utils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';
import AgGridSortUtils, { isSortModelItem } from '../utils/AgGridSortUtils';
import AgGridTableType from '../AgGridTableType';
import {
  isTable,
  isPivotTable,
  TREE_NODE_KEY,
} from '../utils/AgGridTableUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/PivotDatasource');

export class PivotDatasource implements IServerSideDatasource {
  /** The GridApi for communicating with AG Grid and notifying of updates */
  private gridApi!: GridApi;

  private readonly pending = new Pending();

  /** Pending getRows requests */
  private readonly pendingGetRows: IServerSideGetRowsParams[] = [];

  private snapshot: CorePlusDhType.coreplus.pivot.PivotSnapshot | null = null;

  private isListening = false;

  constructor(
    private readonly dh: typeof CorePlusDhType,
    private readonly pivot: CorePlusDhType.coreplus.pivot.PivotTable
  ) {
    this.handleColumnGroupOpened = this.handleColumnGroupOpened.bind(this);
    this.handleRowGroupOpened = this.handleRowGroupOpened.bind(this);
    this.handleTableUpdated = this.handleTableUpdated.bind(this);

    this.initPivot();
  }

  private initPivot(): void {
    // TODO: We should only be listening to the viewport we're currently displaying. However, AG Grid's API is a pain to use.
    // For POC purposes, just setting a large viewport and getting a snapshot.
    this.startPivotListening(this.pivot);
    this.pivot.setViewport({
      rows: this.dh.RangeSet.ofRange(0, 1000),
      columns: this.dh.RangeSet.ofRange(0, 1000),
      sources: this.pivot.valueSources,
    });
  }

  private startPivotListening(
    pivot: CorePlusDhType.coreplus.pivot.PivotTable
  ): void {
    pivot.addEventListener(
      this.dh.coreplus.pivot.PivotTable.EVENT_UPDATED,
      this.handleTableUpdated
    );
    this.isListening = true;
  }

  private stopPivotListening(
    pivot: CorePlusDhType.coreplus.pivot.PivotTable
  ): void {
    pivot.removeEventListener(
      this.dh.coreplus.pivot.PivotTable.EVENT_UPDATED,
      this.handleTableUpdated
    );
    this.isListening = false;
  }

  private handleColumnGroupOpened({
    columnGroup,
    columnGroups,
  }: ColumnGroupOpenedEvent): void {
    // TODO: How do we use this stuff?
    log.debug('Column group opened', columnGroup, columnGroups);
  }

  private handleRowGroupOpened({ data, expanded }: RowGroupOpenedEvent): void {
    if (data == null) {
      log.warn('Row group opened with null data', event);
      return;
    }

    const rowGroupKeys = this.getRowGroupKeys(data);
    const rowIndex = this.findRowIndex(rowGroupKeys);
    if (rowIndex == null) {
      log.warn('Row group opened with data not in snapshot', data);
      return;
    }
    this.pivot.setRowExpanded(rowIndex, expanded);
  }

  private handleTableUpdated(
    event: DhType.Event<CorePlusDhType.coreplus.pivot.PivotSnapshot>
  ): void {
    log.debug('Pivot table updated', event.detail);
    this.snapshot = event.detail;
    this.processRequests();

    // // TODO: Should we go through all the value sources? All the row sources?
    // const valueSource = snapshot.valueSources[0];
    // const rowData = [];
    // const rowOffset = snapshot.rows.offset;
    // const columnOffset = snapshot.columns.offset;
    // const pivotResultFields = [];
    // for (let r = 0; r < snapshot.rows.count; r += 1) {
    //   const row: Record<string, unknown> = {};
    //   const depth = snapshot.rows.getDepth(rowOffset + r) - 1;
    //   row[TREE_NODE_KEY] = {
    //     hasChildren: snapshot.rows.hasChildren(rowOffset + r),
    //     isExpanded: snapshot.rows.isExpanded(rowOffset + r),
    //     depth,
    //     index: rowOffset + r,
    //   };
    //   for (
    //     let rowSourceIndex = 0;
    //     rowSourceIndex < this.pivot.rowSources.length;
    //     rowSourceIndex += 1
    //   ) {
    //     const rowSource = this.pivot.rowSources[rowSourceIndex];
    //     row[rowSource.name] = snapshot.rows.getKeys(r);
    //   }
    //   for (let c = 0; c < snapshot.columns.count; c += 1) {
    //     const columnKey = snapshot.columns
    //       .getKeys(c)
    //       .filter(k => k != null)
    //       .join('/');
    //     const value = snapshot.getValue(
    //       valueSource,
    //       rowOffset + r,
    //       columnOffset + c
    //     );
    //     // const value = row.getValue(column);
    //     pivotResultFields.push(columnKey);
    //     row[columnKey] = value;
    //   }
    //   rowData.push(row);
    // }

    // log.debug('Pivot row data', rowData);

    // this.params?.success({
    //   rowData,
    //   rowCount: snapshot.rows.totalCount,
    //   pivotResultFields,
    // });

    // const cacheBlockState = this.gridApi.getCacheBlockState();
    // console.log('Pivot cache block state', cacheBlockState);
  }

  setGridApi(gridApi: GridApi): void {
    if (this.gridApi != null) {
      // this.gridApi.removeEventListener(
      //   'columnRowGroupChanged',
      //   this.handleColumnRowGroupChanged
      // );
      // this.gridApi.removeEventListener(
      //   'columnValueChanged',
      //   this.handleColumnValueChanged
      // );
      // this.gridApi.removeEventListener(
      //   'filterChanged',
      //   this.handleFilterChanged
      // );
      // this.gridApi.removeEventListener('sortChanged', this.handleSortChanged);
      this.gridApi.removeEventListener(
        'rowGroupOpened',
        this.handleRowGroupOpened
      );
      this.gridApi.removeEventListener(
        'columnGroupOpened',
        this.handleColumnGroupOpened
      );
    }

    this.pending.cancel();
    this.gridApi = gridApi;

    this.gridApi.addEventListener('rowGroupOpened', this.handleRowGroupOpened);
    this.gridApi.addEventListener(
      'columnGroupOpened',
      this.handleColumnGroupOpened
    );
    // this.gridApi.addEventListener('columnGroupOpened', (event: ColumnGroupOpenedEvent => {
    //   const { column, expanded } = event;
    //   if (column == null) {
    //     log.warn('Column group opened with null column', event);
    //     return;
    //   }
    //   if (column.getColId() == null) {
    //     log.warn('Column group opened with column without colId', event);
    //     return;
    //   }
    // });

    // gridApi.addEventListener(
    //   'columnRowGroupChanged',
    //   this.handleColumnRowGroupChanged
    // );
    // gridApi.addEventListener(
    //   'columnValueChanged',
    //   this.handleColumnValueChanged
    // );
    // gridApi.addEventListener('filterChanged', this.handleFilterChanged);
    // gridApi.addEventListener('sortChanged', this.handleSortChanged);

    // this.queueOperation(async () => {
    //   await this.updateGridState();
    // });
  }

  getRows(params: IServerSideGetRowsParams): void {
    log.debug('getRows adding to queue', params.request);
    this.pendingGetRows.push(params);
    // It'll get processed when the next update comes in
    // this.processRequests();

    // const { request } = params;
    // const { startRow, endRow } = request;
    // log.debug('getRows', request, startRow, endRow);

    // if (startRow == null || endRow == null) {
    //   log.error('getRows called without startRow or endRow', request);
    //   params.fail();
    //   return;
    // }
    // if (!this.isListening) {
    //   this.startPivotListening(this.pivot);
    // }

    // this.params = params;
    // const rows = this.dh.RangeSet.ofRange(startRow, endRow);

    // // TODO: We should be setting the viewport columns based on what is visible in the grid,
    // // but for now just set all of them.
    // const columns = this.dh.RangeSet.ofRange(
    //   0,
    //   this.pivot.columnSources.length
    // );
    // // const sources = this.table.valueSources;
    // const sources = [this.pivot.valueSources[0]]; // TODO: Support multiple value sources
    // this.pivot.setViewport({ rows, columns, sources });

    // try {
    //   const rowCount = await this.table.getRowCount();
    //   assertNotNull(rowCount);
    //   if (request.startRow >= rowCount) {
    //     // If the start row is past the end of the table, return no rows
    //     params.success({ rowData: [], rowCount });
    //     return;
    //   }
    //   const endRow = Math.min(request.endRow, rowCount);
    //   const tableData = await this.table.getSubTable(
    //     request.startRow,
    //     endRow - request.startRow
    //   );
    //   const rowData = [];
    //   for (let i = 0; i < endRow - request.startRow; i += 1) {
    //     const row = await tableData.getRow(i);
    //     rowData.push(row);
    //   }
    //   params.success({ rowData, rowCount });
    // } catch (e) {
    //   log.error('Error fetching rows', e);
    //   params.fail();
    // }
  }

  /** Goes through all pending requests and returns data from the snapshot if available */
  private processRequests(): void {
    log.debug2('processRequests', this.pendingGetRows.length);

    if (this.snapshot == null) {
      log.debug('Waiting for snapshot to be available');
      return;
    }

    let i = 0;
    while (i < this.pendingGetRows.length) {
      const params = this.pendingGetRows[i];
      const { request, fail, success } = params;

      try {
        const result = this.processRequest(request);
        if (result != null) {
          log.debug2('Processed request', request, result);
          success(result);
          this.pendingGetRows.splice(i, 1);
        } else {
          log.debug2('Still waiting for result for request', request);
          i += 1; // Move to the next request
        }
      } catch (e) {
        log.error('Error processing request', request, e);
        fail();
        this.pendingGetRows.splice(i, 1); // Remove the request on failure
      }
    }

    // TODO: We probably don't need to log this
    const cacheBlockState = this.gridApi.getCacheBlockState();
    log.debug2('Pivot cache block state', cacheBlockState);
  }

  private getRowGroupKeys(data: Record<string, unknown>): string[] {
    const rowGroupKeys: string[] = [];
    for (let i = 0; i < this.pivot.rowSources.length; i += 1) {
      const rowSource = this.pivot.rowSources[i];
      if (data[rowSource.name] != null) {
        rowGroupKeys.push(String(data[rowSource.name]));
      }
    }
    return rowGroupKeys;
  }

  private findRowIndex(groupKeys: string[]): number | null {
    assertNotNull(this.snapshot, 'Snapshot must be available to find row');
    for (let r = 0; r < this.snapshot.rows.count; r += 1) {
      const rowkeys = this.snapshot.rows.getKeys(r);
      const nonNullRowKeys = rowkeys.filter(key => key != null);
      if (
        groupKeys.length === nonNullRowKeys.length &&
        groupKeys.every((key, index) => key === nonNullRowKeys[index])
      ) {
        return r;
      }
    }
    return null;
  }

  /**
   * Check if a row is in the group defined by the group keys.
   * @param groupKeys Group keys to check against the snapshot.
   * @param rowKeys Row keys to check against the group keys.
   * @returns `true` if the row is in the group defined by the group keys, `false` otherwise.
   */
  private isRowInGroup(groupKeys: string[], rowKeys: string[]): boolean {
    const nonNullRowKeys = rowKeys.filter(key => key != null);
    return (
      nonNullRowKeys.length === groupKeys.length + 1 &&
      groupKeys.every((key, index) => key === nonNullRowKeys[index])
    );
  }

  private processRequest(
    request: IServerSideGetRowsRequest
  ): LoadSuccessParams | null {
    assertNotNull(
      this.snapshot,
      'Snapshot must be available to process request'
    );
    log.debug2('Processing request', request);

    const { startRow, endRow, groupKeys } = request;
    if (
      startRow == null ||
      endRow == null ||
      startRow > endRow ||
      startRow < 0 ||
      endRow < 0
    ) {
      throw new Error(
        `getRows called with invalid startRow/endRow: ${JSON.stringify(
          request
        )}, startRow: ${startRow}, endRow: ${endRow}`
      );
    }

    // Get the row data from the snapshot
    const rowData: Record<string, unknown>[] = [];
    const rowOffset = this.snapshot.rows.offset;
    const columnOffset = this.snapshot.columns.offset;
    const pivotResultFields = [];

    // Just iterate through the whole snapshot, and add the rows that match the group keys
    for (
      let snapshotRow = 0;
      snapshotRow < this.snapshot.rows.count;
      snapshotRow += 1
    ) {
      const rowKeys = this.snapshot.rows.getKeys(snapshotRow);
      if (!this.isRowInGroup(groupKeys, rowKeys)) {
        continue; // Skip rows that are not in the group
      }
      const row: Record<string, unknown> = {};
      for (
        let rowSourceIndex = 0;
        rowSourceIndex < this.pivot.rowSources.length;
        rowSourceIndex += 1
      ) {
        const rowSource = this.pivot.rowSources[rowSourceIndex];
        const rowSourceKey = rowKeys[rowSourceIndex];
        if (rowSourceKey != null) {
          row[rowSource.name] = rowSourceKey;
        }
      }
      const depth = this.snapshot.rows.getDepth(snapshotRow) - 1;
      row[TREE_NODE_KEY] = {
        hasChildren: this.snapshot.rows.hasChildren(snapshotRow),
        isExpanded: this.snapshot.rows.isExpanded(snapshotRow),
        depth,
        index: snapshotRow,
      };
      for (let c = 0; c < this.snapshot.columns.count; c += 1) {
        const columnKey = this.snapshot.columns
          .getKeys(c)
          .filter(k => k != null)
          .join('/');
        const value = this.snapshot.getValue(
          this.pivot.valueSources[0],
          rowOffset + snapshotRow,
          columnOffset + c
        );
        // const value = row.getValue(column);
        row[columnKey] = value;
        pivotResultFields.push(columnKey);
      }
      rowData.push(row);
    }

    log.debug2('Pivot row data', rowData);
    // TODO: We should be returning the full table row count, this won't scroll
    return {
      rowData,
      rowCount: rowData.length,
      pivotResultFields,
    };
  }

  destroy(): void {
    this.pending.cancel();
    this.stopPivotListening(this.pivot);
  }
}

export default PivotDatasource;
