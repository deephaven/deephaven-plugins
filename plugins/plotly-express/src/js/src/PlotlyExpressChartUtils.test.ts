import { ChartUtils } from '@deephaven/chart';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { Formatter } from '@deephaven/jsapi-utils';
import {
  getPathParts,
  isLineSeries,
  isAutoAxis,
  isLinearAxis,
  areSameAxisRange,
  removeColorsFromData,
  getDataMappings,
  PlotlyChartWidgetData,
  getReplaceableWebGlTraceIndices,
  hasUnreplaceableWebGlTraces,
  setWebGlTraceType,
  setRangebreaksFromCalendar,
} from './PlotlyExpressChartUtils';

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

describe('getDataMappings', () => {
  it('should return the data mappings from the widget data', () => {
    const widgetData = {
      type: 'test',
      figure: {
        deephaven: {
          mappings: [
            { table: 0, data_columns: { x: ['x0'], y: ['y0'] } },
            { table: 1, data_columns: { x: ['x1'], y: ['y1'] } },
          ],
          is_user_set_color: false,
          is_user_set_template: false,
        },
        plotly: {
          data: [],
        },
      },
      revision: 0,
      new_references: [],
      removed_references: [],
    } satisfies PlotlyChartWidgetData;

    const expectedMappings = new Map([
      [
        0,
        new Map([
          ['x', ['x0']],
          ['y', ['y0']],
        ]),
      ],
      [
        1,
        new Map([
          ['x', ['x1']],
          ['y', ['y1']],
        ]),
      ],
    ]);

    expect(getDataMappings(widgetData)).toEqual(expectedMappings);
  });
});

describe('removeColorsFromData', () => {
  it('should remove colors in the original colorway', () => {
    const colorway = ['red', 'green', 'blue'];
    const data = [
      {
        marker: {
          color: 'red',
        },
      },
      {
        line: {
          color: 'blue',
        },
      },
    ];
    const expectedData = [
      {
        marker: {},
      },
      {
        line: {},
      },
    ];
    removeColorsFromData(colorway, data);
    expect(data).toEqual(expectedData);
  });

  it('should not remove colors that were not in the colorway', () => {
    const colorway = ['red', 'green', 'blue'];
    const data = [
      {
        marker: {
          color: 'purple',
        },
      },
      {
        line: {
          color: 'yellow',
        },
      },
    ];
    // Clone because the data should not be modified, but removeColorsFromData mutates the input
    const expectedData = structuredClone(data);
    removeColorsFromData(colorway, data);
    expect(data).toEqual(expectedData);
  });
});

describe('getPathParts', () => {
  it('should return the path parts within the plotly data array', () => {
    expect(getPathParts('/plotly/data/0/x')).toEqual(['0', 'x']);
  });

  it('should return an empty array if the path is empty', () => {
    expect(getPathParts('')).toEqual([]);
  });
});

describe('isLineSeries', () => {
  it('should return true if the data is a line series without markers', () => {
    expect(
      isLineSeries({
        type: 'scatter',
        mode: 'lines',
      })
    ).toBe(true);

    expect(
      isLineSeries({
        type: 'scattergl',
        mode: 'lines',
      })
    ).toBe(true);
  });

  it('should return false if the data is not a line series without markers', () => {
    expect(
      isLineSeries({
        type: 'scatter',
        mode: 'lines+markers',
      })
    ).toBe(false);

    expect(
      isLineSeries({
        type: 'scatterpolar',
        mode: 'lines',
      })
    ).toBe(false);
  });
});

describe('isAutoAxis', () => {
  it('should return true if the axis type is automatically determined based on the data', () => {
    expect(
      isAutoAxis({
        type: '-',
      })
    ).toBe(true);

    expect(isAutoAxis({})).toBe(true);
  });

  it('should return false if the axis type is not automatically determined based on the data', () => {
    expect(
      isAutoAxis({
        type: 'linear',
      })
    ).toBe(false);
  });
});

describe('isLinearAxis', () => {
  it('should return true if the axis is a linear axis', () => {
    expect(
      isLinearAxis({
        type: 'linear',
      })
    ).toBe(true);

    expect(
      isLinearAxis({
        type: 'date',
      })
    ).toBe(true);
  });

  it('should return false if the axis is not a linear axis', () => {
    expect(
      isLinearAxis({
        type: 'log',
      })
    ).toBe(false);
  });
});

