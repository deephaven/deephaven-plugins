import { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import createMockProxy from '@deephaven/utils/dist/MockProxy';
import IrisGridPivotModel from './IrisGridPivotModel';

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

describe('IrisGridPivotModel', () => {
  let pivotTable: DhType.coreplus.pivot.PivotTable;
  let model: IrisGridPivotModel;
  let formatter: Formatter;

  beforeEach(() => {
    jest.useFakeTimers();
    pivotTable = {
      rowSources: [],
      valueSources: [{ type: 'int', name: 'value' }],
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as DhType.coreplus.pivot.PivotTable;

    formatter = new Formatter(mockDh);
    model = new IrisGridPivotModel(mockDh, pivotTable, formatter);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be created successfully', () => {
    expect(model).toBeDefined();
  });

  it('should return correct row count', () => {
    const addEventListenerMock = jest.fn();
    const mockSetViewport = jest.fn();
    pivotTable = createMockProxy<DhType.coreplus.pivot.PivotTable>({
      rowSources: [
        createMockProxy<DhType.coreplus.pivot.PivotSource>({
          type: 'java.lang.String',
          name: 'R',
        }),
      ],
      columnSources: [
        createMockProxy<DhType.coreplus.pivot.PivotSource>({
          type: 'java.lang.String',
          name: 'C',
        }),
      ],
      valueSources: [
        createMockProxy<DhType.coreplus.pivot.PivotSource>({
          type: 'long',
          name: 'Count',
        }),
      ],
      addEventListener: addEventListenerMock,
      removeEventListener: jest.fn(),
      setViewport: mockSetViewport,
    });

    const mockGetKeys = jest.fn(i => [`R${i}`]);
    const mockGetDepth = jest.fn(() => 2);
    const mockGetColumnKeys = jest.fn(i => [`C${i}`]);
    const mockGetColumnDepth = jest.fn(() => 2);
    // Takes a valueSource, returns a value
    const mockGetGrandTotal = jest.fn(() => 10000);
    // Takes a position and a valueSource, returns a value
    const mockGetTotal = jest.fn(() => 100);
    const mockIsExpanded = jest.fn(() => false);
    const mockHasChildren = jest.fn(() => false);

    const mockGetValue = jest.fn(
      (
        valueSource: DhType.coreplus.pivot.PivotSource,
        rowIndex: number,
        colIndex: number
      ) => 1
    );

    model = new IrisGridPivotModel(mockDh, pivotTable, formatter);
    model.startListening();

    const updateEvent = {
      type: 'update',
      detail: {
        rows: {
          count: 3,
          offset: 0,
          totalCount: 3,
          getKeys: mockGetKeys,
          getDepth: mockGetDepth,
          getTotal: mockGetTotal,
          isExpanded: mockIsExpanded,
          hasChildren: mockHasChildren,
        },
        columns: {
          count: 2,
          offset: 0,
          totalCount: 2,
          getKeys: mockGetColumnKeys,
          getDepth: mockGetColumnDepth,
          getTotal: mockGetTotal,
          isExpanded: mockIsExpanded,
          hasChildren: mockHasChildren,
        },
        valueSources: [...pivotTable.valueSources],
        getGrandTotal: mockGetGrandTotal,
        getValue: mockGetValue,
      },
    };

    expect(model.rowCount).toBe(0); // Initially, no rows. We get the count from the snapshot in the update event.
    expect(model.columns.length).toBe(2); // Only the virtual columns initially. RowBy sources and the totals.

    model.setViewport(0, 10);
    // TODO: figure out what to do with the columns on the initial setViewport
    // , model.columns);
    jest.runOnlyPendingTimers();
    expect(mockSetViewport).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: {
          start: 0,
          end: 10,
        },
        columns: expect.objectContaining({
          start: 0,
          // TODO: end of the range is not currently set correctly
        }),
        sources: [
          expect.objectContaining({
            name: 'Count',
          }),
        ],
      })
    );

    // Simulate the update event with the data
    addEventListenerMock.mock.calls[0][1](updateEvent);

    expect(model.rowCount).toBe(4); // 3 rows + 1 totals
    expect(model.columns.length).toBe(4); // 2 virtual columns (row source labels, totals) + 2 actual columns (C0, C1)

    expect(
      Array(4)
        .fill(0)
        .map((_, i) => model.textForCell(i, 0))
    ).toEqual([
      '',
      '10000', // Grand total
      '100', // Total for C0
      '100', // Total for C1
    ]);

    expect(
      Array(4)
        .fill(0)
        .map((_, i) => model.textForCell(i, 1))
    ).toEqual([
      'R0',
      '100', // Total for R0
      '1', // Value for C0
      '1', // Value for C1
    ]);

    // Expandable rows

    // Totals row is expanded by default, needs API support to manually collapse/expand
    expect(model.isRowExpanded(0)).toBe(true);
    expect(model.isRowExpandable(0)).toBe(true);

    // R0
    expect(model.isRowExpanded(1)).toBe(false);
    expect(model.isRowExpandable(1)).toBe(false);

    // Expandable columns

    console.log('Columns:', model.columns);

    // Virtual columns are not expandable
    expect(model.isColumnExpandable(0)).toBe(false);

    // Totals column is expanded by default, needs API support to manually collapse/expand
    expect(model.isColumnExpandable(1)).toBe(true);
    expect(model.isColumnExpanded(1)).toBe(true);

    // TODO: test viewports: 1 row (just the totals), 1 row (just the data, no totals)
  });
});
