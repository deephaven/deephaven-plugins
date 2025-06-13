import type { dh as DhType } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import {
  Column,
  ColumnRowGroupChangedEvent,
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
    }
    super.setGridApi(gridApi);
    gridApi.addEventListener(
      'columnRowGroupChanged',
      this.handleColumnRowGroupChanged
    );
  }

  private async handleColumnRowGroupChanged(
    event: ColumnRowGroupChangedEvent
  ): Promise<void> {
    log.debug('Column row group changed', event);
    assertNotNull(this.gridApi);
    const rowGroupColumns = this.gridApi.getRowGroupColumns();
    await this.applyRowGroupColumns(rowGroupColumns);
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

  /**
   * Apply the row group state to the data source.
   * All columns passed in are grouped columns.
   *
   * @param rowGroupState The row group state to apply.
   */
  private async applyRowGroupColumns(
    columnRowGroupState: Column[]
  ): Promise<void> {
    log.debug('Applying row group columns', columnRowGroupState);
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error('Cannot apply row group columns to a tree table.');
    }

    if (columnRowGroupState.length === 0) {
      log.debug('No row group columns, using TableViewportDatasource');
      const newDatasource = new TableViewportDatasource(this.dh, this.table);
      assertNotNull(this.params);
      assertNotNull(this.gridApi);
      newDatasource.init(this.params);
      newDatasource.setGridApi(this.gridApi);

      this.currentDatasource.destroy();

      newDatasource.setViewportRange(0, 100);
      this.currentDatasource = newDatasource;
      return;
    }

    const rollupConfig = new this.dh.RollupConfig();
    rollupConfig.groupingColumns = columnRowGroupState.map(c => c.getId());
    rollupConfig.includeConstituents = true;
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
  }
}

export default DeephavenViewportDatasource;
