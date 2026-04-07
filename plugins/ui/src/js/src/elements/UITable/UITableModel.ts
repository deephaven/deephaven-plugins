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
  IrisGridTableModel,
  type IrisGridThemeType,
  isIrisGridTableModelTemplate,
  UIRow,
} from '@deephaven/iris-grid';
import { TableUtils } from '@deephaven/jsapi-utils';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { ensureArray } from '@deephaven/utils';
import type {
  ColorGradient,
  FormattingRule,
  HeatmapConfig,
} from './UITableUtils';
import JsTableProxy, { UITableLayoutHints } from './JsTableProxy';
import { resolveNamedScale } from './ColorScales';
import { interpolateColor, normalizeValue } from '../utils/HeatmapUtils';

/**
 * Create a UITableModel.
 * @param dh The JS API object
 * @param baseTable The base table to create the UI table model from.
 * @param layoutHints Layout hints for the table
 * @param format Format rules for the table
 * @param displayNameMap Column display name mappings
 * @returns Promise resolving to a new UITableModel
 */
export async function makeUiTableModel(
  dh: typeof DhType,
  baseTableProp: DhType.Table,
  layoutHints: UITableLayoutHints,
  format: FormattingRule[],
  displayNameMap: Record<string, string>
): Promise<UITableModel> {
  const baseTable = await baseTableProp.copy();
  const customColumns: string[] = [];
  format.forEach((rule, i) => {
    const { if_ } = rule;
    if (if_ != null) {
      customColumns.push(`${getFormatCustomColumnName(i)}=${if_}`);
    }
  });

  if (customColumns.length > 0) {
    await new TableUtils(dh).applyCustomColumns(baseTable, customColumns);
    format.forEach((rule, i) => {
      const { if_ } = rule;
      if (if_ != null) {
        const columnType = baseTable.findColumn(
          getFormatCustomColumnName(i)
        ).type;
        if (!TableUtils.isBooleanType(columnType)) {
          throw new Error(
            `ui.TableFormat if_ must be a boolean column. "${if_}" is a ${columnType} column`
          );
        }
      }
    });
  }

  const pendingJoins: Array<{
    lhs: string;
    source: string;
    agg: 'Min' | 'Max';
  }> = [];

  format.forEach(rule => {
    const { cols, mode } = rule;
    if (mode?.type !== 'dataBar' || cols == null) {
      return;
    }
    const columns: ColumnName[] = ensureArray(cols);
    columns.forEach(column => {
      const { value_column: valueColumn = column, min, max } = mode;

      try {
        baseTable.findColumn(column);
      } catch {
        throw new Error(`Can't find databar column ${column}`);
      }

      try {
        baseTable.findColumn(valueColumn);
      } catch {
        throw new Error(`Can't find databar value column ${valueColumn}`);
      }

      if (min == null) {
        pendingJoins.push({
          lhs: `${valueColumn}__DATABAR_Min`,
          source: valueColumn,
          agg: 'Min',
        });
      }
      if (max == null) {
        pendingJoins.push({
          lhs: `${valueColumn}__DATABAR_Max`,
          source: valueColumn,
          agg: 'Max',
        });
      }
    });
  });

  format.forEach(rule => {
    const { cols } = rule;
    if (cols == null) {
      return;
    }

    [rule.color, rule.background_color].forEach(config => {
      if (
        config == null ||
        typeof config === 'string' ||
        config.type !== 'heatmap'
      ) {
        return;
      }
      const { min, max } = config;
      const columns: ColumnName[] = ensureArray(cols);
      columns.forEach(column => {
        try {
          baseTable.findColumn(column);
        } catch {
          throw new Error(`Can't find heatmap column ${column}`);
        }

        if (typeof min === 'string') {
          try {
            baseTable.findColumn(min);
          } catch {
            throw new Error(
              `Can't find heatmap min column ${min} for column ${column}`
            );
          }
        }
        if (typeof max === 'string') {
          try {
            baseTable.findColumn(max);
          } catch {
            throw new Error(
              `Can't find heatmap max column ${max} for column ${column}`
            );
          }
        }

        let minSource: string | null = null;
        if (min == null) {
          minSource = column;
        } else if (typeof min === 'string') {
          minSource = min;
        }

        let maxSource: string | null = null;
        if (max == null) {
          maxSource = column;
        } else if (typeof max === 'string') {
          maxSource = max;
        }

        if (minSource != null) {
          pendingJoins.push({
            lhs: `${column}__HEATMAP_Min`,
            source: minSource,
            agg: 'Min',
          });
        }
        if (maxSource != null) {
          pendingJoins.push({
            lhs: `${column}__HEATMAP_Max`,
            source: maxSource,
            agg: 'Max',
          });
        }
      });
    });
  });

  const totalsOperationMap: Record<string, string[]> = {};
  pendingJoins.forEach(({ source, agg }) => {
    const existing = totalsOperationMap[source];
    if (existing == null) {
      totalsOperationMap[source] = [agg];
    } else if (!existing.includes(agg)) {
      existing.push(agg);
    }
  });

  const joinColumns = pendingJoins.map(({ lhs, source, agg }) => {
    const needsSuffix = (totalsOperationMap[source]?.length ?? 0) > 1;
    const rhs = needsSuffix ? `${source}__${agg}` : source;
    return `${lhs}=${rhs}`;
  });

  let table = baseTable;
  let totalsTable: DhType.TotalsTable | undefined;

  if (Object.keys(totalsOperationMap).length > 0) {
    totalsTable = await baseTable.getTotalsTable({
      operationMap: totalsOperationMap,
      defaultOperation: 'Skip',
      showGrandTotalsByDefault: false,
      showTotalsByDefault: false,
      groupBy: [],
    });
    table = await baseTable.naturalJoin(totalsTable, [], joinColumns);
  }

  const uiTableProxy = new JsTableProxy({
    table,
    layoutHints,
    onClose: () => {
      // Need to cleanup the base tables when the proxy is closed if we needed aggregations
      if (totalsTable != null) {
        baseTable.close();
        totalsTable.close();
      }
    },
  });

  const baseModel = await IrisGridModelFactory.makeModel(dh, uiTableProxy);

  return new UITableModel({
    dh,
    model: baseModel,
    format,
    displayNameMap,
  });
}

