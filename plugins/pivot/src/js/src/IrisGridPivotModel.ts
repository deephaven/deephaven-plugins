/* eslint class-methods-use-this: "off" */
/* eslint no-underscore-dangle: "off" */
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import Log from '@deephaven/log';
import { Formatter, FormatterUtils, TableUtils } from '@deephaven/jsapi-utils';
import {
  assertNotNull,
  EMPTY_ARRAY,
  EventShimCustomEvent,
} from '@deephaven/utils';
import {
  memoizeClear,
  type ExpandableGridModel,
  type ExpandableColumnGridModel,
  type ModelIndex,
  type MoveOperation,
  type Token,
  type VisibleIndex,
} from '@deephaven/grid';
import {
  IrisGridModel,
  IrisGridUtils,
  type CellData,
  type ColumnName,
  type DisplayColumn,
  type IrisGridThemeType,
  type UITreeRow,
  type UIViewportData,
  type UITotalsTableConfig,
  type PendingDataMap,
  type PendingDataErrorMap,
} from '@deephaven/iris-grid';
import {
  checkColumnsChanged,
  makeExpandableDisplayColumn,
  makePlaceholderDisplayColumn,
  makeRowSourceColumn,
  makeGrandTotalColumnName,
  makeColumn,
  type ExpandableDisplayColumn,
  getColumnGroups,
  isCorePlusDh,
} from './PivotUtils';
import {
  ExpandableColumnHeaderGroup,
  isExpandableColumnHeaderGroup,
} from './ExpandableColumnHeaderGroup';
import IrisGridPivotTheme from './IrisGridPivotTheme';

const log = Log.module('@deephaven/js-plugin-pivot/IrisGridPivotModel');

const SET_VIEWPORT_THROTTLE = 150;
const APPLY_VIEWPORT_THROTTLE = 0;
const ROW_BUFFER_PAGES = 1;
const COLUMN_BUFFER_PAGES = 1;

export interface IrisGridPivotModelConfig {
  rowBufferPages?: number;
  columnBufferPages?: number;
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
  private pivotTable: CorePlusDhType.coreplus.pivot.PivotTable;

  private keyColumns: readonly ExpandableDisplayColumn[];

  private _layoutHints: DhType.LayoutHints | null | undefined;

  private _columnHeaderGroupMap: Map<string, ExpandableColumnHeaderGroup> =
    new Map();

  private columnHeaderParentMap: Map<string, ExpandableColumnHeaderGroup> =
    new Map();

  private _columnHeaderMaxDepth: number | null = null;

  private _columnHeaderGroups: ExpandableColumnHeaderGroup[] = [];

  private _isColumnHeaderGroupsInitialized = false;

  private viewportData: UIPivotViewportData<R> | null = null;

  private formattedStringData: (string | null)[][] = [];

  private snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData | null =
    null;

  private snapshotValueSources: CorePlusDhType.coreplus.pivot.PivotSource[] =
    [];

  private irisFormatter: Formatter;

  // Pending expand/collapse state to apply when the next pivot update is received
  private pendingIsRootRowExpanded = true;

  private pendingIsRootColumnExpanded = true;

  private _isRootRowExpanded = true;

  private _isRootColumnExpanded = true;

  private viewport: {
    top: VisibleIndex;
    bottom: VisibleIndex;
    columns?: readonly DhType.Column[];
  } | null = null;

  private readonly rowBufferPages: number;

  private readonly columnBufferPages: number;

