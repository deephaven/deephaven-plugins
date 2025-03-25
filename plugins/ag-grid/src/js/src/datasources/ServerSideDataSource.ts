/* eslint-disable class-methods-use-this */
import {
  IServerSideDatasource,
  IServerSideGetRowsParams,
  ViewportChangedEvent,
} from '@ag-grid-community/core';
import { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

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
    log.debug('Table disconnected, destroying grid.');
    this.destroy();
  }

  private handleRequestFailed({ detail: error }: DhType.Event<unknown>): void {
    log.error('Request failed:', error);
  }

  async getRows(params: IServerSideGetRowsParams): Promise<void> {
    const { fail, request, success } = params;
    if (this.table == null) {
      fail();
      return;
    }
    log.debug2('getRows', request);

    // Get the viewport data for the requested rows
    // We don't need to worry about cancelling this request, as even if the next request comes in we should still be able to use the data
    const startRow = request.startRow ?? 0;
    const endRow = Math.max(startRow, (request.endRow ?? this.table.size) - 1);
    if (this.getRowsSubscription == null) {
      this.getRowsSubscription = this.table.setViewport(startRow, endRow);
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
    if (this.viewportSubscription == null) {
      log.debug('Creating new viewport subscription');
      // We need to setup the new subscription. After it's created, we just need to update the viewport
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

      // We also want to listen for when the table size changes, so we can notify AG Grid
      this.sizeListenerCleanup = this.table.addEventListener<number>(
        this.dh.Table.EVENT_SIZECHANGED,
        ({ detail: newSize }) => {
          log.debug('Table size changed', newSize);
          api.setRowCount(newSize);
        }
      );
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
