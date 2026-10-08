import { ensureArray } from '@deephaven/utils';
import { dhTruck } from '@deephaven/icons';
import { TestUtils } from '@deephaven/test-utils';
import {
  type IrisGridContextMenuData,
  IrisGridContextMenuHandler,
  type IrisGridModel,
  type IrisGridType,
  type KeyedGridModel,
  KeyedSelection,
} from '@deephaven/iris-grid';
import {
  GridRange,
  type GridMetrics,
  type GridModel,
  type GridPoint,
  RangedSelection,
} from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import type {
  ContextAction,
  ResolvableContextAction,
} from '@deephaven/components';
import UITableContextMenuHandler, {
  getModelSelectedRanges,
  getSelectedKeys,
  getVisibleColumnNames,
  wrapContextActions,
} from './UITableContextMenuHandler';
import { stringifyWithReferences } from '../../widget/ReferenceUtils';
import { REFERENCE_KEY } from '../utils/ElementUtils';

const MOCK_MODEL = TestUtils.createMockProxy<IrisGridModel>({
  columns: [
    {
      name: 'column0',
      type: 'string',
    },
    {
      name: 'column1',
      type: 'int',
    },
  ] as unknown as IrisGridModel['columns'],
  groupedColumns: [],
  valueForCell: (col: number, row: number) => `${col}-${row}-value`,
  textForCell: (col: number, row: number) => `${col}-${row}-text`,
});

const CLIENT_CELL_DATA = {
  value: 'cellValue',
  valueText: 'cellText',
  column: { name: 'cellName' } as dh.Column,
  rowIndex: 0,
  columnIndex: 0,
  modelRow: 1,
  modelColumn: 1,
  model: MOCK_MODEL,
};

const SERVER_CELL_DATA = {
  value: CLIENT_CELL_DATA.value,
  text: CLIENT_CELL_DATA.valueText,
  column_name: CLIENT_CELL_DATA.column.name,
  is_column_header: false,
  is_row_header: false,
  always_fetch_columns: {},
  selected_ranges: [],
  selected_keys: null,
  _visible_columns: [],
};

const CLIENT_HEADER_DATA = {
  value: 'headerValue',
  valueText: 'headerText',
  column: { name: 'headerName' } as dh.Column,
  rowIndex: null,
  columnIndex: 0,
  modelRow: null,
  modelColumn: 1,
  model: MOCK_MODEL,
};

const SERVER_HEADER_DATA = {
  value: CLIENT_HEADER_DATA.value,
  text: CLIENT_HEADER_DATA.valueText,
  column_name: CLIENT_HEADER_DATA.column.name,
  is_column_header: true,
  is_row_header: false,
  always_fetch_columns: {},
  selected_ranges: [],
  selected_keys: null,
  _visible_columns: [],
};

async function resolveContextAction(
  action: ResolvableContextAction = [] as ResolvableContextAction
): Promise<ContextAction[]> {
  if (typeof action === 'function') {
    return ensureArray(await action());
  }
  return ensureArray(await action);
}

/** What the transport would send for the params an action was called with. */
function serialize(params: unknown) {
  const { payload, references } = stringifyWithReferences(params);
  return { sent: JSON.parse(payload), references };
}

