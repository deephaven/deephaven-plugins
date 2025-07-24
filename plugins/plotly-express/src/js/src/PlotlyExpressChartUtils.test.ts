import { ChartUtils } from '@deephaven/chart';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { Delta } from 'plotly.js';
import { TestUtils } from '@deephaven/test-utils';
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
  isSingleValue,
  transformValueFormat,
  replaceValueFormat,
  FORMAT_PREFIX,
  getDataTypeMap,
  PlotlyChartDeephavenData,
  setDefaultValueFormat,
  convertToPlotlyNumberFormat,
  setRangebreaksFromCalendar,
} from './PlotlyExpressChartUtils';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const mockDh = {
  calendar: {
    DayOfWeek: {
      values: () => [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ],
    },
  },
  i18n: {
    TimeZone: {
      getTimeZone: () => ({ id: 'America/New_York', standardOffset: 300 }),
    },
  },
} satisfies DeepPartial<typeof DhType> as unknown as typeof DhType;

const findColumn = jest.fn().mockImplementation(columnName => {
  let type = 'int';
  if (columnName === 'y') {
    type = 'double';
  }
  return { type };
});

const MOCK_TABLE = TestUtils.createMockProxy<DhType.Table>({
  columns: [{ name: 'x' }, { name: 'y' }] as DhType.Column[],
  size: 500,
  subscribe: () => TestUtils.createMockProxy(),
  findColumn,
});

const getColumnTypeFormatter = jest.fn().mockImplementation(columnType => {
  if (columnType === 'int') {
    return {
      defaultFormatString: '$#,##0USD',
    };
  }
  return {
    defaultFormatString: '$#,##0.00USD',
  };
});

const FORMATTER = {
  getColumnTypeFormatter,
} as unknown as Formatter;

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
          type: 'scatter3d',
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
      holidays: [{ date: '2024-01-01', businessPeriods: [] }],
      businessPeriods: [{ open: '08:00', close: '17:00' }],
    } as unknown as DhType.calendar.BusinessCalendar;

    const layout = {
      xaxis: {},
      yaxis: {},
    };

    const chartUtils = new ChartUtils(mockDh);

    const formatter = new Formatter(mockDh);

    const updatedLayout = {
      ...layout,
      ...setRangebreaksFromCalendar(formatter, calendar, layout, chartUtils),
    };

    expect(updatedLayout).toEqual({
      xaxis: {
        rangebreaks: [
          { values: ['2024-01-01 00:00:00.000000'] },
          { pattern: 'hour', bounds: [17, 8] },
          { bounds: [6, 1], pattern: 'day of week' },
        ],
      },
      yaxis: {
        rangebreaks: [
          { values: ['2024-01-01 00:00:00.000000'] },
          { pattern: 'hour', bounds: [17, 8] },
          { bounds: [6, 1], pattern: 'day of week' },
        ],
      },
    });
  });
});

describe('isSingleValue', () => {
  it('should return true is the data contains an indicator trace', () => {
    expect(
      isSingleValue([{ type: 'indicator' }], ['0', 'delta', 'reference'])
    ).toBe(true);
  });

  it('should return false if the data does not contain an indicator trace', () => {
    expect(isSingleValue([{ type: 'scatter' }], ['0', 'x'])).toBe(false);
  });
});

