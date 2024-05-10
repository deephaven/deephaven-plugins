import { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { PlotlyExpressChartModel } from './PlotlyExpressChartModel';
import { PlotlyChartWidgetData } from './PlotlyExpressChartUtils';

jest.mock('./PlotlyExpressChartModel', () => {
  const original = jest.requireActual('./PlotlyExpressChartModel');
  original.PlotlyExpressChartModel.prototype.fireDownsampleStart = jest.fn();
  original.PlotlyExpressChartModel.prototype.fireDownsampleFinish = jest.fn();
  original.PlotlyExpressChartModel.prototype.fireDownsampleFail = jest.fn();
  original.PlotlyExpressChartModel.prototype.fireDownsampleNeeded = jest.fn();
  return original;
});

const SMALL_TABLE = TestUtils.createMockProxy<DhType.Table>({
  columns: [{ name: 'x' }, { name: 'y' }] as DhType.Column[],
  size: 500,
  subscribe: () => TestUtils.createMockProxy(),
});

const LARGE_TABLE = TestUtils.createMockProxy<DhType.Table>({
  columns: [{ name: 'x' }, { name: 'y' }] as DhType.Column[],
  size: 50000,
  subscribe: () => TestUtils.createMockProxy(),
});

function createMockWidget(tables: DhType.Table[], plotType = 'scatter') {
  const widgetData = {
    type: 'test',
    figure: {
      deephaven: {
        mappings: tables.map((_, i) => ({
          table: i,
          data_columns: {
            x: [`/plotly/data/${i}/x`],
            y: [`/plotly/data/${i}/y`],
          },
        })),
        is_user_set_color: false,
        is_user_set_template: false,
      },
      plotly: {
        data: tables.map((_, i) => ({
          type: plotType as 'scatter',
          mode: 'lines',
          xaxis: i === 0 ? 'x' : `x${i + 1}`,
          yaxis: i === 0 ? 'y' : `y${i + 1}`,
        })),
        layout: {
          title: 'layout',
          xaxis: {},
          yaxis: {},
          xaxis2: {},
          yaxis2: {},
        },
      },
    },
    revision: 0,
    new_references: tables.map((_, i) => i),
    removed_references: [],
  } satisfies PlotlyChartWidgetData;

  return {
    getDataAsString: () => JSON.stringify(widgetData),
    exportedObjects: tables.map(t => ({
      fetch: () => Promise.resolve(t),
      reexport: jest.fn(),
      close: jest.fn(),
    })),
    addEventListener: jest.fn(),
  } satisfies Partial<DhType.Widget> as unknown as DhType.Widget;
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const mockDownsample = jest.fn(t => t);

const mockDh = {
  calendar: {
    DayOfWeek: {
      values: () => [],
    },
  },
  plot: {
    Downsample: {
      runChartDownsample: mockDownsample,
    },
    ChartData: (() =>
      TestUtils.createMockProxy()) as unknown as typeof DhType.plot.ChartData,
  },
  Table: {
    EVENT_UPDATED: 'updated',
  },
  Widget: {
    EVENT_MESSAGE: 'message',
  },
} satisfies DeepPartial<typeof DhType> as unknown as typeof DhType;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('PlotlyExpressChartModel', () => {
  it('should create a new instance of PlotlyExpressChartModel', () => {
    const mockWidget = createMockWidget([]);

    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    expect(chartModel.isSubscribed).toBe(false);
    expect(chartModel.layout).toEqual(
      JSON.parse(mockWidget.getDataAsString()).figure.plotly.layout
    );
  });

  it('should subscribe', async () => {
    const mockWidget = createMockWidget([]);
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    await chartModel.subscribe(jest.fn());
    expect(chartModel.isSubscribed).toBe(true);
  });

  it('should not downsample line charts when the table is small', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE]);
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    await chartModel.subscribe(jest.fn());
    expect(mockDownsample).toHaveBeenCalledTimes(0);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(chartModel.fireDownsampleStart).toHaveBeenCalledTimes(0);
    expect(chartModel.fireDownsampleFinish).toHaveBeenCalledTimes(0);
  });

  it('should downsample line charts when the table is big', async () => {
    const mockWidget = createMockWidget([LARGE_TABLE]);
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    await chartModel.subscribe(jest.fn());
    expect(mockDownsample).toHaveBeenCalledTimes(1);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(chartModel.fireDownsampleStart).toHaveBeenCalledTimes(1);
    expect(chartModel.fireDownsampleFinish).toHaveBeenCalledTimes(1);
  });

  it('should downsample only the required tables', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE, LARGE_TABLE]);
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    await chartModel.subscribe(jest.fn());
    expect(mockDownsample).toHaveBeenCalledTimes(1);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(chartModel.fireDownsampleStart).toHaveBeenCalledTimes(1);
    expect(chartModel.fireDownsampleFinish).toHaveBeenCalledTimes(1);
  });

  it('should fail to downsample for non-line plots', async () => {
    const mockWidget = createMockWidget([LARGE_TABLE], 'scatterpolar');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    await chartModel.subscribe(jest.fn());
    expect(mockDownsample).toHaveBeenCalledTimes(0);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(chartModel.fireDownsampleStart).toHaveBeenCalledTimes(1);
    expect(chartModel.fireDownsampleFinish).toHaveBeenCalledTimes(0);
    expect(chartModel.fireDownsampleFail).toHaveBeenCalledTimes(1);
  });
});
