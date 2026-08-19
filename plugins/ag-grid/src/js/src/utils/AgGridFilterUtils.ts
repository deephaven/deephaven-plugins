import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  type AdvancedFilterModel,
  type DateFilterModel,
  type FilterModel,
  type GridApi,
  type ICombinedSimpleModel,
  type ISimpleFilterModel,
  type NumberFilterModel,
  type TextFilterModel,
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

  /**
   * Parses the given filter model into Deephaven filter conditions.
   * @param dh Deephaven API instance
   * @param table Table to filter
   * @param filterModel Filter model to parse
   * @returns The equivalent Deephaven filter conditions
   * @deprecated Use `getFilterFromGridApi` instead, which respects column
   * filter params such as `caseSensitive`. This method always filters
   * case-sensitively.
   */
  static parseFilterModel(
    dh: typeof DhType,
    table: DhType.Table | DhType.TreeTable,
    filterModel: FilterModel | AdvancedFilterModel | null
  ): DhType.FilterCondition[] {
    // Preserves the original behavior of always filtering case-sensitively
    return this.parseFilterModelInternal(dh, table, filterModel, () => true);
  }

  /**
   * Gets the Deephaven filter conditions for the current filter model set on
   * the given GridApi, respecting column filter params such as
   * `caseSensitive`. AG Grid text filters are case-insensitive unless the
   * column's filterParams specify otherwise.
   * @param dh Deephaven API instance
   * @param table Table to filter
   * @param gridApi GridApi to get the filter model and column definitions from
   * @returns The equivalent Deephaven filter conditions
   */
  static getFilterFromGridApi(
    dh: typeof DhType,
    table: DhType.Table | DhType.TreeTable,
    gridApi: GridApi
  ): DhType.FilterCondition[] {
    // Not handling AdvancedFilterModel (gridApi.getAdvancedFilterModel()) yet
    return this.parseFilterModelInternal(
      dh,
      table,
      gridApi.getFilterModel(),
      colId => gridApi.getColumnDef(colId)?.filterParams?.caseSensitive === true
    );
  }

  private static parseFilterModelInternal(
    dh: typeof DhType,
    table: DhType.Table | DhType.TreeTable,
    filterModel: FilterModel | AdvancedFilterModel | null,
    isCaseSensitive: (colId: string) => boolean
  ): DhType.FilterCondition[] {
    if (filterModel == null) {
      return [];
    }

    return Object.entries(filterModel).map(([colId, model]) => {
      const column = table.findColumn(colId);
      const caseSensitive = isCaseSensitive(colId);

      if (this.isCombinedSimpleModel(model, this.isSimpleFilterModel)) {
        return model.conditions
          .map(m => {
            if (this.isSupportedSimpleFilterModel(m)) {
              return this.parseSimpleFilter(dh, column, m, caseSensitive);
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
        return this.parseSimpleFilter(dh, column, model, caseSensitive);
      }
      throw new Error(`Filter model ${model} is not supported`);
    });
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
      ['text', 'number', 'date'].includes(model.filterType)
    );
  }

  private static parseSimpleFilter(
    dh: typeof DhType,
    column: DhType.Column,
    model: SupportedSimpleFilterModel,
    caseSensitive = false
  ): DhType.FilterCondition {
    switch (model.filterType) {
      case 'text':
        return this.parseTextFilter(dh, column, model, caseSensitive);
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
    model: TextFilterModel,
    caseSensitive = false
  ): DhType.FilterCondition {
    const filterText = model.filter ?? '';
    const filterValue = dh.FilterValue.ofString(filterText);

    switch (model.type as ExtendedTextFilterModelType) {
      case 'equals':
        return caseSensitive
          ? column.filter().eq(filterValue)
          : column.filter().eqIgnoreCase(filterValue);
      case 'notEqual':
        return caseSensitive
          ? column.filter().notEq(filterValue)
          : column.filter().notEqIgnoreCase(filterValue);
      case 'contains':
        return caseSensitive
          ? column.filter().contains(filterValue)
          : column.filter().containsIgnoreCase(filterValue);
      case 'notContains':
        return column
          .filter()
          .isNull()
          .or(
            (caseSensitive
              ? column.filter().contains(filterValue)
              : column.filter().containsIgnoreCase(filterValue)
            ).not()
          );
      case 'startsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(
            caseSensitive
              ? column.filter().invoke('startsWith', filterValue)
              : column
                  .filter()
                  .matchesIgnoreCase(
                    dh.FilterValue.ofString(`(?s)^\\Q${filterText}\\E.*`)
                  )
          );
      case 'endsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(
            caseSensitive
              ? column.filter().invoke('endsWith', filterValue)
              : column
                  .filter()
                  .matchesIgnoreCase(
                    dh.FilterValue.ofString(`(?s).*\\Q${filterText}\\E$`)
                  )
          );
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
