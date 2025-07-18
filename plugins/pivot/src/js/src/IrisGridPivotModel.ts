/* eslint class-methods-use-this: "off" */
/* eslint no-underscore-dangle: "off" */
import memoize from 'memoize-one';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import {
  assertNotNull,
  EMPTY_ARRAY,
  EventShimCustomEvent,
  type CancelablePromise,
} from '@deephaven/utils';
import {
  GridRange,
  type ModelIndex,
  type MoveOperation,
} from '@deephaven/grid';
import {
  ColumnHeaderGroup,
  IrisGridModel,
  IrisGridTableModel,
  type ColumnName,
  type DisplayColumn,
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import {
  TOTALS_COLUMN,
  type PivotColumnMap,
  type PivotSchema,
} from './PivotUtils';

const log = Log.module('@deephaven/js-plugin-pivot/IrisGridPivotModel');

// const GRAND_TOTAL_VALUE = 'Grand Total';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IrisGridPivotModel extends IrisGridTableModel {}

/**
 * Model which proxies calls to IrisGridModel.
 * This allows updating the underlying Pivot tables on schema changes.
 * The proxy model will call any methods it has implemented and delegate any
 * it does not implement to the underlying model.
 */
class IrisGridPivotModel extends IrisGridModel {
  // private keyTable: DhType.Table;

  private keyTableSubscription: DhType.TableSubscription | null;

  // private columnMap: PivotColumnMap;

  private nextColumnMap: PivotColumnMap | null;

  // private schema: PivotSchema;

  private pivotTable: DhType.coreplus.pivot.PivotTable;

  // model: IrisGridModel;

  private schemaPromise: CancelablePromise<[DhType.Table, DhType.Table]> | null;

  private nextModel: IrisGridModel | null;

  private totalsTable: DhType.Table | null;

  private nextTotalsTable: DhType.Table | null;

  private totalsRowMap: Map<string, unknown>;

  private _layoutHints: DhType.LayoutHints | null | undefined;

  constructor(
    dh: typeof DhType,
    // table: DhType.Table,
    // keyTable: DhType.Table,
    // totalsTable: DhType.Table | null,
    // columnMap: KeyColumnArray,
    // schema: PivotSchema,
    pivotTable: DhType.coreplus.pivot.PivotTable,
    formatter = new Formatter(dh)
  ) {
    super(dh);

    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.handleModelEvent = this.handleModelEvent.bind(this);

    // this.model = makeModel(dh, table, formatter);
    this.schemaPromise = null;
    this.nextModel = null;

    // this.keyTable = keyTable;
    this.keyTableSubscription = null;
    this.pivotTable = pivotTable;
    this.totalsTable = null;
    this.nextTotalsTable = null;
    this.totalsRowMap = new Map();

    // this.columnMap = new Map(
    //   schema.hasTotals ? [[TOTALS_COLUMN, 'Totals'], ...columnMap] : columnMap
    // );
    this.nextColumnMap = null;
    // this.schema = schema;

    this._layoutHints = {
      backColumns: [TOTALS_COLUMN],
      hiddenColumns: [],
      frozenColumns: [],
      columnGroups: [],
      areSavedLayoutsAllowed: false,
      frontColumns: [],
      searchDisplayMode: this.dh.SearchDisplayMode.SEARCH_DISPLAY_HIDE,
    };

    // this.startListeningToKeyTable();

    // this.startListeningToSchema();

    // this.setTotalsTable(totalsTable);

    // Proxy everything to the underlying model, unless overridden
    // eslint-disable-next-line no-constructor-return
    // return new Proxy(this, {
    //   // We want to use any properties on the proxy model if defined
    //   // If not, then proxy to the underlying model
    //   get(target, prop, receiver) {
    //     // Does this class have a getter for the prop
    //     // Getter functions are on the prototype
    //     const proxyHasGetter =
    //       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
    //         ?.get != null;

    //     if (proxyHasGetter) {
    //       return Reflect.get(target, prop, receiver);
    //     }

    //     // Does this class implement the property
    //     const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

    //     // Does the class implement a function for the property
    //     const proxyHasFn = Object.prototype.hasOwnProperty.call(
    //       Object.getPrototypeOf(target),
    //       prop
    //     );

    //     const trueTarget = proxyHasProp || proxyHasFn ? target : target.model;
    //     return Reflect.get(trueTarget, prop);
    //   },
    //   set(target, prop, value) {
    //     const proxyHasSetter =
    //       Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
    //         ?.set != null;

    //     const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

    //     if (proxyHasSetter || proxyHasProp) {
    //       return Reflect.set(target, prop, value, target);
    //     }

    //     return Reflect.set(target.model, prop, value, target.model);
    //   },
    // });
  }

  /**
   * Add displayName property to the given column
   * @param column Column to add displayName to
   * @param columnMap Column name map
   * @returns Column with the displayName
   */
  private createDisplayColumn(
    column: DhType.Column,
    columnMap: PivotColumnMap
  ): DisplayColumn {
    return new Proxy(column, {
      get: (target, prop) => {
        if (prop === 'displayName') {
          return columnMap.get(column.name) ?? column.name;
        }
        return Reflect.get(target, prop);
      },
    });
  }

  private getCachedColumnHeaderGroups = memoize(
    (
      columnMap: PivotColumnMap,
      schema: PivotSchema
    ): readonly ColumnHeaderGroup[] => [
      new ColumnHeaderGroup({
        name: schema.pivotDescription,
        children: schema.rowColNames,
        depth: 1,
        childIndexes: schema.rowColNames.map((_, index) => index),
      }),
      new ColumnHeaderGroup({
        name: schema.columnColNames.join(', '),
        children: [...columnMap.keys()],
        depth: 1,
        childIndexes: [...columnMap.keys()].map((_, index) => index),
      }),
    ]
  );

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    // return this.getCachedColumnHeaderGroups(this.columnMap, this.schema);
    return EMPTY_ARRAY;
  }

  get initialMovedColumns(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
    // log.debug('get initialMovedColumns');
    // return this.getCachedMovedColumns(
    //   this.model.columns,
    //   this.schema.hasTotals
    // );
  }

  get columns(): readonly DhType.Column[] {
    // TODO: get columns from the JSPivotTable, cache them
    return Array.from(EMPTY_ARRAY);
    // return this.getCachedColumns(this.columnMap, this.model.columns);
  }

  get isChartBuilderAvailable(): boolean {
    return false;
  }

  get isFormatColumnsAvailable(): boolean {
    return false;
  }

  get isOrganizeColumnsAvailable(): boolean {
    return false;
  }

  get isSeekRowAvailable(): boolean {
    return false;
  }

  get isSelectDistinctAvailable(): boolean {
    return false;
  }

  get isReversible(): boolean {
    return false;
  }

  isFilterable(columnIndex: ModelIndex): boolean {
    return false;
    // return columnIndex < this.schema.rowColNames.length;
  }

  isColumnSortable(columnIndex: ModelIndex): boolean {
    return false;
    // return columnIndex < this.schema.rowColNames.length;
  }

  get isTotalsAvailable(): boolean {
    // Hide Aggregate Columns option in Table Settings
    return false;
  }

  get isRollupAvailable(): boolean {
    return false;
  }

  get isExportAvailable(): boolean {
    // table.freeze is available, but exporting requires extra logic for column mapping and totals rows
    return false;
  }

  get isCustomColumnsAvailable(): boolean {
    return false;
  }

  get rowCount(): number {
    return 0;
    // return this.model.rowCount + (this.schema.hasTotals ? 1 : 0);
  }

  valueForCell(x: ModelIndex, y: ModelIndex): unknown {
    return '42val';
    // if (this.schema.hasTotals && y === this.rowCount - 1) {
    //   if (x >= this.schema.rowColNames.length) {
    //     return this.totalsRowMap.get(this.columns[x].name);
    //   }
    //   return x === 0 ? GRAND_TOTAL_VALUE : undefined;
    // }
    // return this.model.valueForCell(x, y);
  }

  textForCell(x: ModelIndex, y: ModelIndex): string {
    return '42txt';
    // return this.schema.hasTotals && y === this.rowCount - 1 && x === 0
    //   ? GRAND_TOTAL_VALUE
    //   : // Pass the context so model.textForCell calls this.valueForCell instead of model.valueForCell
    //     this.model.textForCell.call(this, x, y);
  }

  copyTotalsData(data: DhType.ViewportData): void {
    this.totalsRowMap = new Map();
    data.columns.forEach(column => {
      this.totalsRowMap.set(column.name, data.getData(0, column));
    });
  }

  handleTotalsUpdate(event: DhType.Event<DhType.ViewportData>): void {
    log.debug('handleTotalsUpdate', event.detail);

    this.copyTotalsData(event.detail);
    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  getCachedMovedColumns = memoize(
    (
      columns: readonly DhType.Column[],
      hasTotals: boolean
    ): readonly MoveOperation[] => {
      if (!hasTotals) {
        return EMPTY_ARRAY;
      }

      const totalsColumnIndex = columns.findIndex(
        c => c.name === TOTALS_COLUMN
      );
      if (totalsColumnIndex === -1) {
        log.warn('Totals column not found in getCachedMovedColumns');
        return EMPTY_ARRAY;
      }
      const movedColumns: MoveOperation[] = [];
      if (totalsColumnIndex < columns.length - 1) {
        movedColumns.push({
          from: totalsColumnIndex,
          to: columns.length - 1,
        });
      }
      return movedColumns;
    }
  );

  getCachedColumns = memoize(
    (columnMap: PivotColumnMap, tableColumns: readonly DhType.Column[]) =>
      tableColumns.map(c => this.createDisplayColumn(c, columnMap))
  );

  get layoutHints(): DhType.LayoutHints | null | undefined {
    return this._layoutHints;
  }

  isColumnMovable(): boolean {
    return false;
  }

  /**
   * Use this as the canonical column index since things like layoutHints could have
   * changed the column order.
   */
  getColumnIndexByName(name: ColumnName): number | undefined {
    return this.getColumnIndicesByNameMap(this.columns).get(name);
  }

  getColumnIndicesByNameMap = memoize(
    (columns: readonly DhType.Column[]): Map<ColumnName, ModelIndex> => {
      const indices = new Map();
      columns.forEach(({ name }, i) => indices.set(name, i));
      return indices;
    }
  );

  updateFrozenColumns(columns: ColumnName[]): void {
    if (columns.length > 0) {
      throw new Error('Cannot freeze columns on a pivot table');
    }
  }

  handleModelEvent(event: CustomEvent): void {
    log.debug2('handleModelEvent', event);

    const { detail, type } = event;
    this.dispatchEvent(new EventShimCustomEvent(type, { detail }));
  }

  async snapshot(
    ranges: readonly GridRange[],
    includeHeaders = false,
    formatValue: (value: unknown, column: DhType.Column) => unknown = value =>
      value,
    consolidateRanges = true
  ): Promise<unknown[][]> {
    // TODO:
    return Array.from(EMPTY_ARRAY);
  }

  colorForCell(x: ModelIndex, y: ModelIndex, theme: IrisGridThemeType): string {
    const value = this.valueForCell(x, y);
    if (value == null || value === '') {
      assertNotNull(theme.nullStringColor);
      return theme.nullStringColor;
    }

    // Format based on the value/type of the cell
    const column = this.columns[x];
    if (TableUtils.isDateType(column.type) || column.name === 'Date') {
      assertNotNull(theme.dateColor);
      return theme.dateColor;
    }
    if (TableUtils.isNumberType(column.type)) {
      if ((value as number) > 0) {
        assertNotNull(theme.positiveNumberColor);
        return theme.positiveNumberColor;
      }
      if ((value as number) < 0) {
        assertNotNull(theme.negativeNumberColor);
        return theme.negativeNumberColor;
      }
      assertNotNull(theme.zeroNumberColor);
      return theme.zeroNumberColor;
    }

    return theme.textColor;

    // if (!isIrisGridTableModelTemplate(this.model)) {
    //   throw new Error('Invalid model, colorForCell not available');
    // }
    // return this.model.colorForCell(x, y, theme);
  }

  startListening(): void {
    super.startListening();

    // this.addListeners(this.model);
  }

  stopListening(): void {
    super.stopListening();

    // this.removeListeners(this.model);
  }

  addListeners(model: IrisGridModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model.addEventListener(events[i], this.handleModelEvent);
    }
  }

  removeListeners(model: IrisGridModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model.removeEventListener(events[i], this.handleModelEvent);
    }
  }

  close(): void {
    log.debug('close');
    // this.model.close();
  }
}

export default IrisGridPivotModel;
