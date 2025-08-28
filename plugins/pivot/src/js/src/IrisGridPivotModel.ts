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
  type ExpandableColumnGridModel,
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
import { makeVirtualColumn, type ExpandableDisplayColumn } from './PivotUtils';

const log = Log.module('@deephaven/js-plugin-pivot/IrisGridPivotModel');

const SET_VIEWPORT_THROTTLE = 150;
const APPLY_VIEWPORT_THROTTLE = 0;
const ROW_BUFFER_PAGES = 1;

export function isColumnHeaderGroup(x: unknown): x is ColumnHeaderGroup {
  return x instanceof ColumnHeaderGroup;
}

export interface IrisGridPivotModelConfig {
  rowBufferPages?: number;
}

const GRAND_TOTAL_COL = 'Grand Totals';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IrisGridPivotModel extends IrisGridTableModel {}

/**
 * Model implementing the Pivot Table functionality.
 * This allows updating the underlying Pivot tables on schema changes.
 * The proxy model will call any methods it has implemented and delegate any
 * it does not implement to the underlying model.
 */
class IrisGridPivotModel<R extends UITreeRow = UITreeRow>
  extends IrisGridModel
  implements ExpandableGridModel, ExpandableColumnGridModel
{
  private pivotTable: DhType.coreplus.pivot.PivotTable;

  private virtualColumns: ExpandableDisplayColumn[];

  private _layoutHints: DhType.LayoutHints | null | undefined;

  private viewportData: UIViewportData<R> | null = null;

  private rowData: DhType.coreplus.pivot.DimensionData | null = null;

  private columnData: DhType.coreplus.pivot.DimensionData | null = null;

  private irisFormatter: Formatter;

  private viewport: {
    top: VisibleIndex;
    bottom: VisibleIndex;
    columns?: readonly DhType.Column[];
  } | null = null;

  private readonly rowBufferPages: number;

  constructor(
    dh: typeof DhType,
    pivotTable: DhType.coreplus.pivot.PivotTable,
    formatter = new Formatter(dh),
    config: IrisGridPivotModelConfig = {}
  ) {
    super(dh);

    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.handleModelEvent = this.handleModelEvent.bind(this);
    this.handlePivotUpdated = this.handlePivotUpdated.bind(this);

    this.dh = dh;
    this.pivotTable = pivotTable;
    this.irisFormatter = formatter;

    this.rowBufferPages = config.rowBufferPages ?? ROW_BUFFER_PAGES;

    this.virtualColumns = [
      ...pivotTable.rowSources.map((source, col) =>
        this.createRowSourceColumn(source, col)
      ),
      // TODO:
      // Grand Total is a column group name, individual source value columns will have own unique(?) names
      // Display names will be based on the source value names
      makeVirtualColumn({
        name: GRAND_TOTAL_COL,
        type: pivotTable.valueSources[0].type,
        index: pivotTable.rowSources.length,
        depth: 2,
        isExpanded: true,
        hasChildren: true,
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
      // Disable Search functionality
      searchDisplayMode: this.dh.SearchDisplayMode.SEARCH_DISPLAY_HIDE,
    };
  }

  dh: typeof DhType;

  private createRowSourceColumn(
    source: DhType.coreplus.pivot.PivotSource,
    index: number
  ) {
    const { name, type, isSortable } = source;
    return makeVirtualColumn({ name, type, index, isSortable });
  }

  /**
   * Create a column with displayName property based on the dimension data
   * @param snapshotDim Snapshot dimension data
   * @param valueSource Value source data
   * @param originalIndex Original column index in the dimension
   * @returns Column with the displayName
   */
  private createExpandableDisplayColumn(
    snapshotDim: DhType.coreplus.pivot.DimensionData,
    valueSource: DhType.coreplus.pivot.PivotSource,
    originalIndex: number
  ): ExpandableDisplayColumn {
    const keys = snapshotDim.getKeys(originalIndex);
    const depth = snapshotDim.getDepth(originalIndex);
    const hasChildren = snapshotDim.hasChildren(originalIndex);
    const isExpanded = snapshotDim.isExpanded(originalIndex);
    let name = '';
    // TODO: confirm first level depth is 2
    for (let i = 0; i < depth - 1; i += 1) {
      if (i > 0) {
        name += '-';
      }
      name += keys[i];
    }

    let displayName = name;

    if (hasChildren) {
      if (isExpanded) {
        displayName = `▼ ${displayName}`;
      } else {
        displayName = `► ${displayName}`;
      }
    }

    return makeVirtualColumn({
      name,
      displayName,
      type: valueSource.type,
      index: originalIndex + this.virtualColumns.length,
      depth,
      isExpanded,
      hasChildren,
    });
  }

  /**
   * Create a placeholder column with displayName property based on the dimension data
   * @param snapshotDim Snapshot dimension data
   * @param valueSource Value source data
   * @param originalIndex Original column index in the dimension
   * @returns Column with the displayName
   */
  private createPlaceholderDisplayColumn(
    snapshotDim: DhType.coreplus.pivot.DimensionData,
    valueSource: DhType.coreplus.pivot.PivotSource,
    originalIndex: number
  ): ExpandableDisplayColumn {
    return makeVirtualColumn({
      name: `placeholder${originalIndex}`,
      displayName: '...',
      type: valueSource.type,
      index: originalIndex + this.virtualColumns.length,
      // TODO: confirm correct default depth?
      depth: 2,
      isExpanded: false,
      hasChildren: false,
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
      for (let i = 0; i < snapshotColumnsDim.totalCount; i += 1) {
        if (
          i >= snapshotColumnsDim.offset &&
          i < snapshotColumnsDim.offset + snapshotColumnsDim.count
        ) {
          columns.push(
            this.createExpandableDisplayColumn(
              snapshotColumnsDim,
              // TODO: how do we count multiple value sources? are they included in the totalCount?
              valueSources[0],
              i
            )
          );
        } else {
          columns.push(
            this.createPlaceholderDisplayColumn(
              snapshotColumnsDim,
              // TODO: how do we count multiple value sources? are they included in the totalCount?
              valueSources[0],
              i
            )
          );
        }
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

  textForColumnHeader(x: ModelIndex, depth = 0): string | undefined {
    const header = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(header)) {
      return header.isNew ? '' : header.name;
    }
    return header?.displayName ?? header?.name;
  }

  private getCachedColumnHeaderGroups = memoize(
    (
      columns: readonly ExpandableDisplayColumn[]
    ): readonly ColumnHeaderGroup[] => [
      new ColumnHeaderGroup({
        name: 'group1',
        children: this.virtualColumns.map(c => c.name),
        depth: 1,
        childIndexes: this.virtualColumns.map((_, index) => index),
      }),
      new ColumnHeaderGroup({
        name: 'group2',
        children: columns.slice(this.virtualColumns.length).map(c => c.name),
        depth: 1,
        childIndexes: columns
          .slice(this.virtualColumns.length)
          .map((_, index) => index + this.virtualColumns.length),
      }),
    ]
  );

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    // TODO:
    const groups = this.getCachedColumnHeaderGroups(this.columns);
    log.debug2('get initialColumnHeaderGroups', {
      groups,
      count: groups.length,
    });
    return groups;
    // return EMPTY_ARRAY;
  }

  // get columnHeaderGroupMap(): Map<string, ColumnHeaderGroup> {
  //   this.initializeColumnHeaderGroups();
  //   return this._columnHeaderGroupMap;
  // }

  get initialMovedColumns(): readonly MoveOperation[] {
    // TODO:
    // log.debug('get initialMovedColumns');
    // return this.getCachedMovedColumns(
    //   this.model.columns,
    //   this.schema.hasTotals
    // );
    return EMPTY_ARRAY;
  }

  get columns(): ExpandableDisplayColumn[] {
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
    return (
      (this.rowData?.totalCount ?? 0) + (this.viewportData == null ? 0 : 1)
    );
  }

  get floatingTopRowCount(): number {
    return 0;
  }

  get columnCount(): number {
    return (this.columnData?.totalCount ?? 0) + this.virtualColumns.length;
  }

  get sort(): readonly DhType.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(_: readonly DhType.Sort[]) {
    // No-op, pivot tables do not support sorting
  }

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

    // console.log('handleModelEvent', event.type, event.detail);

    const { detail, type } = event;
    this.dispatchEvent(new EventShimCustomEvent(type, { detail }));
  }

  // TODO: used for debug only, remove
  viewportDataToArray(viewportData: UIViewportData<R> | null): string[][] {
    if (!viewportData) return [];

    return viewportData.rows.map(row =>
      Array.from(row.data.values()).map(cell => String(cell.value ?? ''))
    );
  }

  handlePivotUpdated(
    event: DhType.Event<DhType.coreplus.pivot.PivotSnapshot>
  ): void {
    // get the data from the snapshot, store in the model
    // dispatch model updated event
    const snapshot = event.detail;
    const { columns, rows } = snapshot;
    this.columnData = columns;
    this.rowData = rows;
    this.formattedStringData = [];

    this.viewportData = this.extractSnapshotData(snapshot);
    this.columnHeaderGroups = this.getCachedColumnHeaderGroups(this.columns);

    log.debug(
      'handlePivotUpdated',
      this.viewportDataToArray(this.viewportData),
      this.columns.length,
      this.columnHeaderGroups
    );

    console.log(
      'handlePivotUpdated',
      this.viewportDataToArray(this.viewportData),
      this.columns.length,
      this.columnHeaderGroups,
      this.viewportData
    );

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
    assertNotNull(this.viewport);

    const newData: UIViewportData<R> = {
      // TODO: add columnOffset
      // TODO: should probably get the totals on every update and store separately,
      // then get them conditionally in the row() method
      offset: snapshot.rows.offset + (this.viewport.top === 0 ? 0 : 1), // account for the totals row
      rows: [],
    };

    const virtualColumnCount = this.virtualColumns.length;
    const columnCount = snapshot.columns.count + virtualColumnCount;

    if (this.viewport.top === 0) {
      const totalsRow = new Map<ModelIndex, CellData>();
      const totalKeys = snapshot.rows.getKeys(0);
      // const totalDepth = snapshot.rows.getDepth(0) - 2;
      for (let c = 0; c < columnCount; c += 1) {
        if (c < totalKeys.length) {
          // Does viewport always contain all the keys?
          totalsRow.set(c, {
            // Only render the value for the deepest level
            value: undefined,
          });
        } else if (c === totalKeys.length) {
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
      for (let c = 0; c < columnCount; c += 1) {
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

    // TODO:
    // this.removeListeners(this);

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

  // TODO: remove type annotation after installing the updated grid package
  getCachedFormattedString: (
    formatter: Formatter,
    value: unknown,
    columnType: string,
    columnName: ColumnName,
    formatOverride?: { formatString?: string | null }
  ) => string = memoizeClear(
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

  get isExpandAllAvailable(): boolean {
    return this.pivotTable.expandAll !== undefined;
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

  isRowExpandable(y: ModelIndex): boolean {
    // TODO: add method to get adjusted row index for viewportData
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = y - offset;
    return this.viewportData?.rows[viewportY]?.hasChildren ?? false;
  }

  isRowExpanded(y: ModelIndex): boolean {
    // TODO: add method to get adjusted row index for viewportData
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = y - offset;
    return this.viewportData?.rows[viewportY]?.isExpanded ?? false;
  }

  setRowExpanded(
    y: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    if (y === 0) {
      // TODO: implement this in the API
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

  depthForRow(y: ModelIndex): number {
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = y - offset;
    const depth = this.viewportData?.rows[viewportY]?.depth ?? 0;
    // log.debug2('[0] depthForRow', y, depth);
    return depth;
  }

  /* Expandable Columns */

  get hasExpandableColumns(): boolean {
    return true;
  }

  get isExpandAllColumnsAvailable(): boolean {
    return true;
  }

  expandAllColumns(): void {
    log.debug('expandAllColumns');
  }

  collapseAllColumns(): void {
    log.debug('collapseAllColumns');
  }

  isColumnExpandable(x: ModelIndex): boolean {
    // return this.viewportData?.columns[x]?.hasChildren ?? false;
    // TODO: offset
    return this.columns[x]?.hasChildren ?? false;
  }

  isColumnExpanded(x: ModelIndex): boolean {
    // return this.viewportData?.columns[x]?.isExpanded ?? false;
    // TODO: offset
    return this.columns[x]?.isExpanded ?? false;
  }

  setColumnExpanded(
    x: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    const adjustedX = x - this.virtualColumns.length;
    if (adjustedX < 0) {
      // TODO: implement expand/collapse for the Totals column in the API
      log.debug('Ignore expand/collapse for virtual columns');
      return;
    }
    if (this.isExpandAllAvailable) {
      this.pivotTable.setColumnExpanded(
        adjustedX,
        isExpanded,
        expandDescendants
      );
    } else {
      this.pivotTable.setColumnExpanded(adjustedX, isExpanded);
    }
  }

  depthForColumn(x: ModelIndex): number {
    const depth = this.columns[x]?.depth ?? 0;
    // log.debug2('[0] depthForColumn', x, depth);
    return depth;
  }

  /* / Expandable Columns */

  // TODO: remove type annotation after installing the updated grid package
  getCachedCustomColumnFormatFlag: (
    formatter: Formatter,
    columnName: string,
    columnType: string
  ) => boolean = memoizeClear(FormatterUtils.isCustomColumnFormatDefined, {
    max: 10000,
  });

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
    // TODO: consider moving the totals row logic from extractSnapshotData to this method
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = y - offset;
    return this.viewportData?.rows?.[viewportY] ?? null;
  }

  // TODO: debug method, remove later
  getViewportData(): UIViewportData<R> | null {
    return this.viewportData;
  }

  sourceColumn(column: ModelIndex, row: ModelIndex): DhType.Column {
    // TODO:
    return this.columns[column];
  }

  tokensForCell(
    column: ModelIndex,
    row: ModelIndex,
    visibleLength = 0
  ): Token[] {
    const text = this.textForCell(column, row);
    return this.getCachedTokensInText(text, visibleLength);
  }

  getCachedViewportColumns = memoize(
    (
      columns: readonly DhType.Column[] | undefined
    ): readonly DhType.Column[] | undefined => {
      if (columns == null) {
        return columns;
      }
      return columns.filter(
        c => !this.virtualColumns.some(vc => vc.name === c.name)
      );
    }
  );

  getCachedViewportColumnRange = memoize(
    (
      columns: readonly DhType.Column[] | undefined,
      columnData: DhType.coreplus.pivot.DimensionData | null
    ): DhType.RangeSet => {
      const viewportColumns = this.getCachedViewportColumns(columns);
      if (viewportColumns == null) {
        // TODO: test case with null columnData
        return this.dh.RangeSet.ofRange(0, columnData?.totalCount ?? 0);
      }
      if (viewportColumns.length === 0) {
        // Minimal range is just one column
        return this.dh.RangeSet.ofRange(0, 0);
      }
      const virtualColumnCount = this.virtualColumns.length;
      // console.log('getCachedViewportColumnRange', {
      //   virtualColumnCount,
      //   columns,
      // });
      const sourceColumnIndexes = viewportColumns.map(
        c =>
          (this.getColumnIndexByName(c.name) ?? virtualColumnCount - 1) -
          virtualColumnCount
      );
      const filteredIndexes = sourceColumnIndexes.filter(index => index >= 0);

      // console.log('sourceColumnIndexes', {
      //   sourceColumnIndexes,
      //   filteredIndexes,
      // });

      if (filteredIndexes.length === 0) {
        log.warn(
          'getCachedViewportColumnRange',
          'No valid columns found',
          columns,
          sourceColumnIndexes
        );
        return this.dh.RangeSet.ofRange(0, 0);
      }
      if (filteredIndexes.length !== sourceColumnIndexes.length) {
        // This probably also means the indexes are not contiguous
        log.warn(
          'getCachedViewportColumnRange',
          'Some column indexes are not found in the model',
          columns,
          sourceColumnIndexes
        );
      }

      const minIndex = filteredIndexes[0];
      const maxIndex = filteredIndexes[filteredIndexes.length - 1];

      // Warn if the indexes are not contiguous
      if (filteredIndexes.length !== maxIndex - minIndex + 1) {
        log.warn(
          'getCachedViewportColumnRange',
          'Column indexes are not contiguous',
          columns,
          sourceColumnIndexes
        );
      }
      return this.dh.RangeSet.ofRange(minIndex, maxIndex);
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

      log.debug2('setViewport', this.viewport, {
        totalRowCount: this.rowData?.totalCount,
        thisRowCount: this.rowCount,
      });

      this.applyViewport();
    },
    SET_VIEWPORT_THROTTLE
  );

  getCachedViewportRowRange = memoize(
    (top: number, bottom: number): [number, number] => {
      const viewHeight = bottom - top + 1;
      const viewportTop = Math.max(0, top - viewHeight * this.rowBufferPages);
      const viewportBottom = bottom + viewHeight * this.rowBufferPages;
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
    columns?: readonly DhType.Column[]
  ): void {
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.VIEWPORT_UPDATED)
    );

    // -1 to account for the totals row
    const rowRange = this.dh.RangeSet.ofRange(
      Math.max(0, top - 1),
      Math.max(0, bottom - 1)
    );

    const columnRange = this.getCachedViewportColumnRange(
      columns,
      this.columnData
    );

    const sources = [...this.pivotTable.valueSources];

    log.debug2('applyBufferedViewport', {
      top,
      bottom,
      columns,
      rowRange,
      columnRange,
    });
    this.pivotTable.setViewport({
      rows: rowRange,
      columns: columnRange, // this.dh.RangeSet.ofRange(0, 200), // TODO: columnRange,
      sources,
    });
  }
}

export default IrisGridPivotModel;
