import type { Layout } from 'plotly.js';
import { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { ChartModel } from '@deephaven/chart';
import { Formatter } from '@deephaven/jsapi-utils';
import { PlotlyExpressChartModel } from './PlotlyExpressChartModel';
import {
  FilterColumns,
  getWidgetData,
  PlotlyChartWidgetData,
  setDefaultValueFormat,
} from './PlotlyExpressChartUtils';

const SMALL_TABLE = TestUtils.createMockProxy<DhType.Table>({
  columns: [{ name: 'x' }, { name: 'y' }] as DhType.Column[],
  size: 500,
  subscribe: () => TestUtils.createMockProxy(),
});

const LARGE_TABLE = TestUtils.createMockProxy<DhType.Table>({
  columns: [{ name: 'x' }, { name: 'y' }] as DhType.Column[],
  size: 50_000,
  subscribe: () => TestUtils.createMockProxy(),
});

const REALLY_LARGE_TABLE = TestUtils.createMockProxy<DhType.Table>({
  columns: [{ name: 'x' }, { name: 'y' }] as DhType.Column[],
  size: 5_000_000,
  subscribe: () => TestUtils.createMockProxy(),
});

jest.mock('./PlotlyExpressChartUtils', () => ({
  ...jest.requireActual('./PlotlyExpressChartUtils'),
  setDefaultValueFormat: jest.fn(),
}));

function createMockWidget(
  tables: DhType.Table[],
  plotType = 'scatter',
  title: Partial<Layout['title']> = { text: 'Title' },
  filterColumns: FilterColumns | undefined = undefined,
  layoutTitle: string | undefined = undefined
) {
  const layoutAxes: Partial<Layout> = {};
  tables.forEach((_, i) => {
    if (i === 0) {
      layoutAxes.xaxis = {};
      layoutAxes.yaxis = {};
    } else {
      layoutAxes[`xaxis${i + 1}` as 'xaxis'] = {};
      layoutAxes[`yaxis${i + 1}` as 'yaxis'] = {};
    }
  });

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
        calendar: {
          timeZone: 'America/New_York',
          businessDays: [
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
          ],
          holidays: [{ date: '2024-01-01', businessPeriods: [] }],
          businessPeriods: [{ open: '08:00', close: '17:00' }],
          name: 'Test',
        },
        filterColumns,
      },
      plotly: {
        data: tables.map((_, i) => ({
          type: plotType as 'scatter',
          mode: 'lines',
          xaxis: i === 0 ? 'x' : `x${i + 1}`,
          yaxis: i === 0 ? 'y' : `y${i + 1}`,
        })),
        layout: {
          title,
          legend: {
            title: {
              text: layoutTitle,
            },
          },
          ...layoutAxes,
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
    sendMessage: jest.fn(),
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
  i18n: {
    TimeZone: {
      getTimeZone: () => ({ id: 'America/New_York', standardOffset: 300 }),
    },
  },
} satisfies DeepPartial<typeof DhType> as unknown as typeof DhType;

const mockDhChicago = {
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
  i18n: {
    TimeZone: {
      getTimeZone: () => ({ id: 'America/Chicago', standardOffset: 300 }),
    },
  },
} satisfies DeepPartial<typeof DhType> as unknown as typeof DhType;

// toHaveBeenLastCalledWith etc. do not actually check for the correct event type like this does
const checkEventTypes = (mockSubscribe: jest.Mock, eventTypes: string[]) => {
  const { calls } = mockSubscribe.mock;
  expect(calls.length).toBe(eventTypes.length);
  for (let i = 0; i < calls.length; i += 1) {
    expect(calls[i][0].type).toBe(eventTypes[i]);
  }
};

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

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(mockDownsample).toHaveBeenCalledTimes(0);
    expect(mockSubscribe).toHaveBeenCalledTimes(0);
  });

  it('should downsample line charts when the table is big', async () => {
    const mockWidget = createMockWidget([LARGE_TABLE]);
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(mockDownsample).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(2);

    checkEventTypes(mockSubscribe, [
      ChartModel.EVENT_DOWNSAMPLESTARTED,
      ChartModel.EVENT_DOWNSAMPLEFINISHED,
    ]);
  });

  it('should downsample only the required tables', async () => {
    const mockWidget = createMockWidget([
      SMALL_TABLE,
      LARGE_TABLE,
      REALLY_LARGE_TABLE,
    ]);
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(mockDownsample).toHaveBeenCalledTimes(2);
    expect(mockSubscribe).toHaveBeenCalledTimes(4);

    checkEventTypes(mockSubscribe, [
      ChartModel.EVENT_DOWNSAMPLESTARTED,
      ChartModel.EVENT_DOWNSAMPLESTARTED,
      ChartModel.EVENT_DOWNSAMPLEFINISHED,
      ChartModel.EVENT_DOWNSAMPLEFINISHED,
    ]);
  });

  it('should fail to downsample for non-line plots', async () => {
    const mockWidget = createMockWidget([LARGE_TABLE], 'scatterpolar');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(mockDownsample).toHaveBeenCalledTimes(0);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);

    checkEventTypes(mockSubscribe, [ChartModel.EVENT_DOWNSAMPLEFAILED]);
  });

  it('should fetch non-line plots under the max threshold with downsampling disabled', async () => {
    const mockWidget = createMockWidget([LARGE_TABLE], 'scatterpolar');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    chartModel.isDownsamplingDisabled = true;
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(mockDownsample).toHaveBeenCalledTimes(0);
    expect(mockSubscribe).toHaveBeenCalledTimes(0);
  });

  it('should not fetch non-line plots over the max threshold with downsampling disabled', async () => {
    const mockWidget = createMockWidget([REALLY_LARGE_TABLE], 'scatterpolar');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    chartModel.isDownsamplingDisabled = true;
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe and addTable are async
    expect(mockDownsample).toHaveBeenCalledTimes(0);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);

    checkEventTypes(mockSubscribe, [ChartModel.EVENT_DOWNSAMPLEFAILED]);
  });

  it('should swap replaceable WebGL traces without blocker events if WebGL is disabled or reenabled', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scattergl');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    // Assume WebGL is supported in case it's false in the test environment
    chartModel.isWebGlSupported = true;

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe is async
    chartModel.setRenderOptions({ webgl: true });
    expect(chartModel.plotlyData[0].type).toBe('scattergl');
    chartModel.setRenderOptions({ webgl: false });
    expect(chartModel.plotlyData[0].type).toBe('scatter');
    chartModel.setRenderOptions({ webgl: true });
    expect(chartModel.plotlyData[0].type).toBe('scattergl');

    // No events should be emitted since the trace is replaceable
    expect(mockSubscribe).toHaveBeenCalledTimes(0);
  });

  it('should swap replaceable WebGL traces without blocker events if WebGL is not supported', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scattergl');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    // Assume WebGL is not supported in case it's true in the test environment
    chartModel.isWebGlSupported = false;

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe is async
    chartModel.setRenderOptions({ webgl: true });
    expect(chartModel.plotlyData[0].type).toBe('scatter');
    chartModel.setRenderOptions({ webgl: false });
    expect(chartModel.plotlyData[0].type).toBe('scatter');
    chartModel.setRenderOptions({ webgl: true });
    expect(chartModel.plotlyData[0].type).toBe('scatter');

    // No events should be emitted since the trace is replaceable
    expect(mockSubscribe).toHaveBeenCalledTimes(0);
  });

  it('should emit blocker events only if unreplaceable WebGL traces are present and WebGL is disabled, then blocker clear events when reenabled', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scatter3d');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe is async
    chartModel.setRenderOptions({ webgl: true });
    // no calls because the chart has webgl enabled
    expect(mockSubscribe).toHaveBeenCalledTimes(0);
    chartModel.setRenderOptions({ webgl: false });
    // blocking event should be emitted
    expect(mockSubscribe).toHaveBeenCalledTimes(1);

    chartModel.setRenderOptions({ webgl: true });
    // blocking clear event should be emitted, but this doesn't count as an acknowledge
    expect(mockSubscribe).toHaveBeenCalledTimes(2);

    expect(chartModel.hasAcknowledgedWebGlWarning).toBe(false);
    // if user had accepted the rendering (simulated by fireBlockerClear), no EVENT_BLOCKER event should be emitted again
    chartModel.fireBlockerClear();
    chartModel.setRenderOptions({ webgl: false });
    expect(mockSubscribe).toHaveBeenCalledTimes(3);

    checkEventTypes(mockSubscribe, [
      ChartModel.EVENT_BLOCKER,
      ChartModel.EVENT_BLOCKER_CLEAR,
      ChartModel.EVENT_BLOCKER_CLEAR,
    ]);
  });

  it('should emit layout update events if the formatter is updated', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'line');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );
    const formatter = new Formatter(mockDh);
    const formatterChicago = new Formatter(mockDhChicago);

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe is async
    expect(mockSubscribe).toHaveBeenCalledTimes(0);

    chartModel.setFormatter(formatter);
    // since a calendar is provided and the formatter is set for the first time, the layout and data should be updated
    // three calls are made because fireTimeZoneUpdated calls fireUpdated, which fires fireLoadFinished the first time
    expect(mockSubscribe).toHaveBeenCalledTimes(3);

    chartModel.setFormatter(formatterChicago);
    // since the timezone is different, the layout should be updated and the data should be updated
    expect(mockSubscribe).toHaveBeenCalledTimes(5);

    chartModel.setFormatter(formatterChicago);
    // no updates should be emitted since the formatter is the same
    expect(mockSubscribe).toHaveBeenCalledTimes(5);

    checkEventTypes(mockSubscribe, [
      ChartModel.EVENT_LAYOUT_UPDATED,
      ChartModel.EVENT_UPDATED,
      ChartModel.EVENT_LOADFINISHED,
      ChartModel.EVENT_LAYOUT_UPDATED,
      ChartModel.EVENT_UPDATED,
    ]);
  });

  it('should call setDefaultValueFormat when the formatter is updated', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scatter');
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick); // Subscribe is async
    const mockFormatter = TestUtils.createMockProxy<Formatter>();
    expect(setDefaultValueFormat).toHaveBeenCalledTimes(1);
    chartModel.setFormatter(mockFormatter);
    expect(setDefaultValueFormat).toHaveBeenCalledTimes(2);
  });

  it('should emit layout update events if a widget is updated and has a new title', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scatter', {
      text: 'Test',
    });
    const updatedWidget = createMockWidget([SMALL_TABLE], 'scatter', {
      text: 'Updated Test',
    });
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick);
    chartModel.handleWidgetUpdated(
      getWidgetData(mockWidget),
      mockWidget.exportedObjects
    );

    expect(mockSubscribe).toHaveBeenCalledTimes(0);

    chartModel.handleWidgetUpdated(
      getWidgetData(updatedWidget),
      updatedWidget.exportedObjects
    );

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenLastCalledWith(
      new CustomEvent(ChartModel.EVENT_LAYOUT_UPDATED)
    );
  });

  it('should fire a widget sendMessage initially and when filters are provided when none are required', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scatter', 'Test', {
      columns: [
        { name: 'category', type: 'java.lang.String', required: false },
      ],
    });
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick);

    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockWidget.sendMessage).toHaveBeenLastCalledWith(
      '{"type":"FILTER","filterMap":{}}'
    );
    chartModel.setFilter(new Map([['category', 'Test']]));
    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockWidget.sendMessage).toHaveBeenLastCalledWith(
      '{"type":"FILTER","filterMap":{"category":"Test"}}'
    );
  });

  it('should fire a widget sendMessage only when all filters are provided when all are required', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scatter', 'Test', {
      columns: [{ name: 'category', type: 'java.lang.String', required: true }],
    });
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick);

    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(0);
    chartModel.setFilter(new Map([['category', 'Test']]));
    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockWidget.sendMessage).toHaveBeenLastCalledWith(
      '{"type":"FILTER","filterMap":{"category":"Test"}}'
    );
  });

  it('should fire a widget sendMessage only when all required filters are provided when some are required', async () => {
    const mockWidget = createMockWidget([SMALL_TABLE], 'scatter', 'Test', {
      columns: [
        { name: 'category', type: 'java.lang.String', required: true },
        { name: 'other', type: 'java.lang.String', required: false },
      ],
    });
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick);

    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(0);
    chartModel.setFilter(new Map([['other', 'Test']]));
    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(0);
    chartModel.setFilter(
      new Map([
        ['other', 'Test'],
        ['category', 'Test'],
      ])
    );
    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockWidget.sendMessage).toHaveBeenLastCalledWith(
      '{"type":"FILTER","filterMap":{"other":"Test","category":"Test"}}'
    );
    chartModel.setFilter(new Map([['other', 'Test']]));
    expect(mockWidget.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('should emit layout update events if a widget is updated and has a legend title', async () => {
    const mockWidget = createMockWidget(
      [SMALL_TABLE],
      'scatter',
      undefined,
      undefined,
      'Test Legend Title'
    );
    const chartModel = new PlotlyExpressChartModel(
      mockDh,
      mockWidget,
      jest.fn()
    );

    const mockSubscribe = jest.fn();
    await chartModel.subscribe(mockSubscribe);
    await new Promise(process.nextTick);
    if (chartModel.widget instanceof Object) {
      chartModel.handleWidgetUpdated(
        getWidgetData(chartModel.widget),
        chartModel.widget.exportedObjects
      );
    }
    expect(mockSubscribe).toHaveBeenCalledTimes(2);
    expect(mockSubscribe).toHaveBeenLastCalledWith(
      new CustomEvent(ChartModel.EVENT_LAYOUT_UPDATED)
    );
  });
});
