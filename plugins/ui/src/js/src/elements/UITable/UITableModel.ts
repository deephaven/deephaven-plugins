import {
  GridThemeType,
  DataBarOptions,
  CellRenderType,
  ModelIndex,
  GridColor,
  NullableGridColor,
  memoizeClear,
  GridRenderer,
} from '@deephaven/grid';
import {
  ColumnName,
  IrisGridModel,
  IrisGridModelFactory,
  type IrisGridThemeType,
  isIrisGridTableModelTemplate,
  UIRow,
} from '@deephaven/iris-grid';
import { ensureArray } from '@deephaven/utils';
import { TableUtils } from '@deephaven/jsapi-utils';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { ColorGradient, DatabarConfig, FormattingRule } from './UITableUtils';
import JsTableProxy, { UITableLayoutHints } from './JsTableProxy';

export async function makeUiTableModel(
  dh: typeof DhType,
  table: DhType.Table,
  databars: DatabarConfig[],
  layoutHints: UITableLayoutHints,
  format: FormattingRule[]
): Promise<UITableModel> {
  const joinColumns: string[] = [];
  const totalsOperationMap: Record<string, string[]> = {};
  databars.forEach(config => {
    const { column, value_column: valueColumn = column, min, max } = config;

    try {
      table.findColumn(column);
    } catch {
      throw new Error(`Can't find databar column ${column}`);
    }

    try {
      table.findColumn(valueColumn);
    } catch {
      throw new Error(`Can't find databar value column ${valueColumn}`);
    }

    if (min == null && max == null) {
      totalsOperationMap[valueColumn] = ['Min', 'Max'];
      joinColumns.push(
        `${valueColumn}__DATABAR_Min=${valueColumn}__Min`,
        `${valueColumn}__DATABAR_Max=${valueColumn}__Max`
      );
    } else if (min == null) {
      totalsOperationMap[valueColumn] = ['Min'];
      joinColumns.push(`${valueColumn}__DATABAR_Min=${valueColumn}`);
    } else if (max == null) {
      totalsOperationMap[valueColumn] = ['Max'];
      joinColumns.push(`${valueColumn}__DATABAR_Max=${valueColumn}`);
    }
  });

  let baseTable = table;

  const customColumns: string[] = [];
  format.forEach((rule, i) => {
    const { where } = rule;
    if (where != null) {
      customColumns.push(`_${i}__FORMAT=${where}`);
    }
  });

  baseTable.applyCustomColumns(customColumns);

  if (joinColumns.length > 0) {
    const totalsTable = await table.getTotalsTable({
      operationMap: totalsOperationMap,
      defaultOperation: 'Skip',
      showGrandTotalsByDefault: false,
      showTotalsByDefault: false,
      groupBy: [],
    });

    baseTable = await table.naturalJoin(totalsTable, [], joinColumns);
  }

  const uiTableProxy = new JsTableProxy({
    table: baseTable,
    layoutHints,
  });

  const baseModel = await IrisGridModelFactory.makeModel(dh, uiTableProxy);

  return new UITableModel({
    dh,
    model: baseModel,
    table: uiTableProxy,
    databars,
    format,
  });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UITableModel extends IrisGridModel {}

type NumericValue =
  | number
  | DhType.LongWrapper
  | DhType.BigIntegerWrapper
  | DhType.BigDecimalWrapper;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class UITableModel extends IrisGridModel {
  table: DhType.Table;

  private model: IrisGridModel;

  private databars: Map<ColumnName, DatabarConfig>;

  private colorMap: Map<string, string> = new Map();

  private format: FormattingRule[];

  constructor({
    dh,
    model,
    table,
    databars,
    format,
  }: {
    dh: typeof DhType;
    model: IrisGridModel;
    table: DhType.Table;
    databars: DatabarConfig[];
    format: FormattingRule[];
  }) {
    super(dh);

    this.model = model;
    this.table = table;

    this.databars = new Map<ColumnName, DatabarConfig>();
    databars.forEach(databar => {
      this.databars.set(databar.column, databar);
    });

    this.format = format;

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      // We want to use any properties on the proxy model if defined
      // If not, then proxy to the underlying model
      get(target, prop, receiver) {
        // Does this class have a getter for the prop
        // Getter functions are on the prototype
        const proxyHasGetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.get != null;

        if (proxyHasGetter) {
          return Reflect.get(target, prop, receiver);
        }

        // Does this class implement the property
        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        // Does the class implement a function for the property
        const proxyHasFn = Object.prototype.hasOwnProperty.call(
          Object.getPrototypeOf(target),
          prop
        );

        const trueTarget = proxyHasProp || proxyHasFn ? target : target.model;
        return Reflect.get(trueTarget, prop);
      },
      set(target, prop, value) {
        const proxyHasSetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.set != null;

        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        if (proxyHasSetter || proxyHasProp) {
          return Reflect.set(target, prop, value, target);
        }

        return Reflect.set(target.model, prop, value, target.model);
      },
    });
  }

  setColorMap(colorMap: Map<string, string>): void {
    this.colorMap = colorMap;
  }

  // eslint-disable-next-line class-methods-use-this
  override renderTypeForCell(
    column: ModelIndex,
    row: ModelIndex
  ): CellRenderType {
    if (
      !isIrisGridTableModelTemplate(this.model) ||
      this.model.isTotalsRow(row)
    ) {
      return this.model.renderTypeForCell(column, row);
    }
    const columnName = this.columns[column].name;
    return this.databars.has(columnName)
      ? 'dataBar'
      : this.model.renderTypeForCell(column, row);
  }

  /**
   * Gets the value as a number for a databar column.
   * This will unwrap the value if it's a numeric wrapper.
   * If the value is null, it will default to 0 as this indiates the value has not been fetched.
   * @param row The UIRow to get the value from
   * @param columnName The column name associated with the value
   * @param valueType The type of value to get. This is used for error messages. E.g. 'minimum' or 'maximum'
   * @returns Numeric value for the databar column
   */
  getDatabarValueFromRow(
    row: UIRow | null,
    columnName: ColumnName,
    valueType: string
  ): number {
    if (row != null) {
      let column;

      try {
        column = this.table.findColumn(columnName);
      } catch {
        throw new Error(`Can't find databar ${valueType} column ${columnName}`);
      }

      if (!TableUtils.isNumberType(column.type)) {
        throw new Error(
          `Can't use non-numeric column as databar ${valueType}: ${columnName} is of type ${column.type}`
        );
      }

      const valueColumnIndex = this.getColumnIndexByName(columnName);
      const rowDataKey = valueColumnIndex ?? columnName;

      const value = (row.data.get(rowDataKey)?.value ?? 0) as NumericValue;
      return typeof value === 'number' ? value : value.asNumber();
    }
    return 0;
  }

  override dataBarOptionsForCell(
    columnIndex: number,
    rowIndex: number,
    theme: GridThemeType
  ): DataBarOptions {
    if (!isIrisGridTableModelTemplate(this.model)) {
      throw new Error('Cannot use databars on this table type');
    }

    const columnName = this.columns[columnIndex].name;

    const config = this.databars.get(columnName);
    if (config == null) {
      throw new Error(`No databar config for column ${columnName}`);
    }

    const {
      column,
      value_column: valueColumnName = column,
      min = `${valueColumnName}__DATABAR_Min`,
      max = `${valueColumnName}__DATABAR_Max`,
      axis = 'proportional',
      color: userColor,
      value_placement: valuePlacement = 'beside',
      opacity = valuePlacement === 'overlap' ? 0.35 : 1,
      markers: markersProp = [],
      direction = 'LTR',
    } = config;

    const valueColumnIndex = this.getColumnIndexByName(valueColumnName);

    if (valueColumnIndex == null) {
      throw new Error(`Can't find column ${valueColumnName}`);
    }

    const row = this.model.row(rowIndex);

    const value = this.getDatabarValueFromRow(row, valueColumnName, 'value');

    const minRowValue =
      typeof min === 'string'
        ? this.getDatabarValueFromRow(row, min, 'minimum')
        : min;

    const maxRowValue =
      typeof max === 'string'
        ? this.getDatabarValueFromRow(row, max, 'maximum')
        : max;

    const markers = markersProp.map(marker => {
      const { value: markerValue, color: markerColor = theme.markerBarColor } =
        marker;
      return {
        value:
          typeof markerValue === 'string'
            ? this.getDatabarValueFromRow(row, markerValue, 'marker')
            : markerValue,
        color: this.colorMap.get(markerColor) ?? markerColor,
      };
    });

    let positiveColor: string | ColorGradient = theme.positiveBarColor;
    let negativeColor: string | ColorGradient = theme.negativeBarColor;

    if (userColor != null) {
      if (typeof userColor === 'string' || Array.isArray(userColor)) {
        positiveColor = userColor;
        negativeColor = userColor;
      } else {
        positiveColor = userColor.positive ?? positiveColor;
        negativeColor = userColor.negative ?? negativeColor;
      }
    }

    if (Array.isArray(positiveColor)) {
      positiveColor = positiveColor.map(
        color => this.colorMap.get(color) ?? color
      );
    } else {
      positiveColor = this.colorMap.get(positiveColor) ?? positiveColor;
    }

    if (Array.isArray(negativeColor)) {
      negativeColor = negativeColor.map(
        color => this.colorMap.get(color) ?? color
      );
    } else {
      negativeColor = this.colorMap.get(negativeColor) ?? negativeColor;
    }

    return {
      columnMin: minRowValue,
      columnMax: maxRowValue,
      axis,
      color: value >= 0 ? positiveColor : negativeColor,
      valuePlacement,
      opacity,
      markers,
      direction,
      value,
    };
  }

  /**
   * Escape a string and convert it to a case-insensitive regex.
   * Memoizes the regex compilation for performance.
   * @param pattern The regex pattern
   * @returns The regex
   */
  asRegex = memoizeClear(
    (pattern: string): RegExp => new RegExp(pattern, 'i'),
    {
      max: 10000,
    }
  );

  formatColumnMatch = memoizeClear(
    (columns: string[], column: string): boolean =>
      columns.some(c => {
        if (c.startsWith('/') && c.endsWith('/')) {
          const regex = this.asRegex(c.slice(1, -1));
          return regex.test(column);
        }

        // Replace wildcard with regex to match 1+ characters
        // Pad with ^ and $ to match the whole string
        return this.asRegex(`^${c.replace('*', '.+')}$`).test(column);
      }),
    { primitive: true, max: 10000 }
  );

  getFormatOptionForCell<K extends keyof FormattingRule>(
    column: ModelIndex,
    row: ModelIndex,
    formatKey: K
  ): FormattingRule[K] | undefined {
    if (!isIrisGridTableModelTemplate(this.model)) {
      return undefined;
    }
    const columnName = this.columns[column].name;
    for (let i = 0; i < this.format.length; i += 1) {
      const rule = this.format[i];
      const { cols, where, [formatKey]: formatValue } = rule;
      if (formatValue == null) {
        // eslint-disable-next-line no-continue
        continue;
      }
      if (
        cols == null ||
        this.formatColumnMatch(ensureArray(cols), columnName)
      ) {
        if (where == null) {
          return formatValue;
        }
        const rowValues = this.model.row(row)?.data;
        if (rowValues == null) {
          return undefined;
        }
        const whereValue = rowValues.get(`_${i}__FORMAT`)?.value;
        if (whereValue === true) {
          return formatValue;
        }
      }
    }
    return undefined;
  }

  getCachedFormatForCell = memoizeClear(
    (
      format: DhType.Format | undefined,
      formatString: string | null | undefined
    ): DhType.Format | undefined => ({
      ...format,
      formatString,
    }),
    { max: 10000 }
  );

  override formatForCell(
    column: ModelIndex,
    row: ModelIndex
  ): DhType.Format | undefined {
    const format = this.model.formatForCell(column, row);
    return this.getCachedFormatForCell(
      format,
      this.getFormatOptionForCell(column, row, 'value') ?? format?.formatString
    );
  }

  override colorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: IrisGridThemeType
  ): GridColor {
    const color = this.getFormatOptionForCell(column, row, 'color');
    const { colorMap } = this;
    if (color != null) {
      return colorMap.get(color) ?? color;
    }

    const backgroundColor = this.getFormatOptionForCell(
      column,
      row,
      'background_color'
    );

    if (backgroundColor != null) {
      const isDarkBackground = GridRenderer.getCachedColorIsDark(
        colorMap.get(backgroundColor) ?? backgroundColor
      );
      return isDarkBackground ? theme.white : theme.black;
    }

    return this.model.colorForCell(column, row, theme);
  }

  override textAlignForCell(
    column: ModelIndex,
    row: ModelIndex
  ): CanvasTextAlign {
    return (
      this.getFormatOptionForCell(column, row, 'alignment') ??
      this.model.textAlignForCell(column, row)
    );
  }

  override backgroundColorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: IrisGridThemeType
  ): NullableGridColor {
    const backgroundColor = this.getFormatOptionForCell(
      column,
      row,
      'background_color'
    );
    if (backgroundColor != null) {
      return this.colorMap.get(backgroundColor) ?? backgroundColor;
    }
    return this.model.backgroundColorForCell(column, row, theme);
  }
}

export default UITableModel;
