import {
  AgEventListener,
  FilterChangedEvent,
  GridApi,
  IViewportDatasourceParams,
  SortChangedEvent,
} from '@ag-grid-community/core';
import { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { ViewportDatasource } from './ViewportRowDatasource';

describe('ViewportDatasource', () => {
  let mockDh: typeof DhType;
  let mockTable: DhType.Table;
  let mockGridApi: GridApi;
  let datasource: ViewportDatasource;
  let mockInitParams: IViewportDatasourceParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners = new Map<string, (...args: any[]) => unknown>();

  beforeEach(() => {
    listeners.clear();
    mockDh = TestUtils.createMockProxy<typeof DhType>();
    mockTable = TestUtils.createMockProxy<DhType.Table>({
      size: 100,
    });
    mockGridApi = TestUtils.createMockProxy<GridApi>({
      addEventListener: jest.fn((event, listener) => {
        listeners.set(event, listener);
      }),
      removeEventListener: jest.fn(event => {
        listeners.delete(event);
      }),
      getColumnState: jest.fn(() => []),
    });
    mockInitParams = {
      setRowCount: jest.fn(),
      setRowData: jest.fn(),
      getRow: jest.fn(),
    };

    datasource = new ViewportDatasource(mockDh, mockTable);
    datasource.init(mockInitParams);
    datasource.setGridApi(mockGridApi);
  });

  it('should listen to table updates when initialized', () => {
    expect(mockTable.addEventListener).toHaveBeenCalledWith(
      mockDh.Table.EVENT_UPDATED,
      expect.any(Function)
    );
    expect(mockTable.addEventListener).toHaveBeenCalledWith(
      mockDh.Table.EVENT_DISCONNECT,
      expect.any(Function)
    );
    expect(mockInitParams.setRowCount).toHaveBeenCalledWith(mockTable.size);
  });

  it('should start listening to grid events when API set', () => {
    expect(mockGridApi.addEventListener).toHaveBeenCalledWith(
      'filterChanged',
      expect.any(Function)
    );
    expect(mockGridApi.addEventListener).toHaveBeenCalledWith(
      'sortChanged',
      expect.any(Function)
    );
  });
  it('should set the viewport on the table when range is set', () => {
    const startRow = 0;
    const endRow = 10;
    datasource.setViewportRange(startRow, endRow);
    expect(mockTable.setViewport).toHaveBeenCalledWith(startRow, endRow);
  });
  it('should refresh the viewport when filters and sorts change', () => {
    const filterChangedListener = listeners.get(
      'filterChanged'
    ) as AgEventListener;
    const sortChangedListener = listeners.get('sortChanged') as AgEventListener;

    const startRow = 50;
    const endRow = 60;
    datasource.setViewportRange(startRow, endRow);
    expect(mockTable.setViewport).toHaveBeenCalledWith(startRow, endRow);

    jest.clearAllMocks();

    filterChangedListener(TestUtils.createMockProxy<FilterChangedEvent>());
    expect(mockTable.setViewport).toHaveBeenCalled();

    jest.clearAllMocks();

    sortChangedListener(TestUtils.createMockProxy<SortChangedEvent>());
    expect(mockTable.setViewport).toHaveBeenCalled();
  });
});