describe('wrapContextActions', () => {
  test('handles cell item', async () => {
    const action = {
      action: jest.fn(),
    };
    const wrapped = wrapContextActions(
      action,
      CLIENT_CELL_DATA,
      [],
      [],
      [],
      null
    );
    expect(wrapped).toEqual([
      expect.objectContaining({
        icon: undefined,
        action: expect.any(Function),
        actions: undefined,
      }),
    ]);
    const resolvedAction = await resolveContextAction(wrapped[0]);
    expect(resolvedAction.length).toBe(1);
    resolvedAction[0].action?.(null as unknown as Event);
    expect(action.action).toHaveBeenCalledWith(SERVER_CELL_DATA);
  });

  test('handles cell item with icon', async () => {
    const action = {
      action: jest.fn(),
      icon: 'dhTruck',
    };
    const wrapped = wrapContextActions(
      action,
      CLIENT_CELL_DATA,
      [],
      [],
      [],
      null
    );
    expect(wrapped).toEqual([
      expect.objectContaining({
        icon: dhTruck,
        action: expect.any(Function),
        actions: undefined,
      }),
    ]);
  });

  test('handles header item', async () => {
    const action = {
      action: jest.fn(),
    };
    const wrapped = wrapContextActions(
      action,
      CLIENT_HEADER_DATA,
      [],
      [],
      [],
      null
    );
    expect(wrapped).toEqual([
      expect.objectContaining({
        icon: undefined,
        action: expect.any(Function),
        actions: undefined,
      }),
    ]);
    const resolvedAction = await resolveContextAction(wrapped[0]);
    expect(resolvedAction.length).toBe(1);
    resolvedAction[0].action?.(null as unknown as Event);
    expect(action.action).toHaveBeenCalledWith(SERVER_HEADER_DATA);
  });

  test('handles dynamic item', async () => {
    const mockAction = jest.fn();
    const action = jest.fn(() =>
      Promise.resolve({
        action: mockAction,
      })
    );
    const wrapped = wrapContextActions(
      action,
      CLIENT_CELL_DATA,
      [],
      [],
      [],
      null
    );
    expect(wrapped).toEqual([expect.any(Function)]);
    const resolvedAction = await resolveContextAction(wrapped[0]);
    expect(resolvedAction.length).toBe(1);
    expect(action).toHaveBeenCalledWith(SERVER_CELL_DATA);
    resolvedAction[0].action?.(null as unknown as Event);
    expect(mockAction).toHaveBeenCalledWith(SERVER_CELL_DATA);
  });

  test('handles nested items', async () => {
    const action = {
      title: 'parent',
      actions: [
        {
          title: 'child',
          action: jest.fn(),
        },
      ],
    };
    const wrapped = wrapContextActions(
      action,
      CLIENT_CELL_DATA,
      [],
      [],
      [],
      null
    );
    expect(wrapped).toEqual([
      expect.objectContaining({
        icon: undefined,
        action: undefined,
        actions: expect.any(Array),
      }),
    ]);
    const resolvedParentAction = await resolveContextAction(wrapped[0]);
    const resolvedChildAction = await resolveContextAction(
      resolvedParentAction[0].actions?.[0]
    );
    expect(resolvedChildAction.length).toBe(1);
    resolvedChildAction[0].action?.(null as unknown as Event);
    expect(action.actions[0].action).toHaveBeenCalledWith(SERVER_CELL_DATA);
  });

  test('passes the selection payload to the callback', async () => {
    const action = { action: jest.fn() };
    const ranges = [
      { start_row: 2, end_row: 4, start_column: null, end_column: null },
    ];
    const keys = {
      key_columns: ['Sym'],
      key_values: [['AAPL']],
      inverted: false,
    };

    const wrapped = wrapContextActions(
      action,
      CLIENT_CELL_DATA,
      [],
      ranges,
      ['column0'],
      keys
    );
    const resolved = await resolveContextAction(wrapped[0]);
    resolved[0].action?.(null as unknown as Event);

    expect(action.action).toHaveBeenCalledWith(
      expect.objectContaining({
        selected_ranges: ranges,
        selected_keys: keys,
        _visible_columns: ['column0'],
      })
    );
  });

  test('nested actions inherit the selection payload', async () => {
    const child = { title: 'child', action: jest.fn() };
    const ranges = [
      { start_row: 7, end_row: 7, start_column: null, end_column: null },
    ];

    const wrapped = wrapContextActions(
      { title: 'parent', actions: [child] },
      CLIENT_CELL_DATA,
      [],
      ranges,
      ['column1'],
      null
    );
    const parent = await resolveContextAction(wrapped[0]);
    const resolvedChild = await resolveContextAction(parent[0].actions?.[0]);
    resolvedChild[0].action?.(null as unknown as Event);

    expect(child.action).toHaveBeenCalledWith(
      expect.objectContaining({
        selected_ranges: ranges,
        _visible_columns: ['column1'],
      })
    );
  });

  describe('table sent by reference', () => {
    const table = TestUtils.createMockProxy<dh.Table>();

    function expectSentTable(params: unknown) {
      const { sent, references } = serialize(params);
      const { _table: sentTable } = sent;
      expect(sentTable).toEqual({ [REFERENCE_KEY]: 0 });
      expect(references).toHaveLength(1);
      expect(references[0]).toBe(table);
    }

    test('is sent with a cell item', async () => {
      const action = { action: jest.fn() };

      const wrapped = wrapContextActions(
        action,
        CLIENT_CELL_DATA,
        [],
        [],
        [],
        null,
        table
      );
      const resolved = await resolveContextAction(wrapped[0]);
      resolved[0].action?.(null as unknown as Event);

      expectSentTable(action.action.mock.calls[0][0]);
    });

    test('is sent with a header item', async () => {
      const action = { action: jest.fn() };

      const wrapped = wrapContextActions(
        action,
        CLIENT_HEADER_DATA,
        [],
        [],
        [],
        null,
        table
      );
      const resolved = await resolveContextAction(wrapped[0]);
      resolved[0].action?.(null as unknown as Event);

      expectSentTable(action.action.mock.calls[0][0]);
    });

    test('is sent with a nested item', async () => {
      const child = { title: 'child', action: jest.fn() };

      const wrapped = wrapContextActions(
        { title: 'parent', actions: [child] },
        CLIENT_CELL_DATA,
        [],
        [],
        [],
        null,
        table
      );
      const parent = await resolveContextAction(wrapped[0]);
      const resolvedChild = await resolveContextAction(parent[0].actions?.[0]);
      resolvedChild[0].action?.(null as unknown as Event);

      expectSentTable(child.action.mock.calls[0][0]);
    });

    test('is sent to a dynamic item and to the items it returns', async () => {
      const returned = { action: jest.fn() };
      const generator = jest.fn((_params: unknown) =>
        Promise.resolve(returned)
      );

      const wrapped = wrapContextActions(
        generator,
        CLIENT_CELL_DATA,
        [],
        [],
        [],
        null,
        table
      );
      const resolved = await resolveContextAction(wrapped[0]);
      resolved[0].action?.(null as unknown as Event);

      expectSentTable(generator.mock.calls[0][0]);
      expectSentTable(returned.action.mock.calls[0][0]);
    });

    test('is left out when there is no table', async () => {
      const action = { action: jest.fn() };

      const wrapped = wrapContextActions(
        action,
        CLIENT_CELL_DATA,
        [],
        [],
        [],
        null,
        null
      );
      const resolved = await resolveContextAction(wrapped[0]);
      resolved[0].action?.(null as unknown as Event);

      expect(action.action.mock.calls[0][0]).not.toHaveProperty('_table');
    });
  });
});

