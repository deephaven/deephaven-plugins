import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import type {
  ChartBuilderSettings,
  IrisGridModel,
  IrisGridTableModel,
} from '@deephaven/iris-grid';
import { type dh } from '@deephaven/jsapi-types';
import {
  type ContextAction,
  type ResolvableContextAction,
} from '@deephaven/components';
import { UITable } from './UITable';
import { wrapActionsWithTableRef } from './UITableUtils';
import WidgetCallableContext from '../../widget/WidgetCallableContext';

const mockEmit = jest.fn();
const mockTable = {} as dh.Table;
const mockModel = {
  columns: [] as dh.Column[],
  isChartBuilderAvailable: true,
  description: 'test_table',
  table: mockTable,
  close: jest.fn(),
  setColorMap: jest.fn(),
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
      const [state, setState] = react.useState(initialValue);
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
let capturedOnContextMenu:
  | ((data: unknown) => ResolvableContextAction[])
  | undefined;

jest.mock('@deephaven/iris-grid', () => {
  const actual = jest.requireActual('@deephaven/iris-grid');
  return {
    ...actual,
    IrisGrid: jest.fn(props => {
      capturedOnCreateChart = props.onCreateChart;
      capturedOnContextMenu = props.onContextMenu;
      return <div data-testid="iris-grid" />;
    }),
    IrisGridUtils: jest.fn(() => ({
      hydrateSort: jest.fn(),
      hydrateQuickFilters: jest.fn(),
    })),
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
  capturedOnCreateChart = undefined;
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

describe('wrapActionsWithTableRef', () => {
  const tableRef = {} as dh.Table;

  it('sets the table ref before invoking the action', () => {
    const calls: string[] = [];
    const setRef = jest.fn(() => calls.push('setRef'));
    const action = jest.fn(() => calls.push('action'));

    const [wrapped] = wrapActionsWithTableRef(
      [{ title: 'Act', action }],
      tableRef,
      setRef
    ) as ContextAction[];
    wrapped.action?.(new Event('click'));

    expect(calls).toEqual(['setRef', 'action']);
    expect(setRef).toHaveBeenCalledWith([tableRef]);
  });

  it('wraps nested sub-menu actions', () => {
    const setRef = jest.fn();
    const nestedAction = jest.fn();

    const [wrapped] = wrapActionsWithTableRef(
      [{ title: 'Menu', actions: [{ title: 'Nested', action: nestedAction }] }],
      tableRef,
      setRef
    ) as ContextAction[];
    const [nested] = wrapped.actions as ContextAction[];
    nested.action?.(new Event('click'));

    expect(setRef).toHaveBeenCalledWith([tableRef]);
    expect(nestedAction).toHaveBeenCalled();
  });

  it('wraps actions returned by a dynamic action resolver', async () => {
    const setRef = jest.fn();
    const dynamicAction = jest.fn();

    const [resolver] = wrapActionsWithTableRef(
      [async () => [{ title: 'Dynamic', action: dynamicAction }]],
      tableRef,
      setRef
    ) as Array<() => Promise<ContextAction[]>>;

    // The resolver itself is a callable, so the ref must be set before it runs.
    const resolved = await resolver();
    expect(setRef).toHaveBeenCalledTimes(1);

    resolved[0].action?.(new Event('click'));
    expect(setRef).toHaveBeenCalledTimes(2);
    expect(dynamicAction).toHaveBeenCalled();
  });
});

describe('context menu table ref', () => {
  async function renderAndGetActions() {
    const setNextCallableRefs = jest.fn();
    await act(async () => {
      render(
        <WidgetCallableContext.Provider value={setNextCallableRefs}>
          <UITable
            table={mockExportedTable}
            contextMenu={{ title: 'Server action', action: jest.fn() }}
            showSearch={false}
            showQuickFilters={false}
            showGroupingColumn={false}
            reverse={false}
          />
        </WidgetCallableContext.Provider>
      );
    });

    await waitFor(() => {
      expect(capturedOnContextMenu).toBeDefined();
    });

    const actions = capturedOnContextMenu?.({
      value: 1,
      valueText: '1',
      column: { name: 'A' },
      rowIndex: 0,
      columnIndex: 0,
      modelRow: null,
      modelColumn: 0,
      model: mockModel,
    }) as ContextAction[];

    return { actions, setNextCallableRefs };
  }

  it('sets the ref for server actions', async () => {
    const { actions, setNextCallableRefs } = await renderAndGetActions();

    actions[0].action?.(new Event('click'));

    expect(setNextCallableRefs).toHaveBeenCalledTimes(1);
  });

  it('leaves client-side plugin actions alone', async () => {
    const { actions, setNextCallableRefs } = await renderAndGetActions();

    // A plugin action sends no request, so a ref set here would be drained by
    // whatever request came next.
    expect(actions[actions.length - 1]).toBe(mockPluginAction);

    actions[actions.length - 1].action?.(new Event('click'));

    expect(setNextCallableRefs).not.toHaveBeenCalled();
  });
});
