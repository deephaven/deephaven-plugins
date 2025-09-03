import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TestUtils } from '@deephaven/test-utils';
import {
  extractSnapshotRow,
  extractTotalsRow,
  findRowIndex,
  getHeaderName,
  getPivotResultColumns,
  makeColumnValuesColDef,
  getRowGroupKeys,
  isPivotColumnGroupContext,
  toGroupKeyString,
  makePendingColDef,
} from './AgGridPivotUtils';
import { TREE_NODE_KEY } from './AgGridTableUtils';
import AgGridFormatter from './AgGridFormatter';

function assertInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThan(max);
}

function parseNumber(value: string): number {
  return Number.parseInt(value.replace(/\D/g, ''), 10);
}

function makeDimensionData({
  count = 3,
  offset = 0,
  totalCount = 1000,
}): CorePlusDhType.coreplus.pivot.DimensionData {
  return TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>(
    {
      count,
      offset,
      totalCount,
      getKeys: jest.fn((index: number) => {
        assertInRange(index, offset, offset + count);
        return [`Key${index}`];
      }),
      getDepth: jest.fn((index: number) => {
        assertInRange(index, offset, offset + count);
        return 1;
      }),
      hasChildren: jest.fn((index: number) => {
        assertInRange(index, offset, offset + count);
        return false;
      }),
      isExpanded: jest.fn((index: number) => {
        assertInRange(index, offset, offset + count);
        return false;
      }),
      getTotal: jest.fn(
        (index: number, source: CorePlusDhType.coreplus.pivot.PivotSource) => {
          assertInRange(index, offset, offset + count);
          return (index + 1) * 10 + parseNumber(source.name) * 1000;
        }
      ),
    }
  );
}

describe('isPivotColumnGroupContext', () => {
  it.each([
    [undefined, false],
    [null, false],
    [{ snapshotIndex: 0 }, true],
    [{ someOtherKey: 1 }, false],
  ])('should return %p for %p', (context, expected) => {
    expect(isPivotColumnGroupContext(context)).toBe(expected);
  });
});

describe('toGroupKeyString', () => {
  it.each([
    [[], ''],
    [[null, null], ''],
    [[undefined, undefined], ''],
    [['A', null], 'A'],
    [['A', 'B', null], 'A/B'],
    [['A', 'B', 'C'], 'A/B/C'],
  ])('should return %p for %p', (groupKeys, expected) => {
    expect(toGroupKeyString(groupKeys)).toBe(expected);
  });
});

describe('getRowGroupKeys', () => {
  it('should return an empty array if there are no row sources', () => {
    const result = getRowGroupKeys([], {});
    expect(result).toEqual([]);
  });

  it('should return the correct row group keys for a single row source', () => {
    const result = getRowGroupKeys(
      [
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'A',
        }),
      ],
      { A: 'A1' }
    );
    expect(result).toEqual(['A1']);
  });

  it('should return the correct row group keys for multiple row sources', () => {
    const result = getRowGroupKeys(
      [
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'A',
        }),
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'B',
        }),
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'C',
        }),
      ],
      { A: 'A1', B: 'B1', C: 'C1' }
    );
    expect(result).toEqual(['A1', 'B1', 'C1']);
  });

  it('should return the correct row group keys when last value is missing', () => {
    const result2 = getRowGroupKeys(
      [
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'A',
        }),
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'B',
        }),
        TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
          name: 'C',
        }),
      ],
      { A: 'A1', B: 'B1' }
    );
    expect(result2).toEqual(['A1', 'B1']);
  });
});

describe('findRowIndex', () => {
  it('should return null if no matching row is found', () => {
    const rows =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: 2,
        getKeys: (index: number) => (index === 0 ? ['A1'] : ['A2']),
      });
    const result = findRowIndex(rows, ['B1']);
    expect(result).toBeNull();
  });
});

describe('getHeaderName', () => {
  it.each([
    [['A', null], 'A'],
    [['A', 'B', null], 'B'],
    [['A', 'B', 'C'], 'C'],
  ])('should return %p for %p', (columnKeys, expected) => {
    expect(getHeaderName(columnKeys)).toBe(expected);
  });

  it.each([[[]], [[null]], [[null, null]]])(
    'should throw for %p',
    columnKeys => {
      expect(() => getHeaderName(columnKeys)).toThrow(
        'No non-null column key found'
      );
    }
  );
});

