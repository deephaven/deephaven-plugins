import { dh as DhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import { IrisGridModel } from '@deephaven/iris-grid';
import IrisGridPivotModel from './IrisGridPivotModel';
import {
  makePlaceholderColumnName,
  makeGrandTotalColumnName,
  COLUMN_SOURCE_GROUP_COLOR,
  makeTotalsGroupName,
} from './PivotUtils';

const { createMockProxy, asMock } = TestUtils;

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const EVENT_PIVOT_TABLE_UPDATED = 'pivotTableUpdated';

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
    pivot: createMockProxy<typeof DhType.coreplus.pivot>({
      PivotTable: createMockProxy<typeof DhType.coreplus.pivot.PivotTable>({
        EVENT_UPDATED: EVENT_PIVOT_TABLE_UPDATED,
      }),
    }),
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
  columnBufferPages: 0,
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
    type: EVENT_PIVOT_TABLE_UPDATED,
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
  rowIndex: number
): string[] {
  return Array(model.columns.length)
    .fill(0)
    .map((_, i) => model.textForCell(i, rowIndex));
}

function getModelColumnText(
  model: IrisGridPivotModel,
  columnIndex: number
): string[] {
  return Array(model.rowCount)
    .fill(0)
    .map((_, i) => model.textForCell(columnIndex, i));
}

const formatter = new Formatter(mockDh);