describe('setDefaultValueFormat', () => {
  it('should only set the valueformat to double if at least one type is double and there is no valueformat', () => {
    const plotlyData = [
      {
        type: 'indicator',
        number: [],
        value: {},
        delta: {
          reference: {},
          prefix: 'prefix',
          suffix: 'suffix',
        },
      },
      {
        type: 'indicator',
        number: [],
        value: {
          valueformat: 'valueformat',
        },
        delta: {
          reference: {},
          valueformat: 'valueformat',
          prefix: 'prefix',
          suffix: 'suffix',
        },
      },
    ] as unknown as Plotly.Data[];
    const defaultValueFormatSet = new Set([
      {
        index: 0,
        path: 'number',
        typeFrom: ['value', 'delta/reference'],
        options: {
          format: true,
          prefix: true,
          suffix: true,
        },
      },
      {
        index: 0,
        path: 'delta',
        typeFrom: ['value', 'delta/reference'],
        options: {
          format: true,
          prefix: false,
          suffix: false,
        },
      },
    ]);
    const dataTypeMap = new Map([
      ['/plotly/data/0/value', 'int'],
      ['/plotly/data/0/delta/reference', 'double'],
    ]);

    setDefaultValueFormat(
      plotlyData,
      defaultValueFormatSet,
      dataTypeMap,
      FORMATTER
    );

    const expectedData = [
      {
        type: 'indicator',
        number: [],
        value: {},
        delta: { reference: {}, prefix: 'prefix', suffix: 'suffix' },
      },
      {
        type: 'indicator',
        number: [],
        value: { valueformat: 'valueformat' },
        delta: {
          reference: {},
          valueformat: 'valueformat',
          prefix: 'prefix',
          suffix: 'suffix',
        },
      },
    ];

    expect(plotlyData).toEqual(expectedData);
  });
  it('should set the value format to the int if all are int', () => {
    const plotlyData = [
      {
        type: 'indicator',
        number: [],
        value: {},
        delta: {
          reference: {},
          prefix: 'prefix',
          suffix: 'suffix',
        },
      },
    ] as unknown as Plotly.Data[];
    const defaultValueFormatSet = new Set([
      {
        index: 0,
        path: 'number',
        typeFrom: ['value', 'delta/reference'],
        options: {
          format: true,
          prefix: false,
          suffix: false,
        },
      },
      {
        index: 0,
        path: 'delta',
        typeFrom: ['value', 'delta/reference'],
        options: {
          format: true,
          prefix: true,
          suffix: true,
        },
      },
    ]);
    const dataTypeMap = new Map([
      ['/plotly/data/0/value', 'int'],
      ['/plotly/data/0/delta/reference', 'int'],
    ]);

    setDefaultValueFormat(
      plotlyData,
      defaultValueFormatSet,
      dataTypeMap,
      FORMATTER
    );

    const expectedData = [
      {
        type: 'indicator',
        number: [],
        value: {},
        delta: { reference: {}, prefix: 'prefix', suffix: 'suffix' },
      },
    ];

    expect(plotlyData).toEqual(expectedData);
  });
});

describe('convertToPlotlyNumberFormat', () => {
  it('should convert the format to a Plotly number format', () => {
    const data = {};
    const valueformat = '$##,##0.00USD';
    const options = {
      format: true,
      prefix: true,
      suffix: true,
    };

    convertToPlotlyNumberFormat(data, valueformat, options);

    expect(data).toEqual({
      valueformat: '01,.2f',
      prefix: '$',
      suffix: 'USD',
    });
  });

  it('should not add the prefix and suffix if the are false', () => {
    const data = {};
    const valueformat = '##,##0.00USD';
    const options = {
      format: true,
      prefix: false,
      suffix: false,
    };

    convertToPlotlyNumberFormat(data, valueformat, options);

    expect(data).toEqual({
      valueformat: '01,.2f',
    });
  });

  it('should not add the format if it is false', () => {
    const data = {};
    const valueformat = '##,##0.00USD';
    const options = {
      format: false,
      prefix: true,
      suffix: true,
    };

    convertToPlotlyNumberFormat(data, valueformat, options);

    expect(data).toEqual({
      prefix: '',
      suffix: 'USD',
    });
  });
});

