import { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils/';
import IrisGridPivotModel from './IrisGridPivotModel';

const { createMockProxy, asMock } = TestUtils;

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const mockDh = createMockProxy<typeof DhType>({
  i18n: {
    TimeZone: {
      getTimeZone: () => ({ id: 'America/New_York', standardOffset: 300 }),
    },
    NumberFormat: {
      format: (_: string, value: unknown) => String(value),
    },
  },
  coreplus: {
    pivot: createMockProxy<typeof DhType.coreplus.pivot>(),
  },
  RangeSet: {
    ofRange: jest.fn().mockImplementation((start: number, end: number) => ({
      start,
      end,
    })),
  },
} satisfies DeepPartial<typeof DhType> as unknown as typeof DhType);

const DEFAULT_CONFIG = {
  rowBufferPages: 0,
};
const DEFAULT_GRAND_TOTAL = 10000;
const DEFAULT_ROW_TOTAL = 100;
const DEFAULT_COLUMN_TOTAL = 200;
const DEFAULT_VALUE = 1;
const DEFAULT_ROW_COUNT = 3;
const DEFAULT_COLUMN_COUNT = 2;

/**
 * Creates a pivot table mock with the specified row, column, and value sources.
 * @param rowByColumns The columns to use for rows.
 * @param columnByColumns The columns to use for columns.
 * @param valueSources The value sources.
 * @returns The created pivot table.
 */
function makePivotTable(
  rowByColumns: string[],
  columnByColumns: string[],
  valueSources: string[]
): DhType.coreplus.pivot.PivotTable {
  return createMockProxy<DhType.coreplus.pivot.PivotTable>({
    rowSources: rowByColumns.map(name =>
      createMockProxy<DhType.coreplus.pivot.PivotSource>({
        type: 'java.lang.String',
        name,
      })
    ),
    columnSources: columnByColumns.map(name =>
      createMockProxy<DhType.coreplus.pivot.PivotSource>({
        type: 'java.lang.String',
        name,
      })
    ),
    valueSources: valueSources.map(name =>
      createMockProxy<DhType.coreplus.pivot.PivotSource>({
        type: 'long',
        name,
      })
    ),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setViewport: jest.fn(),
  });
}

/**
 * Creates an update event for the specified pivot table.
 * @param pivotTable The pivot table to create the update event for.
 * @param updateEventOptions Options for the update event.
 * @returns The created update event.
 */
function makeUpdateEvent(
  pivotTable: DhType.coreplus.pivot.PivotTable,
  // 1 RowByColumn, 1 ColumnByColumn, 1 ValueSource by default
  // No children, nothing expanded
  {
    rowCount = DEFAULT_ROW_COUNT,
    rowOffset = 0,
    totalRowCount = DEFAULT_ROW_COUNT,
    columnCount = DEFAULT_COLUMN_COUNT,
    columnOffset = 0,
    totalColumnCount = DEFAULT_COLUMN_COUNT,
    rowGetDepth = (_i: number): number => 2,
    rowGetKeys = (i: number): (string | null)[] => [
      `${pivotTable.rowSources[0].name}${i}`,
    ],
    rowGetTotal = (
      _i: number,
      _valueSource: DhType.coreplus.pivot.PivotSource
    ): number => DEFAULT_ROW_TOTAL,
    rowIsExpanded = (_i: number): boolean => false,
    rowHasChildren = (_i: number): boolean => false,
    columnGetDepth = (_i: number): number => 2,
    columnGetKeys = (i: number): (string | null)[] => [
      `${pivotTable.columnSources[0].name}${i}`,
    ],
    columnGetTotal = (
      _i: number,
      _valueSource: DhType.coreplus.pivot.PivotSource
    ): number => DEFAULT_COLUMN_TOTAL,
    columnIsExpanded = (_i: number): boolean => false,
    columnHasChildren = (_i: number): boolean => false,

    getGrandTotal = (_valueSource: DhType.coreplus.pivot.PivotSource): number =>
      DEFAULT_GRAND_TOTAL,
    getValue = (
      _valueSource: DhType.coreplus.pivot.PivotSource,
      _rowIndex: number,
      _colIndex: number
    ): number => DEFAULT_VALUE,
  } = {}
): DhType.Event<unknown> {
  return {
    type: 'update',
    detail: {
      rows: {
        count: rowCount,
        offset: rowOffset,
        totalCount: totalRowCount,
        getKeys: jest.fn(rowGetKeys),
        getDepth: jest.fn(rowGetDepth),
        getTotal: jest.fn(rowGetTotal),
        isExpanded: jest.fn(rowIsExpanded),
        hasChildren: jest.fn(rowHasChildren),
      },
      columns: {
        count: columnCount,
        offset: columnOffset,
        totalCount: totalColumnCount,
        getKeys: jest.fn(columnGetKeys),
        getDepth: jest.fn(columnGetDepth),
        getTotal: jest.fn(columnGetTotal),
        isExpanded: jest.fn(columnIsExpanded),
        hasChildren: jest.fn(columnHasChildren),
      },
      valueSources: [...pivotTable.valueSources],
      getGrandTotal: jest.fn(getGrandTotal),
      getValue: jest.fn(getValue),
    },
  };
}

function getModelRowText(
  model: IrisGridPivotModel,
  rowIndex: number,
  columnOffset = 0
): string[] {
  return Array(model.columns.length - columnOffset)
    .fill(0)
    .map((_, i) => model.textForCell(i + columnOffset, rowIndex));
}

function getModelColumnText(
  model: IrisGridPivotModel,
  columnIndex: number,
  rowOffset = 0
): string[] {
  return Array(model.rowCount - rowOffset)
    .fill(0)
    .map((_, i) => model.textForCell(columnIndex, i + rowOffset));
}

const formatter = new Formatter(mockDh);

describe('IrisGridPivotModel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('returns correct row and column count', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    model.startListening();

    expect(model.rowCount).toBe(0); // Initially, no rows. We get the count from the snapshot in the update event.
    expect(model.columns.length).toBe(2); // Initially, only the virtual columns are present. RowBy sources and the totals.

    model.setViewport(0, 10); // End of the viewport is past the last existing row
    jest.runOnlyPendingTimers();
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        // Viewport 0:10 translates to totals row + 0:9
        rows: {
          start: 0,
          end: 10 - 1,
        },
        columns: expect.objectContaining({
          start: 0,
        }),
        sources: [
          expect.objectContaining({
            name: 'Count',
          }),
        ],
      })
    );

    // Simulate the update event with the data
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable)
    );

    expect(model.rowCount).toBe(DEFAULT_ROW_COUNT + 1); // row count + 1 totals
    expect(model.columns.length).toBe(DEFAULT_COLUMN_COUNT + 2); // 2 virtual columns (row source labels, totals) + 2 actual columns (C0, C1)

    expect(
      getModelRowText(model, 0) // Totals row
    ).toEqual([
      '',
      `${DEFAULT_GRAND_TOTAL}`, // Grand total
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C0
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C1
    ]);

    expect(
      getModelRowText(model, 1) // R0
    ).toEqual([
      'R0',
      `${DEFAULT_ROW_TOTAL}`, // Total for R0
      `${DEFAULT_VALUE}`, // Value for C0
      `${DEFAULT_VALUE}`, // Value for C1
    ]);

    expect(
      getModelColumnText(model, 0) // Virtual column (first row source)
    ).toEqual(['', 'R0', 'R1', 'R2']);

    expect(
      getModelColumnText(model, 1) // Virtual column (totals)
    ).toEqual([
      `${DEFAULT_GRAND_TOTAL}`,
      `${DEFAULT_ROW_TOTAL}`,
      `${DEFAULT_ROW_TOTAL}`,
      `${DEFAULT_ROW_TOTAL}`,
    ]);

    expect(
      getModelColumnText(model, 2) // C0
    ).toEqual([
      `${DEFAULT_COLUMN_TOTAL}`,
      `${DEFAULT_VALUE}`,
      `${DEFAULT_VALUE}`,
      `${DEFAULT_VALUE}`,
    ]);

    // Expandable rows

    // Totals row is expanded by default, needs API support to manually collapse/expand
    expect(model.isRowExpanded(0)).toBe(true);
    expect(model.isRowExpandable(0)).toBe(true);

    // R0
    expect(model.isRowExpanded(1)).toBe(false);
    expect(model.isRowExpandable(1)).toBe(false);

    // Expandable columns

    // Virtual columns are not expandable
    expect(model.isColumnExpandable(0)).toBe(false);

    // Totals column is expanded by default, needs API support to manually collapse/expand
    expect(model.isColumnExpandable(1)).toBe(true);
    expect(model.isColumnExpanded(1)).toBe(true);
  });

  it('correctly reflects expanded columns in the model', () => {
    const pivotTable = makePivotTable(['R', 'O'], ['C', 'D'], ['Count']);

    const updateEvent = makeUpdateEvent(pivotTable, {
      columnCount: 5,
      totalColumnCount: 5,
      rowCount: 3,
      totalRowCount: 3,
      rowGetKeys: i => [`R${i}`, null],
      rowIsExpanded: () => false,
      rowHasChildren: () => true,
      // C0 expanded with children D0, D1, D2; C1 not expanded
      // D0, D1, D2 are not guaranteed to be in order unless sorted
      columnGetKeys: i =>
        [
          ['C0', null],
          ['C0', 'D0'],
          ['C0', 'D2'],
          ['C0', 'D1'],
          ['C1', null],
        ][i],
      columnGetDepth: i => [2, 3, 3, 3, 2][i],
      columnIsExpanded: i => [true, false, false, false, false][i],
      columnHasChildren: i => [true, false, false, false, true][i],
      getValue: (_v, row, _col) => row,
    });

    const model = new IrisGridPivotModel(mockDh, pivotTable, formatter);
    model.startListening();

    expect(model.rowCount).toBe(0); // Initially, no rows. We get the count from the snapshot in the update event.
    expect(model.columns.length).toBe(3); // Only the virtual columns initially. RowBy sources and the totals.

    model.setViewport(0, 10);

    expect(pivotTable.addEventListener).toHaveBeenCalledTimes(1);

    // Simulate the update event with the data
    asMock(pivotTable.addEventListener).mock.calls[0][1](updateEvent);

    expect(model.rowCount).toBe(4); // 3 rows + 1 totals
    expect(model.columns.length).toBe(8); // 3 virtual columns (row source labels, totals) + 2 actual columns (C0, C1) + 3 children columns (D0, D1, D2)

    expect(
      getModelRowText(model, 0) // Totals row
    ).toEqual([
      '', // R
      '', // O
      `${DEFAULT_GRAND_TOTAL}`, // Grand total
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C0
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C0 - D0
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C0 - D2
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C0 - D1
      `${DEFAULT_COLUMN_TOTAL}`, // Total for C1
    ]);

    expect(
      getModelRowText(model, 1) // R0
    ).toEqual([
      'R0',
      '', // O
      `${DEFAULT_ROW_TOTAL}`, // Total for R0
      '0', // Value for row 0 in C0
      '0', // Value for C0 - D0
      '0', // Value for C0 - D2
      '0', // Value for C0 - D1
      '0', // Value for C1
    ]);

    // Expandable rows

    // Totals row is expanded by default, needs API support to manually collapse/expand
    expect(model.isRowExpanded(0)).toBe(true);
    expect(model.isRowExpandable(0)).toBe(true);

    // R0
    expect(model.isRowExpanded(1)).toBe(false);
    expect(model.isRowExpandable(1)).toBe(true);

    // Expandable columns

    // Virtual columns are not expandable
    expect(model.isColumnExpandable(0)).toBe(false);
    expect(model.isColumnExpandable(1)).toBe(false);

    // Totals column is expanded by default in the model, needs API support to manually collapse/expand
    expect(model.isColumnExpandable(2)).toBe(true);
    expect(model.isColumnExpanded(2)).toBe(true);

    // C0
    expect(model.isColumnExpandable(3)).toBe(true);
    expect(model.isColumnExpanded(3)).toBe(true);
    expect(model.depthForColumn(3)).toBe(2);
    expect(model.columns[3].name).toBe('C0');

    // C0 children - D0, D1, D2
    expect(model.isColumnExpandable(4)).toBe(false);
    expect(model.isColumnExpanded(4)).toBe(false);
    expect(model.depthForColumn(4)).toBe(3);
    expect(model.columns[4].name).toBe('C0-D0');

    expect(model.isColumnExpandable(5)).toBe(false);
    expect(model.isColumnExpanded(5)).toBe(false);
    expect(model.depthForColumn(5)).toBe(3);
    expect(model.columns[5].name).toBe('C0-D2');

    expect(model.isColumnExpandable(6)).toBe(false);
    expect(model.isColumnExpanded(6)).toBe(false);
    expect(model.depthForColumn(6)).toBe(3);
    expect(model.columns[6].name).toBe('C0-D1');

    // C1
    expect(model.isColumnExpandable(7)).toBe(true);
    expect(model.isColumnExpanded(7)).toBe(false);
    expect(model.depthForColumn(7)).toBe(2);
    expect(model.columns[7].name).toBe('C1');
  });

  it('returns correct data for the viewport with just the totals row', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    model.startListening();

    model.setViewport(0, 0);
    jest.runOnlyPendingTimers();

    // We have to request a viewport with at least one pivot row, even though we only want the totals
    // This behavior might change with future expand/collapseRootRows API change
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: {
          start: 0,
          end: 0,
        },
      })
    );

    // Simulate the update event with the data
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable, {
        rowCount: 1,
        rowOffset: 0,
        totalRowCount: 10,
        rowGetTotal: i => 100 + i,
        getValue: (_v, row, _col) => row,
      })
    );

    expect(model.rowCount).toBe(11); // total row count + 1 totals row

    // First 2 rows in column 2
    expect(getModelColumnText(model, 2).slice(0, 2)).toEqual([
      `${DEFAULT_COLUMN_TOTAL}`,
      '0',
    ]);
  });

  it('returns correct data for the viewport with a single pivot row, no totals', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    model.startListening();

    model.setViewport(1, 1);
    jest.runOnlyPendingTimers();

    // Requesting the row after the totals should translate to row 0 in the pivot viewport
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: {
          start: 0,
          end: 0,
        },
      })
    );

    // Simulate the update event with the data
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable, {
        rowCount: 1,
        // Offset is based on the rows.start value passed to pivotTable.setViewport
        rowOffset: 0,
        totalRowCount: 10,
        rowGetTotal: i => 100 + i,
        getValue: (_v, row, _col) => row,
      })
    );

    expect(model.rowCount).toBe(11); // total row count + 1 totals row

    expect(model.getViewportData()).toEqual(
      expect.objectContaining({
        offset: 1,
      })
    );

    // Row 1
    expect(getModelRowText(model, 1)).toEqual([
      'R0',
      `${DEFAULT_ROW_TOTAL}`,
      '0',
      '0',
    ]);
  });

  it('returns correct data at the end of the viewport', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    model.startListening();

    model.setViewport(10, 12);
    jest.runOnlyPendingTimers();
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: {
          start: 9,
          end: 11,
        },
      })
    );

    // Simulate the update event with the data
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable, {
        rowCount: 3,
        rowOffset: 9,
        totalRowCount: 12,
        rowGetTotal: i => 100 + i,
        getValue: (_v, row, _col) => row,
      })
    );

    expect(model.rowCount).toBe(12 + 1); // row count + 1 totals

    // Column 2 starting from the viewport offset 10
    expect(getModelColumnText(model, 2, 10)).toEqual(['9', '10', '11']);

    // Check that we can access the last row and column
    const lastRowIndex = model.rowCount - 1;
    const lastColumnIndex = model.columns.length - 1;

    expect(model.textForCell(lastColumnIndex, lastRowIndex)).toBe('11');
  });

  it('buffers the viewport rows', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(mockDh, pivotTable, formatter, {
      rowBufferPages: 2,
    });
    model.startListening();

    model.setViewport(1, 2);
    jest.runOnlyPendingTimers();
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: {
          start: 0,
          end: -1 + 2 + 2 * 2, // totals offset, row 2 + 2 pages of buffer
        },
      })
    );
  });
});
