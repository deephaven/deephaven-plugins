import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import type {
  ChartBuilderSettings,
  IrisGridModel,
  IrisGridTableModel,
} from '@deephaven/iris-grid';
import { type dh } from '@deephaven/jsapi-types';
import { UITable } from './UITable';

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
    onContextMenu: () => [],
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

jest.mock('@deephaven/iris-grid', () => {
  const actual = jest.requireActual('@deephaven/iris-grid');
  return {
    ...actual,
    IrisGrid: jest.fn(props => {
      capturedOnCreateChart = props.onCreateChart;
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

    expect(mockEmit).toHaveBeenCalledWith('IrisGridevent.CREATE_CHART', {
      metadata: {
        settings: chartSettings,
        table: 'my_table',
        tableSettings: {},
      },
      table: irisGridModel.table,
    });
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

    expect(mockEmit).toHaveBeenCalledWith('IrisGridevent.CREATE_CHART', {
      metadata: {
        settings: chartSettings,
        table: 'tree_table',
        tableSettings: {},
      },
      table: undefined,
    });
  });
});
