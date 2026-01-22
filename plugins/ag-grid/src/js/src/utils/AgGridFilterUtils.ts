import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  AdvancedFilterModel,
  ColumnAdvancedFilterModel,
  DateFilterModel,
  FilterModel,
  ICombinedSimpleModel,
  ISimpleFilterModel,
  NumberFilterModel,
  TextFilterModel,
} from 'ag-grid-community';
import { TableUtils } from '@deephaven/jsapi-utils';

// These are the currently supported filters, which are a subset of the inbuilt
// AG Grid filters specified on the description for FilterModel
type SupportedSimpleFilterModel =
  | TextFilterModel
  | NumberFilterModel
  | DateFilterModel;

// Boolean columns also use the text filter, but the incoming type prop isn't typed on {type: ISimpleFilterModelType}
// https://www.ag-grid.com/javascript-data-grid/cell-data-types/#boolean
// https://www.ag-grid.com/javascript-data-grid/filter-text/#reference-TextFilterModel-type
type ExtendedTextFilterModelType = TextFilterModel['type'] | 'true' | 'false';

export class AgGridFilterUtils {
  /**
   * Compares two arrays to see if they contain the same filter conditions in any order.
   * @param a A FilterCondition array to compare
   * @param b Another FilterCondition array to compare
   * @returns True if the both arrays contain the same filter conditions, otherwise false.
   */
  static areFiltersEqual(
    a: readonly DhType.FilterCondition[],
    b: readonly DhType.FilterCondition[]
  ): boolean {
    if (a.length !== b.length) return false;
    // Might be a better way than using .toString() here
    const filters = new Set(a.map(f => f.toString()));
    return b.every(f => filters.has(f.toString()));
  }

  static parseFilterModel(
    dh: typeof DhType,
    table: DhType.Table | DhType.TreeTable,
    filterModel: FilterModel | AdvancedFilterModel | null
  ): DhType.FilterCondition[] {
    if (filterModel == null) {
      return [];
    }

    // Check if it's an AdvancedFilterModel
    if (this.isAdvancedFilterModel(filterModel)) {
      return [this.parseAdvancedFilterModel(dh, table, filterModel)];
    }

    return Object.entries(filterModel).map(([colId, model]) => {
      const column = table.findColumn(colId);

      if (this.isCombinedSimpleModel(model, this.isSimpleFilterModel)) {
        return model.conditions
          .map(m => {
            if (this.isSupportedSimpleFilterModel(m)) {
              return this.parseSimpleFilter(dh, column, m);
            }
            throw new Error(`Filter model ${m} is not supported`);
          })
          .reduce((prev, curr) => {
            if (model.operator === 'OR') {
              return prev.or(curr);
            }
            if (model.operator === 'AND') {
              return prev.and(curr);
            }
            throw new Error(
              `Unknown operator ${model.operator} for column ${colId}`
            );
          });
      }

      if (
        this.isSimpleFilterModel(model) &&
        this.isSupportedSimpleFilterModel(model)
      ) {
        return this.parseSimpleFilter(dh, column, model);
      }
      throw new Error(`Filter model ${model} is not supported`);
    });
  }

  static isAdvancedFilterModel(
    model: FilterModel | AdvancedFilterModel
  ): model is AdvancedFilterModel {
    return (
      typeof model === 'object' &&
      model !== null &&
      'filterType' in model &&
      model.filterType === 'join'
    );
  }

  static parseAdvancedFilterModel(
    dh: typeof DhType,
    table: DhType.Table | DhType.TreeTable,
    model: AdvancedFilterModel
  ): DhType.FilterCondition {
    if (model.filterType !== 'join') {
      throw new Error(`Unsupported advanced filter type: ${model.filterType}`);
    }

    if (!model.conditions || model.conditions.length === 0) {
      throw new Error('Advanced filter must have conditions');
    }

    const conditions = model.conditions.map(condition => {
      if ('filterType' in condition && condition.filterType === 'join') {
        // Nested AdvancedFilterModel - recurse
        return this.parseAdvancedFilterModel(dh, table, condition);
      }

      // Column condition - parse directly
      if (!('colId' in condition) || !condition.colId) {
        throw new Error('Advanced filter condition must have colId');
      }

      const column = table.findColumn(condition.colId);
      return this.parseAdvancedColumnFilter(dh, column, condition);
    });

    // Combine conditions based on operator
    return conditions.reduce((prev, curr, index) => {
      if (index === 0) return curr;

      if (model.type === 'OR') {
        return prev.or(curr);
      }
      if (model.type === 'AND') {
        return prev.and(curr);
      }
      throw new Error(`Unknown operator ${model.type} in advanced filter`);
    });
  }

