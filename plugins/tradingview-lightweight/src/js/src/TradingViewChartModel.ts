import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import type {
  TvlChartType,
  TvlFigureData,
  TvlPartitionSpec,
  TvlSeriesConfig,
  DownsampleInfo,
  ModelEvent,
  ModelEventListener,
  NewFigureMessage,
} from './TradingViewTypes';
import { getAllColumnsForTable, convertTime } from './TradingViewUtils';

const log = Log.module('TradingViewChartModel');

/** Tables larger than this will be automatically downsampled (if eligible). */
const AUTO_DOWNSAMPLE_SIZE = 30_000;

/** Series types eligible for LTTB downsampling (single y-value). */
const DOWNSAMPLE_ELIGIBLE_TYPES = new Set(['Line', 'Area', 'Baseline']);

/**
 * Manages the data flow between Deephaven tables and the chart renderer.
 * Uses table.subscribe() and ChartData for efficient delta-based updates,
 * matching the pattern used by PlotlyExpressChartModel.
 */
class TradingViewChartModel {
  private dh: typeof DhType;

  private widget: DhType.Widget;

  private listeners: Set<ModelEventListener> = new Set();

  private figureData: TvlFigureData | null = null;

  private tables: Map<number, DhType.Table> = new Map();

  /** Active table subscriptions (from table.subscribe()) */
  private tableSubscriptionMap: Map<number, DhType.TableSubscription> =
    new Map();

  /** ChartData objects that handle delta updates efficiently */
  private chartDataMap: Map<number, DhType.plot.ChartData> = new Map();

  /** Full column data arrays, updated incrementally via ChartData */
  private tableDataMap: Map<number, Record<string, unknown[]>> = new Map();

  /** Cleanup functions for event listeners */
  private subscriptionCleanupMap: Map<number, Set<() => void>> = new Map();

  private widgetListenerCleanup: (() => void) | null = null;

  private revision = 0;

  /** Track whether initial data has loaded for fitContent */
  private initialLoadComplete = false;

  /** Next table ID for dynamically added partition tables */
  private nextTableId = 0;

  /** Cleanup for PartitionedTable event listener */
  private partitionCleanup: (() => void) | null = null;

  /** PartitionedTable reference (for cleanup on close) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private partitionedTable: any = null;

  /** Downsampling state per table: original table + params for re-sampling. */
  private downsampleMap: Map<number, DownsampleInfo> = new Map();

  /** Current chart plot-area width in pixels. */
  private chartWidth = 0;

  /** Current visible x-axis range as [min, max] strings, or null. */
  private visibleRange: [string, string] | null = null;

  /** Timer for debouncing visible-range updates. */
  private rangeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Table IDs that were just re-downsampled and need a full data replace
   * on their next subscription update (not an incremental append).
   */
  private pendingFullReplace: Set<number> = new Set();

  /**
   * The visible range used for the most recent successful downsample.
   * Used to compare against incoming range changes — if the range matches
   * what we already downsampled for, we skip re-downsampling.
   * This replaces the old `isRedownsampling` flag with a deterministic
   * comparison (the plotly-express `areSameAxisRange` pattern).
   */
  private lastDownsampledRange: [string, string] | null = null;

  /** True while updateDownsamples() is in flight. Prevents concurrent calls. */
  private isUpdatingDownsamples = false;

  /** True if a new downsample was requested while one was already in flight. */
  private pendingDownsampleUpdate = false;

  /** IANA timezone string (e.g. "America/New_York") for time column conversion. */
  private timeZone = '';

  /** Chart type — determines whether time columns need TZ conversion. */
  private chartType: TvlChartType = 'standard';

  /**
   * Stable translator for value columns. ChartData caches per function
   * identity, so this must be a fixed reference (not a new lambda per call).
   */
  private readonly valueTranslator = (val: unknown): unknown =>
    this.unwrapValue(val);

  /**
   * Stable translator for time columns. Produces TZ-adjusted epoch seconds
   * directly, so the view layer never needs to call convertTime.
   */
  private readonly timeTranslator = (val: unknown): unknown => {
    const unwrapped = this.unwrapValue(val);
    if (unwrapped == null || typeof unwrapped !== 'number') return 0;
    // Numeric-scale charts (yieldCurve, options) use raw x values
    if (this.chartType === 'yieldCurve' || this.chartType === 'options') {
      return unwrapped;
    }
    // Standard charts: convert millis → TZ-adjusted epoch seconds
    return convertTime(unwrapped, this.timeZone);
  };

