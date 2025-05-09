/* eslint-disable class-methods-use-this */
import {
  GridApi,
  IServerSideDatasource,
  IServerSideGetRowsRequest,
  IServerSideGetRowsParams,
  ViewportChangedEvent,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import throttle from 'lodash.throttle';
import AgGridSortUtils from '../utils/AgGridSortUtils';
import AgGridFilterUtils from '../utils/AgGridFilterUtils';

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
  /** Keeps track of the current request that is being fetched */
  private request?: Partial<IServerSideGetRowsRequest>;

  private api?: GridApi;

  private hasAutoSizedAllColumns = false;

  /** Last viewport data that was received */
  private viewportData?: DhType.ViewportData;

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
    this.handleRequestFailed = this.handleRequestFailed.bind(this);
    this.handleTableUpdate = this.handleTableUpdate.bind(this);
    this.handleTableSizeChanged = this.handleTableSizeChanged.bind(this);
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
    this.table.addEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTableUpdate
    );
    this.table.addEventListener(
      this.dh.Table.EVENT_SIZECHANGED,
      this.handleTableSizeChanged
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
    this.table.removeEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTableUpdate
    );
    this.table.removeEventListener(
      this.dh.Table.EVENT_SIZECHANGED,
      this.handleTableSizeChanged
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

  private handleTableUpdate(event: DhType.Event<DhType.ViewportData>): void {
    log.debug('Table updated', event.detail);
    const { detail: newViewportData } = event;
    const { api } = this;

    if (api == null) {
      log.warn('AG Grid API is not set, ignoring table update');
      return;
    }

    // Map from the row index to the new data for that row
    const rowUpdates = new Map<string, unknown>();
    newViewportData.rows.forEach((row, index) => {
      rowUpdates.set(
        `${index + newViewportData.offset}`,
        this.extractViewportRow(row, newViewportData.columns)
      );
    });

    // Update the nodes in the grid with the new data
    // The stub data should already be there
    rowUpdates.forEach((data, index) => {
      const node = api.getRowNode(index);
      node?.setData(data);
    });

    // Updating table size here as the SIZECHANGED event doesn't fire on either the
    // table or subscription in some cases. This should be fixed in DH-19071.
    api.setRowCount(this.table.size);

    if (!this.hasAutoSizedAllColumns) {
      // For now only resize columns to fit data during initial mount
      this.hasAutoSizedAllColumns = true;
      api.autoSizeAllColumns();
    }

    this.viewportData = newViewportData;
  }

  private handleTableSizeChanged() {
    log.debug('Table size changed');
    this.api?.setRowCount(this.table.size);
  }

  async getRows(params: IServerSideGetRowsParams): Promise<void> {
    const { api, fail, request, success } = params;

    if (this.api !== api) {
      this.api?.removeEventListener(
        'viewportChanged',
        this.handleViewportChanged
      );

      this.api = api;

      // We need to set the row count here, as AG Grid doesn't know how many rows there are
      api.setRowCount(Math.max(0, this.table.size));
      api.addEventListener('viewportChanged', this.handleViewportChanged);
    }

    if (this.table == null) {
      fail();
      return;
    }

    // Set the request, and add stub data. The viewport change event will update the data
    const { startRow, endRow, ...otherParams } = request;
    this.setRequest({
      // We want to maintain the viewport start/end row, just update the other values
      startRow,
      endRow,
      ...this.request,
      ...otherParams,
    });

    if (startRow == null || endRow == null || startRow < 0 || endRow < 0) {
      log.warn('Invalid startRow', startRow, 'endRow', endRow, ', ignoring');
      fail();
      return;
    }

    const rowData = [];
    for (let r = startRow; r <= endRow; r += 1) {
      if (
        this.viewportData != null &&
        r >= this.viewportData.offset &&
        r < this.viewportData.offset + this.viewportData.rows.length
      ) {
        // We already have data from the viewport, just use that
        const row = this.viewportData.rows[r - this.viewportData.offset];
        rowData.push(this.extractViewportRow(row, this.viewportData.columns));
      } else {
        // Just provide stub data. It will be updated when the UPDATE event comes in from the table viewport.
        const row: Record<string, unknown> = {};
        for (let c = 0; c < this.table.columns.length; c += 1) {
          const column = this.table.columns[c];
          row[column.name] = undefined;
        }
        rowData.push(row);
      }
    }

    log.debug2('getRows', request, 'returning data', rowData);

    success({ rowData, rowCount: this.table.size });
  }

  handleViewportChanged(event: ViewportChangedEvent<unknown>): void {
    const { firstRow, lastRow } = event;
    if (lastRow < firstRow) {
      log.debug('Ignoring invalid viewport range', firstRow, lastRow);
      return;
    }

    log.debug('Viewport changed', firstRow, lastRow);
    const newRequest = {
      ...this.request,
      startRow: firstRow,
      endRow: lastRow,
    };

    this.setRequest(newRequest);
  }

  setRequest(request: Partial<IServerSideGetRowsRequest>): void {
    log.debug('Setting request', request);

    if (request.filterModel !== this.request?.filterModel) {
      log.debug('Filter model changed', request.filterModel);
      if (request.filterModel != null) {
        this.table.applyFilter(
          AgGridFilterUtils.parseFilterModel(
            this.dh,
            this.table,
            request.filterModel
          )
        );
      } else {
        this.table.applyFilter([]);
      }
    }

    if (request.sortModel !== this.request?.sortModel) {
      log.debug('Sort model changed', request.sortModel);
      if (request.sortModel != null) {
        this.table.applySort(
          AgGridSortUtils.parseSortModel(this.table, request.sortModel)
        );
      } else {
        this.table.applySort([]);
      }
    }

    if (request.startRow == null || request.endRow == null) {
      log.debug('No start or end row, ignoring');
      return;
    }

    const startRow = Math.max(0, request.startRow);
    const endRow = Math.min(
      Math.max(startRow, request.endRow),
      this.table.size
    );

    this.setTableViewport(startRow, endRow);

    this.request = request;
  }

  private setTableViewport = throttle((startRow: number, endRow: number) => {
    log.debug('Setting table viewport', startRow, endRow);
    this.table.setViewport(startRow, endRow);
  }, 250);

  destroy(): void {
    log.debug('Destroying server side datasource');
    this.stopListening();
    this.table.close();
  }
}

export default ServerSideDatasource;