  private static parseAdvancedColumnFilter(
    dh: typeof DhType,
    column: DhType.Column,
    condition: ColumnAdvancedFilterModel
  ): DhType.FilterCondition {
    // Map AdvancedFilterModel column condition to a simple filter model
    switch (condition.filterType) {
      case 'text': {
        const textModel: TextFilterModel = {
          filterType: 'text',
          type: condition.type,
          filter: condition.filter,
        };
        return this.parseTextFilter(dh, column, textModel);
      }
      case 'number': {
        const numberModel: NumberFilterModel = {
          filterType: 'number',
          type: condition.type,
          filter: condition.filter,
        };
        return this.parseNumberFilter(dh, column, numberModel);
      }
      case 'date':
      case 'dateString': {
        const dateModel: DateFilterModel = {
          filterType: 'date',
          type: condition.type,
          dateFrom: condition.filter ?? null,
          dateTo: null,
        };
        return this.parseDateFilter(dh, column, dateModel);
      }
      case 'object': {
        // Object filters use text filter
        const objModel: TextFilterModel = {
          filterType: 'text',
          type: condition.type,
          filter: condition.filter ?? '',
        };
        return this.parseTextFilter(dh, column, objModel);
      }
      case 'boolean': {
        // Boolean filters use text filter with true/false type
        const boolModel: TextFilterModel = {
          filterType: 'text',
          type: condition.type as any,
          filter: '',
        };
        return this.parseTextFilter(dh, column, boolModel);
      }
      default:
        throw new Error(
          `Unsupported filter type in advanced filter: ${condition.filterType}`
        );
    }
  }

  static isCombinedSimpleModel<M extends ISimpleFilterModel>(
    model: unknown,
    isSimpleFilterModel: (obj: unknown) => obj is M
  ): model is ICombinedSimpleModel<M> {
    if (typeof model !== 'object' || model === null) return false;
    const m = model as {
      operator?: unknown;
      conditions?: unknown;
      filterType?: unknown;
    };

    const hasValidOperator = typeof m.operator === 'string';
    const hasValidFilterType =
      m.filterType === undefined || typeof m.filterType === 'string';
    const hasValidConditions =
      Array.isArray(m.conditions) && m.conditions.every(isSimpleFilterModel);

    return hasValidOperator && hasValidConditions && hasValidFilterType;
  }

  static isSimpleFilterModel(model: unknown): model is ISimpleFilterModel {
    if (typeof model !== 'object' || model === null) return false;
    const m = model as { type?: unknown; filterType?: unknown };

    const hasValidFilterType =
      m.filterType === undefined || typeof m.filterType === 'string';
    const hasValidType =
      m.type === undefined || m.type === null || typeof m.type === 'string';

    return hasValidType && hasValidFilterType;
  }

  static isSupportedSimpleFilterModel(
    model: ISimpleFilterModel
  ): model is SupportedSimpleFilterModel {
    return (
      model.filterType != null &&
      ['text', 'number', 'date', 'set'].includes(model.filterType)
    );
  }

  private static parseSimpleFilter(
    dh: typeof DhType,
    column: DhType.Column,
    model: SupportedSimpleFilterModel
  ): DhType.FilterCondition {
    switch (model.filterType) {
      case 'text':
        return this.parseTextFilter(dh, column, model);
      case 'number':
        return this.parseNumberFilter(dh, column, model);
      case 'date':
        return this.parseDateFilter(dh, column, model);
      default:
        throw new Error(`Unimplemented simple filter type ${model.filterType}`);
    }
  }

