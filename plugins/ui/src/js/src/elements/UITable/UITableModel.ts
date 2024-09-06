import {
  GridThemeType,
  DataBarOptions,
  CellRenderType,
  ModelIndex,
} from '@deephaven/grid';
import {
  ColumnName,
  IrisGridModel,
  IrisGridModelFactory,
  isIrisGridTableModelTemplate,
  UIRow,
} from '@deephaven/iris-grid';
import { TableUtils } from '@deephaven/jsapi-utils';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { ColorGradient, DatabarConfig } from './UITableUtils';
import JsTableProxy, { UITableLayoutHints } from './JsTableProxy';

export async function makeUiTableModel(
  dh: typeof DhType,
  table: DhType.Table,
  databars: DatabarConfig[],
  layoutHints: UITableLayoutHints
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

  private databarColorMap: Map<string, string> = new Map();

  constructor({
    dh,
    model,
    table,
    databars,
  }: {
    dh: typeof DhType;
    model: IrisGridModel;
    table: DhType.Table;
    databars: DatabarConfig[];
  }) {
    super(dh);

    this.model = model;
    this.table = table;

    this.databars = new Map<ColumnName, DatabarConfig>();
    databars.forEach(databar => {
      this.databars.set(databar.column, databar);
    });

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

  setDatabarColorMap(colorMap: Map<string, string>): void {
    this.databarColorMap = colorMap;
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
        color: this.databarColorMap.get(markerColor) ?? markerColor,
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
        color => this.databarColorMap.get(color) ?? color
      );
    } else {
      positiveColor = this.databarColorMap.get(positiveColor) ?? positiveColor;
    }

    if (Array.isArray(negativeColor)) {
      negativeColor = negativeColor.map(
        color => this.databarColorMap.get(color) ?? color
      );
    } else {
      negativeColor = this.databarColorMap.get(negativeColor) ?? negativeColor;
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
}

export default UITableModel;
