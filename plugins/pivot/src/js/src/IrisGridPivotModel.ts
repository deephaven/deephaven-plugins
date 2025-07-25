/* eslint class-methods-use-this: "off" */
/* eslint no-underscore-dangle: "off" */
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import { type dh as DhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { Formatter, FormatterUtils, TableUtils } from '@deephaven/jsapi-utils';
import {
  assertNotNull,
  EMPTY_ARRAY,
  EventShimCustomEvent,
} from '@deephaven/utils';
import {
  GridRange,
  memoizeClear,
  type ExpandableGridModel,
  type ModelIndex,
  type MoveOperation,
  type Token,
  type VisibleIndex,
} from '@deephaven/grid';
import {
  ColumnHeaderGroup,
  IrisGridModel,
  IrisGridTableModel,
  type CellData,
  type ColumnName,
  type DisplayColumn,
  type IrisGridThemeType,
  type UITreeRow,
  type UIViewportData,
} from '@deephaven/iris-grid';
import { makeVirtualColumn } from './PivotUtils';

const log = Log.module('@deephaven/js-plugin-pivot/IrisGridPivotModel');

const SET_VIEWPORT_THROTTLE = 150;
const APPLY_VIEWPORT_THROTTLE = 0;
const ROW_BUFFER_PAGES = 1;

export function isColumnHeaderGroup(x: unknown): x is ColumnHeaderGroup {
  return x instanceof ColumnHeaderGroup;
}

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
class IrisGridPivotModel<R extends UITreeRow = UITreeRow>
  extends IrisGridModel
  implements ExpandableGridModel
{
  private pivotTable: DhType.coreplus.pivot.PivotTable;

  private virtualColumns: DisplayColumn[];

  private _layoutHints: DhType.LayoutHints | null | undefined;

  // TODO:

  private rowData: DhType.coreplus.pivot.DimensionData | null = null;

  private columnData: DhType.coreplus.pivot.DimensionData | null = null;

  // private snapshotData: DhType.coreplus.pivot.PivotSnapshot | null = null;

  private irisFormatter: Formatter;

  private rowOffset = 0;

  private columnOffset = 0;

  private viewportData: UIViewportData<R> | null = null;

  // private depthData: { depth: number; isExpanded: boolean }[] | null = null;

  private totalsPopulated = false;

  constructor(
    dh: typeof DhType,
    pivotTable: DhType.coreplus.pivot.PivotTable,
    formatter = new Formatter(dh)
  ) {
    super(dh);

    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.handleModelEvent = this.handleModelEvent.bind(this);
    this.handlePivotUpdated = this.handlePivotUpdated.bind(this);

    this.pivotTable = pivotTable;
    this.irisFormatter = formatter;

    this.virtualColumns = [
      ...pivotTable.rowSources.map((source, col) =>
        this.createRowSourceColumn(source, col)
      ),
      makeVirtualColumn({
        name: 'Grand Total',
        // TODO: fix type
        type: pivotTable.valueSources[0].type,
        // TODO: should it be columnSources length?
        index: pivotTable.rowSources.length,
      }),
    ];

    log.debug('constructor', this.virtualColumns);

    this._layoutHints = {
      backColumns: [],
      hiddenColumns: [],
      frozenColumns: [],
      columnGroups: [],
      areSavedLayoutsAllowed: false,
      frontColumns: [],
      searchDisplayMode: this.dh.SearchDisplayMode.SEARCH_DISPLAY_HIDE,
    };

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

    // IrisGrid uses this event to detect when the model is initialized
    // TODO: still need this?
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.columns,
      })
    );
  }

  private createRowSourceColumn(
    source: DhType.coreplus.pivot.PivotSource,
    index: number
  ) {
    const { name, type, isSortable } = source;
    return makeVirtualColumn({ name, type, index, isSortable });
  }

  /**
   * Add displayName property to the given column
   * @param column Column to add displayName to
   * @param columnMap Column name map
   * @returns Column with the displayName
   */
  private createDisplayColumn(
    snapshotDim: DhType.coreplus.pivot.DimensionData,
    valueSources: DhType.coreplus.pivot.PivotSource[],
    index: number
  ): DisplayColumn {
    const virtualColumnCount = this.virtualColumns.length;
    const keys = snapshotDim.getKeys(
      snapshotDim.offset + index - virtualColumnCount
    );
    const depth =
      snapshotDim.getDepth(snapshotDim.offset + index - virtualColumnCount) - 1;
    let name = '';
    for (let i = 0; i < depth; i += 1) {
      if (i > 0) {
        name += '-';
      }
      name += keys[i];
    }
    // TODO:
    const source = valueSources[0];
    return makeVirtualColumn({
      name,
      type: source.type,
      index: snapshotDim.offset + index,
    });
  }

  // TODO: this might not work if columnData is mutated
  getCachedColumns = memoize(
    (
      snapshotColumnsDim: DhType.coreplus.pivot.DimensionData | null,
      valueSources: DhType.coreplus.pivot.PivotSource[],
      snapshotDimOffset: number
    ) => {
      const columns = [...this.virtualColumns];
      if (snapshotColumnsDim == null) {
        return columns;
      }
      for (let i = 0; i < snapshotColumnsDim.count; i += 1) {
        columns.push(
          this.createDisplayColumn(
            snapshotColumnsDim,
            valueSources,
            i + this.virtualColumns.length
          )
        );
      }
      log.debug2('getCachedColumns', {
        columns,
        count: snapshotColumnsDim.count,
        offset: snapshotColumnsDim.offset,
        snapshotDimOffset,
      });
      return columns;
    }
  );

  columnAtDepth(
    x: ModelIndex,
    depth = 0
  ): ColumnHeaderGroup | DisplayColumn | undefined {
    return this.columns[x];
    // if (depth === 0) {
    //   return this.columns[x];
    // }

    // const columnName = this.columns[x]?.name;
    // let group = this.columnHeaderParentMap.get(columnName);

    // if (!group) {
    //   return undefined;
    // }

    // let currentDepth = group.depth;
    // while (currentDepth < depth) {
    //   group = this.columnHeaderParentMap.get(group.name);
    //   if (!group) {
    //     return undefined;
    //   }
    //   currentDepth = group.depth;
    // }

    // if (group.depth === depth) {
    //   return group;
    // }

    // return undefined;
  }

  // TODO: figure out why it gets triggered so often
  textForColumnHeader(x: ModelIndex, depth = 0): string | undefined {
    // log.debug2('textForColumnHeader', x, depth, this.columns);
    const header = this.columnAtDepth(x, depth);
    // if (isColumnHeaderGroup(header)) {
    //   return header.isNew ? '' : header.name;
    // }
    // return header?.displayName ?? header?.name;
    const name = header?.displayName ?? header?.name;
    // if (name == null) {
    //   debugger;
    // }
    return name ?? 'HeaderName'; // TODO: implement
  }

  // private getCachedColumnHeaderGroups = memoize(
  //   (
  //     columnMap: PivotColumnMap,
  //     schema: PivotSchema
  //   ): readonly ColumnHeaderGroup[] => [
  //     new ColumnHeaderGroup({
  //       name: schema.pivotDescription,
  //       children: schema.rowColNames,
  //       depth: 1,
  //       childIndexes: schema.rowColNames.map((_, index) => index),
  //     }),
  //     new ColumnHeaderGroup({
  //       name: schema.columnColNames.join(', '),
  //       children: [...columnMap.keys()],
  //       depth: 1,
  //       childIndexes: [...columnMap.keys()].map((_, index) => index),
  //     }),
  //   ]
  // );

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
    return this.getCachedColumns(
      this.columnData,
      this.pivotTable.valueSources,
      this.columnData?.offset ?? 0
    );
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
    // log.debug2('get rowCount', this.rowData?.totalCount ?? 0);
    // +1 to account for totals row / grand totals
    // TODO: is totals already accounted for?
    return this.rowData?.totalCount ?? 0; //  + (this.totalsPopulated ? 1 : 0);
  }

  get columnCount(): number {
    // log.debug2('get columnCount', this.columnData?.totalCount ?? 0);
    return (this.columnData?.totalCount ?? 0) + this.virtualColumns.length;
  }

  get sort(): readonly DhType.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(_: readonly DhType.Sort[]) {
    // No-op, pivot tables do not support sorting
  }

  // valueForCell(x: ModelIndex, y: ModelIndex): unknown {
  //   return (
  //     this.snapshotData?.getValue(this.pivotTable.valueSources[0], x, y) ?? null
  //   );
  //   // if (this.schema.hasTotals && y === this.rowCount - 1) {
  //   //   if (x >= this.schema.rowColNames.length) {
  //   //     return this.totalsRowMap.get(this.columns[x].name);
  //   //   }
  //   //   return x === 0 ? GRAND_TOTAL_VALUE : undefined;
  //   // }
  //   // return this.model.valueForCell(x, y);
  // }

  // textForCell(x: ModelIndex, y: ModelIndex): string {
  //   // Pass the context so model.textForCell calls this.valueForCell instead of model.valueForCell
  //   const value = this.valueForCell(x, y);
  //   return value == null ? '' : String(value);
  //   // return this.schema.hasTotals && y === this.rowCount - 1 && x === 0
  //   //   ? GRAND_TOTAL_VALUE
  // }

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

  // TODO: remove
  viewportDataToArray(viewportData: UIViewportData<R> | null): string[][] {
    if (!viewportData) return [];

    return viewportData.rows.map(row =>
      Array.from(row.data.values()).map(cell =>
        String(cell.value?.value ?? cell.value ?? '')
      )
    );
  }

  handlePivotUpdated(
    event: DhType.Event<DhType.coreplus.pivot.PivotSnapshot>
  ): void {
    const snapshot = event.detail;
    this.viewportData = this.extractSnapshotData(snapshot);
    // const depthData = [];
    // for (let i = 0; i < snapshot.rows.count; i += 1) {
    //   depthData.push({
    //     depth: snapshot.rows.getDepth(i + snapshot.rows.offset) - 2,
    //     isExpanded: snapshot.rows.isExpanded(i + snapshot.rows.offset),
    //   });
    // }
    // this.depthData = depthData;
    log.debug(
      '[0] handlePivotUpdated',
      snapshot,
      this.viewportDataToArray(this.viewportData)
    );

    this.formattedStringData = [];
    this.columnOffset = snapshot.columns.offset;
    this.rowOffset = snapshot.rows.offset;
    this.totalsPopulated = true;

    // TODO: get the data from the snapshot, store in the model
    // TODO: dispatch model updated event
    const { columns, rows } = snapshot;
    this.columnData = columns;
    this.rowData = rows;
    // this.snapshotData = snapshot;

    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.columns,
      })
    );

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  extractSnapshotData(
    snapshot: DhType.coreplus.pivot.PivotSnapshot
  ): UIViewportData<R> {
    log.debug2(
      'extractSnapshotDataAll',
      snapshot,
      this.viewport,
      this.virtualColumns
    );
    // this.columnData = columns;
    // this.rowData = rows;
    // this.snapshotData = snapshot;

    const newData: UIViewportData<R> = {
      offset: snapshot.rows.offset,
      rows: [],
    };
    assertNotNull(this.viewport?.columns);
    const virtualColumnCount = this.virtualColumns.length;
    const viewportColumnCount = this.viewport.columns.length;
    if (snapshot.columns.count < viewportColumnCount - virtualColumnCount) {
      log.warn('snapshot contains fewer columns than expected', {
        snapshot: snapshot.columns.count,
        virtual: virtualColumnCount,
        viewport: viewportColumnCount,
      });
      throw new Error(
        'Snapshot contains fewer columns than expected, this is likely a bug'
      );
    }

    log.debug('extract snapshot data cols:', {
      snapshot: snapshot.columns.count,
      virtual: virtualColumnCount,
      viewport: viewportColumnCount,
    });

    if (this.viewport?.top === 0) {
      const totalsRow = new Map<ModelIndex, CellData>();
      const totalKeys = snapshot.rows.getKeys(0);
      const totalDepth = snapshot.rows.getDepth(0) - 2;
      for (let c = 0; c < viewportColumnCount; c += 1) {
        log.debug('extractSnapshotTotalRow', totalKeys, totalDepth, c);
        if (c < totalKeys.length) {
          // Does viewport always contain all the keys?
          totalsRow.set(c, {
            // Only render the value for the deepest level
            value: undefined,
          });
        } else if (c === totalKeys.length) {
          // TODO: conditional logic above is wrong
          // Grand Total column (TODO: this could be one of many valueSources)
          totalsRow.set(c, {
            value: snapshot.getGrandTotal(snapshot.valueSources[0]),
          });
        } else {
          const value = snapshot.columns.getTotal(
            c + snapshot.columns.offset - virtualColumnCount,
            // TODO: implement this properly
            snapshot.valueSources[0]
          );
          totalsRow.set(c, { value });
        }
      }

      log.debug('extractSnapshotTotalRowResult', totalsRow);

      newData.rows.push({
        data: totalsRow,
        // TODO: implement this properly
        isExpanded: true,
        hasChildren: true,
        depth: 0,
      } as R);
    }

    for (let r = 0; r < snapshot.rows.count; r += 1) {
      const newRow = new Map<ModelIndex, CellData>();
      const keys = snapshot.rows.getKeys(r + snapshot.rows.offset);
      const depth = snapshot.rows.getDepth(r + snapshot.rows.offset) - 1;
      log.debug('extractSnapshotDataRow', keys, depth, r);
      for (let c = 0; c < viewportColumnCount; c += 1) {
        // const column = this.viewport.columns[c];
        if (c < keys.length) {
          // Does viewport always contain all the keys?
          newRow.set(c, {
            // Only render the value for the deepest level
            value: c === depth - 1 ? keys[c] : undefined,
          });
        } else if (c === keys.length) {
          // TODO: conditional logic above is wrong
          // Grand Total column (TODO: this could be one of many valueSources)
          newRow.set(c, {
            value: snapshot.rows.getTotal(
              r + snapshot.rows.offset,
              snapshot.valueSources[0]
            ),
          });
        } else {
          const value = snapshot.getValue(
            // TODO: implement this properly
            snapshot.valueSources[0],
            r + snapshot.rows.offset,
            // TODO: fix this in case the viewport contains only part of the virtual columns
            c + snapshot.columns.offset - virtualColumnCount
          );
          newRow.set(c, { value });
        }
      }
      newData.rows.push({
        data: newRow,
        // TODO: implement this properly
        isExpanded: snapshot.rows.isExpanded(r + snapshot.rows.offset),
        hasChildren: snapshot.rows.hasChildren(r + snapshot.rows.offset),
        depth,
      } as R);
    }

    return newData;
  }

  // TODO: expand rows, columns

  // TODO: filters, sorts

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

    log.debug(
      'startListening',
      this.dh.coreplus.pivot.PivotTable.EVENT_UPDATED
    );

    this.pivotTable.addEventListener(
      this.dh.coreplus.pivot.PivotTable.EVENT_UPDATED,
      this.handlePivotUpdated
    );
  }

  stopListening(): void {
    super.stopListening();

    log.debug('stopListening', this.dh.coreplus.pivot.PivotTable.EVENT_UPDATED);

    this.pivotTable.removeEventListener(
      this.dh.coreplus.pivot.PivotTable.EVENT_UPDATED,
      this.handlePivotUpdated
    );
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

  // TODO: reuse these?

  get formatter(): Formatter {
    return this.irisFormatter;
  }

  set formatter(formatter: Formatter) {
    this.irisFormatter = formatter;
    this.formattedStringData = [];
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.FORMATTER_UPDATED)
    );
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName = '',
    formatOverride?: { formatString?: string | null }
  ): string {
    return this.getCachedFormattedString(
      this.formatter,
      value,
      columnType,
      columnName,
      formatOverride
    );
  }

  getCachedFormattedString = memoizeClear(
    (
      formatter: Formatter,
      value: unknown,
      columnType: string,
      columnName: ColumnName,
      formatOverride?: { formatString?: string | null }
    ): string =>
      formatter.getFormattedString(
        value,
        columnType,
        columnName,
        formatOverride
      ),
    { max: 10000 }
  );

  get hasExpandableRows(): boolean {
    return true;
  }

  get hasExpandableColumns(): boolean {
    return true;
  }

  get isExpandAllAvailable(): boolean {
    return this.pivotTable.expandAll !== undefined;
  }

  isRowExpandable(y: ModelIndex): boolean {
    // TODO: add method to get adjusted row index for viewportData
    return this.viewportData?.rows[y]?.hasChildren ?? false;
  }

  isRowExpanded(y: ModelIndex): boolean {
    // TODO: add method to get adjusted row index for viewportData
    return this.viewportData?.rows[y]?.isExpanded ?? false;
  }

  setRowExpanded(
    y: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    if (y === 0) {
      log.debug('Ignore expand/collapse for the totals row');
      return;
    }
    if (this.isExpandAllAvailable) {
      // TODO: add method to get adjusted row index for pivotTable
      this.pivotTable.setRowExpanded(y - 1, isExpanded, expandDescendants);
    } else {
      this.pivotTable.setRowExpanded(y - 1, isExpanded);
    }
  }

  expandAll(): void {
    if (this.pivotTable.expandAll != null) {
      this.pivotTable.expandAll();
    }
  }

  collapseAll(): void {
    if (this.pivotTable.collapseAll != null) {
      this.pivotTable.collapseAll();
    }
  }

  depthForRow(y: ModelIndex): number {
    const depth = this.viewportData?.rows[y]?.depth ?? 0;
    // log.debug2('[0] depthForRow', y, depth);
    return depth;
  }

  getCachedCustomColumnFormatFlag = memoizeClear(
    FormatterUtils.isCustomColumnFormatDefined,
    { max: 10000 }
  );

  valueSourceColumn(
    x: ModelIndex,
    y: ModelIndex
  ): {
    name: string;
    type: string;
    isSortable?: boolean;
  } {
    // TODO
    return x < this.virtualColumns.length
      ? this.virtualColumns[x]
      : this.pivotTable.valueSources[0];
  }

  textValueForCell(x: ModelIndex, y: ModelIndex): string | null | undefined {
    // Use a separate cache from memoization just for the strings that are currently displayed
    if (this.formattedStringData[x]?.[y] === undefined) {
      const value = this.valueForCell(x, y);

      if (value === null) {
        return null;
      }
      if (value === undefined) {
        return undefined;
      }

      const column = this.valueSourceColumn(x, y); // This should return the correct valueSource column for the cell
      const hasCustomColumnFormat = this.getCachedCustomColumnFormatFlag(
        this.formatter,
        column.name,
        column.type
      );
      let formatOverride;
      if (!hasCustomColumnFormat) {
        const formatForCell = this.formatForCell(x, y);
        if (formatForCell?.formatString != null) {
          formatOverride = formatForCell;
        }
      }
      const text = this.displayString(
        value,
        column.type,
        column.name,
        formatOverride
      );
      log.debug2('textValueForCell', x, y, column, value, text);
      this.cacheFormattedValue(x, y, text);
    }

    return this.formattedStringData[x][y];
  }

  textForCell(x: ModelIndex, y: ModelIndex): string {
    const text = this.textValueForCell(x, y);
    if (
      // TODO: detect if the column is one of the key columns instead of just checking the index
      x >= this.virtualColumns.length &&
      TableUtils.isTextType(this.columns[x]?.type)
    ) {
      if (text === null) {
        return this.formatter.showNullStrings ? 'null' : '';
      }

      if (text === '') {
        return this.formatter.showEmptyStrings ? 'empty' : '';
      }
    }

    return text ?? '';
  }

  cacheFormattedValue(x: ModelIndex, y: ModelIndex, text: string | null): void {
    if (this.formattedStringData[x] == null) {
      this.formattedStringData[x] = [];
    }
    this.formattedStringData[x][y] = text;
  }

  dataForCell(x: ModelIndex, y: ModelIndex): CellData | undefined {
    return this.row(y)?.data.get(x);
  }

  formatForCell(x: ModelIndex, y: ModelIndex): DhType.Format | undefined {
    return this.dataForCell(x, y)?.format;
  }

  valueForCell(x: ModelIndex, y: ModelIndex): unknown {
    // return 0;
    const data = this.dataForCell(x, y);

    /* JS API current sets null values as undefined in some instances. This means 
    we need to nullish coaelesce so all undefined values from the API return null 
    since the data has been fetched. undefined is used to indicate the API has not 
    fetched data yet */
    if (data) {
      return data.value ?? null;
    }
    return undefined;
  }

  row(y: ModelIndex): R | null {
    // const totalsRowCount = this.totals?.operationOrder?.length ?? 0;
    // const showOnTop = this.totals?.showOnTop ?? false;
    // const totalsRow = this.totalsRow(y);
    // if (totalsRow != null) {
    //   const operation = this.totals?.operationOrder[totalsRow];
    //   assertNotNull(operation);
    //   return this.totalsDataMap?.get(operation) ?? null;
    // }
    // const pendingRow = this.pendingRow(y);
    // if (pendingRow != null) {
    //   return this.pendingNewDataMap.get(pendingRow) ?? null;
    // }
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = y - offset;
    return this.viewportData?.rows?.[viewportY] ?? null;
  }

  sourceColumn(column: ModelIndex, row: ModelIndex): DhType.Column {
    // const totalsRow = this.totalsRow(row);
    // if (totalsRow != null) {
    //   const operation = this.totals?.operationOrder[totalsRow];
    //   const defaultOperation =
    //     this.totals?.defaultOperation ?? AggregationOperation.SUM;
    //   const tableColumn = this.columns[column];

    //   // Find the matching totals table column for the operation
    //   // When there are multiple aggregations for the column, the column name will be the original name of the column with the operation appended afterward
    //   // When the the operation is the default operation OR there is only one operation for the column, then the totals column name is just the original column name
    //   const totalsColumn = this.totalsTable?.columns.find(
    //     col =>
    //       col.name === `${tableColumn.name}__${operation}` ||
    //       ((operation === defaultOperation ||
    //         this.totals?.operationMap[col.name]?.length === 1) &&
    //         col.name === tableColumn.name)
    //   );
    //   if (totalsColumn != null) {
    //     return totalsColumn;
    //   }
    //   // There may be cases were the totals table doesn't have a column, such as when there's a virtual column
    // }
    return this.columns[column];
  }

  tokensForCell(
    column: ModelIndex,
    row: ModelIndex,
    visibleLength = 0
  ): Token[] {
    // const text = this.textForCell(column, row);
    return []; // this.getCachedTokensInText(text, visibleLength);
  }

  getCachedViewportColumns = memoize(
    (columns?: DhType.Column[]): readonly DhType.Column[] => {
      if (columns == null) {
        return EMPTY_ARRAY;
      }
      return columns.filter(c => !this.virtualColumns.includes(c));
    }
  );

  setViewport = throttle(
    (top: VisibleIndex, bottom: VisibleIndex, columns?: DhType.Column[]) => {
      if (bottom < top) {
        log.error('Invalid viewport', top, bottom);
        return;
      }

      const { viewport } = this;
      if (
        viewport != null &&
        viewport.top === top &&
        viewport.bottom === bottom &&
        viewport.columns === columns
      ) {
        log.debug2('Ignoring duplicate viewport', viewport);
        return;
      }

      this.viewport = {
        top,
        bottom,
        columns,
      };
      log.debug2('setViewport', this.viewport);

      this.applyViewport();
    },
    SET_VIEWPORT_THROTTLE
  );

  getCachedViewportRowRange = memoize(
    (top: number, bottom: number): [number, number] => {
      const viewHeight = bottom - top;
      const viewportTop = Math.max(0, top - viewHeight * ROW_BUFFER_PAGES);
      const viewportBottom = bottom + viewHeight * ROW_BUFFER_PAGES;
      return [viewportTop, viewportBottom];
    }
  );

  /**
   * Applies the current viewport to the underlying table.
   */
  applyViewport = throttle(
    (): void => {
      if (!this.viewport) {
        return;
      }

      log.debug2('applyViewport', this.viewport);
      const { top, bottom, columns } = this.viewport;
      const [viewportTop, viewportBottom] = this.getCachedViewportRowRange(
        top,
        bottom
      );
      this.applyBufferedViewport(viewportTop, viewportBottom, columns);
    },
    APPLY_VIEWPORT_THROTTLE,
    { leading: false }
  );

  applyBufferedViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    // TODO: not sure what to do with columns yet
    columns?: DhType.Column[]
  ): void {
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.VIEWPORT_UPDATED)
    );
    const viewportColumns = this.getCachedViewportColumns(columns);
    log.debug2('applyBufferedViewport', top, bottom, columns, viewportColumns);

    const sources = [...this.pivotTable.valueSources];
    // Subtract totals from the row numbers to account for the totals row
    // Except on the initial load, when we don't have totals yet
    const totalsRowCount = this.totalsPopulated ? 1 : 0;
    const rowRange = this.dh.RangeSet.ofRange(
      Math.max(0, top - totalsRowCount),
      Math.max(0, bottom - totalsRowCount)
    );
    const colRange = this.dh.RangeSet.ofRange(
      0,
      // TODO: fix this
      this.columnData?.totalCount ?? 200
    );
    this.pivotTable.setViewport({ rows: rowRange, columns: colRange, sources });
  }
}

export default IrisGridPivotModel;