  private static parseTextFilter(
    dh: typeof DhType,
    column: DhType.Column,
    model: TextFilterModel
  ): DhType.FilterCondition {
    const filterValue = dh.FilterValue.ofString(model.filter ?? '');

    switch (model.type as ExtendedTextFilterModelType) {
      case 'equals':
        return column.filter().eq(filterValue);
      case 'notEqual':
        return column.filter().notEq(filterValue);
      case 'contains':
        return column.filter().contains(filterValue);
      case 'notContains':
        return column
          .filter()
          .isNull()
          .or(column.filter().contains(filterValue).not());
      case 'startsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().invoke('startsWith', filterValue));
      case 'endsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().invoke('endsWith', filterValue));
      // filterValue becomes ofString('') for blank/notBlank filters
      case 'blank':
        return column.filter().isNull().or(column.filter().eq(filterValue));
      case 'notBlank':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().notEq(filterValue));
      case 'true':
        return column.filter().isTrue();
      case 'false':
        return column.filter().isFalse();
      default:
        throw new Error(`Unimplemented filter operation ${model.type}`);
    }
  }

  private static parseNumberFilter(
    dh: typeof DhType,
    column: DhType.Column,
    model: NumberFilterModel
  ): DhType.FilterCondition {
    switch (model.type) {
      case 'blank':
        return column.filter().isNull();
      case 'notBlank':
        return column.filter().isNull().not();
    }

    if (model.filter == null) {
      throw new Error('Model does not have a filter value');
    }

    const filterValue =
      column.type === TableUtils.dataType.CHAR
        ? dh.FilterValue.ofString(String.fromCharCode(model.filter))
        : dh.FilterValue.ofNumber(model.filter);

    switch (model.type) {
      case 'equals':
        return column.filter().eq(filterValue);
      case 'notEqual':
        return column.filter().notEq(filterValue);
      case 'greaterThan':
        return column.filter().greaterThan(filterValue);
      case 'lessThan':
        return column.filter().lessThan(filterValue);
      case 'greaterThanOrEqual':
        return column.filter().greaterThanOrEqualTo(filterValue);
      case 'lessThanOrEqual':
        return column.filter().lessThanOrEqualTo(filterValue);
      case 'inRange': {
        if (model.filterTo == null) {
          throw new Error('Model does not have a filterTo value');
        }
        const filterValueTo =
          column.type === TableUtils.dataType.CHAR
            ? dh.FilterValue.ofString(String.fromCharCode(model.filterTo))
            : dh.FilterValue.ofNumber(model.filterTo);
        return column
          .filter()
          .greaterThan(filterValue)
          .and(column.filter().lessThan(filterValueTo));
      }
      default:
        throw new Error(`Unimplemented filter operation ${model.type}`);
    }
  }

  private static parseDateFilter(
    dh: typeof DhType,
    column: DhType.Column,
    model: DateFilterModel
  ): DhType.FilterCondition {
    switch (model.type) {
      case 'blank':
        return column.filter().isNull();
      case 'notBlank':
        return column.filter().isNull().not();
    }

    if (model.dateFrom == null) {
      throw new Error('Model does not have a dateFrom value');
    }

    const filterValue = dh.FilterValue.ofNumber(
      dh.DateWrapper.ofJsDate(new Date(model.dateFrom))
    );

    switch (model.type) {
      case 'equals':
        return column.filter().eq(filterValue);
      case 'notEqual':
        return column.filter().notEq(filterValue);
      case 'lessThan':
        return column.filter().lessThan(filterValue);
      case 'greaterThan':
        return column.filter().greaterThan(filterValue);
      case 'inRange': {
        if (model.dateTo == null) {
          throw new Error('Model does not have a dateTo value');
        }
        const filterValueTo = dh.FilterValue.ofNumber(
          dh.DateWrapper.ofJsDate(new Date(model.dateTo))
        );
        return column
          .filter()
          .greaterThan(filterValue)
          .and(column.filter().lessThan(filterValueTo));
      }
      default:
        throw new Error(`Unimplemented filter operation ${model.type}`);
    }
  }
}

export default AgGridFilterUtils;
