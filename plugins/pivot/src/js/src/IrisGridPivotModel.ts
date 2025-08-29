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
  IrisGridUtils,
  isColumnHeaderGroup,
  type CellData,
  type ColumnName,
  type DisplayColumn,
  type IrisGridThemeType,
  type UITreeRow,
  type UIViewportData,
} from '@deephaven/iris-grid';
import {
  createExpandableDisplayColumn,
  createPlaceholderDisplayColumn,
  createRowSourceColumn,
  makeGrandTotalColumnName,
  makeUniqueGroupName,
  makeVirtualColumn,
  type ExpandableDisplayColumn,
} from './PivotUtils';

const log = Log.module('@deephaven/js-plugin-pivot/IrisGridPivotModel');

const SET_VIEWPORT_THROTTLE = 150;
const APPLY_VIEWPORT_THROTTLE = 0;
const ROW_BUFFER_PAGES = 1;

export interface IrisGridPivotModelConfig {
  rowBufferPages?: number;
}

export type UIPivotRow = UITreeRow & {
  keyData: Map<ModelIndex, CellData>;
  totalsData: Map<number, CellData>;
};

export type UIPivotViewportData<R extends UIPivotRow = UIPivotRow> =
  UIViewportData<R> & {
    columnOffset: number;
    rowTotalCount: number;
    totalsRow: R;
  };

