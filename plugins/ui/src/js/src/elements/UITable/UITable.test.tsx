import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import type {
  ChartBuilderSettings,
  IrisGridProps,
  IrisGridModel,
  IrisGridTableModel,
} from '@deephaven/iris-grid';
import { type dh } from '@deephaven/jsapi-types';
import {
  type ContextAction,
  type ResolvableContextAction,
} from '@deephaven/components';
import { UITable } from './UITable';
import { stringifyWithReferences } from '../../widget/ReferenceUtils';

const mockEmit = jest.fn();
let mockPersistedState: unknown;
const mockPersistedSorts = ['persisted-sort'];
const mockPersistedQuickFilters = new Map([[0, { text: 'persisted' }]]);
const mockControlledQuickFilters = new Map([[0, { text: 'controlled' }]]);
const mockControlledSorts = ['controlled-sort'];
const mockTable = {} as dh.Table;
const mockModel = {
  columns: [] as dh.Column[],
  isChartBuilderAvailable: true,
  description: 'test_table',
  table: mockTable,
  close: jest.fn(),
  setColorMap: jest.fn(),
  setQuickFiltersReadOnly: jest.fn(),
  setSortsReadOnly: jest.fn(),
  getColumnIndexByName: jest.fn(),
} as unknown as IrisGridTableModel;

jest.mock('@deephaven/dashboard', () => {
  const react = jest.requireActual('react');
  return {
    useDhId: () => 'mock-panel-id',
    useLayoutManager: () => ({
      eventHub: { emit: mockEmit, on: jest.fn(), off: jest.fn() },
    }),
    useListener: jest.fn(),
    usePersistentState: (initialValue: unknown) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [state, setState] = react.useState(
        mockPersistedState ?? initialValue
      );
      return [state, setState];
    },
  };
});

jest.mock('./UITableModel', () => ({
  makeUiTableModel: jest.fn(() => Promise.resolve(mockModel)),
}));

jest.mock('../hooks', () => ({
  useExportedObject: () => ({
    widget: {},
    api: {},
    isLoading: false,
    error: null,
  }),
}));

const mockPluginAction = { title: 'Plugin action', action: jest.fn() };

jest.mock('@deephaven/dashboard-core-plugins', () => ({
  InputFilterEvent: { CLEAR_ALL_FILTERS: 'CLEAR_ALL_FILTERS' },
  IrisGridEvent: { CREATE_CHART: 'IrisGridevent.CREATE_CHART' },
  useDashboardColumnFilters: () => [],
  useGridLinker: () => ({
    alwaysFetchColumns: [],
    columnSelectionValidator: undefined,
    isSelectingColumn: false,
    onColumnSelected: jest.fn(),
    onDataSelected: jest.fn(),
  }),
  useTablePlugin: () => ({
    Plugin: null,
    customFilters: [],
    alwaysFetchColumns: [],
    onContextMenu: () => [mockPluginAction],
  }),
}));

jest.mock('@deephaven/redux', () => ({
  getSettings: () => () => ({
    timeZone: 'America/New_York',
    defaultDateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
  }),
}));

jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  LoadingOverlay: () => null,
  useTheme: () => ({}),
  useStyleProps: () => ({ styleProps: {} }),
  resolveCssVariablesInRecord: (record: Record<string, string>) => record,
}));

// Capture the onCreateChart prop passed to IrisGrid
let capturedOnCreateChart:
  | ((settings: ChartBuilderSettings, model: IrisGridModel) => void)
  | undefined;
let capturedIrisGridProps: IrisGridProps | undefined;
let capturedOnContextMenu:
  | ((data: unknown) => ResolvableContextAction[])
  | undefined;

jest.mock('@deephaven/iris-grid', () => {
  const actual = jest.requireActual('@deephaven/iris-grid');
  return {
    ...actual,
    IrisGrid: jest.fn(props => {
      capturedIrisGridProps = props;
      capturedOnCreateChart = props.onCreateChart;
      capturedOnContextMenu = props.onContextMenu;
      return <div data-testid="iris-grid" />;
    }),
    IrisGridUtils: Object.assign(
      jest.fn(() => ({
        hydrateSort: jest.fn(() => mockControlledSorts),
        hydrateQuickFilters: jest.fn(() => mockControlledQuickFilters),
        hydrateIrisGridState: jest.fn(() => ({
          sorts: mockPersistedSorts,
          quickFilters: mockPersistedQuickFilters,
        })),
      })),
      {
        hydrateGridState: jest.fn(() => ({})),
        dehydrateQuickFilters: jest.fn(() => []),
        dehydrateSort: jest.fn(() => []),
      }
    ),
    IrisGridCacheUtils: {
      makeMemoizedCombinedGridStateDehydrator: jest.fn(() => jest.fn()),
    },
    isIrisGridTableModelTemplate: (model: unknown) =>
      model != null && 'table' in (model as Record<string, unknown>),
  };
});

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

