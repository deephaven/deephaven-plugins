import type { dh as DhType } from '@deephaven/jsapi-types';
import { GridApi, IViewportDatasourceParams } from 'ag-grid-community';
import { DeephavenViewportDatasource } from './DeephavenViewportDatasource';

// Mock the filter utils so we don't need a full Deephaven column/filter chain
jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');
  return {
    ...actual,
    AgGridFilterUtils: {
      ...actual.AgGridFilterUtils,
      parseFilterModel: jest.fn().mockReturnValue([]),
    },
  };
});

/**
 * Create a minimal mock of the Deephaven API.
 */
function createMockDh() {
  return {
    Table: {
      EVENT_UPDATED: 'updated',
      EVENT_DISCONNECT: 'disconnect',
    },
    FilterValue: {
      ofString: jest.fn(),
    },
  } as unknown as typeof DhType;
}

/**
 * Create a mock Deephaven Table with controllable size and event listeners.
 */
function createMockTable(initialSize = 100) {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  return {
    size: initialSize,
    columns: [],
    addEventListener: jest.fn((event: string, handler: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: jest.fn(),
    applyFilter: jest.fn(),
    applySort: jest.fn(),
    setViewport: jest.fn(),
    findColumn: jest.fn(),
    close: jest.fn(),
    /** Helper to change the reported table size (simulates server-side filter results) */
    setSize(newSize: number) {
      this.size = newSize;
    },
  };
}

/**
 * Create a mock AG Grid API with event listener support.
 */
function createMockGridApi() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  return {
    addEventListener: jest.fn((event: string, handler: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: jest.fn(),
    getFilterModel: jest.fn().mockReturnValue({}),
    getColumnState: jest.fn().mockReturnValue([]),
    getFirstDisplayedRowIndex: jest.fn().mockReturnValue(0),
    getLastDisplayedRowIndex: jest.fn().mockReturnValue(49),
    getRowGroupColumns: jest.fn().mockReturnValue([]),
    /** Helper to fire a registered event */
    fireEvent(event: string, detail: unknown = {}) {
      listeners[event]?.forEach(h => h(detail));
    },
  } as unknown as GridApi & {
    fireEvent: (event: string, detail?: unknown) => void;
  };
}

/**
 * Create mock IViewportDatasourceParams.
 */
function createMockParams() {
  return {
    setRowData: jest.fn(),
    setRowCount: jest.fn(),
  } as unknown as IViewportDatasourceParams;
}

describe('DeephavenViewportDatasource', () => {
  let dh: typeof DhType;
  let table: ReturnType<typeof createMockTable>;
  let gridApi: ReturnType<typeof createMockGridApi>;
  let params: IViewportDatasourceParams;
  let datasource: DeephavenViewportDatasource;

  beforeEach(() => {
    jest.clearAllMocks();
    dh = createMockDh();
    table = createMockTable(100);
    gridApi = createMockGridApi();
    params = createMockParams();

    datasource = new DeephavenViewportDatasource(
      dh,
      table as unknown as DhType.Table
    );
    datasource.init(params);
    datasource.setGridApi(gridApi as unknown as GridApi);
  });

  describe('filter then clear restores rows', () => {
    it('should request a valid viewport after clearing a filter that returned zero rows', async () => {
      // 1. Simulate initial viewport set by AG Grid (user sees rows 0-49)
      datasource.setViewportRange(0, 49);

      // Wait for queued operations
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });

      expect(table.setViewport).toHaveBeenLastCalledWith(0, 49);

      // 2. Apply a text filter that returns zero rows.
      // AG Grid fires filterChanged. The table now has 0 rows.
      // When the table has 0 rows, AG Grid calls setViewportRange with (0, -1).
      table.setSize(0);
      gridApi.getFilterModel = jest.fn().mockReturnValue({
        col1: { filterType: 'text', type: 'contains', filter: 'nonexistent' },
      });
      table.setViewport.mockClear();

      // Fire filterChanged event
      gridApi.fireEvent('filterChanged', { source: 'api' });

      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });

      // AG Grid would call setViewportRange(0, -1) since there are no rows
      datasource.setViewportRange(0, -1);

      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });

      // 3. Clear the filter — rows should come back.
      table.setSize(100);
      gridApi.getFilterModel = jest.fn().mockReturnValue({});
      gridApi.getFirstDisplayedRowIndex = jest.fn().mockReturnValue(0);
      gridApi.getLastDisplayedRowIndex = jest.fn().mockReturnValue(49);
      table.setViewport.mockClear();

      // Fire filterChanged event (clearing filter)
      gridApi.fireEvent('filterChanged', { source: 'api' });

      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });

      // The viewport should have been applied with a valid range (not 0, -1)
      const lastCall =
        table.setViewport.mock.calls[table.setViewport.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      const [firstRow, lastRow] = lastCall;
      expect(firstRow).toBeGreaterThanOrEqual(0);
      // This is the key assertion: lastRow must be >= firstRow for rows to display
      expect(lastRow).toBeGreaterThanOrEqual(firstRow);
      expect(lastRow).toBeGreaterThan(0);
    });
  });
});
