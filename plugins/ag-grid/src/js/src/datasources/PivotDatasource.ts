import {
  ColumnRowGroupChangedEvent,
  ColumnValueChangedEvent,
  FilterChangedEvent,
  FilterModel,
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsParams,
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
import { isTable, isPivotTable } from '../utils/AgGridTableUtils';

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

  private handleTableUpdated(
    event: DhType.Event<CorePlusDhType.coreplus.pivot.PivotSnapshot>
  ): void {
    log.debug('Pivot table updated', event.detail);
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
    }

    this.pending.cancel();
    this.gridApi = gridApi;

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
    // const rows = this.dh.RangeSet.ofRange(startRow, endRow);
    const rows = this.dh.RangeSet.ofRange(0, 39);

    // TODO: We should be setting the viewport columns based on what is visible in the grid,
    // but for now just set all of them.
    const columns = this.dh.RangeSet.ofRange(
      0,
      19
      // this.table.columnSources.length
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