const mockExportedTable = {} as dh.WidgetExportedObject;

beforeEach(() => {
  jest.clearAllMocks();
  mockPersistedState = undefined;
  (mockModel as { columns: dh.Column[] }).columns = [];
  capturedOnCreateChart = undefined;
  capturedIrisGridProps = undefined;
});

describe('UITable chart builder', () => {
  async function renderAndWaitForModel() {
    await act(async () => {
      render(
        <UITable
          table={mockExportedTable}
          showSearch={false}
          showQuickFilters={false}
          showGroupingColumn={false}
          reverse={false}
        />
      );
    });

    await waitFor(() => {
      expect(capturedOnCreateChart).toBeDefined();
    });
  }

  it('passes onCreateChart to IrisGrid', async () => {
    await renderAndWaitForModel();
    expect(capturedOnCreateChart).toBeDefined();
  });

  it('emits IrisGridEvent.CREATE_CHART with correct metadata', async () => {
    await renderAndWaitForModel();

    const chartSettings: ChartBuilderSettings = {
      type: 'LINE' as never,
      series: ['col1'],
      xAxis: 'col0',
      isLinked: false,
    };

    const irisGridModel = TestUtils.createMockProxy<IrisGridTableModel>({
      description: 'my_table',
      table: TestUtils.createMockProxy<dh.Table>(),
    });

    capturedOnCreateChart!(chartSettings, irisGridModel);

    expect(mockEmit).toHaveBeenCalledWith(
      'IrisGridevent.CREATE_CHART',
      expect.objectContaining({
        metadata: expect.objectContaining({
          settings: chartSettings,
          sourcePanelId: 'mock-panel-id',
          table: 'my_table',
          tableSettings: {},
        }),
        table: irisGridModel.table,
      })
    );
  });

  it('uses fallback table name when description is empty', async () => {
    await renderAndWaitForModel();

    const chartSettings: ChartBuilderSettings = {
      type: 'LINE' as never,
      series: ['col1'],
      xAxis: 'col0',
      isLinked: false,
    };

    const irisGridModel = TestUtils.createMockProxy<IrisGridTableModel>({
      description: '',
      table: TestUtils.createMockProxy<dh.Table>(),
    });

    capturedOnCreateChart!(chartSettings, irisGridModel);

    expect(mockEmit).toHaveBeenCalledWith(
      'IrisGridevent.CREATE_CHART',
      expect.objectContaining({
        metadata: expect.objectContaining({
          table: 'Table',
        }),
      })
    );
  });

  it('passes undefined table when model is not a table template', async () => {
    await renderAndWaitForModel();

    const chartSettings: ChartBuilderSettings = {
      type: 'LINE' as never,
      series: ['col1'],
      xAxis: 'col0',
      isLinked: false,
    };

    // Model without a 'table' property (e.g. tree table model)
    const irisGridModel = TestUtils.createMockProxy<IrisGridModel>({
      description: 'tree_table',
    });
    // Remove 'table' from proxy so isIrisGridTableModelTemplate returns false
    delete (irisGridModel as unknown as Record<string, unknown>).table;

    capturedOnCreateChart!(chartSettings, irisGridModel);

    expect(mockEmit).toHaveBeenCalledWith(
      'IrisGridevent.CREATE_CHART',
      expect.objectContaining({
        metadata: expect.objectContaining({
          settings: chartSettings,
          sourcePanelId: 'mock-panel-id',
          table: 'tree_table',
          tableSettings: {},
        }),
        table: undefined,
      })
    );
  });
});

