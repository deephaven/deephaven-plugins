import type { dh as DhType } from '@deephaven/jsapi-types';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import {
  ColumnRowGroupChangedEvent,
  ColumnValueChangedEvent,
  FilterChangedEvent,
  FilterModel,
  GridApi,
  IViewportDatasource,
  IViewportDatasourceParams,
  SortChangedEvent,
  SortModelItem,
} from '@ag-grid-community/core';
import Log from '@deephaven/log';
import { assertNotNull, Pending } from '@deephaven/utils';
import { getAggregatedColumns, getRollupConfig } from '../utils/AgGridAggUtils';
import {
  extractViewportRow,
  isTable,
  isTreeTable,
  TREE_NODE_KEY,
} from '../utils/AgGridTableUtils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';
import AgGridSortUtils, { isSortModelItem } from '../utils/AgGridSortUtils';
import AgGridTableType from '../AgGridTableType';
import { getPivotResultColumns, isPivotTable } from '../utils/AgGridPivotUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/ViewportDatasource');

/**
 * Class that takes the input table and provides a viewport data source for AG Grid.
 * Also listens for grouping to change from a table to a tree table and vice versa.
 */
export class DeephavenViewportDatasource implements IViewportDatasource {
  /** The current parameters for the viewport datasource */
  private params!: IViewportDatasourceParams;

  /** The GridApi for communicating with AG Grid and notifying of updates */
  private gridApi!: GridApi;

  /** Track the original table passed in */
  private readonly originalTable: AgGridTableType;

  /** Current promises being awaited for operations applied to the table */
  private pending: Pending;

  /** The current viewport being viewed */
  private currentViewport?: {
    firstRow: number;
    lastRow: number;
  };

  /**
   * Create a Deephaven Viewport Row Model data source that can be used with AG Grid.
   * @param dh Deephaven API instance to use
   * @param table The table to use, either a Table or TreeTable.
   */
  constructor(
    private dh: typeof DhType,
    private table: AgGridTableType
  ) {
    this.handleColumnRowGroupChanged =
      this.handleColumnRowGroupChanged.bind(this);
    this.handleColumnValueChanged = this.handleColumnValueChanged.bind(this);
    this.handleFilterChanged = this.handleFilterChanged.bind(this);
    this.handleSortChanged = this.handleSortChanged.bind(this);
    this.handleTableUpdate = this.handleTableUpdate.bind(this);
    this.handleTableDisconnect = this.handleTableDisconnect.bind(this);

    this.originalTable = table;
    this.pending = new Pending();
  }

  init(params: IViewportDatasourceParams): void {
    log.debug('Initializing DeephavenViewportDatasource', params);
    this.params = params;
    this.startTableListening(this.table);
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    log.debug('setViewportRange', firstRow, lastRow);
    this.queueOperation(async () => {
      this.currentViewport = { firstRow, lastRow };
      this.applyViewport(firstRow, lastRow);
    });
  }

  /**
   * Expand or collapse a row in the tree table.
   *
   * @param row Row to expand or collapse
   * @param isExpanded Whether to expand or collapse the row
   */
  setExpanded(row: DhType.TreeRow | number, isExpanded: boolean): void {
    log.debug('setExpanded', row);
    if (isTreeTable(this.table)) {
      this.table.setExpanded(row, isExpanded);
      return;
    }
    if (isPivotTable(this.table)) {
      this.table.setRowExpanded(row as number, isExpanded);
      return;
    }

    throw new Error('Cannot expand/collapse rows in a non-tree table.');
  }

  setGridApi(gridApi: GridApi): void {
    if (this.gridApi != null) {
      this.gridApi.removeEventListener(
        'columnRowGroupChanged',
        this.handleColumnRowGroupChanged
      );
      this.gridApi.removeEventListener(
        'columnValueChanged',
        this.handleColumnValueChanged
      );
      this.gridApi.removeEventListener(
        'filterChanged',
        this.handleFilterChanged
      );
      this.gridApi.removeEventListener('sortChanged', this.handleSortChanged);
    }

    this.pending.cancel();
    this.gridApi = gridApi;

    gridApi.addEventListener(
      'columnRowGroupChanged',
      this.handleColumnRowGroupChanged
    );
    gridApi.addEventListener(
      'columnValueChanged',
      this.handleColumnValueChanged
    );
    gridApi.addEventListener('filterChanged', this.handleFilterChanged);
    gridApi.addEventListener('sortChanged', this.handleSortChanged);

    this.queueOperation(async () => {
      await this.updateGridState();
    });
  }

