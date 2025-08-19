import {
  ColumnGroupOpenedEvent,
  ColumnRowGroupChangedEvent,
  ColumnValueChangedEvent,
  FilterChangedEvent,
  FilterModel,
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsParams,
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

  /** Params of the current request */
  private params: IServerSideGetRowsParams | null = null;

  private isListening = false;

  constructor(
    private readonly dh: typeof CorePlusDhType,
    private readonly pivot: CorePlusDhType.coreplus.pivot.PivotTable
  ) {
    this.handleColumnGroupOpened = this.handleColumnGroupOpened.bind(this);
    this.handleRowGroupOpened = this.handleRowGroupOpened.bind(this);
    this.handleTableUpdated = this.handleTableUpdated.bind(this);
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

    if (data[TREE_NODE_KEY] == null) {
      log.warn('Row group opened with data without tree node key', event);
      return;
    }

    const { index } = data[TREE_NODE_KEY];
    this.pivot.setRowExpanded(index, expanded);
  }

  private handleTableUpdated(
    event: DhType.Event<CorePlusDhType.coreplus.pivot.PivotSnapshot>
  ): void {
    log.debug('Pivot table updated', event.detail);
    const { detail: snapshot } = event;

    // TODO: Should we go through all the value sources? All the row sources?
    const valueSource = snapshot.valueSources[0];
    const rowData = [];
    const rowOffset = snapshot.rows.offset;
    const columnOffset = snapshot.columns.offset;
    const pivotResultFields = [];
    for (let r = 0; r < snapshot.rows.count; r += 1) {
      const row: Record<string, unknown> = {};
      const depth = snapshot.rows.getDepth(rowOffset + r) - 1;
      row[TREE_NODE_KEY] = {
        hasChildren: snapshot.rows.hasChildren(rowOffset + r),
        isExpanded: snapshot.rows.isExpanded(rowOffset + r),
        depth,
        index: rowOffset + r,
      };
      for (
        let rowSourceIndex = 0;
        rowSourceIndex < this.pivot.rowSources.length;
        rowSourceIndex += 1
      ) {
        const rowSource = this.pivot.rowSources[rowSourceIndex];
        row[rowSource.name] = snapshot.rows.getKeys(r);
      }
      for (let c = 0; c < snapshot.columns.count; c += 1) {
        const columnKey = snapshot.columns
          .getKeys(c)
          .filter(k => k != null)
          .join('/');
        const value = snapshot.getValue(
          valueSource,
          rowOffset + r,
          columnOffset + c
        );
        // const value = row.getValue(column);
        pivotResultFields.push(columnKey);
        row[columnKey] = value;
      }
      rowData.push(row);
    }

    log.debug('Pivot row data', rowData);

    this.params?.success({
      rowData,
      rowCount: snapshot.rows.totalCount,
      pivotResultFields,
    });

    const cacheBlockState = this.gridApi.getCacheBlockState();
    console.log('Pivot cache block state', cacheBlockState);
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
    const { request } = params;
    const { startRow, endRow } = request;
    log.debug('getRows', request, startRow, endRow);

    if (startRow == null || endRow == null) {
      log.error('getRows called without startRow or endRow', request);
      params.fail();
      return;
    }
    if (!this.isListening) {
      this.startPivotListening(this.pivot);
    }

    this.params = params;
    const rows = this.dh.RangeSet.ofRange(startRow, endRow);

    // TODO: We should be setting the viewport columns based on what is visible in the grid,
    // but for now just set all of them.
    const columns = this.dh.RangeSet.ofRange(
      0,
      this.pivot.columnSources.length
    );
    // const sources = this.table.valueSources;
    const sources = [this.pivot.valueSources[0]]; // TODO: Support multiple value sources
    this.pivot.setViewport({ rows, columns, sources });

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

  destroy(): void {
    this.pending.cancel();
    this.stopPivotListening(this.pivot);
  }
}

export default PivotDatasource;
