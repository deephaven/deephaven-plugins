import type { dh as DhType } from '@deephaven/jsapi-types';
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
import { extractViewportRow } from '../utils/AgGridTableUtils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';
import AgGridSortUtils, { isSortModelItem } from '../utils/AgGridSortUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/ViewportDatasource');

/**
 * Class that takes the input table and provides a viewport data source for AG Grid.
 * Also listens for grouping to change from a table to a tree table and vice versa.
 */
class DeephavenViewportDatasource implements IViewportDatasource {
  /** The current parameters for the viewport datasource */
  private params!: IViewportDatasourceParams;

  /** The GridApi for communicating with AG Grid and notifying of updates */
  private gridApi!: GridApi;

  /** Track the original table passed in */
  private readonly originalTable: DhType.Table | DhType.TreeTable;

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
    private table: DhType.Table | DhType.TreeTable
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
    if (!TableUtils.isTreeTable(this.table)) {
      throw new Error('Cannot expand/collapse rows in a non-tree table.');
    }
    this.table.setExpanded(row, isExpanded);
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

  private startTableListening(table: DhType.Table | DhType.TreeTable) {
    table.addEventListener(this.dh.Table.EVENT_UPDATED, this.handleTableUpdate);
    table.addEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleTableDisconnect
    );
  }

  private stopTableListening(table: DhType.Table | DhType.TreeTable) {
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
    event: DhType.Event<DhType.ViewportData | DhType.TreeViewportData>
  ): void {
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

  // eslint-disable-next-line class-methods-use-this
  private handleTableDisconnect(): void {
    log.info('Table disconnected.');
  }

  private async queueOperation(operation: () => Promise<void>): Promise<void> {
    const currentOperations = [...this.pending.pending];
    return this.pending.add(Promise.all(currentOperations).then(operation));
  }

  private applySort(sortModel: SortModelItem[]): void {
    log.debug('Applying sort model', sortModel);
    this.table.applySort(AgGridSortUtils.parseSortModel(this.table, sortModel));
  }

  private applyFilter(filterModel: FilterModel): void {
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
    this.table.setViewport(firstRow, lastRow);
  }

  private refreshViewport(): void {
    log.debug('Refreshing viewport');
    if (this.currentViewport == null) {
      log.debug('Setting default viewport');
      this.currentViewport = {
        firstRow: 0,
        lastRow: 100, // Default to the first 100 rows
      };
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

    // Start by updating the aggregations. This may produce a new table which filters may or may not apply to.
    await this.updateAggregations();
    this.updateFilter();
    this.updateSort();
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
    const treeTable = await this.originalTable.rollup(rollupConfig);
    this.setTable(treeTable);
    this.updateFilter();
    this.updateSort();
    this.refreshViewport();
  }

  private setTable(table: DhType.Table | DhType.TreeTable): void {
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