/** Mock grid whose viewport only resolves model rows below `viewportEnd`. */
function makeIrisGrid({
  viewportEnd = Infinity,
  metrics,
}: {
  viewportEnd?: number;
  metrics?: Partial<GridMetrics>;
} = {}): IrisGridType {
  return TestUtils.createMockProxy<IrisGridType>({
    getModelRow: ((row: number) =>
      row <= viewportEnd ? row : undefined) as IrisGridType['getModelRow'],
    getModelColumn: ((column: number) =>
      column) as IrisGridType['getModelColumn'],
    state: { gridSelection: null, metrics } as IrisGridType['state'],
  });
}

function makeRangedSelection(ranges: GridRange[]): RangedSelection {
  return new RangedSelection(ranges, () =>
    TestUtils.createMockProxy<GridModel>()
  );
}

function makeKeyedSelection(
  keyValues: ReadonlyMap<string, readonly unknown[]>,
  inverted = false
): KeyedSelection {
  return new KeyedSelection({
    getModel: () => TestUtils.createMockProxy<IrisGridModel & KeyedGridModel>(),
    selectedKeys: new Set(keyValues.keys()),
    selectedKeyValues: keyValues,
    invertedSelection: inverted,
  });
}

function makeContextMenuData(
  selection: IrisGridContextMenuData['selection'],
  model: IrisGridModel = MOCK_MODEL
): IrisGridContextMenuData {
  return { ...CLIENT_CELL_DATA, model, selection };
}

describe('getModelSelectedRanges', () => {
  test('converts a ranged selection to model-index ranges', () => {
    const selection = makeRangedSelection([new GridRange(null, 2, null, 4)]);

    expect(
      getModelSelectedRanges(makeIrisGrid(), makeContextMenuData(selection))
    ).toEqual([
      { start_row: 2, end_row: 4, start_column: null, end_column: null },
    ]);
  });

  test('keeps bounds for a range extending past the viewport', () => {
    // getModelRow only resolves rendered rows; the far end must not be dropped.
    const selection = makeRangedSelection([
      new GridRange(null, 0, null, 49999),
    ]);

    expect(
      getModelSelectedRanges(
        makeIrisGrid({ viewportEnd: 10 }),
        makeContextMenuData(selection)
      )
    ).toEqual([
      { start_row: 0, end_row: 49999, start_column: null, end_column: null },
    ]);
  });

  test('returns empty for a keyed selection', () => {
    const selection = makeKeyedSelection(new Map([['a', ['a']]]));

    expect(
      getModelSelectedRanges(makeIrisGrid(), makeContextMenuData(selection))
    ).toEqual([]);
  });

  test('returns empty when there is no selection', () => {
    expect(
      getModelSelectedRanges(makeIrisGrid(), makeContextMenuData(null))
    ).toEqual([]);
  });
});