describe('makeColumnValuesColDef', () => {
  const headerName = 'ColumnHeader';
  const columnKey = 'ColumnKey';
  const valueSources = [
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'Value1',
      type: 'java.lang.Integer',
    }),
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'Value2',
      type: 'java.lang.String',
    }),
  ];

  it('should return a single column definition if there is only one value source', () => {
    const colDef = makeColumnValuesColDef(headerName, columnKey, [
      valueSources[0],
    ]);
    expect(colDef).toEqual({
      headerName,
      field: 'ColumnKey/Value1',
      colId: 'ColumnKey/Value1',
      cellDataType: 'int',
      cellStyle: expect.any(Function),
    });
  });

  it('should return a group column definition if there are multiple value sources', () => {
    const colDef = makeColumnValuesColDef(headerName, columnKey, valueSources);
    expect(colDef).toEqual({
      headerName,
      groupId: 'ColumnKey',
      children: [
        {
          headerName: 'Value1',
          field: 'ColumnKey/Value1',
          colId: 'ColumnKey/Value1',
          cellDataType: 'int',
          cellStyle: expect.any(Function),
        },
        {
          headerName: 'Value2',
          field: 'ColumnKey/Value2',
          colId: 'ColumnKey/Value2',
          cellDataType: 'string',
          cellStyle: undefined,
        },
      ],
    });
  });

  it('should throw if no value sources are provided', () => {
    expect(() =>
      makeColumnValuesColDef('Test Group', 'Test Group', [])
    ).toThrow('No value sources provided');
  });
});