  constructor(
    dh: typeof DhType | typeof CorePlusDhType,
    pivotTable: CorePlusDhType.coreplus.pivot.PivotTable,
    formatter = new Formatter(dh),
    config: IrisGridPivotModelConfig = {}
  ) {
    if (!isCorePlusDh(dh)) {
      throw new Error('CorePlus is not available');
    }

    super(dh);

    this.dh = dh;

    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.handleModelEvent = this.handleModelEvent.bind(this);
    this.handlePivotUpdated = this.handlePivotUpdated.bind(this);

    this.pivotTable = pivotTable;
    this.irisFormatter = formatter;

    // Use the value sources from the pivot table initially,
    // will be updated when the UI supports value source selection
    this.snapshotValueSources = pivotTable.valueSources;

    this.rowBufferPages = config.rowBufferPages ?? ROW_BUFFER_PAGES;
    this.columnBufferPages = config.columnBufferPages ?? COLUMN_BUFFER_PAGES;

    // Key columns don't change on snapshot updates, as opposed to totals and value sources
    this.keyColumns = pivotTable.rowSources.map((source, col) =>
      makeRowSourceColumn(source, col)
    );

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

  dh: typeof CorePlusDhType;

  get filter(): readonly DhType.FilterCondition[] {
    return EMPTY_ARRAY;
  }

  set filter(_: readonly DhType.FilterCondition[]) {
    // No-op
    // TODO: DH-20363: Add support for Pivot filters
  }

  get sort(): readonly DhType.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(_: readonly DhType.Sort[]) {
    // No-op
    // TODO: DH-XXXXX: Add support for Pivot sorting
  }

  get customColumns(): readonly string[] {
    return EMPTY_ARRAY;
  }

  get formatColumns(): readonly [] {
    return [];
  }

  get rollupConfig(): null {
    return null;
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return null;
  }

  get pendingDataErrors(): PendingDataErrorMap {
    return new Map();
  }

  get pendingDataMap(): PendingDataMap {
    return new Map();
  }

  set pendingDataMap(_map: PendingDataMap) {
    // No-op
    // Pivot tables do not support pending data
  }

  get pendingRowCount(): number {
    return 0;
  }

  set pendingRowCount(_count: number) {
    // No-op
    // Pivot tables do not support pending data
  }

  get selectDistinctColumns(): readonly string[] {
    return [];
  }

  async columnStatistics(
    column: DhType.Column
  ): Promise<DhType.ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  async commitPending(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async seekRow(
    startRow: ModelIndex,
    column: DhType.Column,
    valueType: string,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<ModelIndex> {
    throw new Error('Method not implemented.');
  }

  async valuesTable(
    columns: DhType.Column | readonly DhType.Column[]
  ): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  async export(): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  async showFilter(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async quickFilter(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async autoResizeColumns(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async applySort(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async clearFilter(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async applyFilter(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async copy(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getCachedColumns = memoize(
    (
      snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData | null,
      virtualColumns: readonly ExpandableDisplayColumn[],
      valueSources: readonly CorePlusDhType.coreplus.pivot.PivotSource[]
    ) => {
      if (snapshotColumns == null) {
        log.debug2('getCachedColumns', {
          snapshotColumns,
          valueSources,
        });
        return virtualColumns;
      }
      const columns = [...virtualColumns];
      for (let i = 0; i < snapshotColumns.totalCount; i += 1) {
        const isColumnInViewport =
          i >= snapshotColumns.offset &&
          i < snapshotColumns.offset + snapshotColumns.count;
        for (let v = 0; v < valueSources.length; v += 1) {
          columns.push(
            isColumnInViewport
              ? makeExpandableDisplayColumn(
                  snapshotColumns,
                  valueSources[v],
                  i,
                  virtualColumns.length
                )
              : makePlaceholderDisplayColumn(
                  valueSources[v],
                  i,
                  virtualColumns.length
                )
          );
        }
      }
      log.debug2('getCachedColumns', {
        snapshotColumns,
        valueSources,
        columns: columns.map(({ name }) => name),
      });
      return columns;
    }
  );

  getCachedTotalsColumns = memoize(
    (pivotTable, valueSources): readonly ExpandableDisplayColumn[] =>
      valueSources.map(
        (source: CorePlusDhType.coreplus.pivot.PivotSource, col: number) =>
          makeColumn({
            name: makeGrandTotalColumnName(source),
            displayName: source.name,
            description: source.description,
            type: source.type,
            index: pivotTable.rowSources.length + col,
            depth: 2,
            isExpanded: true,
            hasChildren: true,
          })
      )
  );

  get totalsColumns(): readonly ExpandableDisplayColumn[] {
    return this.getCachedTotalsColumns(
      this.pivotTable,
      this.snapshotValueSources
    );
  }

  getCachedVirtualColumns = memoize(
    (
      keyColumns: readonly ExpandableDisplayColumn[],
      totalsColumns: readonly ExpandableDisplayColumn[]
    ) => [...keyColumns, ...totalsColumns]
  );

  get virtualColumns(): readonly ExpandableDisplayColumn[] {
    return this.getCachedVirtualColumns(this.keyColumns, this.totalsColumns);
  }

  /**
   * Get the cached column header groups.
   * Returns groups for the key columns, totals, and the snapshot column in the current viewport.
   * Placeholder columns are not included in the groups.
   */
  private getCachedColumnHeaderGroups = memoize(
    (
      snapshotColumns: CorePlusDhType.coreplus.pivot.DimensionData | null,
      isRootColumnExpanded?: boolean,
      formatValue?: (value: unknown, type: string) => string
    ): readonly ExpandableColumnHeaderGroup[] =>
      getColumnGroups(
        this.pivotTable,
        snapshotColumns,
        isRootColumnExpanded,
        formatValue
      )
  );

  get initialColumnHeaderGroups(): readonly ExpandableColumnHeaderGroup[] {
    const groups = this.getCachedColumnHeaderGroups(
      this.snapshotColumns,
      this.isRootColumnExpanded,
      (value, type) =>
        // Ignore name based formatting, pass empty column name
        this.getCachedFormattedString(this.formatter, value, type, '')
    );
    log.debug2('initialColumnHeaderGroups', groups);
    return groups;
  }

  get columnHeaderMaxDepth(): number {
    return this._columnHeaderMaxDepth ?? 1;
  }

  private set columnHeaderMaxDepth(depth: number) {
    this._columnHeaderMaxDepth = depth;
  }

  get columnHeaderGroupMap(): Map<string, ExpandableColumnHeaderGroup> {
    this.initializeColumnHeaderGroups();
    return this._columnHeaderGroupMap;
  }

  get columnHeaderGroups(): readonly ExpandableColumnHeaderGroup[] {
    this.initializeColumnHeaderGroups();
    return this._columnHeaderGroups;
  }

  set columnHeaderGroups(_groups: readonly ExpandableColumnHeaderGroup[]) {
    // no-op
    // IrisGridPivotModel manages its own column header groups
  }

  private setInternalColumnHeaderGroups(
    groups: readonly ExpandableColumnHeaderGroup[]
  ) {
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
      groups,
      args => new ExpandableColumnHeaderGroup(args)
    );
    this._columnHeaderGroups = newGroups;
    this.columnHeaderMaxDepth = maxDepth;
    this.columnHeaderParentMap = parentMap;
    this._columnHeaderGroupMap = groupMap;
    this._isColumnHeaderGroupsInitialized = true;
  }

  private initializeColumnHeaderGroups(): void {
    if (!this._isColumnHeaderGroupsInitialized) {
      this.setInternalColumnHeaderGroups(this.initialColumnHeaderGroups);
    }
  }

  textForColumnHeader(x: ModelIndex, depth = 0): string | undefined {
    const header = this.columnAtDepth(x, depth);
    if (isExpandableColumnHeaderGroup(header)) {
      return header.isNew ? '' : header.displayName ?? header.name;
    }
    return header?.displayName ?? header?.name;
  }

  colorForColumnHeader(
    x: ModelIndex,
    depth = 0,
    theme: Partial<typeof IrisGridPivotTheme> = {}
  ): string | null {
    const column = this.columnAtDepth(x, depth);
    if (isExpandableColumnHeaderGroup(column)) {
      if (column.isTotalGroup != null && column.isTotalGroup) {
        return theme.totalsHeaderBackground ?? null;
      }
      if (column.isKeyColumnGroup != null && column.isKeyColumnGroup) {
        return theme.columnSourceHeaderBackground ?? null;
      }
    }
    return null;
  }

  getColumnHeaderGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ExpandableColumnHeaderGroup | undefined {
    const group = this.columnAtDepth(modelIndex, depth);
    if (isExpandableColumnHeaderGroup(group)) {
      return group;
    }
    return undefined;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ExpandableColumnHeaderGroup | undefined {
    return this.columnHeaderParentMap.get(
      this.columnAtDepth(modelIndex, depth)?.name ?? ''
    );
  }

  columnAtDepth(
    x: ModelIndex,
    depth = 0
  ): ExpandableColumnHeaderGroup | DisplayColumn | undefined {
    if (depth === 0) {
      return this.columns[x];
    }

    const columnName = this.columns[x]?.name;
    let group = this.columnHeaderParentMap.get(columnName);

    if (group == null) {
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

  get initialMovedColumns(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  get columns(): readonly ExpandableDisplayColumn[] {
    return this.getCachedColumns(
      this.snapshotColumns,
      this.virtualColumns,
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
    // TODO: DH-20363: Add support for Pivot filters
    return false;
  }

  isColumnSortable(columnIndex: ModelIndex): boolean {
    // TODO: DH-20435: Add support for Pivot sorting
    return false;
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

  /**
   * Get the index of the column in the snapshot by its name.
   * @param name Column name
   * @returns Snapshot index or undefined if not found
   */
  getSnapshotColumnIndexByName(
    name: ColumnName,
    virtualColumnCount: number,
    snapshotValueSourceCount: number
  ): number | undefined {
    const index = this.getColumnIndexByName(name);
    return index == null
      ? undefined
      : Math.floor((index - virtualColumnCount) / snapshotValueSourceCount);
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

  handlePivotUpdated(
    event: CorePlusDhType.Event<CorePlusDhType.coreplus.pivot.PivotSnapshot>
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

    this.updatePendingExpandCollapseState();

    // Update column groups based on the new columns and expand/collapse state
    this.setInternalColumnHeaderGroups(this.initialColumnHeaderGroups);

    log.debug2('Pivot updated', {
      columns: this.columns,
      snapshot: this.snapshotColumns,
      viewport: this.viewportData?.rowTotalCount,
      columnCount: this.columnCount,
      rowCount: this.rowCount,
    });

    // snapshot.columns is always a new reference, even if the columns haven't changed
    if (checkColumnsChanged(prevColumns, this.columns)) {
      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
          detail: this.columns,
        })
      );
    } else {
      log.debug2('Pivot columns did not change in the update');
    }

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  extractSnapshotData(
    snapshot: CorePlusDhType.coreplus.pivot.PivotSnapshot
  ): UIPivotViewportData<R> {
    const totalsRowData = new Map<ModelIndex, CellData>();
    const grandTotals = new Map<ModelIndex, CellData>();

    for (let v = 0; v < snapshot.valueSources.length; v += 1) {
      grandTotals.set(v, {
        value: snapshot.getGrandTotal(snapshot.valueSources[v]),
      });

      for (let c = 0; c < snapshot.columns.count; c += 1) {
        const value = snapshot.columns.getTotal(
          c + snapshot.columns.offset,
          snapshot.valueSources[v]
        );
        totalsRowData.set(
          (c + snapshot.columns.offset) * snapshot.valueSources.length + v,
          { value }
        );
      }
    }

    const totalsRow = {
      data: totalsRowData,
      isExpanded: true,
      hasChildren: true,
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

        for (let c = 0; c < snapshot.columns.count; c += 1) {
          const value = snapshot.getValue(
            snapshot.valueSources[v],
            r + snapshot.rows.offset,
            c + snapshot.columns.offset
          );
          newRow.set(
            (c + snapshot.columns.offset) * snapshot.valueSources.length + v,
            { value }
          );
        }
      }

      rows.push({
        data: newRow,
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

  async snapshot(): Promise<unknown[][]> {
    throw new Error('snapshot not implemented for PivotTable');
  }

  async textSnapshot(): Promise<string> {
    throw new Error('textSnapshot not implemented for PivotTable');
  }

  truncationCharForCell(x: ModelIndex): '#' | undefined {
    const column = this.columns[x];
    const { type } = column;

    if (
      TableUtils.isNumberType(type) &&
      this.formatter.truncateNumbersWithPound
    ) {
      return '#';
    }

    return undefined;
  }

  colorForCell(x: ModelIndex, y: ModelIndex, theme: IrisGridThemeType): string {
    const data = this.dataForCell(x, y);
    if (data) {
      const { format, value } = data;
      if (value == null || value === '') {
        assertNotNull(theme.nullStringColor);
        return theme.nullStringColor;
      }
      if (format?.color != null && format.color !== '') {
        return format.color;
      }

      // Fallback to formatting based on the value/type of the cell
      if (value != null) {
        const column = this.sourceColumn(x, y);
        return IrisGridUtils.colorForValue(
          theme,
          column.type,
          column.name,
          value
        );
      }
    }

    return theme.textColor;
  }

  backgroundColorForCell(
    x: ModelIndex,
    y: ModelIndex,
    theme: IrisGridThemeType
  ): string | null {
    return this.formatForCell(x, y)?.backgroundColor ?? null;
  }

  textAlignForCell(x: ModelIndex, y: ModelIndex): CanvasTextAlign {
    const column = this.sourceColumn(x, y);

    return IrisGridUtils.textAlignForValue(column.type, column.name);
  }

  startListening(): void {
    super.startListening();

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
    this.pivotTable.close();
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
    return true;
  }

  get isRootRowExpanded(): boolean {
    return this._isRootRowExpanded;
  }

  set isRootRowExpanded(value: boolean) {
    this.pendingIsRootRowExpanded = value;
  }

  get isRootColumnExpanded(): boolean {
    return this._isRootColumnExpanded;
  }

  set isRootColumnExpanded(value: boolean) {
    this.pendingIsRootColumnExpanded = value;
  }

  private updatePendingExpandCollapseState(): void {
    this._isRootRowExpanded = this.pendingIsRootRowExpanded;
    this._isRootColumnExpanded = this.pendingIsRootColumnExpanded;
  }

  expandAll(): void {
    // Don't check if the root is already expanded, just expand again with all descendants
    this.pivotTable.setRootRowExpanded(true, true);
    this.isRootRowExpanded = true;
    this.pivotTable.setRootColumnExpanded(true, true);
    this.isRootColumnExpanded = true;
  }

  collapseAll(): void {
    // Don't check if the root is already collapsed, just collapse again with all descendants
    this.pivotTable.setRootRowExpanded(false, true);
    this.isRootRowExpanded = false;
    this.pivotTable.setRootColumnExpanded(false, true);
    this.isRootColumnExpanded = false;
  }

  isRowExpandable(y: ModelIndex): boolean {
    if (y === 0) {
      // Render the root row as expandable, but disable expand/collapse until DH-20125 is implemented
      return !this.isRootRowExpanded || this.rowCount > 1;
    }
    return this.row(y)?.hasChildren ?? false;
  }

  isRowExpanded(y: ModelIndex): boolean {
    if (y === 0) {
      // Render the root row as expanded, but disable expand/collapse until DH-20125 is implemented
      return this.isRootRowExpanded;
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
      // log.debug('Ignore expand/collapse for the totals row');
      this.pivotTable.setRootRowExpanded(isExpanded, expandDescendants);
      this.isRootRowExpanded = isExpanded;
      return;
    }
    // Adjust y for the totals row
    this.pivotTable.setRowExpanded(y - 1, isExpanded, expandDescendants);
  }

  depthForRow(y: ModelIndex): number {
    return this.row(y)?.depth ?? 0;
  }

  get hasExpandableColumns(): boolean {
    return true;
  }

  get isExpandAllColumnsAvailable(): boolean {
    return true;
  }

  get isExpandAllRowsAvailable(): boolean {
    return true;
  }

  expandAllColumns(): void {
    log.debug('expandAllColumns');
    this.setColumnExpanded(this.keyColumns.length, true, true);
  }

  collapseAllColumns(): void {
    log.debug('collapseAllColumns');
    this.setColumnExpanded(this.keyColumns.length, false, true);
  }

  isColumnExpandable(x: ModelIndex, depth?: number): boolean {
    log.debug2('isColumnExpandable', {
      x,
      depth,
      name: this.columns[x]?.name,
      v: this.virtualColumns,
      cC: this.columnCount,
      c: this.columns,
    });
    // Root (grand total) columns
    if (x >= this.keyColumns.length && x < this.virtualColumns.length) {
      // The grand total column is expandable if there are any columns
      return (
        !this.isRootColumnExpanded ||
        this.columns.length > this.virtualColumns.length
      );
    }
    if (x < this.keyColumns.length) {
      // Virtual columns, including totals columns, are not expandable until DH-20125
      return false;
    }

    // this.columns don't need index adjustment since virtualColumns and value sources are included
    return this.columns[x]?.hasChildren ?? false;
  }

  isColumnExpanded(x: ModelIndex): boolean {
    if (x >= this.keyColumns.length && x < this.virtualColumns.length) {
      // The grand total column is expandable if there are any columns
      return this.isRootColumnExpanded;
    }
    return this.columns[x]?.isExpanded ?? false;
  }

  setColumnExpanded(
    x: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    log.debug2('[0] setColumnExpanded', {
      x,
      isExpanded,
      name: this.columns[x]?.name,
      v: this.virtualColumns,
      cC: this.columnCount,
      c: this.columns,
    });
    // Root (grand total) columns
    if (x >= this.keyColumns.length && x < this.virtualColumns.length) {
      this.pivotTable.setRootColumnExpanded(isExpanded, expandDescendants);
      this.isRootColumnExpanded = isExpanded;
      return;
    }
    const adjustedX =
      (x - this.virtualColumns.length) / this.snapshotValueSources.length;
    this.pivotTable.setColumnExpanded(adjustedX, isExpanded, expandDescendants);
  }

  depthForColumn(x: ModelIndex): number {
    const depth = this.columns[x]?.depth ?? 0;
    return depth;
  }

  getCachedCustomColumnFormatFlag: (
    formatter: Formatter,
    columnName: string,
    columnType: string
  ) => boolean = memoizeClear(FormatterUtils.isCustomColumnFormatDefined, {
    max: 10000,
  });

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

      const column = this.columns[x];
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
    const keyCount = this.keyColumns.length;
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

  sourceColumn(column: ModelIndex, row: ModelIndex): DhType.Column {
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

  /**
   * Get the cached column range for the current viewport columns, with buffer pages applied.
   * If viewportColumns is undefined, return the full range of columns.
   * If viewportColumns is empty, return a minimal valid range (0,0).
   * Adjusts for virtual columns at the start of the table.
   * @param viewportColumns The columns currently in the viewport
   * @param totalColumnCount The total number of columns in the table
   * @param virtualColumnCount The number of virtual columns at the start of the table
   * @param snapshotValueSourceCount The number of value sources in the snapshot
   * @returns The column range to request from the underlying table
   */
  getCachedViewportColumnRange = memoize(
    (
      viewportColumns: readonly DhType.Column[] | undefined,
      totalColumnCount: number,
      virtualColumnCount: number,
      snapshotValueSourceCount: number
    ): DhType.RangeSet => {
      if (viewportColumns == null) {
        return this.dh.RangeSet.ofRange(0, totalColumnCount);
      }

      if (viewportColumns.length === 0) {
        log.debug(
          'Empty viewport columns, returning minimal range',
          viewportColumns
        );
        // Minimal valid range is a single column
        return this.dh.RangeSet.ofRange(0, 0);
      }

      const minIndex = Math.max(
        0,
        this.getSnapshotColumnIndexByName(
          viewportColumns[0].name,
          virtualColumnCount,
          snapshotValueSourceCount
        ) ?? 0
      );
      const maxIndex = Math.max(
        0,
        this.getSnapshotColumnIndexByName(
          viewportColumns[viewportColumns.length - 1].name,
          virtualColumnCount,
          snapshotValueSourceCount
        ) ?? 0
      );

      if (minIndex > maxIndex) {
        log.warn(
          'Invalid column range, minIndex > maxIndex',
          viewportColumns,
          minIndex,
          maxIndex
        );
        return this.dh.RangeSet.ofRange(0, totalColumnCount);
      }

      const viewWidth = maxIndex - minIndex + 1;
      const viewportStart = Math.max(
        0,
        minIndex - viewWidth * this.columnBufferPages
      );
      const viewportEnd = maxIndex + viewWidth * this.columnBufferPages;

      return this.dh.RangeSet.ofRange(viewportStart, viewportEnd);
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
      this.columns.length,
      this.virtualColumns.length,
      this.snapshotValueSources.length
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