export const GRAND_TOTAL_GROUP_NAME = 'Grand Totals';

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
class IrisGridPivotModel<R extends UIPivotRow = UIPivotRow>
  extends IrisGridModel
  implements ExpandableGridModel, ExpandableColumnGridModel
{
  private pivotTable: DhType.coreplus.pivot.PivotTable;

  private keyColumns: readonly ExpandableDisplayColumn[];

  private totalsColumns: readonly ExpandableDisplayColumn[];

  private virtualColumns: readonly ExpandableDisplayColumn[];

  private _layoutHints: DhType.LayoutHints | null | undefined;

  private _columnHeaderGroupMap: Map<string, ColumnHeaderGroup> = new Map();

  private columnHeaderParentMap: Map<string, ColumnHeaderGroup> = new Map();

  private _columnHeaderMaxDepth: number | null = null;

  private _columnHeaderGroups: ColumnHeaderGroup[] = [];

  private _isColumnHeaderGroupsInitialized = false;

  private viewportData: UIPivotViewportData<R> | null = null;

  private snapshotColumns: DhType.coreplus.pivot.DimensionData | null = null;

  private snapshotValueSources: DhType.coreplus.pivot.PivotSource[] = [];

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

    this.keyColumns = pivotTable.rowSources.map((source, col) =>
      createRowSourceColumn(source, col)
    );

    this.totalsColumns = pivotTable.valueSources.map((source, col) =>
      makeVirtualColumn({
        name: makeGrandTotalColumnName(col),
        displayName: source.name,
        type: source.type,
        index: pivotTable.rowSources.length + col,
        depth: 2,
        isExpanded: true,
        hasChildren: true,
      })
    );

    this.virtualColumns = [...this.keyColumns, ...this.totalsColumns];

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

  getCachedColumns = memoize(
    (
      snapshotColumns: DhType.coreplus.pivot.DimensionData | null,
      valueSources: DhType.coreplus.pivot.PivotSource[]
    ) => {
      if (snapshotColumns == null) {
        log.debug('getCachedColumns', {
          snapshotColumns,
          valueSources,
        });
        return this.virtualColumns;
      }
      const columns = [...this.virtualColumns];
      for (let i = 0; i < snapshotColumns.totalCount; i += 1) {
        const isColumnInViewport =
          i >= snapshotColumns.offset &&
          i < snapshotColumns.offset + snapshotColumns.count;
        // TODO: how do we count multiple value sources? are they included in the totalCount?
        columns.push(
          isColumnInViewport
            ? createExpandableDisplayColumn(
                snapshotColumns,
                valueSources[0],
                i,
                this.virtualColumns.length
              )
            : createPlaceholderDisplayColumn(
                valueSources[0],
                i,
                this.virtualColumns.length
              )
        );
      }
      log.debug2('getCachedColumns', {
        columns: columns.map(({ name }) => ({ name })),
        count: snapshotColumns.count,
        offset: snapshotColumns.offset,
      });
      return columns;
    }
  );

  private getCachedColumnHeaderGroups = memoize(
    (
      columns: readonly ExpandableDisplayColumn[]
    ): readonly ColumnHeaderGroup[] => {
      const childrenMap = new Map();
      let children: ExpandableDisplayColumn[] = [];
      let lastParent = this.virtualColumns.length;
      columns.slice(this.virtualColumns.length).forEach((c, index) => {
        if (index === 0 && c.depth !== 2) {
          throw new Error('First column should be a group column');
        }
        if (c.depth === 2) {
          children = [];
          lastParent = this.virtualColumns.length + index;
          childrenMap.set(lastParent, children);
        }
        children.push(c);
      });

      log.debug(
        'getCachedColumnHeaderGroups',
        [...childrenMap],
        columns.slice(this.virtualColumns.length)
      );

      const headerGroups = [
        new ColumnHeaderGroup({
          name: this.pivotTable.columnSources[0].name,
          color: '#211f22',
          children: this.keyColumns.map(c => c.name),
          depth: 1,
          childIndexes: this.keyColumns.map((_, index) => index),
        }),
        new ColumnHeaderGroup({
          name: GRAND_TOTAL_GROUP_NAME,
          color: '#211f22',
          children: this.totalsColumns.map(c => c.name),
          depth: 1,
          childIndexes: this.totalsColumns.map(
            (_, index) => index + this.keyColumns.length
          ),
        }),

        ...[...childrenMap.values()].map(
          ch =>
            new ColumnHeaderGroup({
              name: makeUniqueGroupName(ch[0].name),
              displayName: ch[0].displayName,
              children: ch.map((col, index) => col.name),
              depth: 1,
              childIndexes: ch.map(col => columns.indexOf(col)),
            })
        ),

        // new ColumnHeaderGroup({
        //   name: 'group2',
        //   children: columns.slice(this.virtualColumns.length).map(c => c.name),
        //   depth: 1,
        //   childIndexes: columns
        //     .slice(this.virtualColumns.length)
        //     .map((_, index) => index + this.virtualColumns.length),
        // }),
      ];
      return headerGroups;
    }
  );

  // TODO: start

  getMemoizedInitialColumnHeaderGroups = memoize(
    (layoutHints?: DhType.LayoutHints) =>
      IrisGridUtils.parseColumnHeaderGroups(
        this,
        layoutHints?.columnGroups ?? []
      ).groups
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

  get columnHeaderMaxDepth(): number {
    return this._columnHeaderMaxDepth ?? 1;
  }

  private set columnHeaderMaxDepth(depth: number) {
    this._columnHeaderMaxDepth = depth;
  }

  get columnHeaderGroupMap(): Map<string, ColumnHeaderGroup> {
    this.initializeColumnHeaderGroups();
    return this._columnHeaderGroupMap;
  }

  get columnHeaderGroups(): ColumnHeaderGroup[] {
    this.initializeColumnHeaderGroups();
    return this._columnHeaderGroups;
  }

  set columnHeaderGroups(groups: readonly ColumnHeaderGroup[]) {
    if (groups === this._columnHeaderGroups) {
      return;
    }

    const {
      groups: newGroups,
      maxDepth,
      parentMap,
      groupMap,
    } = IrisGridUtils.parseColumnHeaderGroups(
      this,
      groups ?? this.initialColumnHeaderGroups
    );

    this._columnHeaderGroups = newGroups;
    this.columnHeaderMaxDepth = maxDepth;
    this.columnHeaderParentMap = parentMap;
    this._columnHeaderGroupMap = groupMap;
    this._isColumnHeaderGroupsInitialized = true;
  }

  private initializeColumnHeaderGroups(): void {
    if (!this._isColumnHeaderGroupsInitialized) {
      this.columnHeaderGroups = IrisGridUtils.parseColumnHeaderGroups(
        this,
        this.initialColumnHeaderGroups
      ).groups;
    }
  }

  textForColumnHeader(x: ModelIndex, depth = 0): string | undefined {
    const header = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(header)) {
      return header.isNew ? '' : header.displayName ?? header.name;
    }
    return x < this.virtualColumns.length
      ? header?.displayName ?? header?.name
      : this.snapshotValueSources[
          (x - this.virtualColumns.length) % this.snapshotValueSources.length
        ].name; // ;
  }

  colorForColumnHeader(x: ModelIndex, depth = 0): string | null {
    const column = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(column)) {
      return column.color ?? null;
    }
    return null;
  }

  getColumnHeaderGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    const group = this.columnAtDepth(modelIndex, depth);
    if (isColumnHeaderGroup(group)) {
      return group;
    }
    return undefined;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    return this.columnHeaderParentMap.get(
      this.columnAtDepth(modelIndex, depth)?.name ?? ''
    );
  }

  columnAtDepth(
    x: ModelIndex,
    depth = 0
  ): ColumnHeaderGroup | DisplayColumn | undefined {
    if (depth === 0) {
      return this.columns[x];
    }

    const columnName = this.columns[x]?.name;
    let group = this.columnHeaderParentMap.get(columnName);

    if (!group) {
      return undefined;
    }

    let currentDepth = group.depth;
    while (currentDepth < depth) {
      group = this.columnHeaderParentMap.get(group.name);
      if (!group) {
        return undefined;
      }
      currentDepth = group.depth;
    }

    if (group.depth === depth) {
      return group;
    }

    return undefined;
  }

  // TODO: end

  get initialMovedColumns(): readonly MoveOperation[] {
    // TODO:
    // log.debug('get initialMovedColumns');
    // return this.getCachedMovedColumns(
    //   this.model.columns,
    //   this.schema.hasTotals
    // );
    return EMPTY_ARRAY;
  }

  get columns(): readonly ExpandableDisplayColumn[] {
    return this.getCachedColumns(
      this.snapshotColumns,
      this.snapshotValueSources
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
    return this.viewportData?.rowTotalCount ?? 0;
  }

  get floatingTopRowCount(): number {
    return 0;
  }

  get columnCount(): number {
    return this.columns.length;
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
    // Get the data from the snapshot, store in the model,
    // dispatch column and model update events
    const prevColumns = this.columns;
    const snapshot = event.detail;
    const { columns } = snapshot;
    this.snapshotColumns = columns;
    // Value sources returned with the snapshot can differ from the original pivotTable.valueSources
    this.snapshotValueSources = snapshot.valueSources;
    // Reset formatted string cache
    this.formattedStringData = [];

    this.viewportData = this.extractSnapshotData(snapshot);
    // Update column groups based on the new columns
    this.columnHeaderGroups = this.getCachedColumnHeaderGroups(this.columns);

    log.debug2(
      'Pivot updated',
      this.viewportDataToArray(this.viewportData),
      this.columns.length,
      this.columnHeaderGroups
    );

    // TODO: this seems to be always true,
    // snapshot.columns is always a new reference, even if the columns haven't changed
    // TODO: file a bug?
    if (
      prevColumns.length !== this.columns.length ||
      prevColumns.some((col, i) => col.name !== this.columns[i].name)
    ) {
      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
          detail: this.columns,
        })
      );
    } else {
      log.debug2('Pivot columns did not change');
    }

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  extractSnapshotData(
    snapshot: DhType.coreplus.pivot.PivotSnapshot
  ): UIPivotViewportData<R> {
    const totalsRowData = new Map<ModelIndex, CellData>();
    const grandTotals = new Map<ModelIndex, CellData>();

    for (let v = 0; v < snapshot.valueSources.length; v += 1) {
      grandTotals.set(v, {
        value: snapshot.getGrandTotal(snapshot.valueSources[v]),
      });

      // TODO: implement valueSources properly
      for (let c = 0; c < snapshot.columns.count; c += 1) {
        const value = snapshot.columns.getTotal(
          c + snapshot.columns.offset,
          snapshot.valueSources[v]
        );
        totalsRowData.set(c + snapshot.columns.offset, { value });
      }
    }

    const totalsRow = {
      data: totalsRowData,
      isExpanded: true,
      hasChildren: true,
      // TODO: correct depth?
      depth: 0,
      totalsData: grandTotals,
      // All entries undefined in the totals row key cells
      keyData: new Map<ModelIndex, CellData>(),
    } as R;

    const rows: R[] = [];

    for (let r = 0; r < snapshot.rows.count; r += 1) {
      const newRow = new Map<ModelIndex, CellData>();
      const keys = snapshot.rows.getKeys(r + snapshot.rows.offset);
      const depth = snapshot.rows.getDepth(r + snapshot.rows.offset) - 1;
      // Key column index to cell data
      const keyData = new Map<ModelIndex, CellData>();
      // Value source index to cell data
      const totalsData = new Map<ModelIndex, CellData>();

      for (let c = 0; c < keys.length; c += 1) {
        keyData.set(c, {
          // Only render the value for the deepest level
          value: c === depth - 1 ? keys[c] : undefined,
        });
      }

      for (let v = 0; v < snapshot.valueSources.length; v += 1) {
        totalsData.set(v, {
          value: snapshot.rows.getTotal(
            r + snapshot.rows.offset,
            snapshot.valueSources[v]
          ),
        });
      }

      for (let c = 0; c < snapshot.columns.count; c += 1) {
        const value = snapshot.getValue(
          // TODO: implement valueSources properly
          snapshot.valueSources[0],
          r + snapshot.rows.offset,
          c + snapshot.columns.offset
        );
        newRow.set(c + snapshot.columns.offset, { value });
        // }
      }
      rows.push({
        data: newRow,
        // TODO: implement valueSources properly
        isExpanded: snapshot.rows.isExpanded(r + snapshot.rows.offset),
        hasChildren: snapshot.rows.hasChildren(r + snapshot.rows.offset),
        depth,
        keyData,
        totalsData,
      } as R);
    }

    return {
      columnOffset: snapshot.columns.offset,
      offset: snapshot.rows.offset,
      rows,
      // Adjust for the totals row
      rowTotalCount: snapshot.rows.totalCount + 1,
      totalsRow,
    };
  }

  async snapshot(
    ranges: readonly GridRange[],
    includeHeaders = false,
    formatValue: (value: unknown, column: DhType.Column) => unknown = value =>
      value,
    consolidateRanges = true
  ): Promise<unknown[][]> {
    // TODO: throw?
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
    // TODO: enable when DH-20125: Implement expand/collapse for pivot table is implemented
    return false;
    // return this.pivotTable.expandAll !== undefined;
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
    if (y === 0) {
      // Render the root row as expandable, but disable expand/collapse until DH-20125 is implemented
      return true;
    }
    return this.row(y)?.hasChildren ?? false;
  }

  isRowExpanded(y: ModelIndex): boolean {
    if (y === 0) {
      // Render the root row as expanded, but disable expand/collapse until DH-20125 is implemented
      return true;
    }
    return this.row(y)?.isExpanded ?? false;
  }

  setRowExpanded(
    y: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    if (y === 0) {
      // DH-20125: Pivot Expansion and Collapse API Changes
      log.debug('Ignore expand/collapse for the totals row');
      return;
    }
    // Adjust y for the totals row
    this.pivotTable.setRowExpanded(y - 1, isExpanded, expandDescendants);
  }

  depthForRow(y: ModelIndex): number {
    return this.row(y)?.depth ?? 0;
  }

  /* Expandable Columns */

  get hasExpandableColumns(): boolean {
    return true;
  }

  get isExpandAllColumnsAvailable(): boolean {
    // TODO: enable when DH-20125: Implement expand/collapse for pivot table is implemented
    return false;
  }

  expandAllColumns(): void {
    log.debug('expandAllColumns');
  }

  collapseAllColumns(): void {
    log.debug('collapseAllColumns');
  }

  isColumnExpandable(x: ModelIndex): boolean {
    return this.columns[x]?.hasChildren ?? false;
  }

  isColumnExpanded(x: ModelIndex): boolean {
    return this.columns[x]?.isExpanded ?? false;
  }

  setColumnExpanded(
    x: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    const adjustedX = x - this.virtualColumns.length;
    if (adjustedX < 0) {
      // DH-20125: Pivot Expansion and Collapse API Changes
      log.debug('Ignore expand/collapse for virtual columns');
      return;
    }
    this.pivotTable.setColumnExpanded(adjustedX, isExpanded, expandDescendants);
  }

  depthForColumn(x: ModelIndex): number {
    const depth = this.columns[x]?.depth ?? 0;
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
    // TODO: unit tests
    return x < this.virtualColumns.length
      ? this.virtualColumns[x]
      : this.snapshotValueSources[
          (x - this.virtualColumns.length) % this.snapshotValueSources.length
        ];
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
    // TODO: store keyColumns or keyCount in the model
    const keyCount =
      this.virtualColumns.length - this.snapshotValueSources.length;
    if (x < keyCount) {
      return this.row(y)?.keyData.get(x);
    }
    if (x < this.virtualColumns.length) {
      return this.row(y)?.totalsData.get(x - keyCount);
    }
    return this.row(y)?.data.get(x - this.virtualColumns.length);
  }

  formatForCell(x: ModelIndex, y: ModelIndex): DhType.Format | undefined {
    return this.dataForCell(x, y)?.format;
  }

  valueForCell(x: ModelIndex, y: ModelIndex): unknown {
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
    if (y === 0) {
      return this.viewportData?.totalsRow ?? null;
    }
    const offset = this.viewportData?.offset ?? 0;
    // Adjust for the totals row
    const viewportY = y - offset - 1;
    return this.viewportData?.rows?.[viewportY] ?? null;
  }

  // TODO: debug method, remove later
  getViewportData(): UIPivotViewportData<R> | null {
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

  getCachedDataColumns = memoize(
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
      viewportColumns: readonly DhType.Column[] | undefined,
      totalColumnCount: number
    ): DhType.RangeSet => {
      // TODO: cleanup
      // Get non-virtual columns
      const dataColumns = this.getCachedDataColumns(viewportColumns);
      if (dataColumns == null) {
        return this.dh.RangeSet.ofRange(0, totalColumnCount);
      }
      if (dataColumns.length === 0) {
        // Minimal valid range is just one column
        return this.dh.RangeSet.ofRange(0, 0);
      }
      const virtualColumnCount = this.virtualColumns.length;
      // console.log('getCachedViewportColumnRange', {
      //   virtualColumnCount,
      //   columns,
      // });
      const sourceColumnIndexes = dataColumns.map(
        c =>
          (this.getColumnIndexByName(c.name) ?? virtualColumnCount - 1) -
          virtualColumnCount
      );
      const filteredIndexes = sourceColumnIndexes.filter(index => index >= 0);

      if (filteredIndexes.length === 0) {
        log.warn(
          'getCachedViewportColumnRange',
          'No valid columns found',
          viewportColumns,
          sourceColumnIndexes
        );
        return this.dh.RangeSet.ofRange(0, 0);
      }
      if (filteredIndexes.length !== sourceColumnIndexes.length) {
        // This probably also means the indexes are not contiguous
        log.warn(
          'getCachedViewportColumnRange',
          'Some column indexes are not found in the model',
          viewportColumns,
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
          viewportColumns,
          sourceColumnIndexes
        );
      }
      return this.dh.RangeSet.ofRange(minIndex, maxIndex);
    }
  );

  setViewport = throttle(
    (
      top: VisibleIndex,
      bottom: VisibleIndex,
      columns?: readonly DhType.Column[]
    ) => {
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
      this.columns.length
    );

    log.debug2('applyBufferedViewport', {
      top,
      bottom,
      columns,
      rowRange,
      columnRange,
    });
    this.pivotTable.setViewport({
      rows: rowRange,
      columns: columnRange,
      // Update this when the UI supports selecting specific value sources.
      // Request all value sources for now.
      sources: this.pivotTable.valueSources,
    });
  }
}

export default IrisGridPivotModel;
