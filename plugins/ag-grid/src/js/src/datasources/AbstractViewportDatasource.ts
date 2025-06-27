import {
  FilterChangedEvent,
  FilterModel,
  GridApi,
  IViewportDatasource,
  IViewportDatasourceParams,
  SortChangedEvent,
  SortModelItem,
} from '@ag-grid-community/core';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { isSortModelItem } from '../utils/AgGridSortUtils';
import { AggregatedColumn } from '../utils/AgGridAggUtils';

const log = Log.module(
  '@deephaven/js-plugin-ag-grid/AbstractViewportDatasource'
);

export abstract class AbstractViewportDatasource
  implements IViewportDatasource
{
  protected params?: IViewportDatasourceParams;

  protected gridApi?: GridApi;

  protected currentViewport?: {
    firstRow: number;
    lastRow: number;
  };

  /**
   * Create a Viewport Row Model data source abstract implementation.
   *
   * Must set the GridApi on this datasource after instantiation.
   * Implementing classes must implement the methods to apply filters, sorts, and viewports.
   */
  constructor() {
    this.handleFilterChanged = this.handleFilterChanged.bind(this);
    this.handleSortChanged = this.handleSortChanged.bind(this);
  }

  init(params: IViewportDatasourceParams): void {
    log.debug('Initializing DeephavenViewportDatasource', params);
    this.params = params;
  }

  setGridApi(gridApi: GridApi): void {
    log.debug('Setting grid API', gridApi);
    if (this.gridApi != null) {
      this.gridApi.removeEventListener(
        'filterChanged',
        this.handleFilterChanged
      );
      this.gridApi.removeEventListener('sortChanged', this.handleSortChanged);
    }
    this.gridApi = gridApi;
    this.gridApi.addEventListener('filterChanged', this.handleFilterChanged);
    this.gridApi.addEventListener('sortChanged', this.handleSortChanged);
  }

  private handleFilterChanged(event: FilterChangedEvent): void {
    log.debug('Filter changed', event);
    assertNotNull(this.gridApi);
    this.applyFilter(this.gridApi.getFilterModel());
    this.refreshViewport();
  }

  private handleSortChanged(event: SortChangedEvent): void {
    log.debug('Sort changed', event);
    assertNotNull(this.gridApi);
    const columnState = this.gridApi.getColumnState();
    const sortModel = columnState.filter(isSortModelItem);
    this.applySort(sortModel);
    this.refreshViewport();
  }

  /**
   * Apply the filter model to the data source.
   *
   * @param filterModel The filter model to apply.
   */
  abstract applyFilter(filterModel: FilterModel): void;

  /**
   * Apply the sort model to the data source.
   *
   * @param sortModel The sort model to apply.
   */
  abstract applySort(sortModel: SortModelItem[]): void;

  /**
   * Apply the viewport to the data source.
   *
   * @param firstRow The first row index of the viewport.
   * @param lastRow The last row index of the viewport.
   */
  abstract applyViewport(firstRow: number, lastRow: number): void;

  /**
   * Apply the aggregated columns to the data source.
   * All columns passed in are aggregated columns.
   *
   * @param aggregatedColumns The aggregated columns to apply.
   */
  abstract applyAggregatedColumns(aggregatedColumns: AggregatedColumn[]): void;

  refreshViewport(): void {
    if (this.currentViewport == null) {
      log.warn('No current viewport to refresh');
      return;
    }
    const { firstRow, lastRow } = this.currentViewport;
    this.applyViewport(firstRow, lastRow);
  }

  setViewportRange(firstRow: number, lastRow: number): void {
    log.debug('setViewportRange', firstRow, lastRow);
    this.currentViewport = { firstRow, lastRow };
    this.applyViewport(firstRow, lastRow);
  }

  // eslint-disable-next-line class-methods-use-this
  destroy(): void {
    // Implementation should clean up any resources or listeners
    log.debug('Destroying DeephavenViewportDatasource');
  }
}

export default AbstractViewportDatasource;