describe('getPivotResultColumns', () => {
  const valueSources = [
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'V1',
      type: 'java.lang.Integer',
    }),
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'V2',
      type: 'java.lang.String',
    }),
  ];

  it('should only add the totals column if there are no columns in the DimensionData', () => {
    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: 0,
      });

    const result = getPivotResultColumns(columns, valueSources);
    expect(result).toEqual([
      {
        headerName: 'V1 Totals',
        field: 'V1',
        colId: 'V1',
        cellDataType: 'int',
        cellStyle: AgGridFormatter.styleForNumberCell,
      },
      {
        headerName: 'V2 Totals',
        field: 'V2',
        colId: 'V2',
        cellDataType: 'string',
        cellStyle: undefined,
      },
    ]);
  });

  it('should handle one level of columns with nothing expanded yet', () => {
    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: 3,
        offset: 0,
        getKeys: (index: number) => [`C${index}`],
        hasChildren: () => true,
      });

    const result = getPivotResultColumns(columns, valueSources);
    expect(result).toEqual([
      {
        headerName: 'C0',
        groupId: 'C0',
        columnGroupShow: 'open',
        children: [
          makePendingColDef('C0'),
          makeColumnValuesColDef('C0 Totals', 'C0', valueSources),
        ],
        context: { snapshotIndex: 0 },
      },
      {
        headerName: 'C1',
        groupId: 'C1',
        columnGroupShow: 'open',
        children: [
          makePendingColDef('C1'),
          makeColumnValuesColDef('C1 Totals', 'C1', valueSources),
        ],
        context: { snapshotIndex: 1 },
      },
      {
        headerName: 'C2',
        groupId: 'C2',
        columnGroupShow: 'open',
        children: [
          makePendingColDef('C2'),
          makeColumnValuesColDef('C2 Totals', 'C2', valueSources),
        ],
        context: { snapshotIndex: 2 },
      },
      {
        headerName: 'V1 Totals',
        field: 'V1',
        colId: 'V1',
        cellDataType: 'int',
        cellStyle: AgGridFormatter.styleForNumberCell,
      },
      {
        headerName: 'V2 Totals',
        field: 'V2',
        colId: 'V2',
        cellDataType: 'string',
        cellStyle: undefined,
      },
    ]);
  });

  it('should handle one level of columns with one expanded', () => {
    const groupKeys = [
      ['C0', null],
      ['C0', 'C0.1'],
      ['C1', null],
    ];
    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: groupKeys.length,
        offset: 0,
        getKeys: (index: number) => groupKeys[index],
        hasChildren: (index: number) => groupKeys[index][1] == null,
      });

    const result = getPivotResultColumns(columns, valueSources);
    expect(result).toEqual([
      {
        headerName: 'C0',
        groupId: 'C0',
        columnGroupShow: 'open',
        children: [
          {
            ...makeColumnValuesColDef('C0.1', 'C0/C0.1', valueSources),
            columnGroupShow: 'open',
          },
          makeColumnValuesColDef('C0 Totals', 'C0', valueSources),
        ],
        context: { snapshotIndex: 0 },
      },
      {
        headerName: 'C1',
        groupId: 'C1',
        columnGroupShow: 'open',
        children: [
          makePendingColDef('C1'),
          makeColumnValuesColDef('C1 Totals', 'C1', valueSources),
        ],
        context: { snapshotIndex: 2 },
      },
      {
        headerName: 'V1 Totals',
        field: 'V1',
        colId: 'V1',
        cellDataType: 'int',
        cellStyle: AgGridFormatter.styleForNumberCell,
      },
      {
        headerName: 'V2 Totals',
        field: 'V2',
        colId: 'V2',
        cellDataType: 'string',
        cellStyle: undefined,
      },
    ]);
  });

  it('should handle multiple levels of columns with some expanded', () => {
    const groupKeys = [
      ['C0', null, null],
      ['C1', null, null],
      ['C1', 'C1.1', null],
      ['C1', 'C1.1', 'C1.1.1'],
      ['C1', 'C1.1', 'C1.1.2'],
      ['C1', 'C1.2', null],
      ['C2', null, null],
      ['C2', 'C2.1', null],
      ['C2', 'C2.2', null],
    ];

    const columns =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.DimensionData>({
        count: groupKeys.length,
        offset: 0,
        getKeys: (index: number) => groupKeys[index],
        hasChildren: (index: number) => groupKeys[index][2] == null,
      });

    const result = getPivotResultColumns(columns, valueSources);
    expect(result).toEqual([
      {
        headerName: 'C0',
        groupId: 'C0',
        columnGroupShow: 'open',
        children: [
          makePendingColDef('C0'),
          makeColumnValuesColDef('C0 Totals', 'C0', valueSources),
        ],
        context: { snapshotIndex: 0 },
      },
      {
        headerName: 'C1',
        groupId: 'C1',
        columnGroupShow: 'open',
        children: [
          {
            headerName: 'C1.1',
            groupId: 'C1/C1.1',
            columnGroupShow: 'open',
            context: { snapshotIndex: 2 },
            children: [
              {
                ...makeColumnValuesColDef(
                  'C1.1.1',
                  'C1/C1.1/C1.1.1',
                  valueSources
                ),
                columnGroupShow: 'open',
              },
              {
                ...makeColumnValuesColDef(
                  'C1.1.2',
                  'C1/C1.1/C1.1.2',
                  valueSources
                ),
                columnGroupShow: 'open',
              },
              makeColumnValuesColDef('C1.1 Totals', 'C1/C1.1', valueSources),
            ],
          },
          {
            headerName: 'C1.2',
            groupId: 'C1/C1.2',
            columnGroupShow: 'open',
            children: [
              makePendingColDef('C1/C1.2'),
              makeColumnValuesColDef('C1.2 Totals', 'C1/C1.2', valueSources),
            ],
            context: { snapshotIndex: 5 },
          },
          makeColumnValuesColDef('C1 Totals', 'C1', valueSources),
        ],
        context: { snapshotIndex: 1 },
      },
      {
        headerName: 'C2',
        groupId: 'C2',
        columnGroupShow: 'open',
        children: [
          {
            headerName: 'C2.1',
            groupId: 'C2/C2.1',
            columnGroupShow: 'open',
            context: { snapshotIndex: 7 },
            children: [
              makePendingColDef('C2/C2.1'),
              makeColumnValuesColDef('C2.1 Totals', 'C2/C2.1', valueSources),
            ],
          },
          {
            headerName: 'C2.2',
            groupId: 'C2/C2.2',
            columnGroupShow: 'open',
            context: { snapshotIndex: 8 },
            children: [
              makePendingColDef('C2/C2.2'),
              makeColumnValuesColDef('C2.2 Totals', 'C2/C2.2', valueSources),
            ],
          },
          makeColumnValuesColDef('C2 Totals', 'C2', valueSources),
        ],
        context: { snapshotIndex: 6 },
      },
      {
        headerName: 'V1 Totals',
        field: 'V1',
        colId: 'V1',
        cellDataType: 'int',
        cellStyle: AgGridFormatter.styleForNumberCell,
      },
      {
        headerName: 'V2 Totals',
        field: 'V2',
        colId: 'V2',
        cellDataType: 'string',
        cellStyle: undefined,
      },
    ]);
  });
});

