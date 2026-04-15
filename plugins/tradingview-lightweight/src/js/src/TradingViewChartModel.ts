import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import type {
  TvlChartType,
  TvlFigureData,
  TvlPartitionSpec,
  TvlSeriesConfig,
  DownsampleInfo,
  DownsampledData,
  ModelEvent,
  ModelEventListener,
  NewFigureMessage,
} from './TradingViewTypes';
import {
  getAllColumnsForTable,
  convertTime,
  unconvertTime,
  transformTableData,
  deduplicateByTime,
  classifyDownsampledRows,
  generateWhitespaceGrid,
  buildDataWithGaps,
} from './TradingViewUtils';

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

  /** Active table subscriptions (from table.subscribe()) for all tables. */
  private tableSubscriptionMap: Map<number, DhType.TableSubscription> =
    new Map();

  /** ChartData objects that handle delta updates efficiently. */
  private chartDataMap: Map<number, DhType.plot.ChartData> = new Map();

  /** Full column data arrays, updated incrementally via ChartData. */
  private tableDataMap: Map<number, Record<string, unknown[]>> = new Map();

  /** Cleanup functions for event listeners. */
  private subscriptionCleanupMap: Map<number, Set<() => void>> = new Map();

  private widgetListenerCleanup: (() => void) | null = null;

  private revision = 0;

  /** Track whether initial data has loaded for fitContent. */
  private initialLoadComplete = false;

  /** Set to true when close() is called; prevents stale async callbacks. */
  private closed = false;

  /** Next table ID for dynamically added partition tables. */
  private nextTableId = 0;

  /** Cleanup for PartitionedTable event listener. */
  private partitionCleanup: (() => void) | null = null;

  /** PartitionedTable reference (for cleanup on close). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private partitionedTable: any = null;

  /** Downsampling state per table: original table + params for re-sampling. */
  private downsampleMap: Map<number, DownsampleInfo> = new Map();

  /** Current chart plot-area width in pixels (from timeScale.width()). */
  private chartWidth = 0;

  /**
   * The zoom range used for the last successfully-loaded downsample, in
   * TZ-shifted epoch seconds. null = full-range (no zoom).
   */
  private lastDownsampledRange: [number, number] | null = null;

  /**
   * Time extent of the full source data in TZ-shifted epoch seconds.
   * Captured from the first full-range downsample's output (first/last
   * time values). Used to decide whether a zoom range is "nearly full"
   * (≥80% coverage → use range=null for uniform fidelity instead of
   * having low-fidelity head/tail at the edges).
   */
  private dataFullExtent: [number, number] | null = null;

  /** True while a downsample RPC is in flight. */
  private isDownsampling = false;

  /** If a new downsample was requested during an in-flight call, store params. */
  private pendingDownsampleParams: {
    width: number;
    range: [number, number] | null;
    isReset: boolean;
  } | null = null;

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

  /** Set the initial chart width before init so downsampling can use it. */
  setChartWidth(width: number): void {
    if (width > 0) this.chartWidth = width;
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

    // Set nextTableId past the highest used ref index to avoid collisions
    this.nextTableId =
      message.new_references.length > 0
        ? Math.max(...message.new_references) + 1
        : 0;

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
  private seenPartitionKeys = new Set<string>();

  private async addPartitionKey(
    pt: any,
    key: unknown,
    spec: TvlPartitionSpec
  ): Promise<void> {
    const keyStr = String(key);
    if (this.seenPartitionKeys.has(keyStr)) {
      return; // Duplicate key — already added
    }
    this.seenPartitionKeys.add(keyStr);

    const table = await pt.getTable(key);
    if (!table) {
      log.warn('getTable returned null for key:', key);
      this.seenPartitionKeys.delete(keyStr);
      return;
    }

    const newTableId = this.nextTableId;
    this.nextTableId += 1;
    this.tables.set(newTableId, table as DhType.Table);

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
      log.debug(
        'Added series for key:',
        keyStr,
        'total:',
        this.figureData.series.length
      );
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
      log.debug(
        'Partition watcher set up with',
        existingKeys?.size ?? 0,
        'initial keys'
      );
    } catch (err) {
      log.error('Failed to set up partition watcher', err);
      this.emit({
        type: 'ERROR',
        message: `Partition watcher failed: ${String(err)}`,
      });
    }
  }

  // ---- Downsample eligibility ----

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

  // ---- Downsample lifecycle ----

  /**
   * Initial downsample + subscribe for all tables. Called once from init().
   */
  private async downsampleAndSubscribe(): Promise<void> {
    if (!this.figureData) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dh = this.dh as any;
    const hasDownsampleApi = dh.plot?.Downsample?.runChartDownsample != null;

    const downsamplePromises: Promise<void>[] = [];

    this.tables.forEach((table, tableId) => {
      if (hasDownsampleApi && this.isDownsampleEligible(tableId, table)) {
        const cols = this.getDownsampleColumns(tableId);
        if (cols) {
          const width = this.chartWidth || 800;
          const info: DownsampleInfo = {
            originalTable: table,
            xCol: cols.xCol,
            yCols: cols.yCols,
            width,
            range: null, // initial = full range
          };
          this.downsampleMap.set(tableId, info);

          downsamplePromises.push(
            dh.plot.Downsample.runChartDownsample(
              table,
              cols.xCol,
              cols.yCols,
              width,
              null // full range
            ).then((downsampled: DhType.Table) => {
              if (this.closed) return;
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
      await Promise.all(downsamplePromises);
      this.lastDownsampledRange = null; // full range
    }

    // Now subscribe to all tables (downsampled or original)
    this.tables.forEach((table, tableId) => {
      this.subscribeTable(tableId, table);
    });
  }

  /**
   * Request a re-downsample. Called from the React component on zoom, pan
   * outside coverage, resize, or reset (dblclick).
   *
   * Only one call runs at a time. If a new request arrives while one is
   * in flight, it is queued and runs after the current one completes.
   *
   * @param width Chart plot-area width in pixels (target point count).
   * @param range Zoom range in TZ-shifted epoch seconds, or null for full.
   * @param isReset If true, emit isResetView so the chart fitContents.
   */
  async requestDownsample(
    width: number,
    range: [number, number] | null,
    isReset: boolean
  ): Promise<void> {
    if (this.downsampleMap.size === 0) return;
    this.chartWidth = width;

    // Queue if already in flight
    if (this.isDownsampling) {
      this.pendingDownsampleParams = { width, range, isReset };
      return;
    }
    this.isDownsampling = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dh = this.dh as any;
    const targetWidth = width;

    let targetRange = range;
    if (targetRange != null && this.dataFullExtent != null) {
      const [dataStart, dataEnd] = this.dataFullExtent;
      const fullDuration = dataEnd - dataStart;
      const zoomDuration = targetRange[1] - targetRange[0];

      // If the zoom covers ≥80% of the data extent, use range=null
      // for uniform fidelity (no sparse head/tail edges).
      if (fullDuration > 0 && zoomDuration / fullDuration >= 0.8) {
        log.debug(
          `Zoom covers ${((zoomDuration / fullDuration) * 100).toFixed(0)}% of data — using full range`
        );
        targetRange = null;
      }

      // Snap range endpoints to the data extent when close. Without this,
      // getVisibleRange() returns a range that ends slightly before the
      // actual data edge (due to bar spacing / rightOffset), leaving a
      // small gap that produces a sparse tail (or head). Snapping
      // eliminates the gap so no low-fidelity points appear at edges the
      // user perceives as "the end of the data."
      if (targetRange != null) {
        const snapThreshold = zoomDuration * 0.05; // 5% of zoom duration
        const snapped: [number, number] = [...targetRange];
        if (snapped[0] - dataStart < snapThreshold) {
          snapped[0] = dataStart;
        }
        if (dataEnd - snapped[1] < snapThreshold) {
          snapped[1] = dataEnd;
        }
        targetRange = snapped;
      }
    }

    const updates: Promise<void>[] = [];

    this.downsampleMap.forEach((oldInfo, tableId) => {
      // Skip if nothing changed
      if (
        !isReset &&
        oldInfo.width === targetWidth &&
        oldInfo.range?.[0] === targetRange?.[0] &&
        oldInfo.range?.[1] === targetRange?.[1]
      ) {
        return;
      }

      const updatedInfo: DownsampleInfo = {
        ...oldInfo,
        width: targetWidth,
        range: targetRange,
      };
      this.downsampleMap.set(tableId, updatedInfo);

      // Convert TZ-shifted epoch seconds back to real UTC for the server.
      // The chart stores and returns TZ-shifted values (convertTime adds
      // the TZ offset so axis labels show local time). The server's
      // runChartDownsample works in real UTC, so we must reverse the shift.
      // Without this, the zoom range is off by the TZ offset — e.g., for
      // UTC-4 the body is 4 hours too early, leaving a sparse tail at the
      // data's actual end.
      const apiRange =
        targetRange?.map((sec: number) => {
          const realUtcSec = unconvertTime(sec, this.timeZone);
          return dh.DateWrapper.ofJsDate(new Date(realUtcSec * 1000));
        }) ?? null;

      updates.push(
        dh.plot.Downsample.runChartDownsample(
          oldInfo.originalTable,
          oldInfo.xCol,
          oldInfo.yCols,
          targetWidth,
          apiRange
        )
          .then((downsampled: DhType.Table) => {
            if (this.closed) return;
            log.debug(
              `Re-downsampled table ${tableId}: ${downsampled.size} rows ` +
                `(range: ${targetRange ? `${targetRange[0]}–${targetRange[1]}` : 'full'})`
            );
            // Tear down old subscription
            this.cleanupSubscriptions(tableId);
            this.chartDataMap.delete(tableId);
            this.tableDataMap.delete(tableId);

            // Replace with new downsampled table and subscribe
            this.tables.set(tableId, downsampled);
            this.subscribeTable(tableId, downsampled);
          })
          .catch((err: unknown) => {
            log.warn('Re-downsample failed for table', tableId, err);
            this.downsampleMap.delete(tableId);
          })
      );
    });

    try {
      if (updates.length > 0) {
        await Promise.all(updates);
        this.lastDownsampledRange = targetRange;
      }
    } finally {
      this.isDownsampling = false;

      // If a new request arrived while we were working, run it now
      if (this.pendingDownsampleParams != null) {
        const pending = this.pendingDownsampleParams;
        this.pendingDownsampleParams = null;
        this.requestDownsample(pending.width, pending.range, pending.isReset);
      }
    }
  }

  /** Get the zoom range of the currently-loaded downsample. null = full. */
  getLastDownsampledRange(): [number, number] | null {
    return this.lastDownsampledRange;
  }

  /** Whether any table is currently downsampled. */
  isDownsampled(): boolean {
    return this.downsampleMap.size > 0;
  }

  // resetView() removed: lightweight-charts' native dblclick fitContent()
  // now works correctly since head/tail data spans the full source range.

  // ---- Subscription ----

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

  /**
   * Subscribe to a table using subscribe() + ChartData (for all tables).
   * Downsampled tables route to handleDownsampledUpdate which classifies
   * rows into head/body/tail and generates whitespace. Non-downsampled
   * tables route to handleTableUpdate for incremental delta processing.
   */
  private subscribeTable(tableId: number, table: DhType.Table): void {
    if (!this.figureData) return;
    if (this.tableSubscriptionMap.has(tableId)) return;

    const columnNames = getAllColumnsForTable(this.figureData.series, tableId);
    const columns = table.columns.filter((col: DhType.Column) =>
      columnNames.includes(col.name)
    );
    if (columns.length === 0) return;

    if (!this.subscriptionCleanupMap.has(tableId)) {
      this.subscriptionCleanupMap.set(tableId, new Set());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cleanupSet = this.subscriptionCleanupMap.get(tableId)!;

    // All tables use subscribe() + ChartData (matching plotly-express pattern)
    this.chartDataMap.set(tableId, new this.dh.plot.ChartData(table));
    this.tableDataMap.set(tableId, {});

    const subscription = table.subscribe(columns);
    this.tableSubscriptionMap.set(tableId, subscription);

    const isDs = this.downsampleMap.has(tableId);

    cleanupSet.add(
      // prettier-ignore
      subscription.addEventListener(
        this.dh.Table.EVENT_UPDATED,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((e: any) => {
          if (isDs) {
            this.handleDownsampledUpdate(
              e as DhType.Event<DhType.SubscriptionTableData>,
              tableId
            );
          } else {
            this.handleTableUpdate(
              e as DhType.Event<DhType.SubscriptionTableData>,
              tableId
            );
          }
        }) as unknown as Parameters<typeof subscription.addEventListener>[1]
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

  // ---- Data update handlers ----

  /**
   * Handle subscription update for a NON-downsampled table.
   * Uses ChartData for delta processing; emits incremental info.
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

    // Extract full column arrays via translators (stable refs for caching)
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

    const addedCount = updateEvent.added != null ? updateEvent.added.size : 0;
    const removedCount =
      updateEvent.removed != null ? updateEvent.removed.size : 0;
    const modifiedCount =
      updateEvent.modified != null ? updateEvent.modified.size : 0;

    this.emit({
      type: 'DATA_UPDATED',
      tableId,
      isInitialLoad: isFirstLoad,
      addedCount,
      removedCount,
      modifiedCount,
      isResetView: false,
    });
  }

  /**
   * Handle subscription update for a DOWNSAMPLED table.
   * Uses ChartData for delta processing, then classifies rows into
   * head/body/tail, generates whitespace grid, and emits DownsampledData.
   */
  private handleDownsampledUpdate(
    event: DhType.Event<DhType.SubscriptionTableData>,
    tableId: number
  ): void {
    const chartData = this.chartDataMap.get(tableId);
    const tableData = this.tableDataMap.get(tableId);

    if (chartData == null || tableData == null) {
      log.warn('No chartData/tableData for downsampled table', tableId);
      return;
    }

    const { detail: updateEvent } = event;

    // Apply delta to ChartData
    chartData.update(updateEvent);

    // Extract full column arrays via translators
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

    // Capture the full data time extent from the initial full-range
    // downsample. Used to decide when a zoom is "nearly full" (≥80%).
    if (this.dataFullExtent == null && this.lastDownsampledRange == null) {
      const timeCols2 = this.getTimeColumnsForTable(tableId);
      const firstTimeCol = timeCols2.values().next().value;
      if (firstTimeCol != null) {
        const timeArr = tableData[firstTimeCol];
        if (timeArr != null && timeArr.length > 1) {
          const first = timeArr[0] as number;
          const last = timeArr[timeArr.length - 1] as number;
          if (Number.isFinite(first) && Number.isFinite(last) && last > first) {
            this.dataFullExtent = [first, last];
          }
        }
      }
    }

    // Build DownsampledData for the chart
    const dsData = this.buildDownsampledData(tableId);

    this.emit({
      type: 'DATA_UPDATED',
      tableId,
      isInitialLoad: isFirstLoad,
      addedCount: 0,
      removedCount: 0,
      modifiedCount: 0,
      isResetView: false,
      downsampledData: dsData,
    });
  }

  /**
   * Build the DownsampledData payload: classify rows into head/body/tail,
   * generate whitespace grid, insert gap markers.
   */
  private buildDownsampledData(tableId: number): DownsampledData {
    const figure = this.figureData;
    const colData = this.getColumnData(tableId);
    const ct = this.chartType;

    // Transform all series for this table and merge into a single data array.
    // For downsampled tables there's typically one series per table.
    let allData: Record<string, unknown>[] = [];
    if (figure && colData) {
      figure.series.forEach(series => {
        if (series.dataMapping.tableId !== tableId) return;
        const data = transformTableData(series, colData, ct);
        const deduped = deduplicateByTime(data as Record<string, unknown>[]);
        allData = deduped;
      });
    }

    // Classify into head / body / tail
    const { head, body, tail } = classifyDownsampledRows(
      allData,
      this.lastDownsampledRange
    );

    // Generate whitespace time grid spanning the FULL data extent (head
    // first point → tail last point). This ensures head/tail bars sit at
    // their real time positions with proper whitespace gaps between them
    // and the dense body region. Without this, the head/tail bars are
    // only a few bar slots from the body edge — panning past the body
    // immediately shows months-old data instead of empty space.
    //
    // The grid density matches the body region so body bars land on grid
    // slots. For the full data span the grid is larger than body-only,
    // but still manageable (e.g., 115 days at body density ≈ 8K points).
    let whitespaceGrid: Array<{ time: number }> = [];
    if (allData.length > 1 && this.lastDownsampledRange != null) {
      const dataStart = allData[0].time as number;
      const dataEnd = allData[allData.length - 1].time as number;
      // Use body density: pointCount = chartWidth for the body duration,
      // scaled to the full data duration.
      const bodyDuration = this.lastDownsampledRange[1] - this.lastDownsampledRange[0];
      const fullDuration = dataEnd - dataStart;
      const bodyPointCount = this.chartWidth || 800;
      const fullPointCount = bodyDuration > 0
        ? Math.round(bodyPointCount * (fullDuration / bodyDuration))
        : bodyPointCount;
      // Cap at a reasonable maximum to prevent performance issues
      const cappedPointCount = Math.min(fullPointCount, 50_000);
      whitespaceGrid = generateWhitespaceGrid(
        dataStart,
        dataEnd,
        cappedPointCount
      );
    }

    const dataWithGaps = [...head, ...body, ...tail];

    return { whitespaceGrid, dataWithGaps };
  }

  // ---- Widget & utility methods ----

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
    this.closed = true;

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
