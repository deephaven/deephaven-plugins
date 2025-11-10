import type { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import {
  convertColumnToColDef,
  getColumnDefs,
  getSideBar,
  isPivotTable,
  isTable,
  isTreeTable,
} from './AgGridTableUtils';

function createMockColumn(options: Partial<DhType.Column> = {}): DhType.Column {
  return {
    name: options.name ?? 'Column',
    type: options.type ?? 'java.lang.String',
  } as unknown as DhType.Column;
}

function createMockPivotSource(
  options: Partial<CorePlusDhType.coreplus.pivot.PivotSource> = {}
): CorePlusDhType.coreplus.pivot.PivotSource {
  return {
    name: options.name ?? 'PivotSource',
    type: options.type ?? 'java.lang.String',
  } as unknown as CorePlusDhType.coreplus.pivot.PivotSource;
}

function createMockTable(options: Partial<DhType.Table> = {}): DhType.Table {
  return {
    columns: options.columns ?? [],
    rollup: options.rollup ?? jest.fn(),
  } as unknown as DhType.Table;
}

function createMockTreeTable(
  options: Partial<DhType.TreeTable> = {}
): DhType.TreeTable {
  return {
    columns: options.columns ?? [],
    groupedColumns: options.groupedColumns ?? [],
    expand: jest.fn(),
    collapse: jest.fn(),
  } as unknown as DhType.TreeTable;
}

function createMockPivotTable(
  options: Partial<CorePlusDhType.coreplus.pivot.PivotTable> = {}
): CorePlusDhType.coreplus.pivot.PivotTable {
  return {
    rowSources: options.rowSources ?? [],
    columnSources: options.columnSources ?? [],
    valueSources: options.valueSources ?? [],
  } as unknown as CorePlusDhType.coreplus.pivot.PivotTable;
}

describe('getSideBar', () => {
  it('returns the correct sidebar definition for a Table', () => {
    const mockTable = createMockTable();
    const sideBar = getSideBar(mockTable);
    expect(sideBar).toEqual({
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: false,
            suppressValues: false,
            suppressPivots: true,
          },
        },
      ],
    });
  });

  it('returns the correct sidebar definition for a TreeTable', () => {
    const mockTreeTable = createMockTreeTable();
    const sideBar = getSideBar(mockTreeTable);
    expect(sideBar).toEqual({
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: true,
            suppressValues: true,
            suppressPivots: true,
          },
        },
      ],
    });
  });
});

describe('convertColumnToColDef', () => {
  it.each([
    ['boolean', { cellDataType: 'boolean', filter: true, cellRenderer: null }],
    [
      'char',
      {
        cellDataType: 'char',
        filter: 'agNumberColumnFilter',
        filterParams: {
          buttons: ['reset', 'apply'],
          allowedCharPattern: 'a-zA-Z',
          numberParser: expect.any(Function),
          numberFormatter: expect.any(Function),
        },
      },
    ],
    ['string', { cellDataType: 'string', filter: true }],
    [
      'decimal',
      {
        cellDataType: 'decimal',
        filter: 'agNumberColumnFilter',
        cellStyle: expect.any(Function),
      },
    ],
    [
      'int',
      {
        cellDataType: 'int',
        filter: 'agNumberColumnFilter',
        cellStyle: expect.any(Function),
      },
    ],
  ])('converts a %s column to a ColDef', (type, expected) => {
    const column = TestUtils.createMockProxy<DhType.Column>({
      name: 'Test Column',
      type,
    });
    const colDef = convertColumnToColDef(column);
    expect(colDef).toEqual({
      ...expected,
    });
  });
});

it('checks table type', () => {
  const table = createMockTable();
  expect(isTable(table)).toBe(true);
  expect(isTreeTable(table)).toBe(false);
  expect(isPivotTable(table)).toBe(false);
});

it('checks tree table type', () => {
  const treeTable = createMockTreeTable();
  expect(isTable(treeTable)).toBe(false);
  expect(isTreeTable(treeTable)).toBe(true);
  expect(isPivotTable(treeTable)).toBe(false);
});