describe('extractSnapshotRow', () => {
  const rowSources = [
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'A',
    }),
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'B',
    }),
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'C',
    }),
  ];
  const valueSources = [
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'V1',
    }),
    TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
      name: 'V2',
    }),
  ];
  it('should extract the correct values from the snapshot', () => {
    const rowCount = 3;
    const mockRows = makeDimensionData({ count: rowCount });
    const snapshot =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSnapshot>({
        rows: mockRows,
      });
    const table =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotTable>({
        rowSources,
        valueSources,
      });
    expect(extractSnapshotRow(snapshot, table, 0)).toEqual({
      A: 'Key0',
      V1: 1010,
      V2: 2010,
      [TREE_NODE_KEY]: {
        depth: 1,
        hasChildren: false,
        index: 0,
        isExpanded: false,
      },
    });

    expect(extractSnapshotRow(snapshot, table, 2)).toEqual({
      A: 'Key2',
      V1: 1030,
      V2: 2030,
      [TREE_NODE_KEY]: {
        depth: 1,
        hasChildren: false,
        index: 2,
        isExpanded: false,
      },
    });

    expect(() => extractSnapshotRow(snapshot, table, 3)).toThrow();
  });

  it('handles an offset correctly', () => {
    const rowCount = 4;
    const offset = 5;
    const mockRows = makeDimensionData({ count: rowCount, offset });
    const snapshot =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSnapshot>({
        rows: mockRows,
      });
    const table =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotTable>({
        rowSources,
        valueSources,
      });
    expect(extractSnapshotRow(snapshot, table, 5)).toEqual({
      A: 'Key5',
      V1: 1060,
      V2: 2060,
      [TREE_NODE_KEY]: {
        depth: 1,
        hasChildren: false,
        index: 5,
        isExpanded: false,
      },
    });

    expect(extractSnapshotRow(snapshot, table, 8)).toEqual({
      A: 'Key8',
      V1: 1090,
      V2: 2090,
      [TREE_NODE_KEY]: {
        depth: 1,
        hasChildren: false,
        index: 8,
        isExpanded: false,
      },
    });

    expect(() => extractSnapshotRow(snapshot, table, 0)).toThrow();
  });
});

describe('extractTotalsRow', () => {
  it('should extract the correct totals from the snapshot', () => {
    const mockRows = makeDimensionData({ count: 3 });
    const mockColumns = makeDimensionData({ count: 2 });
    const snapshot =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSnapshot>({
        rows: mockRows,
        columns: mockColumns,
        getValue: jest.fn(
          (source, rowIndex, columnIndex) =>
            parseNumber(source.name) * 1000 + columnIndex * 100 + rowIndex
        ),
        getGrandTotal: jest.fn(source => parseNumber(source.name) * 1000),
      });
    const table =
      TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotTable>({
        valueSources: [
          TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
            name: 'V1',
          }),
          TestUtils.createMockProxy<CorePlusDhType.coreplus.pivot.PivotSource>({
            name: 'V2',
          }),
        ],
      });

    expect(extractTotalsRow(snapshot, table)).toEqual({
      'Key0/V1': 1010,
      'Key0/V2': 2010,
      'Key1/V1': 1020,
      'Key1/V2': 2020,
      V1: 1000,
      V2: 2000,
      [TREE_NODE_KEY]: {
        depth: 0,
        hasChildren: false,
        index: 1000,
        isExpanded: false,
      },
    });
  });
});
