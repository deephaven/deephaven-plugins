import {
  GridApi,
  IRowNode,
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  ViewportChangedEvent,
} from '@ag-grid-community/core';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ServerSideDatasource } from './ServerSideDatasource';

describe('ServerSideDatasource', () => {
  let mockDh: typeof DhType;
  let mockTable: DhType.Table;
  let mockGridApi: GridApi;
  let datasource: ServerSideDatasource;
  let mockSubscription: DhType.TableViewportSubscription;

  let mockSetViewportSubscription: jest.Mock;
  let mockCloseSubscription: jest.Mock;

  let mockGetRowsSuccess: jest.Mock;
  let mockGetRowsFail: jest.Mock;

  let defaultGetRowsParams: IServerSideGetRowsParams;

  const defaultGetRowsRequest: IServerSideGetRowsRequest = {
    startRow: 0,
    endRow: 50,
    sortModel: [],
    filterModel: [],
    rowGroupCols: [],
    valueCols: [],
    pivotCols: [],
    pivotMode: false,
    groupKeys: [],
  };

  const mockViewportData = {
    rows: [],
    columns: [],
    offset: 0,
  };

  beforeEach(() => {
    mockDh = {
      Table: {
        EVENT_DISCONNECT: 'disconnect',
        EVENT_REQUEST_FAILED: 'requestFailed',
        EVENT_UPDATED: 'updated',
        EVENT_SIZECHANGED: 'sizeChanged',
      },
    } as typeof DhType;

    mockGridApi = {
      setRowCount: jest.fn(),
      autoSizeAllColumns: jest.fn(),
      addEventListener: jest.fn(),
      forEachNode: jest.fn(),
    } as unknown as GridApi;

    mockGetRowsFail = jest.fn();
    mockGetRowsSuccess = jest.fn();
    defaultGetRowsParams = {
      api: mockGridApi,
      fail: mockGetRowsFail,
      success: mockGetRowsSuccess,
      request: defaultGetRowsRequest,
      parentNode: undefined as unknown as IRowNode,
      context: undefined,
    };

    const mockFilter = {
      isNull: jest.fn(),
    };

    const mockSort = {
      asc: jest.fn(),
      desc: jest.fn(),
    };

    const mockColumn = {
      filter: jest.fn().mockReturnValue(mockFilter),
      sort: jest.fn().mockReturnValue(mockSort),
    };

    mockCloseSubscription = jest.fn();
    mockSetViewportSubscription = jest.fn();
    mockSubscription = {
      addEventListener: jest.fn(),
      close: mockCloseSubscription,
      getViewportData: jest.fn().mockResolvedValue(mockViewportData),
      setViewport: mockSetViewportSubscription,
    } as unknown as DhType.TableViewportSubscription;

    mockTable = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      applyFilter: jest.fn(),
      applySort: jest.fn(),
      findColumn: jest.fn().mockReturnValue(mockColumn),
      setViewport: jest.fn().mockReturnValue(mockSubscription),
      close: jest.fn(),
      size: 100,
    } as unknown as DhType.Table;

    datasource = new ServerSideDatasource(mockDh, mockTable);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRows', () => {
    it('should create new getRows subscription when none exists', async () => {
      await datasource.getRows(defaultGetRowsParams);

      expect(mockTable.applyFilter).toHaveBeenCalledTimes(0);
      expect(mockTable.applySort).toHaveBeenCalledTimes(0);
      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);
      expect(mockGetRowsSuccess).toHaveBeenCalledTimes(1);
      expect(mockGetRowsFail).toHaveBeenCalledTimes(0);
      expect(mockCloseSubscription).toHaveBeenCalledTimes(0);
    });

    it('should create new subscriptions on filter change', async () => {
      await datasource.getRows(defaultGetRowsParams);

      expect(mockTable.applyFilter).toHaveBeenCalledTimes(0);
      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);

      // Call viewport change to create a viewport subscription so that cached viewport bounds are populated
      // This typically happens immediately after getRows is called
      datasource.handleViewportChanged({
        api: mockGridApi,
        firstRow: 0,
        lastRow: 50,
      } as ViewportChangedEvent<unknown>);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(2);

      await datasource.getRows({
        api: mockGridApi,
        fail: jest.fn(),
        success: jest.fn(),
        request: {
          ...defaultGetRowsRequest,
          filterModel: [{ filterType: 'number', type: 'blank' }],
        },
        parentNode: undefined as unknown as IRowNode,
        context: undefined,
      });

      // Both viewport and getRows subscriptions were closed and updated
      expect(mockCloseSubscription).toHaveBeenCalledTimes(2);
      expect(mockTable.applyFilter).toHaveBeenCalledTimes(2);
      expect(mockTable.applySort).toHaveBeenCalledTimes(0);
      expect(mockTable.setViewport).toHaveBeenCalledTimes(4);
    });

    it('should create new subscriptions on sort change', async () => {
      await datasource.getRows(defaultGetRowsParams);

      expect(mockTable.applySort).toHaveBeenCalledTimes(0);
      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);

      // Call viewport change to create a viewport subscription so that cached viewport bounds are populated
      // This typically happens immediately after getRows is called
      datasource.handleViewportChanged({
        api: mockGridApi,
        firstRow: 0,
        lastRow: 50,
      } as ViewportChangedEvent<unknown>);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(2);

      await datasource.getRows({
        api: mockGridApi,
        fail: jest.fn(),
        success: jest.fn(),
        request: {
          ...defaultGetRowsRequest,
          sortModel: [{ colId: 'col1', sort: 'asc' }],
        },
        parentNode: undefined as unknown as IRowNode,
        context: undefined,
      });

      // Both viewport and getRows subscriptions were closed and updated
      expect(mockCloseSubscription).toHaveBeenCalledTimes(2);
      expect(mockTable.applyFilter).toHaveBeenCalledTimes(0);
      expect(mockTable.applySort).toHaveBeenCalledTimes(2);
      expect(mockTable.setViewport).toHaveBeenCalledTimes(4);
    });

    it('should only update range when getRows subscription already exists', async () => {
      await datasource.getRows(defaultGetRowsParams);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);

      await datasource.getRows(defaultGetRowsParams);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);
      expect(mockSetViewportSubscription).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleViewportChanged', () => {
    it('should ignore invalid viewport range', () => {
      jest.spyOn(datasource, 'createViewportSubscription');

      datasource.handleViewportChanged({
        api: mockGridApi,
        firstRow: 10,
        lastRow: 5,
      } as ViewportChangedEvent<unknown>);

      expect(datasource.createViewportSubscription).toHaveBeenCalledTimes(0);
      expect(mockTable.setViewport).toHaveBeenCalledTimes(0);
    });

    it('should create new viewport subscription when none exists', () => {
      jest.spyOn(datasource, 'createViewportSubscription');

      datasource.handleViewportChanged({
        api: mockGridApi,
        firstRow: 0,
        lastRow: 10,
      } as ViewportChangedEvent<unknown>);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);
      expect(datasource.createViewportSubscription).toHaveBeenCalledWith(
        mockGridApi,
        0,
        10
      );
    });

    it('should only update range when viewport subscription already exists', () => {
      datasource.createViewportSubscription(mockGridApi, 0, 10);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);

      datasource.handleViewportChanged({
        api: mockGridApi,
        firstRow: 5,
        lastRow: 15,
      } as ViewportChangedEvent<unknown>);

      expect(mockTable.setViewport).toHaveBeenCalledTimes(1);
      expect(mockSetViewportSubscription).toHaveBeenCalledWith(5, 15);
    });
  });

  describe('destroy', () => {
    it('should cleanup subscriptions and listeners', () => {
      // Create getRows and viewport subscription
      datasource.getRows(defaultGetRowsParams);
      datasource.createViewportSubscription(mockGridApi, 0, 10);
      datasource.destroy();

      expect(mockCloseSubscription).toHaveBeenCalledTimes(2);
      expect(mockTable.removeEventListener).toHaveBeenCalledTimes(2);
      expect(mockTable.close).toHaveBeenCalledTimes(1);
    });
  });
});