describe('UITable controlled state', () => {
  const baseProps = {
    table: mockExportedTable,
    showSearch: false,
    showQuickFilters: false,
    showGroupingColumn: false,
    reverse: false,
  };

  it('controls IrisGrid and passes change handlers when values and callbacks are provided', async () => {
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          quickFilters={{}}
          sorts={[]}
          onQuickFiltersChange={jest.fn()}
          onSortsChange={jest.fn()}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps).toEqual(
        expect.objectContaining({
          isQuickFiltersControlled: true,
          isSortsControlled: true,
          onQuickFiltersChange: expect.any(Function),
          onSortsChange: expect.any(Function),
        })
      );
    });
  });

  it('controls IrisGrid when only values are provided', async () => {
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          quickFilters={{}}
          sorts={[]}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps).toEqual(
        expect.objectContaining({
          isQuickFiltersControlled: true,
          isSortsControlled: true,
        })
      );
    });
    expect(capturedIrisGridProps?.onQuickFiltersChange).toBeUndefined();
    expect(capturedIrisGridProps?.onSortsChange).toBeUndefined();
  });

  it('does not control IrisGrid but passes change handlers when only callbacks are provided', async () => {
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          onQuickFiltersChange={jest.fn()}
          onSortsChange={jest.fn()}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps).toEqual(
        expect.objectContaining({
          isQuickFiltersControlled: false,
          isSortsControlled: false,
          onQuickFiltersChange: expect.any(Function),
          onSortsChange: expect.any(Function),
        })
      );
    });
  });

  it('forwards user changes to the callbacks', async () => {
    const onQuickFiltersChange = jest.fn();
    const onSortsChange = jest.fn();
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          onQuickFiltersChange={onQuickFiltersChange}
          onSortsChange={onSortsChange}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps?.onSortsChange).toBeDefined();
    });
    act(() => {
      capturedIrisGridProps?.onQuickFiltersChange?.(new Map());
      capturedIrisGridProps?.onSortsChange?.([]);
    });
    expect(onQuickFiltersChange).toHaveBeenCalledWith({});
    expect(onSortsChange).toHaveBeenCalledWith([]);
  });

  it('applies default values as uncontrolled initial state', async () => {
    // Sorts are only hydrated once the model has columns
    (mockModel as { columns: dh.Column[] }).columns = [
      { name: 'A' } as dh.Column,
    ];
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          defaultQuickFilters={{ A: '>1' }}
          defaultSorts={[]}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps).toEqual(
        expect.objectContaining({
          isQuickFiltersControlled: false,
          isSortsControlled: false,
        })
      );
    });
    expect(capturedIrisGridProps?.quickFilters).toBe(
      mockControlledQuickFilters
    );
    expect(capturedIrisGridProps?.sorts).toBe(mockControlledSorts);
  });

  it('does not let persisted state override controlled values', async () => {
    mockPersistedState = {};
    // Controlled sorts are only hydrated once the model has columns
    (mockModel as { columns: dh.Column[] }).columns = [
      { name: 'A' } as dh.Column,
    ];
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          quickFilters={{}}
          sorts={[]}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps).toBeDefined();
    });
    expect(capturedIrisGridProps?.quickFilters).toBe(
      mockControlledQuickFilters
    );
    expect(capturedIrisGridProps?.sorts).toBe(mockControlledSorts);
  });

  it('uses persisted state over default values', async () => {
    mockPersistedState = {};
    (mockModel as { columns: dh.Column[] }).columns = [
      { name: 'A' } as dh.Column,
    ];
    await act(async () => {
      render(
        <UITable
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...baseProps}
          defaultQuickFilters={{ A: '>1' }}
          defaultSorts={[]}
          onQuickFiltersChange={jest.fn()}
          onSortsChange={jest.fn()}
        />
      );
    });

    await waitFor(() => {
      expect(capturedIrisGridProps).toBeDefined();
    });
    expect(capturedIrisGridProps?.quickFilters).toBe(mockPersistedQuickFilters);
    expect(capturedIrisGridProps?.sorts).toBe(mockPersistedSorts);
  });
});

describe('context menu table', () => {
  const serverAction = jest.fn();

  async function renderAndGetActions() {
    await act(async () => {
      render(
        <UITable
          table={mockExportedTable}
          contextMenu={{ title: 'Server action', action: serverAction }}
          showSearch={false}
          showQuickFilters={false}
          showGroupingColumn={false}
          reverse={false}
        />
      );
    });

    await waitFor(() => {
      expect(capturedOnContextMenu).toBeDefined();
    });

    return capturedOnContextMenu?.({
      value: 1,
      valueText: '1',
      column: { name: 'A' },
      rowIndex: 0,
      columnIndex: 0,
      modelRow: null,
      modelColumn: 0,
      model: mockModel,
    }) as ContextAction[];
  }

  it('sends the model table to server actions by reference', async () => {
    const actions = await renderAndGetActions();

    actions[0].action?.(new Event('click'));

    const { references } = stringifyWithReferences(
      serverAction.mock.calls[0][0]
    );
    expect(references).toHaveLength(1);
    expect(references[0]).toBe(mockTable);
  });

  it('returns plugin actions unchanged', async () => {
    const actions = await renderAndGetActions();

    expect(actions[actions.length - 1]).toBe(mockPluginAction);
  });
});