describe('areSameAxisRange', () => {
  it('should return true if the two axis ranges are null (autorange)', () => {
    expect(areSameAxisRange(null, null)).toBe(true);
  });
  it('should return true if the two axis ranges are the same', () => {
    expect(areSameAxisRange([0, 10], [0, 10])).toBe(true);
  });
  it('should return false if the two axis ranges are different', () => {
    expect(areSameAxisRange([0, 10], [0, 20])).toBe(false);
    expect(areSameAxisRange([0, 20], [0, 10])).toBe(false);
    expect(areSameAxisRange([0, 10], null)).toBe(false);
    expect(areSameAxisRange(null, [0, 10])).toBe(false);
  });
});

describe('getReplaceableWebGlTraceIndexes', () => {
  it('should return the indexes of any trace with gl', () => {
    expect(
      getReplaceableWebGlTraceIndices([
        {
          type: 'scattergl',
        },
        {
          type: 'scatter',
        },
        {
          type: 'scatter3d',
        },
        {
          type: 'scattergl',
        },
      ])
    ).toEqual(new Set([0, 3]));
  });

  it('should return an empty set if there are no traces with gl', () => {
    expect(
      getReplaceableWebGlTraceIndices([
        {
          type: 'scatter',
        },
        {
          type: 'scatter3d',
        },
      ])
    ).toEqual(new Set());
  });
});

describe('hasUnreplaceableWebGlTraces', () => {
  it('should return true if there is a single unreplaceable trace', () => {
    expect(
      hasUnreplaceableWebGlTraces([
        {
          type: 'scattermapbox',
        },
      ])
    ).toBe(true);
  });

  it('should return true if there are unreplaceable traces', () => {
    expect(
      hasUnreplaceableWebGlTraces([
        {
          type: 'scattergl',
        },
        {
          type: 'scatter',
        },
        {
          type: 'scatter3d',
        },
        {
          type: 'scattergl',
        },
        {
          type: 'scatter3d',
        },
      ])
    ).toBe(true);
  });

  it('should return false if there are no unreplaceable traces', () => {
    expect(
      hasUnreplaceableWebGlTraces([
        {
          type: 'scatter',
        },
        {
          type: 'scattergl',
        },
      ])
    ).toBe(false);
  });
});

describe('setWebGlTraceType', () => {
  it('should set the trace type to gl if webgl is enabled', () => {
    const data: Plotly.Data[] = [
      {
        type: 'scatter',
      },
      {
        type: 'scatter',
      },
    ];
    const webGlTraceIndices = new Set([1]);
    setWebGlTraceType(data, true, webGlTraceIndices);
    expect(data[0].type).toBe('scatter');
    expect(data[1].type).toBe('scattergl');
  });

  it('should remove the gl from the trace type if webgl is disabled', () => {
    const data: Plotly.Data[] = [
      {
        type: 'scatter',
      },
      {
        type: 'scattergl',
      },
    ];
    const webGlTraceIndices = new Set([1]);
    setWebGlTraceType(data, false, webGlTraceIndices);
    expect(data[0].type).toBe('scatter');
    expect(data[1].type).toBe('scatter');
  });
});

describe('setRangeBreaksFromCalendar', () => {
  it('should set the range breaks from the calendar data', () => {
    const calendar = {
      timeZone: { id: 'America/New_York', standardOffset: 300 },
      businessDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      holidays: [
        { date: '2024-01-01', businessPeriods: [] },
        {
          date: '2024-04-01',
          businessPeriods: [
            { open: '2024-04-01T12:00:00Z', close: '2024-04-01T16:00:00Z' },
          ],
        },
      ],
      businessPeriods: [{ open: '08:00', close: '12:00' }],
    } as unknown as DhType.calendar.BusinessCalendar;

    const layout = {
      xaxis: {},
      yaxis: {},
    };
    console.log(mockDh);

    const chartUtils = new ChartUtils(mockDh);

    console.log("hi");

    const formatter = new Formatter(mockDh);

    setRangebreaksFromCalendar(formatter, calendar, layout, chartUtils);

    console.log(layout);
  });
});
