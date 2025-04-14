/* eslint-disable class-methods-use-this */
import {
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
    sorts: DhType.Sort[] = []
  ): void {
    log.debug('Creating new viewport subscription', firstRow, lastRow, sorts);

    this.viewportSubscription?.close();

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

  private parseSorts(sortModelItems: readonly SortModelItem[]): DhType.Sort[] {
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

  private hasSortsChanged(sorts: readonly DhType.Sort[]): boolean {
    if (this.sorts.length !== sorts.length) return true;
    for (let i = 0; i < this.sorts.length; i += 1) {
      const oldSort = this.sorts[i];
      const newSort = sorts[i];
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
    const newSorts = this.parseSorts(request.sortModel);

    if (this.getRowsSubscription == null) {
      this.getRowsSubscription = this.table.setViewport(startRow, endRow);
      api.addEventListener('viewportChanged', this.handleViewportChanged);
    } else if (this.hasSortsChanged(newSorts)) {
      log.debug2('Sorts changed', newSorts);
      this.sorts = newSorts;

      this.getRowsSubscription?.close();

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
        newSorts
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
