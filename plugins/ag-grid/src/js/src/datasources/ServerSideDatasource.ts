/* eslint-disable class-methods-use-this */
import {
  AdvancedFilterModel,
  FilterModel,
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsParams,
  SortModelItem,
  ViewportChangedEvent,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';

const log = Log.module('@deephaven/js-plugin-ag-grid/ServerSideDataSource');

/**
 * Server Side Datasource that can be used with AG Grid.
 *
 * https://www.ag-grid.com/react-data-grid/server-side-model-datasource/
 *
 * Because of the way AG Grid is set up, this uses two subscriptions on the Deephaven table:
 * - A "getRows" subscription, where it requests the rows it needs. This just gets the viewport data, but does not listen for any updates on that subscription.
 * - A "viewport" subscription, where it listens for updates to the viewport data and updates the AG Grid accordingly. This subscription will be updated as the users viewport moves.
 */
export class ServerSideDatasource implements IServerSideDatasource {
  private getRowsSubscription?: DhType.TableViewportSubscription;

  private viewportSubscription?: DhType.TableViewportSubscription;

  private sizeListenerCleanup?: () => void;

  private viewportStartRow?: number;

  private viewportEndRow?: number;

  private filters: DhType.FilterCondition[] = [];

  private sorts: DhType.Sort[] = [];

  /**
   * Create a Server Side Datasource that can be used with AG Grid.
   *
   * @param dh Deephaven API instance to use
   * @param table Deephaven table to use
   */
  constructor(
    private dh: typeof DhType,
    private table: DhType.Table
  ) {
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleViewportChanged = this.handleViewportChanged.bind(this);
    this.startListening();
  }

  private startListening() {
    this.table.addEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    this.table.addEventListener(
      this.dh.Table.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  private stopListening() {
    this.table.removeEventListener(
      this.dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    this.table.removeEventListener(
      this.dh.Table.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  private extractViewportRow(
    row: DhType.Row,
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

  private createViewportSubscription(
    api: GridApi,
    firstRow: number,
    lastRow: number,
    filters: DhType.FilterCondition[] = [],
    sorts: DhType.Sort[] = []
  ): void {
    log.debug('Creating new viewport subscription', firstRow, lastRow, sorts);

    this.viewportSubscription?.close();

    this.table.applyFilter(filters);
    this.table.applySort(sorts);
    this.viewportSubscription = this.table.setViewport(firstRow, lastRow);
    this.viewportSubscription?.addEventListener<DhType.ViewportData>(
      this.dh.Table.EVENT_UPDATED,
      ({ detail: newViewportData }) => {
        log.debug('Updated', newViewportData);

        // Map from the row index to the new data for that row
        const rowUpdates = new Map<number, unknown>();
        newViewportData.rows.forEach((row, index) => {
          rowUpdates.set(
            index + newViewportData.offset,
            this.extractViewportRow(row, newViewportData.columns)
          );
        });

        api.forEachNode((node, index) => {
          if (rowUpdates.has(index)) {
            node.setData(rowUpdates.get(index));
          }
        });
      }
    );

    if (this.sizeListenerCleanup == null) {
      // We also want to listen for when the table size changes, so we can notify AG Grid
      this.sizeListenerCleanup = this.table.addEventListener<number>(
        this.dh.Table.EVENT_SIZECHANGED,
        ({ detail: newSize }) => {
          log.debug('Table size changed', newSize);
          api.setRowCount(newSize);
        }
      );
    }
  }

  private parseTextFilter(
    column: DhType.Column,
    type: string,
    filter: string
  ): DhType.FilterCondition {
    const filterValue = this.dh.FilterValue.ofString(filter ?? '');
    switch (type) {
      case 'equals':
        return column.filter().eq(filterValue);
      case 'notEqual':
        return column.filter().notEq(filterValue);
      case 'contains':
        return column.filter().contains(filterValue);
      case 'notContains':
        return column
          .filter()
          .isNull()
          .or(column.filter().contains(filterValue).not());
      case 'startsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().invoke('startsWith', filterValue));
      case 'endsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().invoke('endsWith', filterValue));
      // filterValue is ofString('') for blank/notBlank filters
      case 'blank':
        return column.filter().isNull().or(column.filter().eq(filterValue));
      case 'notBlank':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().notEq(filterValue));
      default:
        throw new Error(`Unimplemented filter operation ${type}`);
    }
  }

  private parseFilter(
    column: DhType.Column,
    filterType: string,
    type: string,
    filter: string
  ): DhType.FilterCondition {
    switch (filterType) {
      case 'text':
        return this.parseTextFilter(column, type, filter);
      default:
        throw new Error(`Unimplemented filter type ${filterType}`);
    }
  }

  private parseFilterModel(
    filterModel: FilterModel | AdvancedFilterModel | null
  ): DhType.FilterCondition[] {
    if (filterModel == null) {
      return [];
    }

    return Object.entries(filterModel).map(([colId, val]) => {
      const column = this.table.findColumn(colId);

      const { conditions, operator } = val;
      if (
        conditions != null &&
        operator != null &&
        Array.isArray(conditions) &&
        typeof operator === 'string'
      ) {
        return conditions
          .map(condition => {
            const { filterType, filter, type } = condition;
            return this.parseFilter(column, filterType, type, filter);
          })
          .reduce((prev, curr) => {
            if (operator === 'OR') {
              return prev.or(curr);
            }
            if (operator === 'AND') {
              return prev.and(curr);
            }
            throw new Error(`Unknown operator ${operator} for column ${colId}`);
          });
      }

      const { filterType, filter, type } = val;
      return this.parseFilter(column, filterType, type, filter);
    });
  }

  private parseSortModel(
    sortModelItems: readonly SortModelItem[]
  ): DhType.Sort[] {
    return sortModelItems.map(item => {
      const column = this.table.findColumn(item.colId);
      const sort = column.sort();
      switch (item.sort) {
        case 'asc':
          return sort.asc();
        case 'desc':
          return sort.desc();
        default:
          throw new Error(
            `Unknown sort direction ${item.sort} for column ${item.colId}`
          );
      }
    });
  }

  private hasFiltersChanged(
    newFilters: readonly DhType.FilterCondition[]
  ): boolean {
    if (this.filters.length !== newFilters.length) return true;
    const existingFilters = new Set(this.filters.map(f => f.toString()));
    return !newFilters.every(f => existingFilters.has(f.toString()));
  }

  private hasSortsChanged(newSorts: readonly DhType.Sort[]): boolean {
    if (this.sorts.length !== newSorts.length) return true;
    for (let i = 0; i < this.sorts.length; i += 1) {
      const oldSort = this.sorts[i];
      const newSort = newSorts[i];
      if (oldSort.column.name !== newSort.column.name) return true;
      if (oldSort.direction !== newSort.direction) return true;
      if (oldSort.isAbs !== newSort.isAbs) return true;
    }
    return false;
  }

  async getRows(params: IServerSideGetRowsParams): Promise<void> {
    const { api, fail, request, success } = params;
    if (this.table == null) {
      fail();
      return;
    }
    log.debug2('getRows', request);

    // Get the viewport data for the requested rows
    // We don't need to worry about cancelling this request, as even if the next request comes in we should still be able to use the data
    const startRow = request.startRow ?? 0;
    const endRow = Math.max(startRow, (request.endRow ?? this.table.size) - 1);
    const newSorts = this.parseSortModel(request.sortModel);
    const newFilters = this.parseFilterModel(request.filterModel);

    if (this.getRowsSubscription == null) {
      this.getRowsSubscription = this.table.setViewport(startRow, endRow);
      api.addEventListener('viewportChanged', this.handleViewportChanged);
    } else if (
      this.hasFiltersChanged(newFilters) ||
      this.hasSortsChanged(newSorts)
    ) {
      log.debug2('Filters or sorts changed', newFilters, newSorts);
      this.filters = newFilters;
      this.sorts = newSorts;

      this.getRowsSubscription?.close();

      this.table.applyFilter(this.filters);
      this.table.applySort(this.sorts);
      this.getRowsSubscription = this.table.setViewport(startRow, endRow);

      // We need to update the viewport subscription as well
      // The bounds in the getRows request are independent from the viewport bounds, use cached bounds
      assertNotNull(this.viewportStartRow);
      assertNotNull(this.viewportEndRow);
      this.createViewportSubscription(
        api,
        this.viewportStartRow,
        this.viewportEndRow,
        this.filters,
        this.sorts
      );
    } else {
      this.getRowsSubscription.setViewport(startRow, endRow);
    }

    const viewportData = await this.getRowsSubscription?.getViewportData();
    const rowData = viewportData.rows.map(row =>
      this.extractViewportRow(row, viewportData.columns)
    );

    success({ rowData, rowCount: this.table.size });
  }

  handleViewportChanged(event: ViewportChangedEvent<unknown>): void {
    const { api, firstRow, lastRow } = event;
    if (lastRow < firstRow) {
      log.debug('Ignoring invalid viewport range', firstRow, lastRow);
      return;
    }

    log.debug('Viewport changed', firstRow, lastRow);
    // Cache viewport bounds so the viewport subscription can be swapped out when filtering/sorting
    this.viewportStartRow = firstRow;
    this.viewportEndRow = lastRow;

    if (this.viewportSubscription == null) {
      // We need to setup the new subscription. After it's created, we just need to update the viewport
      this.createViewportSubscription(api, firstRow, lastRow);
    } else {
      // We just need to update the viewport
      this.viewportSubscription.setViewport(firstRow, lastRow);
    }
  }

  destroy(): void {
    log.debug('Destroying server side datasource');
    this.viewportSubscription?.close();
    this.getRowsSubscription?.close();
    this.sizeListenerCleanup?.();
    this.stopListening();
    this.table.close();
  }
}

export default ServerSideDatasource;