describe('getSelectedKeys', () => {
  const KEYED_MODEL = TestUtils.createMockProxy<IrisGridModel>({
    columns: [
      { name: 'Sym', type: 'string' },
      { name: 'Exchange', type: 'string' },
    ] as unknown as IrisGridModel['columns'],
    selectionKeyColumnIndices: [0, 1],
  } as Partial<IrisGridModel>);

  test('returns key columns, values and inverted flag', () => {
    const selection = makeKeyedSelection(
      new Map([
        ['AAPL|NY', ['AAPL', 'NY']],
        ['GOOG|NASDAQ', ['GOOG', 'NASDAQ']],
      ])
    );

    expect(
      getSelectedKeys(
        makeIrisGrid(),
        makeContextMenuData(selection, KEYED_MODEL)
      )
    ).toEqual({
      key_columns: ['Sym', 'Exchange'],
      key_values: [
        ['AAPL', 'NY'],
        ['GOOG', 'NASDAQ'],
      ],
      inverted: false,
    });
  });

  test('propagates inverted selections', () => {
    const selection = makeKeyedSelection(
      new Map([['AAPL|NY', ['AAPL', 'NY']]]),
      true
    );

    expect(
      getSelectedKeys(
        makeIrisGrid(),
        makeContextMenuData(selection, KEYED_MODEL)
      )
    ).toEqual(expect.objectContaining({ inverted: true }));
  });

  test('returns null for a ranged selection', () => {
    const selection = makeRangedSelection([new GridRange(null, 0, null, 1)]);

    expect(
      getSelectedKeys(makeIrisGrid(), makeContextMenuData(selection))
    ).toBeNull();
  });

  test('sends a marker instead of the keys when there are too many', () => {
    const count = 100_001;
    const keyValues = new Map(
      Array.from({ length: count }, (_, i) => [String(i), [String(i)]] as const)
    );

    expect(
      getSelectedKeys(
        makeIrisGrid(),
        makeContextMenuData(makeKeyedSelection(keyValues), KEYED_MODEL)
      )
    ).toEqual({ too_large: true, count });
  });
});

describe('getVisibleColumnNames', () => {
  const model = TestUtils.createMockProxy<IrisGridModel>({
    columnCount: 3,
    columns: [
      { name: 'A', type: 'string' },
      { name: 'B', type: 'string' },
      { name: 'C', type: 'string' },
    ] as unknown as IrisGridModel['columns'],
  });

  function makeGrid(
    userColumnWidths: Map<number, number>,
    movedColumns: GridMetrics['movedColumns'] = []
  ) {
    return TestUtils.createMockProxy<IrisGridType>({
      state: {
        metrics: { userColumnWidths, movedColumns },
      } as IrisGridType['state'],
    });
  }

  test('uses visual order and excludes hidden columns', () => {
    // B moved ahead of A, C hidden.
    const irisGrid = makeGrid(new Map([[2, 0]]), [{ from: 1, to: 0 }]);

    expect(getVisibleColumnNames(irisGrid, model)).toEqual(['B', 'A']);
  });

  test('includes columns scrolled out of the viewport', () => {
    // Metrics only measure rendered columns, so nothing is recorded here.
    const irisGrid = makeGrid(new Map());

    expect(getVisibleColumnNames(irisGrid, model)).toEqual(['A', 'B', 'C']);
  });
});

describe('getHeaderActions', () => {
  const builtInAction = { title: 'Built in', action: jest.fn() };

  function getActions(table: unknown, headerAction: jest.Mock) {
    jest
      .spyOn(IrisGridContextMenuHandler.prototype, 'getHeaderActions')
      .mockReturnValue([builtInAction]);

    // Only the table-backed model has `table`, so it is not on `IrisGridModel`.
    const model = TestUtils.createMockProxy<IrisGridModel>({
      columnCount: 1,
      columns: [
        { name: 'A', type: 'string' },
      ] as unknown as IrisGridModel['columns'],
      sourceForCell: (() => ({
        column: 0,
        row: 0,
      })) as IrisGridModel['sourceForCell'],
      table,
    } as Partial<IrisGridModel>);
    const handler = new UITableContextMenuHandler(
      {} as typeof dh,
      makeIrisGrid({
        metrics: { userColumnWidths: new Map(), movedColumns: [] },
      }),
      model,
      undefined,
      { title: 'Header item', action: headerAction },
      []
    );

    return handler.getHeaderActions(0, { column: 0 } as GridPoint);
  }

  it('sends the model table by reference with header items', async () => {
    const table = TestUtils.createMockProxy<dh.Table>();
    const headerAction = jest.fn();

    const actions = getActions(table, headerAction);

    // The built-in header actions are client-side and are returned as they were.
    expect(actions[0]).toBe(builtInAction);
    const [item] = await resolveContextAction(actions[1]);
    item.action?.(null as unknown as Event);

    const { sent, references } = serialize(headerAction.mock.calls[0][0]);
    const { _table: sentTable } = sent;
    expect(sentTable).toEqual({ [REFERENCE_KEY]: 0 });
    expect(references[0]).toBe(table);
  });
});