  private startTableListening(table: AgGridTableType) {
    table.addEventListener(this.dh.Table.EVENT_UPDATED, this.handleTableUpdate);
    table.addEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleTableDisconnect
    );
  }

  private stopTableListening(table: AgGridTableType) {
    table.removeEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTableUpdate
    );
    table.removeEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleTableDisconnect
    );
  }

  private handleColumnRowGroupChanged(event: ColumnRowGroupChangedEvent): void {
    log.debug('Column row group changed', event);
    this.queueOperation(async () => {
      await this.updateAggregations();
      this.refreshViewport();
    });
  }

  private handleColumnValueChanged(event: ColumnValueChangedEvent): void {
    log.debug('Column value changed', event);
    this.queueOperation(async () => {
      await this.updateAggregations();
      this.refreshViewport();
    });
  }

  private handleFilterChanged(event: FilterChangedEvent): void {
    log.debug('Filter changed', event);
    this.queueOperation(async () => {
      this.applyFilter(this.gridApi.getFilterModel());
      this.refreshViewport();
    });
  }

  private handleSortChanged(event: SortChangedEvent): void {
    log.debug('Sort changed', event);
    assertNotNull(this.gridApi);
    this.queueOperation(async () => {
      const columnState = this.gridApi.getColumnState();
      const sortModel = columnState.filter(isSortModelItem);
      this.applySort(sortModel);
      this.refreshViewport();
    });
  }

  private handleTableUpdate(
    event: DhType.Event<
      | DhType.ViewportData
      | DhType.TreeViewportData
      | CorePlusDhType.coreplus.pivot.PivotSnapshot
    >
  ): void {
    if (isPivotTable(this.table)) {
      this.handlePivotUpdate(
        event as DhType.Event<CorePlusDhType.coreplus.pivot.PivotSnapshot>
      );
    } else {
      this.handleStandardTableUpdate(
        event as DhType.Event<DhType.ViewportData | DhType.TreeViewportData>
      );
    }
  }

  private handleStandardTableUpdate(
    event: DhType.Event<DhType.ViewportData | DhType.TreeViewportData>
  ): void {
    if (isPivotTable(this.table)) {
      throw new Error('Cannot handle standard table update for pivot table.');
    }

    const newData: Record<number, unknown> = {};

    const { detail: data } = event;
    const { columns, offset } = data;
    for (let r = 0; r < data.rows.length; r += 1) {
      const row = data.rows[r];
      newData[offset + r] = extractViewportRow(row, columns);
    }

    // log.debug2('Updating viewport data', this.table.size);
    this.params?.setRowData(newData);
    this.params?.setRowCount(this.table.size);
  }

  private handlePivotUpdate(
    event: DhType.Event<CorePlusDhType.coreplus.pivot.PivotSnapshot>
  ): void {
    if (!isPivotTable(this.table)) {
      throw new Error('Cannot handle pivot update for non-pivot table.');
    }

    log.debug('Pivot update', event);
    const { detail: snapshot } = event;

    // Get the row data from the snapshot
    const rowData: Record<string, unknown>[] = [];
    const rowOffset = snapshot.rows.offset;
    const columnOffset = snapshot.columns.offset;
    const pivotResultFields = [];

    // Just iterate through the whole snapshot, and add the rows that match the group keys
    for (
      let snapshotRow = 0;
      snapshotRow < snapshot.rows.count;
      snapshotRow += 1
    ) {
      const rowKeys = snapshot.rows.getKeys(snapshotRow);
      const row: Record<string, unknown> = {};
      for (
        let rowSourceIndex = 0;
        rowSourceIndex < this.table.rowSources.length;
        rowSourceIndex += 1
      ) {
        const rowSource = this.table.rowSources[rowSourceIndex];
        const rowSourceKey = rowKeys[rowSourceIndex];
        if (rowSourceKey != null) {
          row[rowSource.name] = rowSourceKey;
        }
      }
      const depth = snapshot.rows.getDepth(snapshotRow) - 1;
      row[TREE_NODE_KEY] = {
        hasChildren: snapshot.rows.hasChildren(snapshotRow),
        isExpanded: snapshot.rows.isExpanded(snapshotRow),
        depth,
        index: snapshotRow,
      };
      for (let c = 0; c < snapshot.columns.count; c += 1) {
        const columnKey = snapshot.columns
          .getKeys(c)
          .filter(k => k != null)
          .join('/');
        const value = snapshot.getValue(
          this.table.valueSources[0],
          rowOffset + snapshotRow,
          columnOffset + c
        );
        row[columnKey] = value;
        pivotResultFields.push(columnKey);
      }
      rowData.push(row);
    }

    log.debug2('Pivot row data', rowData);
    // TODO: We should be returning the full table row count, this won't scroll
    // return {
    //   rowData,
    //   rowCount: rowData.length,
    //   pivotResultFields,
    // };

    // this.gridApi.setPivotResultColumns()
    // this.table.columnSources
    // this.gridApi.setPivotResultColumns(pivotResultFields);
    const pivotResultColumns = getPivotResultColumns(snapshot.columns);
    log.debug2('Pivot result columns', pivotResultColumns);
    this.params?.setRowData(rowData);
    this.params?.setRowCount(snapshot.rows.totalCount);
    this.gridApi.setPivotResultColumns(pivotResultColumns);
  }

  // eslint-disable-next-line class-methods-use-this
  private handleTableDisconnect(): void {
    log.info('Table disconnected.');
  }

  private async queueOperation(operation: () => Promise<void>): Promise<void> {
    const currentOperations = [...this.pending.pending];
    return this.pending.add(Promise.all(currentOperations).then(operation));
  }

  private applySort(sortModel: SortModelItem[]): void {
    if (isPivotTable(this.table)) {
      throw new Error('Pivot table sort not yet implemented.');
    }
    log.debug('Applying sort model', sortModel);
    this.table.applySort(AgGridSortUtils.parseSortModel(this.table, sortModel));
  }

  private applyFilter(filterModel: FilterModel): void {
    if (isPivotTable(this.table)) {
      throw new Error('Pivot table filter not yet implemented.');
    }
    log.debug('Applying filter', filterModel);
    this.table.applyFilter(
      AgGridFilterUtils.parseFilterModel(
        this.dh,
        this.table,
        this.gridApi.getFilterModel()
      )
    );
  }

  private applyViewport(firstRow: number, lastRow: number): void {
    log.debug('Applying viewport', firstRow, lastRow);
    if (isPivotTable(this.table)) {
      const rows = this.dh.RangeSet.ofRange(firstRow, lastRow);

      // TODO: We should be setting the viewport columns based on what is visible in the grid,
      // but for now just set all of them.
      const columns = this.dh.RangeSet.ofRange(
        0,
        this.table.columnSources.length
      );
      this.table.setViewport({
        rows,
        columns,
        sources: this.table.valueSources,
      });
    } else {
      this.table.setViewport(firstRow, lastRow);
    }
  }

  private refreshViewport(): void {
    log.debug('Refreshing viewport');
    if (this.currentViewport == null) {
      const defaultViewport = {
        firstRow: Math.max(this.gridApi.getFirstDisplayedRowIndex(), 0),
        lastRow: Math.max(this.gridApi.getLastDisplayedRowIndex(), 0),
      };
      log.debug('Setting default viewport', defaultViewport);
      this.currentViewport = defaultViewport;
    }
    const { firstRow, lastRow } = this.currentViewport;
    this.applyViewport(firstRow, lastRow);
  }

  /**
   * Syncs this data source with the current GridApi state.
   * This includes applying the current filter, sort, and viewport.
   */
  private async updateGridState(): Promise<void> {
    log.debug('Updating grid state');

    if (isTable(this.originalTable)) {
      // Start by updating the aggregations. This may produce a new table which filters may or may not apply to.
      await this.updateAggregations();
    }
    if (!isPivotTable(this.originalTable)) {
      this.updateFilter();
      this.updateSort();
    }
    this.refreshViewport();
  }

  /** Syncs the filter with the GridApi */
  private updateFilter(): void {
    log.debug('Updating filter');
    const filterModel = this.gridApi.getFilterModel();
    this.applyFilter(filterModel);
  }

  /** Syncs the sort with the GridApi */
  private updateSort(): void {
    const columnState = this.gridApi.getColumnState();
    const sortModel = columnState.filter(isSortModelItem);
    this.applySort(sortModel);
  }

  /**
   * Get the current row group columns and aggregations and apply them.
   */
  private async updateAggregations(): Promise<void> {
    assertNotNull(this.gridApi);
    const rowGroupColumns = this.gridApi.getRowGroupColumns();
    const aggregatedColumns = getAggregatedColumns(this.gridApi);
    log.debug('Updating aggregations', rowGroupColumns, aggregatedColumns);

    if (rowGroupColumns.length === 0) {
      log.debug('No row group columns, using original table');
      this.setTable(this.originalTable);
      this.refreshViewport();
      return;
    }

    const rollupConfig = getRollupConfig(
      rowGroupColumns,
      aggregatedColumns,
      this.dh
    );

    if (TableUtils.isTreeTable(this.originalTable)) {
      throw new Error('Cannot apply aggregations to a tree table.');
    }
    if (isPivotTable(this.originalTable)) {
      throw new Error('Cannot apply aggregations to a pivot table.');
    }
    const treeTable = await this.originalTable.rollup(rollupConfig);
    this.setTable(treeTable);
    this.updateFilter();
    this.updateSort();
    this.refreshViewport();
  }

  private setTable(table: AgGridTableType): void {
    log.debug('Setting table', table);
    this.stopTableListening(this.table);
    if (this.originalTable !== this.table && table !== this.table) {
      log.debug('Closing table', this.table);
      this.table.close();
    }
    this.table = table;
    this.startTableListening(table);
  }

  destroy(): void {
    log.debug('Destroying DeephavenViewportDatasource');
    this.table.close();
    if (this.originalTable !== this.table) {
      this.originalTable.close();
    }
  }
}

export default DeephavenViewportDatasource;