/**
 * Gets the name of the custom column that stores the where clause for a formatting rule
 * @param i The index of the formatting rule
 * @returns The name of the custom column that stores the where clause for the formatting rule
 */
function getFormatCustomColumnName(i: number): string {
  return `_${i}__FORMAT`;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UITableModel extends IrisGridTableModel {}

type NumericValue =
  | number
  | DhType.LongWrapper
  | DhType.BigIntegerWrapper
  | DhType.BigDecimalWrapper;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class UITableModel extends IrisGridModel {
  private model: IrisGridModel;

  /**
   * Map of theme color keys to hex color values
   */
  private colorMap: Map<string, string> = new Map();

  private displayNameMap: Record<string, string>;

  private format: FormattingRule[];

  constructor({
    dh,
    model,
    format,
    displayNameMap,
  }: {
    dh: typeof DhType;
    model: IrisGridModel;
    format: FormattingRule[];
    displayNameMap: Record<string, string>;
  }) {
    super(dh);

    this.model = model;
    this.displayNameMap = displayNameMap;

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
          return Reflect.set(target, prop, value);
        }

        return Reflect.set(target.model, prop, value);
      },
    });
  }

  override textForColumnHeader(
    column: ModelIndex,
    depth?: number
  ): string | undefined {
    const originalText = this.model.textForColumnHeader(column, depth);
    if (originalText == null) {
      return originalText;
    }

    if (originalText in this.displayNameMap) {
      return this.displayNameMap[originalText];
    }
    return originalText;
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

    const mode = this.getFormatOptionForCell(column, row, 'mode');
    if (mode?.type === 'dataBar') {
      return 'dataBar';
    }

    return this.model.renderTypeForCell(column, row);
  }

  private resolveFormatColor(
    column: ModelIndex,
    row: ModelIndex,
    value: string | HeatmapConfig
  ): string {
    if (typeof value !== 'string') {
      return this.resolveHeatmapColor(column, row, value);
    }
    return this.colorMap.get(value) ?? value;
  }

  /**
   * Helper to read a numeric value from a row.
   * This will unwrap the value if it's a numeric wrapper.
   * If the value is null, it will default to 0 as this indicates the value has not been fetched.
   * @param row The UIRow to get the value from
   * @param columnName The column name associated with the value
   * @returns Numeric value for the column
   */
  private getNumericValueFromRow(
    row: UIRow | null,
    columnName: ColumnName
  ): number {
    if (row == null) {
      return 0;
    }
    const valueColumnIndex = this.getColumnIndexByName(columnName);
    const rowDataKey = valueColumnIndex ?? columnName;
    const value = (row.data.get(rowDataKey)?.value ?? 0) as NumericValue;
    return typeof value === 'number' ? value : value.asNumber();
  }

  /**
   * Gets the value as a number for a databar column.
   * Validates that the column exists and is a numeric type.
   * If the value is null, it will default to 0 as this indicates the value has not been fetched.
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
    if (row != null && isIrisGridTableModelTemplate(this.model)) {
      let column;

      try {
        column = this.model.table.findColumn(columnName);
      } catch {
        throw new Error(`Can't find databar ${valueType} column ${columnName}`);
      }

      if (!TableUtils.isNumberType(column.type)) {
        throw new Error(
          `Can't use non-numeric column as databar ${valueType}: ${columnName} is of type ${column.type}`
        );
      }

      return this.getNumericValueFromRow(row, columnName);
    }
    return 0;
  }

  /**
   * Gets the value as a number for a heatmap column.
   * Validates that the column exists and is a numeric type.
   * If the value is null, it will default to 0 as this indicates the value has not been fetched.
   * @param row The UIRow to get the value from
   * @param columnName The column name associated with the value
   * @param valueType The type of value to get. This is used for error messages. E.g. 'minimum' or 'maximum'
   * @returns Numeric value for the heatmap column
   */
  getHeatmapValueFromRow(
    row: UIRow | null,
    columnName: ColumnName,
    valueType: string
  ): number {
    if (row != null && isIrisGridTableModelTemplate(this.model)) {
      let column;

      try {
        column = this.model.table.findColumn(columnName);
      } catch {
        throw new Error(`Can't find heatmap ${valueType} column ${columnName}`);
      }

      if (!TableUtils.isNumberType(column.type)) {
        throw new Error(
          `Can't use non-numeric column as heatmap ${valueType}: ${columnName} is of type ${column.type}`
        );
      }

      return this.getNumericValueFromRow(row, columnName);
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

    const config = this.getFormatOptionForCell(columnIndex, rowIndex, 'mode');
    if (config == null) {
      throw new Error(`No databar config for column ${columnName}`);
    }

    const {
      value_column: valueColumnName = columnName,
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

    const barColor = value >= 0 ? positiveColor : negativeColor;
    const hasGradient = Array.isArray(barColor) && barColor.length > 1;
    const formatTextColor = this.getFormatOptionForCell(
      columnIndex,
      rowIndex,
      'color'
    );

    let textColor: string;
    if (formatTextColor != null) {
      textColor = this.resolveFormatColor(
        columnIndex,
        rowIndex,
        formatTextColor
      );
    } else if (hasGradient) {
      textColor = value >= 0 ? barColor[barColor.length - 1] : barColor[0];
    } else {
      textColor = Array.isArray(barColor) ? barColor[0] : barColor;
    }

    return {
      columnMin: minRowValue,
      columnMax: maxRowValue,
      axis,
      color: barColor,
      // @ts-expect-error TODO: bump web version
      textColor,
      valuePlacement,
      opacity,
      markers,
      direction,
      value,
    };
  }

  formatColumnMatch = memoizeClear(
    (columns: string[], column: string): boolean =>
      columns.some(c => c === column),
    { primitive: true, max: 10000 }
  );

  /**
   * Gets the first matching format option for a cell.
   * Checks if there is a column match and if there is a where clause match if needed.
   * If there is no value for the key that matches in any rule, returns undefined.
   * Stops on first match.
   *
   * @param column The model column index
   * @param row The model row index
   * @param formatKey The key to get the format option for
   * @returns The format option if set or undefined
   */
  getFormatOptionForCell<K extends keyof FormattingRule>(
    column: ModelIndex,
    row: ModelIndex,
    formatKey: K
  ): FormattingRule[K] | undefined {
    if (!isIrisGridTableModelTemplate(this.model)) {
      return undefined;
    }
    const columnName = this.columns[column].name;

    // Iterate in reverse so that the last rule that matches is used
    for (let i = this.format.length - 1; i >= 0; i -= 1) {
      const rule = this.format[i];
      const { cols, if_, [formatKey]: formatValue } = rule;
      if (formatValue == null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let resolvedFormatValue = formatValue;
      const columnSourceIndex =
        typeof formatValue === 'string'
          ? this.getColumnIndexByName(formatValue)
          : null;
      if (columnSourceIndex != null) {
        const columnSource = this.columns[columnSourceIndex];
        if (!TableUtils.isStringType(columnSource.type)) {
          throw new Error(
            `Column ${columnSource.name} which provides TableFormat values for ${formatKey} is of type ${columnSource.type}. Columns that provide TableFormat values must be of type string.`
          );
        }
        resolvedFormatValue = this.valueForCell(
          columnSourceIndex,
          row
        ) as NonNullable<FormattingRule[K]>;
      }

      if (
        cols == null ||
        this.formatColumnMatch(ensureArray(cols), columnName)
      ) {
        if (if_ == null) {
          return resolvedFormatValue;
        }
        const rowValues = this.model.row(row)?.data;
        if (rowValues == null) {
          return undefined;
        }
        const whereValue = rowValues.get(getFormatCustomColumnName(i))?.value;
        if (whereValue === true) {
          return resolvedFormatValue;
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

  /**
   * Resolve a heatmap config to an interpolated color for a given cell.
   *
   * @param column The model column index
   * @param row The model row index
   * @param config The HeatmapConfig object
   * @returns Hex color string
   */
  resolveHeatmapColor(
    column: ModelIndex,
    row: ModelIndex,
    config: HeatmapConfig
  ): string {
    if (!isIrisGridTableModelTemplate(this.model)) {
      throw new Error('Cannot use heatmaps on this table type');
    }

    const columnName = this.columns[column].name;
    const rowData = this.model.row(row);
    const cellValue = this.getHeatmapValueFromRow(rowData, columnName, 'value');

    const {
      min: configMin,
      max: configMax,
      mid: configMid,
      colors: configColors,
    } = config;

    // When min/max is a number, use it directly.
    // When null or a string column name, the aggregation block has already
    // computed the global value into the hidden __HEATMAP_Min/__HEATMAP_Max
    // columns via TotalsTable + naturalJoin.
    const minValue =
      typeof configMin === 'number'
        ? configMin
        : this.getHeatmapValueFromRow(
            rowData,
            `${columnName}__HEATMAP_Min`,
            'minimum'
          );

    const maxValue =
      typeof configMax === 'number'
        ? configMax
        : this.getHeatmapValueFromRow(
            rowData,
            `${columnName}__HEATMAP_Max`,
            'maximum'
          );

    const colors =
      configColors ?? (configMid != null ? 'diverging' : 'sequential');
    let hexColors: string[];
    let positions: number[] | undefined;

    if (typeof colors === 'string') {
      hexColors = resolveNamedScale(colors).colors.map(
        c => this.colorMap.get(c) ?? c
      );
    } else if (colors.length > 0 && Array.isArray(colors[0])) {
      const tuples = colors as [number, string][];
      hexColors = tuples.map(([, c]) => this.colorMap.get(c) ?? c);
      positions = tuples.map(([p]) => p);
    } else {
      hexColors = (colors as string[]).map(c => this.colorMap.get(c) ?? c);
    }

    return interpolateColor(
      hexColors,
      normalizeValue(cellValue, minValue, maxValue, configMid),
      positions
    );
  }

  override colorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: IrisGridThemeType
  ): GridColor {
    const color = this.getFormatOptionForCell(column, row, 'color');

    // If a color is explicitly set, use it
    if (color != null) {
      return this.resolveFormatColor(column, row, color);
    }

    // If there is a background color, use white or black depending on the background color
    const backgroundColor = this.getFormatOptionForCell(
      column,
      row,
      'background_color'
    );

    if (backgroundColor != null) {
      const resolvedBg = this.resolveFormatColor(column, row, backgroundColor);
      const isDarkBackground = GridRenderer.getCachedColorIsDark(resolvedBg);
      return isDarkBackground ? theme.white : theme.black;
    }

    return this.model.colorForCell(column, row, theme);
  }

  override textAlignForCell(
    column: ModelIndex,
    row: ModelIndex
  ): CanvasTextAlign {
    // Check if the base model has a custom alignment. If so, don't override with UI table formatting.
    // Text alignment priority hierarchy (from highest to lowest):
    // 1. Alignment from context menu
    // 2. UI table formatting
    // 3. Data type based alignment
    const columnName = this.columns[column].name;
    const contextMenuAlignment = this.model.columnAlignmentMap.get(columnName);

    return (
      contextMenuAlignment ??
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
      return this.resolveFormatColor(column, row, backgroundColor);
    }
    return this.model.backgroundColorForCell(column, row, theme);
  }
}

export default UITableModel;