it('checks pivot table type', () => {
  const pivotTable = createMockPivotTable();
  expect(isTable(pivotTable)).toBe(false);
  expect(isTreeTable(pivotTable)).toBe(false);
  expect(isPivotTable(pivotTable)).toBe(true);
});

describe('convertColumnToColDef', () => {
  it('converts boolean column', () => {
    const column = {
      name: 'test',
      type: 'java.lang.Boolean',
    } as unknown as DhType.Column;
    const colDef = convertColumnToColDef(column);
    expect(colDef.cellDataType).toBe('boolean');
    expect(colDef.filter).toBe(true);
    expect(colDef.cellRenderer).toBeNull();
  });

  it('converts char column', () => {
    const column = {
      name: 'test',
      type: 'java.lang.Character',
    } as unknown as DhType.Column;
    const colDef = convertColumnToColDef(column);
    expect(colDef.cellDataType).toBe('char');
    expect(colDef.filter).toBe('agNumberColumnFilter');
  });

  it('converts string column', () => {
    const column = {
      name: 'test',
      type: 'java.lang.String',
    } as unknown as DhType.Column;
    const colDef = convertColumnToColDef(column);
    expect(colDef.cellDataType).toBe('string');
    expect(colDef.filter).toBe(true);
  });
});

describe('getColumnDefs', () => {
  describe('for table', () => {
    it('empty table has no definitions', () => {
      const table = createMockTable();
      const columnDefs = getColumnDefs(table);
      expect(columnDefs).toHaveLength(0);
    });

    it('returns column definitions for a table', () => {
      const table = createMockTable({
        columns: [
          createMockColumn({ name: 'col1' }),
          createMockColumn({ name: 'col2' }),
        ],
      });
      const columnDefs = getColumnDefs(table);
      expect(columnDefs).toHaveLength(2);
      expect(columnDefs[0].field).toBe('col1');
      expect(columnDefs[1].field).toBe('col2');
      expect(columnDefs[0].headerName).toBe('col1');
      expect(columnDefs[1].headerName).toBe('col2');
    });
  });

  describe('for tree table', () => {
    it('empty tree table has no definitions', () => {
      const treeTable = createMockTreeTable();
      const columnDefs = getColumnDefs(treeTable);
      expect(columnDefs).toHaveLength(0);
    });
    it('returns column definitions for a tree table', () => {
      const treeTable = createMockTreeTable({
        columns: [
          createMockColumn({ name: 'col1' }),
          createMockColumn({ name: 'col2' }),
        ],
        groupedColumns: [createMockColumn({ name: 'col1' })],
      });
      const columnDefs = getColumnDefs(treeTable);
      expect(columnDefs).toHaveLength(2);
      expect(columnDefs[0].field).toBe('col1');
      expect(columnDefs[0].headerName).toBe('col1');
      expect(columnDefs[0].rowGroup).toBe(true);
      expect(columnDefs[1].field).toBe('col2');
      expect(columnDefs[1].headerName).toBe('col2');
    });
  });

  describe('for pivot table', () => {
    it('empty pivot table has no definitions', () => {
      const pivotTable = createMockPivotTable();
      const columnDefs = getColumnDefs(pivotTable);
      expect(columnDefs).toHaveLength(0);
    });

    it('returns column definitions for a pivot table', () => {
      const pivotTable = createMockPivotTable({
        rowSources: [createMockPivotSource({ name: 'row1' })],
        columnSources: [createMockPivotSource({ name: 'col1' })],
        valueSources: [createMockPivotSource({ name: 'value1' })],
      });
      const columnDefs = getColumnDefs(pivotTable);
      expect(columnDefs).toHaveLength(3);
      expect(columnDefs[0].field).toBe('row1');
      expect(columnDefs[0].rowGroup).toBe(true);
      expect(columnDefs[1].field).toBe('col1');
      expect(columnDefs[1].pivot).toBe(true);
      expect(columnDefs[2].field).toBe('value1');
    });
  });
});
