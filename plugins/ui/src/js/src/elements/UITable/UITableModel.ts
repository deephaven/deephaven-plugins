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
} from '@deephaven/iris-grid';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { ColorGradient, DatabarConfig } from './UITableUtils';
import JsTableProxy, { UITableLayoutHints } from './JsTableProxy';
import { TableUtils } from '@deephaven/jsapi-utils';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UITableModel extends IrisGridModel {}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class UITableModel extends IrisGridModel {
  private model: IrisGridModel;

  private table: DhType.Table;

  private databars: Map<ColumnName, DatabarConfig>;

  private uiLayoutHints: UITableLayoutHints;

  constructor(
    dh: typeof DhType,
    model: IrisGridModel,
    table: DhType.Table,
    databars: DatabarConfig[],
    layoutHints: UITableLayoutHints
  ) {
    super(dh);

    this.model = model;
    this.table = table;
    this.uiLayoutHints = layoutHints;

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

  async init(): Promise<void> {
    if (this.databars.size === 0) {
      return;
    }

    const joinColumns: string[] = [];
    const totalsOperationMap: Record<string, string[]> = {};
    this.databars.forEach(config => {
      const { column, value_column: valueColumn = column, min, max } = config;

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

    if (
      joinColumns.length === 0 ||
      Object.keys(totalsOperationMap).length === 0
    ) {
      return;
    }

    const totalsTable = await this.table.getTotalsTable({
      operationMap: totalsOperationMap,
      defaultOperation: 'Skip',
      showGrandTotalsByDefault: false,
      showTotalsByDefault: false,
      groupBy: [],
    });

    const resultTable = await this.table.naturalJoin(
      totalsTable,
      [],
      joinColumns
    );

    const uiTableProxy = new JsTableProxy({
      table: resultTable,
      layoutHints: this.uiLayoutHints,
    });

    this.model = await IrisGridModelFactory.makeModel(this.dh, uiTableProxy);
    this.table = uiTableProxy;
  }

  // get model(): IrisGridModel {
  //   return this._model;
  // }

  // set model(model: IrisGridModel) {
  //   this._model = model;
  // }

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
      value_placement: valuePlacement = 'overlap',
      opacity = valuePlacement === 'overlap' ? 0.35 : 1,
      markers = [],
      direction = 'LTR',
    } = config;

    const valueColumnIndex = this.getColumnIndexByName(valueColumnName);

    if (valueColumnIndex == null) {
      throw new Error(`Can't find column ${valueColumnName}`);
    }

    const valueColumn = this.columns[valueColumnIndex];

    if (!TableUtils.isNumberType(valueColumn.type)) {
      throw new Error(
        `Can't use non-numeric column as a databar value: ${valueColumnName} is of type ${valueColumn.type}`
      );
    }

    let value = this.valueForCell(valueColumnIndex, rowIndex) ?? 0; // Default the value to 0 if it's null so we don't draw a bar
    if (typeof value !== 'number') {
      value = value.asNumber();
    }

    let positiveColor: string | ColorGradient = theme.positiveBarColor;
    let negativeColor: string | ColorGradient = theme.negativeBarColor;

    if (userColor != null) {
      if (typeof userColor === 'string' || Array.isArray(userColor)) {
        positiveColor = userColor;
        negativeColor = userColor;
      } else {
        positiveColor = userColor.positive;
        negativeColor = userColor.negative;
      }
    }

    let minRowValue = 0;

    if (!isIrisGridTableModelTemplate(this.model)) {
      throw new Error('Cannot use databars on this table type');
    }

    if (typeof min === 'string') {
      const row = this.model.row(rowIndex);
      if (row != null) {
        const minColumn = this.table.findColumn(min);
        if (minColumn == null) {
          throw new Error(`Can't find minimum value column ${min}`);
        }

        const minValue = (row.data.get(minColumn.name)?.value ?? 0) as
          | number
          | DhType.LongWrapper;

        if (typeof minValue !== 'number') {
          minRowValue = minValue.asNumber();
        } else {
          minRowValue = minValue;
        }
      }
    } else {
      minRowValue = min;
    }

    let maxRowValue = 0;

    if (typeof max === 'string') {
      const row = this.model.row(rowIndex);
      if (row != null) {
        const maxColumn = this.table.findColumn(max);
        if (maxColumn == null) {
          throw new Error(`Can't find maximum value column ${max}`);
        }

        if (!TableUtils.isNumberType(maxColumn.type)) {
          throw new Error(`Column ${maxColumn.name} must be numeric`);
        }

        const maxValue = (row.data.get(maxColumn.name)?.value ?? 0) as
          | number
          | DhType.LongWrapper
          | DhType.BigIntegerWrapper
          | DhType.BigDecimalWrapper;

        if (typeof maxValue !== 'number') {
          maxRowValue = maxValue.asNumber();
        } else {
          maxRowValue = maxValue;
        }
      }
    } else {
      maxRowValue = max;
    }

    // console.log(positiveColor);

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
