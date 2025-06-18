import type { dh as DhType } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import {
  ColumnRowGroupChangedEvent,
  ColumnValueChangedEvent,
  FilterModel,
  GridApi,
  IViewportDatasourceParams,
  SortModelItem,
} from '@ag-grid-community/core';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import AbstractViewportDatasource from './AbstractViewportDatasource';
import TreeViewportDatasource from './TreeViewportDatasource';
import TableViewportDatasource from './TableViewportDatasource';
import {
  AggregatedColumn,
  getAggregatedColumns,
  getRollupConfig,
} from '../utils/AgGridAggUtils';

const log = Log.module('@deephaven/js-plugin-ag-grid/ViewportDatasource');

/**
 * Class that takes the input table and creates either a TableViewportDatasource or TreeViewportDatasource
 * depending on whether the table is a tree table or not.
 * Also listens for grouping to change from a table to a tree table and vice versa.
 * Will just call the child data source for the most part.
 */
class DeephavenViewportDatasource extends AbstractViewportDatasource {
  /**
   * The current datasource being used, either TableViewportDatasource or TreeViewportDatasource.
   */
  public currentDatasource: AbstractViewportDatasource;

  constructor(
    private dh: typeof DhType,
    private readonly table: DhType.Table | DhType.TreeTable
  ) {
    super();

    this.handleColumnRowGroupChanged =
      this.handleColumnRowGroupChanged.bind(this);
    this.handleColumnValueChanged = this.handleColumnValueChanged.bind(this);

    this.currentDatasource = TableUtils.isTreeTable(table)
      ? new TreeViewportDatasource(dh, table)
      : new TableViewportDatasource(dh, table);
  }

  init(params: IViewportDatasourceParams): void {
    super.init(params);
    this.currentDatasource.init(params);
  }

  setGridApi(gridApi: GridApi): void {
    this.currentDatasource.setGridApi(gridApi);

    if (this.gridApi != null) {
      this.gridApi.removeEventListener(
        'columnRowGroupChanged',
        this.handleColumnRowGroupChanged
      );
      this.gridApi.removeEventListener(
        'columnValueChanged',
        this.handleColumnValueChanged
      );
    }
    super.setGridApi(gridApi);
    gridApi.addEventListener(
      'columnRowGroupChanged',
      this.handleColumnRowGroupChanged
    );
    gridApi.addEventListener(
      'columnValueChanged',
      this.handleColumnValueChanged
    );
  }

  private async handleColumnRowGroupChanged(
    event: ColumnRowGroupChangedEvent
  ): Promise<void> {
    log.debug('Column row group changed', event);
    await this.updateAggregations();
    this.currentDatasource.refreshViewport();
  }

  private async handleColumnValueChanged(event: ColumnValueChangedEvent): void {
    log.debug('Column value changed', event);
    assertNotNull(this.gridApi);
    await this.updateAggregations();
    this.currentDatasource.refreshViewport();
  }

  applySort(sortModel: SortModelItem[]): void {
    this.currentDatasource.applySort(sortModel);
  }

  applyFilter(filterModel: FilterModel): void {
    this.currentDatasource.applyFilter(filterModel);
  }

  applyViewport(firstRow: number, lastRow: number): void {
    this.currentDatasource.applyViewport(firstRow, lastRow);
  }

  applyAggregatedColumns(aggregatedColumns: AggregatedColumn[]): void {
    log.debug('Applying aggregated columns', aggregatedColumns);
    assertNotNull(this.gridApi);
    this.currentDatasource.applyAggregatedColumns(aggregatedColumns);
  }

  /**
   * Get the current row group columns and aggregations and apply them.
   */
  private async updateAggregations(): Promise<void> {
    assertNotNull(this.gridApi);
    const rowGroupColumns = this.gridApi.getRowGroupColumns();
    const aggregatedColumns = getAggregatedColumns(this.gridApi);
    log.debug('Updating aggregations', rowGroupColumns, aggregatedColumns);

    if (TableUtils.isTreeTable(this.table)) {
      throw new Error('Cannot apply aggregations to a tree table.');
    }

    if (rowGroupColumns.length === 0) {
      log.debug('No row group columns, using TableViewportDatasource');
      const newDatasource = new TableViewportDatasource(this.dh, this.table);
      assertNotNull(this.params);
      assertNotNull(this.gridApi);
      newDatasource.init(this.params);
      newDatasource.setGridApi(this.gridApi);

      // TODO: Should apply aggregations as well

      this.currentDatasource.destroy();

      newDatasource.setViewportRange(0, 100);
      this.currentDatasource = newDatasource;
      return;
    }

    const rollupConfig = getRollupConfig(
      rowGroupColumns,
      aggregatedColumns,
      this.dh
    );

    const treeTable = await this.table.rollup(rollupConfig);
    const treeDatasource = new TreeViewportDatasource(this.dh, treeTable);

    assertNotNull(this.params);
    assertNotNull(this.gridApi);
    treeDatasource.init(this.params);
    treeDatasource.setGridApi(this.gridApi);

    this.currentDatasource.destroy();

    // TODO: Refresh the grid itself to get to the top of the viewport
    treeDatasource.setViewportRange(0, 100);

    this.currentDatasource = treeDatasource;
  }

  destroy(): void {
    log.debug('Destroying DeephavenViewportDatasource');
    super.destroy();
    this.currentDatasource.destroy();
    this.table.close();
  }
}

export default DeephavenViewportDatasource;
