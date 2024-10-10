import { ensureArray } from '@deephaven/utils';
import { dhTruck } from '@deephaven/icons';
import { TestUtils } from '@deephaven/test-utils';
import type { IrisGridModel } from '@deephaven/iris-grid';
import type { dh } from '@deephaven/jsapi-types';
import type {
  ContextAction,
  ResolvableContextAction,
} from '@deephaven/components';
import { wrapContextActions } from './UITableContextMenuHandler';

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
};

async function resolveContextAction(
  action: ResolvableContextAction = [] as ResolvableContextAction
): Promise<ContextAction[]> {
  if (typeof action === 'function') {
    return ensureArray(await action());
  }
  return ensureArray(await action);
}

describe('wrapContextActions', () => {
  test('handles cell item', async () => {
    const action = {
      action: jest.fn(),
    };
    const wrapped = wrapContextActions(action, CLIENT_CELL_DATA, []);
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
    const wrapped = wrapContextActions(action, CLIENT_CELL_DATA, []);
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
    const wrapped = wrapContextActions(action, CLIENT_HEADER_DATA, []);
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
    const wrapped = wrapContextActions(action, CLIENT_CELL_DATA, []);
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
    const wrapped = wrapContextActions(action, CLIENT_CELL_DATA, []);
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
});