  constructor(dh: typeof DhType, widget: DhType.Widget) {
    this.dh = dh;
    this.widget = widget;
  }

  subscribe(listener: ModelEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ModelEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        log.error('Error in model listener', e);
      }
    });
  }

  /**
   * Set the timezone for time column conversion. Must be called before
   * subscribing to tables (i.e. before init).
   */
  setTimeZone(tz: string): void {
    this.timeZone = tz;
  }

  /**
   * Set the chart type (standard, yieldCurve, options). Determines whether
   * time columns receive TZ conversion or are passed through as raw numbers.
   */
  setChartType(ct: TvlChartType): void {
    this.chartType = ct;
  }

  /**
   * Collect the set of column names that serve as time/x-axis columns
   * for any series or marker spec on the given table.
   */
  private getTimeColumnsForTable(tableId: number): Set<string> {
    const timeCols = new Set<string>();
    this.figureData?.series.forEach(s => {
      if (s.dataMapping.tableId === tableId) {
        timeCols.add(s.dataMapping.columns.time);
      }
      if (s.markerSpec?.tableId === tableId && s.markerSpec.columns.time) {
        timeCols.add(s.markerSpec.columns.time);
      }
    });
    return timeCols;
  }

  /**
   * Initialize the model with widget data from fetch().
   */
  async init(
    exportedObjects: DhType.WidgetExportedObject[],
    dataString: string
  ): Promise<void> {
    const message: NewFigureMessage = JSON.parse(dataString);

    if (message.type !== 'NEW_FIGURE') {
      log.error('Unexpected initial message type:', message.type);
      return;
    }

    this.figureData = message.figure;
    this.revision = message.revision;

    // Determine which ref index is the PartitionedTable (if any)
    const ptRefIndex = this.figureData.partitionSpec?.refIndex;

    // Fetch all referenced tables (skip the PartitionedTable ref)
    const tablePromises: Promise<void>[] = [];
    message.new_references.forEach(refIdx => {
      if (refIdx === ptRefIndex) return; // handled separately below
      if (refIdx < exportedObjects.length) {
        const exported = exportedObjects[refIdx];
        tablePromises.push(
          exported.fetch().then((table: unknown) => {
            this.tables.set(refIdx, table as DhType.Table);
          })
        );
      }
    });
    await Promise.all(tablePromises);

    // Set nextTableId to one past the highest existing ID
    this.nextTableId = message.new_references.length;

    // Downsample large tables if eligible, then subscribe
    await this.downsampleAndSubscribe();

    // Fetch and watch the PartitionedTable for new partition keys
    if (ptRefIndex != null && ptRefIndex < exportedObjects.length) {
      await this.setupPartitionWatcher(
        exportedObjects[ptRefIndex],
        this.figureData.partitionSpec!
      );
    }

    // Listen for widget config updates
    this.widgetListenerCleanup = this.listenToWidget();

    // Emit initial figure config
    this.emit({
      type: 'FIGURE_UPDATED',
      figure: this.figureData,
      tables: Array.from(this.tables.values()),
    });
  }

  /**
   * Add a single partition key: fetch its constituent table, subscribe,
   * create a series config, and push it to the figure.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async addPartitionKey(pt: any, key: unknown, spec: TvlPartitionSpec): Promise<void> {
    const table = await pt.getTable(key);
    if (!table) {
      log.warn('getTable returned null for key:', key);
      return;
    }

    const newTableId = this.nextTableId;
    this.nextTableId += 1;
    this.tables.set(newTableId, table as DhType.Table);

    const keyStr = String(key);
    const newSeries: TvlSeriesConfig = {
      id: `by_${keyStr}`,
      type: spec.seriesType,
      options: { title: keyStr },
      dataMapping: {
        tableId: newTableId,
        columns: spec.columns,
      },
    };

    // Push the series config BEFORE subscribing so that
    // getAllColumnsForTable() can find the column names for this tableId.
    if (this.figureData) {
      this.figureData.series.push(newSeries);
      log.debug('Added series for key:', keyStr, 'total:', this.figureData.series.length);
    }

    this.subscribeTable(newTableId, table as DhType.Table);
  }

  /**
   * Fetch the PartitionedTable, discover all existing keys, subscribe
   * to each, and listen for new keys that appear later.
   */
  private async setupPartitionWatcher(
    exported: DhType.WidgetExportedObject,
    spec: TvlPartitionSpec
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pt = (await exported.fetch()) as any;
      this.partitionedTable = pt;

      // Discover and add all existing keys
      const existingKeys = pt.getKeys();
      log.debug('Existing partition keys:', existingKeys?.size ?? 0);
      if (existingKeys) {
        const keyPromises: Promise<void>[] = [];
        existingKeys.forEach((key: unknown) => {
          keyPromises.push(this.addPartitionKey(pt, key, spec));
        });
        await Promise.all(keyPromises);
      }

      // Listen for new keys that appear after init
      let eventName = 'keyadded';
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dhPT = (this.dh as any).PartitionedTable;
        if (dhPT?.EVENT_KEYADDED) {
          eventName = dhPT.EVENT_KEYADDED;
        }
      } catch {
        // PartitionedTable not on dh namespace, use string fallback
      }

      this.partitionCleanup = pt.addEventListener(
        eventName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (event: any) => {
          try {
            await this.addPartitionKey(pt, event.detail, spec);
            if (this.figureData) {
              this.emit({
                type: 'FIGURE_UPDATED',
                figure: this.figureData,
                tables: Array.from(this.tables.values()),
              });
            }
          } catch (err) {
            log.error('Error handling new partition key', err);
          }
        }
      );
      log.debug('Partition watcher set up with', existingKeys?.size ?? 0, 'initial keys');
    } catch (err) {
      log.error('Failed to set up partition watcher', err);
      this.emit({
        type: 'ERROR',
        message: `Partition watcher failed: ${String(err)}`,
      });
    }
  }

  /**
   * Check if a table should be downsampled based on its size and
   * the series types that reference it.
   */
  private isDownsampleEligible(tableId: number, table: DhType.Table): boolean {
    if (table.size <= AUTO_DOWNSAMPLE_SIZE) return false;
    if (!this.figureData) return false;

    // Only standard charts (time-based x-axis) can be downsampled
    if (
      this.figureData.chartType === 'yieldCurve' ||
      this.figureData.chartType === 'options'
    ) {
      return false;
    }

    // All series referencing this table must be eligible types
    const seriesForTable = this.figureData.series.filter(
      s => s.dataMapping.tableId === tableId
    );
    if (seriesForTable.length === 0) return false;

    return seriesForTable.every(s => DOWNSAMPLE_ELIGIBLE_TYPES.has(s.type));
  }

  /**
   * Get the x-column and y-columns for downsampling a specific table.
   */
  private getDownsampleColumns(
    tableId: number
  ): { xCol: string; yCols: string[] } | null {
    if (!this.figureData) return null;

    const seriesForTable = this.figureData.series.filter(
      s => s.dataMapping.tableId === tableId
    );
    if (seriesForTable.length === 0) return null;

    // x-column is always the 'time' mapping
    const xCol = seriesForTable[0].dataMapping.columns.time;
    if (!xCol) return null;

    // y-columns: collect all non-time column mappings
    const yCols = new Set<string>();
    seriesForTable.forEach(s => {
      Object.entries(s.dataMapping.columns).forEach(([key, col]) => {
        if (key !== 'time') {
          yCols.add(col);
        }
      });
    });
    if (yCols.size === 0) return null;

    return { xCol, yCols: Array.from(yCols) };
  }

  /**
   * Downsample eligible tables, then subscribe to all tables.
   */
  private async downsampleAndSubscribe(): Promise<void> {
    if (!this.figureData) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dh = this.dh as any;
    const hasDownsampleApi =
      dh.plot?.Downsample?.runChartDownsample != null;

    const downsamplePromises: Promise<void>[] = [];

    this.tables.forEach((table, tableId) => {
      if (
        hasDownsampleApi &&
        this.isDownsampleEligible(tableId, table)
      ) {
        const cols = this.getDownsampleColumns(tableId);
        if (cols) {
          const width = this.chartWidth || 800;
          const info: DownsampleInfo = {
            originalTable: table,
            xCol: cols.xCol,
            yCols: cols.yCols,
            width,
            range: this.visibleRange,
          };
          this.downsampleMap.set(tableId, info);

          downsamplePromises.push(
            dh.plot.Downsample.runChartDownsample(
              table,
              cols.xCol,
              cols.yCols,
              width,
              this.visibleRange?.map((val: string) =>
                dh.DateWrapper.ofJsDate(new Date(val))
              ) ?? null
            ).then((downsampled: DhType.Table) => {
              log.info(
                `Downsampled table ${tableId}: ${table.size} → ${downsampled.size} rows`
              );
              this.tables.set(tableId, downsampled);
            })
          );
        }
      }
    });

    if (downsamplePromises.length > 0) {
      this.downsampleMap.forEach((_, tableId) => {
        this.pendingFullReplace.add(tableId);
      });
      await Promise.all(downsamplePromises);
      this.lastDownsampledRange = this.visibleRange;
    }

    // Now subscribe to all tables (downsampled or original)
    this.tables.forEach((table, tableId) => {
      this.subscribeTable(tableId, table);
    });
  }

  /**
   * Called when the visible range or chart width changes.
   * Re-downsamples all eligible tables with the new parameters.
   *
   * Only one call runs at a time. If a new request arrives while one is
   * in flight, it is queued and runs after the current one completes
   * (with the latest visibleRange / chartWidth at that time).
   */
  private async updateDownsamples(): Promise<void> {
    if (this.downsampleMap.size === 0) return;

    // Prevent concurrent calls — queue for retry instead
    if (this.isUpdatingDownsamples) {
      this.pendingDownsampleUpdate = true;
      return;
    }
    this.isUpdatingDownsamples = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dh = this.dh as any;

    const updates: Promise<void>[] = [];

    this.downsampleMap.forEach((oldInfo, tableId) => {
      const newWidth = this.chartWidth || 800;
      const newRange = this.visibleRange;

      // Skip if nothing changed
      if (
        oldInfo.width === newWidth &&
        oldInfo.range?.[0] === newRange?.[0] &&
        oldInfo.range?.[1] === newRange?.[1]
      ) {
        return;
      }

      const updatedInfo: DownsampleInfo = {
        ...oldInfo,
        width: newWidth,
        range: newRange,
      };
      this.downsampleMap.set(tableId, updatedInfo);

      updates.push(
        dh.plot.Downsample.runChartDownsample(
          oldInfo.originalTable,
          oldInfo.xCol,
          oldInfo.yCols,
          newWidth,
          newRange?.map((val: string) =>
            dh.DateWrapper.ofJsDate(new Date(val))
          ) ?? null
        )
          .then((downsampled: DhType.Table) => {
            log.debug(
              `Re-downsampled table ${tableId}: ${downsampled.size} rows ` +
                `(range: ${newRange ? newRange.join(' – ') : 'auto'})`
            );
            // Tear down old subscription
            this.cleanupSubscriptions(tableId);
            this.chartDataMap.delete(tableId);
            this.tableDataMap.delete(tableId);

            // Mark for full data replace on next update
            this.pendingFullReplace.add(tableId);

            // Replace with new downsampled table
            this.tables.set(tableId, downsampled);
            this.subscribeTable(tableId, downsampled);
          })
          .catch((err: unknown) => {
            log.warn('Re-downsample failed for table', tableId, err);
            // Original table was likely closed (disconnect/reconnect).
            // Remove from downsampleMap so we stop retrying.
            this.downsampleMap.delete(tableId);
          })
      );
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      this.lastDownsampledRange = this.visibleRange;
    }

    this.isUpdatingDownsamples = false;

    // If a new update was requested while we were working, run it now
    // with the latest visibleRange / chartWidth.
    if (this.pendingDownsampleUpdate) {
      this.pendingDownsampleUpdate = false;
      this.updateDownsamples();
    }
  }

  /**
   * Set the chart plot-area width. Called from the React component on resize.
   */
  setChartWidth(width: number): void {
    if (width === this.chartWidth || width <= 0) return;
    this.chartWidth = width;
    this.scheduleDownsampleUpdate();
  }

  /**
   * Set the visible time range. Called from the React component when the
   * user finishes a zoom/pan gesture (not during the gesture).
   * @param range [min, max] as ISO date strings, or null for full/auto range.
   */
  setVisibleRange(range: [string, string] | null): void {
    // Compare against the range we last downsampled for. If it matches,
    // the current data is already optimal — skip re-downsampling.
    // This is the deterministic loop-breaker (same pattern as plotly-express
    // areSameAxisRange).
    if (
      this.lastDownsampledRange?.[0] === range?.[0] &&
      this.lastDownsampledRange?.[1] === range?.[1]
    ) {
      return;
    }
    this.visibleRange = range;
    this.scheduleDownsampleUpdate();
  }

  /**
   * Debounce downsample updates to avoid hammering the server during
   * smooth pan/drag operations.
   */
  private scheduleDownsampleUpdate(): void {
    if (this.downsampleMap.size === 0) return;
    if (this.rangeDebounceTimer != null) {
      clearTimeout(this.rangeDebounceTimer);
    }
    this.rangeDebounceTimer = setTimeout(() => {
      this.rangeDebounceTimer = null;
      this.updateDownsamples();
    }, 250);
  }

  /**
   * Returns debug info about downsampled tables. Useful for verification.
   */
  getDownsampleDebugInfo(): {
    tableId: number;
    originalSize: number;
    currentSize: number;
    isDownsampled: boolean;
    width: number;
    range: [string, string] | null;
  }[] {
    return Array.from(this.tables.entries()).map(([id, table]) => {
      const dsInfo = this.downsampleMap.get(id);
      return {
        tableId: id,
        originalSize: dsInfo
          ? (dsInfo.originalTable as DhType.Table).size
          : table.size,
        currentSize: table.size,
        isDownsampled: dsInfo != null,
        width: dsInfo?.width ?? 0,
        range: dsInfo?.range ?? null,
      };
    });
  }

  /**
   * Clean up subscriptions and event listeners for a specific table.
   */
  private cleanupSubscriptions(tableId: number): void {
    const cleanupSet = this.subscriptionCleanupMap.get(tableId);
    if (cleanupSet) {
      cleanupSet.forEach(cleanup => cleanup());
      this.subscriptionCleanupMap.delete(tableId);
    }
    const sub = this.tableSubscriptionMap.get(tableId);
    if (sub) {
      sub.close();
      this.tableSubscriptionMap.delete(tableId);
    }
  }

  private subscribeTable(tableId: number, table: DhType.Table): void {
    if (!this.figureData) return;
    if (this.tableSubscriptionMap.has(tableId)) return;

    const columnNames = getAllColumnsForTable(this.figureData.series, tableId);
    const columns = table.columns.filter((col: DhType.Column) =>
      columnNames.includes(col.name)
    );
    if (columns.length === 0) return;

    // Create ChartData for delta-aware updates
    this.chartDataMap.set(tableId, new this.dh.plot.ChartData(table));
    this.tableDataMap.set(tableId, {});

    // Use table.subscribe() — streams all rows for selected columns
    const subscription = table.subscribe(columns);
    this.tableSubscriptionMap.set(tableId, subscription);

    if (!this.subscriptionCleanupMap.has(tableId)) {
      this.subscriptionCleanupMap.set(tableId, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cleanupSet = this.subscriptionCleanupMap.get(tableId)!;

    // Listen on the SUBSCRIPTION for data updates (not the table)
    cleanupSet.add(
      subscription.addEventListener(
        this.dh.Table.EVENT_UPDATED,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((e: any) =>
          this.handleTableUpdate(
            e as DhType.Event<DhType.SubscriptionTableData>,
            tableId
          )) as unknown as Parameters<typeof subscription.addEventListener>[1]
      )
    );

    // Listen for table disconnect
    cleanupSet.add(
      table.addEventListener(
        this.dh.Table.EVENT_DISCONNECT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (() => {
          log.warn('Table disconnected:', tableId);
        }) as unknown as Parameters<typeof table.addEventListener>[1]
      )
    );
  }

  /**
   * Handle a table subscription update using ChartData for delta processing.
   * This follows the exact pattern from PlotlyExpressChartModel.handleFigureUpdated.
   */
  private handleTableUpdate(
    event: DhType.Event<DhType.SubscriptionTableData>,
    tableId: number
  ): void {
    const chartData = this.chartDataMap.get(tableId);
    const tableData = this.tableDataMap.get(tableId);

    if (chartData == null || tableData == null) {
      log.warn('No chartData/tableData for table', tableId);
      return;
    }

    const { detail: updateEvent } = event;

    // Apply delta to ChartData
    chartData.update(updateEvent);

    // Extract full column arrays from ChartData.
    // Time columns use timeTranslator (produces TZ-adjusted epoch seconds).
    // Value columns use valueTranslator (unwraps DH wrappers to plain numbers).
    // Both are stable references so ChartData's per-(column, func) cache works —
    // only delta rows are translated on subsequent updates.
    const timeCols = this.getTimeColumnsForTable(tableId);
    updateEvent.columns.forEach((column: DhType.Column) => {
      const translator = timeCols.has(column.name)
        ? this.timeTranslator
        : this.valueTranslator;
      tableData[column.name] = chartData.getColumn(
        column.name,
        translator,
        updateEvent
      );
    });

    const isFirstLoad = !this.initialLoadComplete;
    if (isFirstLoad) {
      this.initialLoadComplete = true;
    }

    // After a re-downsample, the first update from the new table needs a
    // full data replace (not incremental append) because the series data
    // is entirely different from what was previously rendered.
    const isFullReplace = this.pendingFullReplace.delete(tableId);

    // Pass through delta info so the renderer can use series.update()
    // for appends instead of series.setData() for the full dataset
    const addedCount = updateEvent.added != null ? updateEvent.added.size : 0;
    let removedCount =
      updateEvent.removed != null ? updateEvent.removed.size : 0;
    const modifiedCount =
      updateEvent.modified != null ? updateEvent.modified.size : 0;

    // Force full replace path in the chart component
    if (isFullReplace) {
      removedCount = 1;
    }

    this.emit({
      type: 'DATA_UPDATED',
      tableId,
      isInitialLoad: isFirstLoad,
      addedCount,
      removedCount,
      modifiedCount,
      preserveVisibleRange: isFullReplace,
    });
  }

  private listenToWidget(): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = ((event: any) => {
      try {
        const data = event.detail;
        const message: NewFigureMessage = JSON.parse(data.getDataAsString());

        if (message.type === 'NEW_FIGURE' && message.revision > this.revision) {
          this.revision = message.revision;
          this.figureData = message.figure;

          this.emit({
            type: 'FIGURE_UPDATED',
            figure: this.figureData,
            tables: Array.from(this.tables.values()),
          });
        }
      } catch (e) {
        log.error('Error processing widget message', e);
      }
    }) as unknown as Parameters<typeof this.widget.addEventListener>[1];

    this.widget.addEventListener(this.dh.Widget.EVENT_MESSAGE, handler);

    return () => {
      this.widget.removeEventListener(this.dh.Widget.EVENT_MESSAGE, handler);
    };
  }

  /**
   * Unwrap Deephaven wrapper types to plain JS values.
   * DateWrapper -> epoch millis via asDate().getTime()
   * LongWrapper -> number via asNumber()
   */
  // eslint-disable-next-line class-methods-use-this
  private unwrapValue(val: unknown): unknown {
    if (val == null) return val;
    if (typeof val !== 'object') return val;

    const asDate = val as { asDate?: () => Date };
    if (typeof asDate.asDate === 'function') {
      return asDate.asDate().getTime();
    }

    const asNum = val as { asNumber?: () => number };
    if (typeof asNum.asNumber === 'function') {
      return asNum.asNumber();
    }

    return val;
  }

  getFigureData(): TvlFigureData | null {
    return this.figureData;
  }

  getColumnData(tableId: number): Map<string, unknown[]> | undefined {
    const tableData = this.tableDataMap.get(tableId);
    if (!tableData) return undefined;
    // Convert Record to Map for backward compat with TradingViewUtils
    const map = new Map<string, unknown[]>();
    Object.entries(tableData).forEach(([key, val]) => {
      map.set(key, val);
    });
    return map;
  }

  getSeriesConfigs(): TvlSeriesConfig[] {
    return this.figureData?.series ?? [];
  }

  close(): void {
    // Cancel pending debounce
    if (this.rangeDebounceTimer != null) {
      clearTimeout(this.rangeDebounceTimer);
      this.rangeDebounceTimer = null;
    }

    // Clean up subscription event listeners
    this.subscriptionCleanupMap.forEach(cleanupSet => {
      cleanupSet.forEach(cleanup => {
        cleanup();
      });
    });
    this.subscriptionCleanupMap.clear();

    // Clean up subscriptions
    this.tableSubscriptionMap.forEach(sub => {
      sub.close();
    });
    this.tableSubscriptionMap.clear();

    // Clean up tables (including downsampled)
    this.tables.forEach(table => {
      table.close();
    });
    this.tables.clear();

    // Also close original tables held in downsampleMap
    this.downsampleMap.forEach(info => {
      const orig = info.originalTable as DhType.Table;
      if (orig?.close) orig.close();
    });
    this.downsampleMap.clear();

    // Clean up widget listener
    if (this.widgetListenerCleanup) {
      this.widgetListenerCleanup();
      this.widgetListenerCleanup = null;
    }

    // Clean up partition watcher
    if (this.partitionCleanup) {
      this.partitionCleanup();
      this.partitionCleanup = null;
    }
    if (this.partitionedTable?.close) {
      this.partitionedTable.close();
      this.partitionedTable = null;
    }

    this.listeners.clear();
    this.chartDataMap.clear();
    this.tableDataMap.clear();
  }
}

export default TradingViewChartModel;
