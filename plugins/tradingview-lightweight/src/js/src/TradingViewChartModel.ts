import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import type {
  TvlChartType,
  TvlFigureData,
  TvlPartitionSpec,
  TvlSeriesConfig,
  DownsampleReadyMessage,
  ModelEvent,
  ModelEventListener,
  NewFigureMessage,
} from './TradingViewTypes';
import {
  getAllColumnsForTable,
  convertTime,
  unconvertTime,
} from './TradingViewUtils';

const log = Log.module('TradingViewChartModel');

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

  /** Active full-table subscriptions (non-downsampled tables). */
  private tableSubscriptionMap: Map<number, DhType.TableSubscription> =
    new Map();

  /** Active viewport subscriptions (downsampled tables). */
  private viewportSubscriptionMap: Map<
    number,
    DhType.TableViewportSubscription
  > = new Map();

  /** Current viewport range per downsampled table [firstRow, lastRow]. */
  private viewportRangeMap: Map<number, [number, number]> = new Map();

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

  /** IANA timezone string (e.g. "America/New_York") for time column conversion. */
  private timeZone = '';

  /** Chart type — determines whether time columns need TZ conversion. */
  private chartType: TvlChartType = 'standard';

  // ---- Python-side downsample state ----

  /** Whether Python-side downsampling is active for any table. */
  private pythonDownsampled = false;

  /** Table IDs that are Python-downsampled. */
  private downsampledTableIds: Set<number> = new Set();

  /** True while waiting for a DOWNSAMPLE_READY response. */
  pendingDownsample = false;

  /** If a new zoom was requested while waiting, store it here. */
  private pendingZoomParams: {
    from: number;
    to: number;
    width: number;
  } | null = null;

  /** True if the next DOWNSAMPLE_READY is a reset (should fitContent). */
  private expectingReset = false;

  /** Debug callback for overlay. */
  private debugFn: ((msg: string) => void) | null = null;

  /**
   * Set pendingDownsample and emit a DOWNSAMPLE_PENDING event
   * so the view layer can show/hide the loading scrim.
   */
  private setPendingDownsample(pending: boolean): void {
    if (this.pendingDownsample === pending) return;
    this.pendingDownsample = pending;
    this.emit({ type: 'DOWNSAMPLE_PENDING', pending });
  }

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

    // Check for Python-side downsampling
    if (this.figureData.downsampleInfo) {
      this.pythonDownsampled = true;
      Object.entries(this.figureData.downsampleInfo).forEach(
        ([tableIdStr, info]) => {
          if (info.isDownsampled) {
            this.downsampledTableIds.add(Number(tableIdStr));
          }
        }
      );
      log.info(
        'Python-side downsampling active for tables:',
        Array.from(this.downsampledTableIds)
      );
    }

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

    // Subscribe to all tables. Downsampled tables use viewport subscriptions.
    this.tables.forEach((table, tableId) => {
      if (this.downsampledTableIds.has(tableId)) {
        // Initial load: viewport = full table
        this.subscribeTable(tableId, table, [0, Math.max(0, table.size - 1)]);
      } else {
        this.subscribeTable(tableId, table);
      }
    });

    // Fetch and watch the PartitionedTable for new partition keys
    if (ptRefIndex != null && ptRefIndex < exportedObjects.length) {
      await this.setupPartitionWatcher(
        exportedObjects[ptRefIndex],
        this.figureData.partitionSpec!
      );
    }

    // Listen for widget config updates and DOWNSAMPLE_READY messages
    this.widgetListenerCleanup = this.listenToWidget();

    // Emit initial figure config
    this.emit({
      type: 'FIGURE_UPDATED',
      figure: this.figureData,
      tables: Array.from(this.tables.values()),
    });
  }

  // ---- Python-side downsample communication ----

  /** Whether Python-side downsampling is active. */
  isPythonDownsampled(): boolean {
    return this.pythonDownsampled;
  }

  /** Set debug callback for overlay output. */
  setDebugFn(fn: (msg: string) => void): void {
    this.debugFn = fn;
  }

  private dbg(msg: string): void {
    this.debugFn?.(msg);
  }

  /**
   * Get the full time range of the source data in TZ-shifted epoch
   * seconds (the format used by LWC's setVisibleRange).
   * Returns null if not available.
   */
  getFullTimeRange(): [number, number] | null {
    if (!this.figureData?.downsampleInfo) return null;
    const info = Object.values(this.figureData.downsampleInfo).find(
      i => i.fullRange != null
    );
    if (info?.fullRange) {
      const fromSec = convertTime(info.fullRange[0], this.timeZone);
      const toSec = convertTime(info.fullRange[1], this.timeZone);
      return [fromSec, toSec];
    }
    return null;
  }

  /**
   * Send a ZOOM message to the Python server.
   * Called when user finishes a zoom or pan gesture.
   *
   * @param fromSeconds Visible range start in TZ-shifted epoch seconds
   * @param toSeconds Visible range end in TZ-shifted epoch seconds
   */
  sendZoom(fromSeconds: number, toSeconds: number, width: number = 0): void {
    if (!this.pythonDownsampled) return;

    // Queue if already waiting
    if (this.pendingDownsample) {
      this.pendingZoomParams = { from: fromSeconds, to: toSeconds, width };
      return;
    }

    // Convert TZ-shifted seconds to real UTC nanoseconds
    const fromUtcSec = unconvertTime(fromSeconds, this.timeZone);
    const toUtcSec = unconvertTime(toSeconds, this.timeZone);
    const fromNanos = Math.round(fromUtcSec * 1e9);
    const toNanos = Math.round(toUtcSec * 1e9);

    this.setPendingDownsample(true);
    this.expectingReset = false;

    const msg = JSON.stringify({
      type: 'ZOOM',
      from: String(fromNanos),
      to: String(toNanos),
      width,
    });

    this.dbg(`sendZoom: ${fromNanos} → ${toNanos} w=${width}`);
    this.widget.sendMessage(msg, []);
  }

  /**
   * Send a RESET message to the Python server.
   * Called on double-click.
   */
  sendReset(): void {
    if (!this.pythonDownsampled) return;

    // If already waiting, mark the pending as a reset
    if (this.pendingDownsample) {
      this.pendingZoomParams = null; // cancel any pending zoom
      this.expectingReset = true;
      // Still send the RESET -- the Python side will process it after
      // the current ZOOM response, and the JS side will ignore the
      // ZOOM response when it sees the RESET response.
    }

    this.setPendingDownsample(true);
    this.expectingReset = true;

    log.debug('Sending RESET');
    this.widget.sendMessage(JSON.stringify({ type: 'RESET' }), []);
  }

  /**
   * Handle DOWNSAMPLE_READY from the Python server.
   * Replaces table subscriptions with the new downsampled tables.
   */
  private async handleDownsampleReady(
    message: DownsampleReadyMessage,
    exportedObjects: DhType.WidgetExportedObject[]
  ): Promise<void> {
    const isReset = Object.values(message.tables).some(t => t.isReset);
    this.dbg(
      `handleDsReady: isReset=${isReset} tables=${Object.keys(
        message.tables
      )} exports=${exportedObjects.length}`
    );

    // If we're expecting a RESET but this is a stale ZOOM response, skip it.
    if (this.expectingReset && !isReset) {
      this.dbg('SKIP stale ZOOM (RESET pending)');
      return;
    }
    if (isReset) {
      this.expectingReset = false;
    }

    const entries = Object.entries(message.tables);
    // Process sequentially — each iteration mutates shared state
    for (let idx = 0; idx < entries.length; idx += 1) {
      const [tableIdStr, info] = entries[idx];
      const tableId = Number(tableIdStr);
      const exported = exportedObjects[info.refIndex];
      if (exported == null) {
        this.dbg(`NO export for ref ${info.refIndex}`);
        // eslint-disable-next-line no-continue
        continue;
      }

      this.dbg(`fetching table ${tableId} refIdx=${info.refIndex}...`);
      // eslint-disable-next-line no-await-in-loop
      const newTable = (await exported.fetch()) as DhType.Table;
      if (this.closed) return;
      this.dbg(
        `got table ${tableId}: ${newTable.size} rows, vp=[${info.viewport[0]},${info.viewport[1]}]`
      );

      log.debug(
        `DOWNSAMPLE_READY table ${tableId}: ${newTable.size} rows` +
          ` viewport=[${info.viewport[0]}, ${info.viewport[1]}]`
      );

      // Tear down old subscription
      this.cleanupSubscriptions(tableId);
      this.chartDataMap.delete(tableId);
      this.tableDataMap.delete(tableId);

      // Close old table
      const oldTable = this.tables.get(tableId);
      if (oldTable) {
        try {
          oldTable.close();
        } catch {
          // May already be closed
        }
      }

      // Install new table and subscribe with viewport
      this.tables.set(tableId, newTable);

      // Store isReset flag so the DATA_UPDATED handler knows to fitContent
      if (isReset) {
        this.resetPendingForTable.add(tableId);
      }

      // Update fullRange from server (ticking tables may have grown)
      if (info.fullRange && this.figureData?.downsampleInfo?.[tableIdStr]) {
        this.figureData.downsampleInfo[tableIdStr].fullRange = info.fullRange;
      }

      // Hybrid merge: always subscribe to full table
      const vp: [number, number] = [0, Math.max(0, newTable.size - 1)];
      this.subscribeTable(tableId, newTable, vp);
    }

    this.setPendingDownsample(false);

    // If a new zoom was requested while we were waiting, send it now
    if (this.pendingZoomParams != null) {
      const p = this.pendingZoomParams;
      this.pendingZoomParams = null;
      this.sendZoom(p.from, p.to, p.width);
    }
  }

  /** Tables that should trigger fitContent on next DATA_UPDATED. */
  private resetPendingForTable: Set<number> = new Set();

  // ---- Partition handling ----

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
    const vpSub = this.viewportSubscriptionMap.get(tableId);
    if (vpSub) {
      vpSub.close();
      this.viewportSubscriptionMap.delete(tableId);
    }
    this.viewportRangeMap.delete(tableId);
  }

  /**
   * Subscribe to a table. For downsampled tables, uses a viewport
   * subscription (only receives rows in the viewport). For regular
   * tables, uses a full subscription with ChartData for delta updates.
   */
  private subscribeTable(
    tableId: number,
    table: DhType.Table,
    viewport?: [number, number]
  ): void {
    if (!this.figureData) return;

    const isDs = this.downsampledTableIds.has(tableId);

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

    if (isDs && viewport) {
      // Viewport subscription for downsampled tables
      const [first, last] = viewport;
      this.viewportRangeMap.set(tableId, [first, last]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vpSub = (table as any).setViewport(
        first,
        last,
        columns
      ) as DhType.TableViewportSubscription;
      this.viewportSubscriptionMap.set(tableId, vpSub);

      this.dbg(
        `setViewport tid=${tableId} [${first},${last}] vpSub=${typeof vpSub} hasAddEvent=${typeof vpSub?.addEventListener}`
      );

      // TableViewportSubscription fires EVENT_UPDATED with ViewportData
      cleanupSet.add(
        vpSub.addEventListener(
          this.dh.Table.EVENT_UPDATED,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((e: any) => {
            this.dbg(`vpUpdate tid=${tableId}`);
            this.handleViewportUpdate(e, tableId);
          }) as unknown as Parameters<typeof vpSub.addEventListener>[1]
        )
      );
    } else {
      // Full subscription for non-downsampled tables
      if (this.tableSubscriptionMap.has(tableId)) return;

      this.chartDataMap.set(tableId, new this.dh.plot.ChartData(table));
      this.tableDataMap.set(tableId, {});

      const subscription = table.subscribe(columns);
      this.tableSubscriptionMap.set(tableId, subscription);

      cleanupSet.add(
        // prettier-ignore
        subscription.addEventListener(
          this.dh.Table.EVENT_UPDATED,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((e: any) => {
            this.handleTableUpdate(
              e as DhType.Event<DhType.SubscriptionTableData>,
              tableId
            );
          }) as unknown as Parameters<typeof subscription.addEventListener>[1]
        )
      );
    }

    // Listen for table disconnect / reconnect
    cleanupSet.add(
      table.addEventListener(
        this.dh.Table.EVENT_DISCONNECT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (() => {
          log.warn('Table disconnected:', tableId);
          this.emit({ type: 'DISCONNECTED', connected: false });
        }) as unknown as Parameters<typeof table.addEventListener>[1]
      )
    );
    cleanupSet.add(
      table.addEventListener(
        this.dh.Table.EVENT_RECONNECT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (() => {
          log.info('Table reconnected:', tableId);
          this.emit({ type: 'DISCONNECTED', connected: true });
        }) as unknown as Parameters<typeof table.addEventListener>[1]
      )
    );
  }

  // updateViewport removed — hybrid merge always subscribes to full table

  // ---- Data update handlers ----

  /**
   * Handle viewport update for a DOWNSAMPLED table.
   * Viewport data arrives as ViewportData (rows array with offset),
   * not as SubscriptionTableData (delta with added/removed/modified).
   * We extract column arrays directly from the viewport rows.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleViewportUpdate(event: any, tableId: number): void {
    const { detail: vpData } = event;
    const columns: DhType.Column[] = vpData.columns ?? [];
    const rows = vpData.rows ?? [];

    this.dbg(
      `vpUpdate data: cols=${columns.length} rows=${rows.length} offset=${
        vpData.offset
      } keys=${Object.keys(vpData).join(',')}`
    );
    if (rows.length > 0) {
      const row0 = rows[0];
      this.dbg(
        `row0 type=${typeof row0} keys=${
          row0 ? Object.keys(row0).slice(0, 5).join(',') : 'null'
        }`
      );
      if (columns.length > 0) {
        try {
          const val = row0.get(columns[0]);
          this.dbg(`row0.get(col0)=${val} type=${typeof val}`);
        } catch (e) {
          this.dbg(`row0.get THREW: ${e}`);
        }
      }
    }

    // Build column arrays from viewport rows
    const data: Record<string, unknown[]> = {};
    const timeCols = this.getTimeColumnsForTable(tableId);

    columns.forEach((col: DhType.Column) => {
      const arr: unknown[] = [];
      const isTime = timeCols.has(col.name);
      for (let i = 0; i < rows.length; i += 1) {
        const raw = rows[i].get(col);
        const unwrapped = this.unwrapValue(raw);
        if (isTime) {
          if (unwrapped == null || typeof unwrapped !== 'number') {
            arr.push(0);
          } else if (
            this.chartType === 'yieldCurve' ||
            this.chartType === 'options'
          ) {
            arr.push(unwrapped);
          } else {
            arr.push(convertTime(unwrapped, this.timeZone));
          }
        } else {
          arr.push(unwrapped);
        }
      }
      data[col.name] = arr;
    });

    this.tableDataMap.set(tableId, data);

    const isFirstLoad = !this.initialLoadComplete;
    if (isFirstLoad) {
      this.initialLoadComplete = true;
    }

    const isResetView = this.resetPendingForTable.has(tableId);
    if (isResetView) {
      this.resetPendingForTable.delete(tableId);
    }

    this.emit({
      type: 'DATA_UPDATED',
      tableId,
      isInitialLoad: isFirstLoad,
      addedCount: rows.length,
      removedCount: 0,
      modifiedCount: 0,
      isResetView,
    });
  }

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

    // Check if this table has a pending reset (from double-click)
    const isResetView = this.resetPendingForTable.has(tableId);
    if (isResetView) {
      this.resetPendingForTable.delete(tableId);
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
      isResetView,
    });
  }

  // ---- Widget & utility methods ----

  private listenToWidget(): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = ((event: any) => {
      try {
        const data = event.detail;
        const dataStr = data.getDataAsString();
        const msg = JSON.parse(dataStr);
        const exported = data.exportedObjects ?? [];
        this.dbg(`widget msg: type=${msg.type} exports=${exported.length}`);

        if (msg.type === 'NEW_FIGURE' && msg.revision > this.revision) {
          this.revision = msg.revision;
          this.figureData = msg.figure;

          this.emit({
            type: 'FIGURE_UPDATED',
            figure: this.figureData!,
            tables: Array.from(this.tables.values()),
          });
        } else if (msg.type === 'DOWNSAMPLE_READY') {
          this.handleDownsampleReady(msg as DownsampleReadyMessage, exported);
        }
      } catch (e) {
        log.error('Error processing widget message', e);
      }
    }) as unknown as Parameters<typeof this.widget.addEventListener>[1];

    this.widget.addEventListener(this.dh.Widget.EVENT_MESSAGE, handler);

    // Detect widget close (server disconnect / variable removed)
    const closeHandler = (() => {
      log.warn('Widget closed');
      this.emit({ type: 'DISCONNECTED', connected: false });
    }) as unknown as Parameters<typeof this.widget.addEventListener>[1];
    this.widget.addEventListener(this.dh.Widget.EVENT_CLOSE, closeHandler);

    return () => {
      this.widget.removeEventListener(this.dh.Widget.EVENT_MESSAGE, handler);
      this.widget.removeEventListener(this.dh.Widget.EVENT_CLOSE, closeHandler);
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

  /** Get the set of table IDs that are Python-downsampled. */
  getDownsampledTableIds(): Set<number> {
    return this.downsampledTableIds;
  }

  /** Get a table by ID. */
  getTable(tableId: number): DhType.Table | undefined {
    return this.tables.get(tableId);
  }

  // getViewportRange and getDataTimeExtent removed — not needed with hybrid merge

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
    this.viewportSubscriptionMap.forEach(vpSub => {
      vpSub.close();
    });
    this.viewportSubscriptionMap.clear();
    this.viewportRangeMap.clear();

    // Clean up tables
    this.tables.forEach(table => {
      table.close();
    });
    this.tables.clear();

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
    this.resetPendingForTable.clear();
    this.downsampledTableIds.clear();
    this.seenPartitionKeys.clear();
  }
}

export default TradingViewChartModel;