describe('transformValueFormat', () => {
  it('should not transform the value if it does not contain FORMAT_PREFIX', () => {
    const data = {
      valueformat: '.2f',
    };

    const numberFormatOptions = transformValueFormat(data);
    expect(data.valueformat).toBe('.2f');
    expect(numberFormatOptions).toEqual({
      format: false,
    });
  });

  it('should transform the value if it contains FORMAT_PREFIX', () => {
    const data = {
      valueformat: `${FORMAT_PREFIX}#,##0.00`,
    };

    const numberFormatOptions = transformValueFormat(data);

    expect(data.valueformat).toBe('01,.2f');
    expect(numberFormatOptions).toEqual({
      format: false,
    });
  });

  it('should not replace the prefix and suffix if they are already there', () => {
    const data = {
      valueformat: `${FORMAT_PREFIX}$#,##0.00USD`,
      prefix: 'prefix',
      suffix: 'suffix',
    };

    const numberFormatOptions = transformValueFormat(data);

    expect(data.valueformat).toBe('01,.2f');
    expect(data.prefix).toBe('prefix');
    expect(data.suffix).toBe('suffix');
    expect(numberFormatOptions).toEqual({
      format: false,
    });
  });

  it('should replace the prefix and suffix if they are null', () => {
    const data = {
      valueformat: `${FORMAT_PREFIX}$#,##0.00USD`,
      prefix: null,
      suffix: null,
    };

    const numberFormatOptions = transformValueFormat(data);

    expect(data.valueformat).toBe('01,.2f');
    expect(data.prefix).toBe('$');
    expect(data.suffix).toBe('USD');
    expect(numberFormatOptions).toEqual({
      format: false,
    });
  });

  it('should return true for all format options if the format is not defined', () => {
    const data = {} as Partial<Delta>;

    const numberFormatOptions = transformValueFormat(data);

    expect(data.valueformat).toBe(undefined);
    expect(numberFormatOptions).toEqual({
      format: true,
      prefix: true,
      suffix: true,
    });
  });

  it('should return true for the format but false for the prefix and suffix if they are defined', () => {
    const data = {
      prefix: 'prefix',
      suffix: 'suffix',
    } as Partial<Delta>;

    const numberFormatOptions = transformValueFormat(data);

    expect(data.valueformat).toBe(undefined);
    expect(numberFormatOptions).toEqual({
      format: true,
      prefix: false,
      suffix: false,
    });
  });
});

describe('replaceValueFormat', () => {
  it('should replace formatting for indicator traces', () => {
    const data = [
      {
        type: 'indicator',
        delta: {
          valueformat: `${FORMAT_PREFIX}#,##0.00`,
        },
        number: {
          valueformat: `${FORMAT_PREFIX}#,##0.00`,
        },
      },
    ] as Plotly.Data[];

    const expectedData = [
      {
        type: 'indicator',
        delta: {
          valueformat: '01,.2f',
          prefix: '',
          suffix: '',
        },
        number: {
          valueformat: '01,.2f',
          prefix: '',
          suffix: '',
        },
      },
    ];

    replaceValueFormat(data);

    expect(data).toEqual(expectedData);
  });
  it('should add delta and number for traces that do not have valueformat set', () => {
    const data = [
      {
        type: 'indicator',
      },
    ] as Plotly.Data[];

    const expectedData = [
      {
        type: 'indicator',
        delta: {},
        number: {},
      },
    ];

    replaceValueFormat(data);

    expect(data).toEqual(expectedData);
  });

  describe('getDataTypeMap', () => {
    it('should return the data type map', () => {
      const deephavenData = {
        mappings: [
          {
            table: 0,
            data_columns: {
              x: ['/plotly/data/0/x'],
              y: ['/plotly/data/0/y'],
            },
          },
        ],
        is_user_set_color: false,
        is_user_set_template: false,
      } satisfies PlotlyChartDeephavenData;

      const mockTableData = new Map([[0, MOCK_TABLE]]);

      const dataTypeMap = getDataTypeMap(deephavenData, mockTableData);

      const expectedMap = new Map([
        ['0/x', 'int'],
        ['0/y', 'double'],
      ]);

      expect(dataTypeMap).toEqual(expectedMap);
    });
  });
});