describe('IrisGridPivotModel', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
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

    // Totals column is expanded but not expandable by default, needs API support to manually collapse/expand
    expect(model.isColumnExpandable(1)).toBe(false);
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

    // Totals column is expanded but not expandable by default, needs API support to manually collapse/expand
    expect(model.isColumnExpandable(2)).toBe(false);
    expect(model.isColumnExpanded(2)).toBe(true);

    // C0
    expect(model.isColumnExpandable(3)).toBe(true);
    expect(model.isColumnExpanded(3)).toBe(true);
    expect(model.depthForColumn(3)).toBe(2);
    expect(model.columns[3].name).toBe('__C0__Count');

    // C0 children - D0, D1, D2
    expect(model.isColumnExpandable(4)).toBe(false);
    expect(model.isColumnExpanded(4)).toBe(false);
    expect(model.depthForColumn(4)).toBe(3);
    expect(model.columns[4].name).toBe('__C0_D0__Count');

    expect(model.isColumnExpandable(5)).toBe(false);
    expect(model.isColumnExpanded(5)).toBe(false);
    expect(model.depthForColumn(5)).toBe(3);
    expect(model.columns[5].name).toBe('__C0_D2__Count');

    expect(model.isColumnExpandable(6)).toBe(false);
    expect(model.isColumnExpanded(6)).toBe(false);
    expect(model.depthForColumn(6)).toBe(3);
    expect(model.columns[6].name).toBe('__C0_D1__Count');

    // C1
    expect(model.isColumnExpandable(7)).toBe(true);
    expect(model.isColumnExpanded(7)).toBe(false);
    expect(model.depthForColumn(7)).toBe(2);
    expect(model.columns[7].name).toBe('__C1__Count');
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
    expect(getModelColumnText(model, 2).slice(10)).toEqual(['9', '10', '11']);

    // Check that we can access the last row and column
    const lastRowIndex = model.rowCount - 1;
    const lastColumnIndex = model.columns.length - 1;

    expect(model.textForCell(lastColumnIndex, lastRowIndex)).toBe('11');
  });

  it.each([
    {
      description: 'Just the totals row, should request 2 rows of buffer (0-1)',
      setViewportArgs: [0, 0],
      expectedRows: { start: 0, end: 1 },
    },
    {
      description:
        'Page size: 5, totals row + 4 data rows. Should request 4 data rows + 10 rows of buffer (0-13)',
      setViewportArgs: [0, 4],
      expectedRows: { start: 0, end: 13 },
    },
    {
      description:
        'Page size: 2, no totals row. Should request 2 data rows + 4 rows of buffer (0-5)',
      setViewportArgs: [1, 2],
      expectedRows: { start: 0, end: 5 },
    },
    {
      description:
        'Page size: 3, totals row is outside of the buffer. Should request 3 data rows + 6 rows of buffer before and after the viewport (3-17)',
      setViewportArgs: [10, 12],
      expectedRows: { start: 3, end: 17 },
    },
  ])(
    'buffers the viewport rows: $description',
    ({ setViewportArgs, expectedRows }) => {
      const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

      const model = new IrisGridPivotModel(mockDh, pivotTable, formatter, {
        rowBufferPages: 2,
      });

      model.setViewport(setViewportArgs[0], setViewportArgs[1]);
      jest.runOnlyPendingTimers();
      expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expectedRows,
        })
      );
    }
  );

  it('returns virtual columns on initial load', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const mockColumnsChangedListener = jest.fn();

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    // model.startListening() is called implicitly when event listeners are added
    model.addEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      mockColumnsChangedListener
    );

    expect(model.columns.length).toBe(2); // 1 row source, 1 totals column

    expect(model.columns.map(({ name }) => name)).toEqual([
      'R',
      makeGrandTotalColumnName(pivotTable.valueSources[0]),
    ]);

    model.setViewport(0, 0, model.columns);
    jest.runOnlyPendingTimers();
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: {
          start: 0,
          end: 0,
        },
      })
    );
    expect(model.columnCount).toBe(2);
  });

  it('returns placeholder columns outside of the viewport', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const mockColumnsChangedListener = jest.fn();

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    // model.startListening() is called implicitly when event listeners are added
    model.addEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      mockColumnsChangedListener
    );
    expect(model.columnCount).toBe(2);
    model.setViewport(0, 0, model.columns);

    jest.runOnlyPendingTimers();
    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: {
          start: 0,
          end: 0,
        },
      })
    );

    expect(mockColumnsChangedListener).not.toHaveBeenCalled();

    // Update event populates the total column count and placeholder columns
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable, {
        columnCount: 3,
        totalColumnCount: 5,
        getValue: jest.fn((_v, row, col) => 1000 * row + col),
      })
    );

    expect(model.columnCount).toBe(7); // 2 virtual, 3 data, 2 placeholder columns outside of the viewport
    expect(model.columns.length).toBe(7);
    expect(model.columns.map(({ name }) => name)).toEqual([
      'R',
      makeGrandTotalColumnName(pivotTable.valueSources[0]),
      '__C0__Count',
      '__C1__Count',
      '__C2__Count',
      makePlaceholderColumnName(3, pivotTable.valueSources[0]),
      makePlaceholderColumnName(4, pivotTable.valueSources[0]),
    ]);

    expect(mockColumnsChangedListener).toHaveBeenCalled();

    expect(getModelRowText(model, 2).slice(0, 5)).toEqual([
      'R1',
      `${DEFAULT_ROW_TOTAL}`,
      '1000',
      '1001',
      '1002',
    ]);
  });

  it('returns placeholder columns to the left of the viewport', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    model.startListening();

    expect(model.columnCount).toBe(2);
    model.setViewport(0, 0, model.columns);
    jest.runOnlyPendingTimers();

    asMock(pivotTable.addEventListener).mock.calls[0][1](
      // Initial update contains total column count, 1 data column with offset 0
      // and triggers columnschanged event for the grid to re-request the viewport with more columns
      makeUpdateEvent(pivotTable, {
        columnCount: 1,
        totalColumnCount: 10,
        columnOffset: 0,
      })
    );

    asMock(pivotTable.setViewport).mockClear();
    model.setViewport(0, 0, model.columns.slice(5, 8)); // Viewport with 3 columns starting from index 5
    jest.runOnlyPendingTimers();

    expect(asMock(pivotTable.setViewport)).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: {
          // indexes adjusted for virtual columns
          start: 3,
          end: 5,
        },
      })
    );

    // Pivot responds with the update event, 3 columns starting from adjusted index 3
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable, {
        columnCount: 3,
        totalColumnCount: 10,
        columnOffset: 3,
      })
    );

    expect(model.columnCount).toBe(12);
    expect(model.columns.length).toBe(12);
    expect(model.columns.map(({ name }) => name)).toEqual([
      // Virtual columns are always present
      'R',
      makeGrandTotalColumnName(pivotTable.valueSources[0]),
      // Placeholder columns outside of the viewport
      makePlaceholderColumnName(0, pivotTable.valueSources[0]),
      makePlaceholderColumnName(1, pivotTable.valueSources[0]),
      makePlaceholderColumnName(2, pivotTable.valueSources[0]),
      // 3 viewport columns starting at index 5
      '__C3__Count',
      '__C4__Count',
      '__C5__Count',
      // Placeholder columns outside of the viewport
      makePlaceholderColumnName(6, pivotTable.valueSources[0]),
      makePlaceholderColumnName(7, pivotTable.valueSources[0]),
      makePlaceholderColumnName(8, pivotTable.valueSources[0]),
      makePlaceholderColumnName(9, pivotTable.valueSources[0]),
    ]);
  });

  it('correctly handles column offsets in viewport data', () => {
    const pivotTable = makePivotTable(['R'], ['C'], ['Count']);

    const model = new IrisGridPivotModel(
      mockDh,
      pivotTable,
      formatter,
      DEFAULT_CONFIG
    );
    model.startListening();

    expect(model.columnCount).toBe(2);
    model.setViewport(0, 0, model.columns);
    jest.runOnlyPendingTimers();

    asMock(pivotTable.addEventListener).mock.calls[0][1](
      // Initial update contains total column count, 1 data column with offset 0
      // and triggers columnschanged event for the grid to re-request the viewport with more columns
      makeUpdateEvent(pivotTable, {
        columnCount: 1,
        totalColumnCount: 10,
        columnOffset: 0,
      })
    );

    model.setViewport(0, 0, model.columns.slice(5, 8)); // Viewport with 3 columns starting from index 5
    jest.runOnlyPendingTimers();

    // Pivot responds with the update event, 3 columns starting from adjusted index 3
    asMock(pivotTable.addEventListener).mock.calls[0][1](
      makeUpdateEvent(pivotTable, {
        columnCount: 3,
        totalColumnCount: 10,
        columnOffset: 3,
        getValue: jest.fn((_v, row, col) => 1000 * row + col),
        columnGetTotal: jest.fn((col, _v) => 200 + col),
      })
    );

    expect(getModelRowText(model, 0)).toEqual([
      '',
      `${DEFAULT_GRAND_TOTAL}`,
      '',
      '',
      '',
      '203',
      '204',
      '205',
      '',
      '',
      '',
      '',
    ]);

    expect(getModelRowText(model, 2)).toEqual([
      'R1',
      `${DEFAULT_ROW_TOTAL}`,
      '',
      '',
      '',
      '1003',
      '1004',
      '1005',
      '',
      '',
      '',
      '',
    ]);
  });

  describe('column header groups', () => {
    it('contain groups for virtual columns', () => {
      const pivotTable = makePivotTable(['R', 'O'], ['C'], ['Count']);

      const model = new IrisGridPivotModel(
        mockDh,
        pivotTable,
        formatter,
        DEFAULT_CONFIG
      );
      model.startListening();

      expect(model.columnCount).toBe(3);
      expect(model.columnHeaderGroups).toEqual([
        expect.objectContaining({
          name: 'C',
          color: COLUMN_SOURCE_GROUP_COLOR,
          children: ['R', 'O'],
          depth: 1,
          childIndexes: [0, 1],
        }),
        expect.objectContaining({
          name: `__GRAND_TOTALS_C`,
          children: [makeGrandTotalColumnName(pivotTable.valueSources[0])],
          depth: 1,
          childIndexes: [2],
        }),
      ]);
    });

    it('contain a group with empty name for data columns', () => {
      const pivotTable = makePivotTable(['R', 'O'], ['C'], ['Count']);

      const model = new IrisGridPivotModel(
        mockDh,
        pivotTable,
        formatter,
        DEFAULT_CONFIG
      );
      model.startListening();

      model.setViewport(0, 0, model.columns.slice(5, 8)); // Viewport with 3 columns starting from index 5
      jest.runOnlyPendingTimers();

      // Pivot responds with the update event, 3 columns starting from adjusted index 3
      asMock(pivotTable.addEventListener).mock.calls[0][1](
        makeUpdateEvent(pivotTable, {
          columnCount: 3,
          totalColumnCount: 7,
          columnOffset: 3,
        })
      );

      expect(model.columnCount).toBe(10);
      expect(model.columnHeaderGroups).toEqual([
        expect.objectContaining({
          name: 'C',
          children: ['R', 'O'],
          depth: 1,
          childIndexes: [0, 1],
        }),
        expect.objectContaining({
          name: '__GRAND_TOTALS_C',
          children: [makeGrandTotalColumnName(pivotTable.valueSources[0])],
          depth: 1,
          childIndexes: [2],
        }),

        expect.objectContaining({
          name: makeTotalsGroupName(
            makePlaceholderColumnName(0, pivotTable.valueSources[0])
          ),
          children: [makePlaceholderColumnName(0, pivotTable.valueSources[0])],
          depth: 1,
          childIndexes: [3],
        }),

        expect.objectContaining({
          name: makeTotalsGroupName(
            makePlaceholderColumnName(1, pivotTable.valueSources[0])
          ),
          children: [makePlaceholderColumnName(1, pivotTable.valueSources[0])],
          depth: 1,
          childIndexes: [4],
        }),

        expect.objectContaining({
          name: makeTotalsGroupName(
            makePlaceholderColumnName(2, pivotTable.valueSources[0])
          ),
          children: [makePlaceholderColumnName(2, pivotTable.valueSources[0])],
          depth: 1,
          childIndexes: [5],
        }),

        // groups for columns in the viewport
        expect.objectContaining({
          name: makeTotalsGroupName('__C3__Count'),
          children: ['__C3__Count'],
          depth: 1,
          childIndexes: [6],
        }),

        expect.objectContaining({
          name: makeTotalsGroupName('__C4__Count'),
          children: ['__C4__Count'],
          depth: 1,
          childIndexes: [7],
        }),

        expect.objectContaining({
          name: makeTotalsGroupName('__C5__Count'),
          children: ['__C5__Count'],
          depth: 1,
          childIndexes: [8],
        }),

        // groups for columns outside the viewport
        expect.objectContaining({
          name: makeTotalsGroupName(
            makePlaceholderColumnName(6, pivotTable.valueSources[0])
          ),
          children: [makePlaceholderColumnName(6, pivotTable.valueSources[0])],
          depth: 1,
          childIndexes: [9],
        }),
      ]);
    });

    it('handles multiple column sources', () => {
      const pivotTable = makePivotTable(['R', 'O'], ['C', 'D'], ['Count']);

      const model = new IrisGridPivotModel(
        mockDh,
        pivotTable,
        formatter,
        DEFAULT_CONFIG
      );
      model.startListening();

      expect(model.columnCount).toBe(3);
      expect(model.columnHeaderGroups).toEqual([
        expect.objectContaining({
          name: 'D',
          color: COLUMN_SOURCE_GROUP_COLOR,
          children: ['R', 'O'],
          depth: 1,
          childIndexes: [0, 1],
          parent: 'C',
        }),
        expect.objectContaining({
          name: '__GRAND_TOTALS_D',
          children: [makeGrandTotalColumnName(pivotTable.valueSources[0])],
          depth: 1,
          parent: '__GRAND_TOTALS_C',
          childIndexes: [2],
        }),
        // Parent for the group D above
        expect.objectContaining({
          name: 'C',
          color: COLUMN_SOURCE_GROUP_COLOR,
          children: ['D'],
          depth: 2,
          // Same as group D
          childIndexes: [0, 1],
        }),

        expect.objectContaining({
          name: '__GRAND_TOTALS_C',
          children: ['__GRAND_TOTALS_D'],
          depth: 2,
          childIndexes: [2],
        }),
      ]);

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

      model.startListening();
      // Simulate the update event with the data
      asMock(pivotTable.addEventListener).mock.calls[0][1](updateEvent);

      expect(model.columnCount).toBe(8);
      //   expect(model.columnHeaderGroups).toEqual([
      //     expect.objectContaining({
      //       name: 'D',
      //       color: COLUMN_SOURCE_GROUP_COLOR,
      //       children: ['R', 'O'],
      //       depth: 1,
      //       childIndexes: [0, 1],
      //       parent: 'C',
      //     }),
      //     expect.objectContaining({
      //       name: '__GRAND_TOTALS_D',
      //       children: [makeGrandTotalColumnName(0)],
      //       depth: 1,
      //       parent: '__GRAND_TOTALS_C',
      //       childIndexes: [2],
      //     }),
      //     // Parent for the group D above
      //     expect.objectContaining({
      //       name: 'C',
      //       color: COLUMN_SOURCE_GROUP_COLOR,
      //       children: ['D'],
      //       depth: 2,
      //       // Same as group D
      //       childIndexes: [0, 1],
      //     }),

      //     expect.objectContaining({
      //       name: '__GRAND_TOTALS_C',
      //       children: ['__GRAND_TOTALS_D'],
      //       depth: 2,
      //       childIndexes: [2],
      //     }),
      //   ]);
    });
  });
});
