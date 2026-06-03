import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import type {
  AutoBinFigureMessage,
  TvlAutoBinMeta,
  TvlChartType,
  TvlDownsampleMeta,
  TvlFigureData,
  TvlSeriesConfig,
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
 *
 * Downsampling is performed entirely in JS via
 * dh.plot.Downsample.runChartDownsample (same approach as plotly-express).
 */
class TradingViewChartModel {
  private dh: typeof DhType;

  private widget: DhType.Widget;

  private listeners: Set<ModelEventListener> = new Set();

  private figureData: TvlFigureData | null = null;

  /** Tables currently subscribed to (may be original or downsampled). */
  private tables: Map<number, DhType.Table> = new Map();

  /**
   * Active subscriptions, keyed by tableId. All paths (downsample,
   * autobin, and direct) use a full table.subscribe() — autobin tables
   * are server-side scoped to a body+anchors aggregation that's already
   * small enough to subscribe to wholesale.
   */
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

  /** Per-template partition watcher state, keyed by template series id. */
  private partitionWatchers: Map<
    string,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partitionedTable: any;
      cleanup: () => void;
      seenKeys: Set<string>;
    }
  > = new Map();

  /** IANA timezone string (e.g. "America/New_York") for time column conversion. */
  private timeZone = '';

  getTimeZone(): string {
    return this.timeZone;
  }

  /** Chart type — determines whether time columns need TZ conversion. */
  private chartType: TvlChartType = 'standard';

  // ---- JS-side downsample state ----

  /** Original (full) tables stored for re-downsampling on zoom/pan. */
  private originalTableMap: Map<number, DhType.Table> = new Map();

  /** Current live downsampled tables (replaced on each re-downsample). */
  private downsampledTableMap: Map<number, DhType.Table> = new Map();

  /** Table IDs that are JS-downsampled. */
  private jsDownsampledTableIds: Set<number> = new Set();

  /** Metadata from Python about which tables are eligible. */
  private downsampleMeta: Record<string, TvlDownsampleMeta> = {};

  /** True while waiting for a downsample operation to complete. */
  pendingDownsample = false;

  /** If a new zoom was requested while waiting, store it here. */
  private pendingZoomParams: {
    range: [number, number] | null;
    width: number;
  } | null = null;

  // ---- Server-side auto-bin state ----

  /** Tables that were auto-binned server-side. */
  private autoBinnedTableIds: Set<number> = new Set();

  /** Per-table auto-bin metadata from the server. */
  private autoBinMeta: Record<string, TvlAutoBinMeta> = {};

  /**
   * Per-table currently-scoped body range in UTC nanoseconds, or null when
   * the full source is in use. Updated when AUTOBIN_ZOOM/RESET is sent so
   * tests and debug overlays can read the current scope.
   */
  private autoBinBodyRange: Record<string, [number, number] | null> = {};

  /** True while waiting for an AUTOBIN_FIGURE response from the server. */
  pendingAutoBin = false;

  /**
   * True if the in-flight auto-bin request was triggered by a RESET
   * (double-click), not a zoom/pan. The server's AUTOBIN_FIGURE response
   * doesn't distinguish, so the model carries the flag forward to plumb
   * isResetView into the resulting DATA_UPDATED event.
   */
  private autoBinPendingIsReset = false;

  /**
   * Monotonic counter incremented every time a resample request is issued
   * (downsample or auto-bin). Tests use this to assert race-condition
   * invariants ("N rapid zooms produce exactly N seq increments").
   */
  resampleSeq = 0;

  /** If a new auto-bin zoom was requested while pending, store it here. */
  private pendingAutoBinParams: {
    range: [number, number] | null;
    width?: number;
  } | null = null;

  /** Tables that should trigger fitContent on next DATA_UPDATED. */
  private resetPendingForTable: Set<number> = new Set();

  /**
   * Tables that have just been re-subscribed after a downsample and
   * are awaiting their first DATA_UPDATED. Used to distinguish a
   * bulk data swap from a normal tick update.
   */
  private freshDownsampleTables: Set<number> = new Set();

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

  /** Same UX signal as setPendingDownsample but for the auto-bin path. */
  private setPendingAutoBin(pending: boolean): void {
    if (this.pendingAutoBin === pending) return;
    this.pendingAutoBin = pending;
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

    // Read downsample metadata from Python
    if (this.figureData.downsampleMeta) {
      this.downsampleMeta = this.figureData.downsampleMeta;
    }
    // Read auto-bin metadata from Python
    if (this.figureData.autoBinMeta) {
      this.autoBinMeta = this.figureData.autoBinMeta;
      Object.keys(this.autoBinMeta).forEach(refStr => {
        this.autoBinnedTableIds.add(Number(refStr));
      });
    }

    // Collect partition refIndex'es so we don't try to .fetch() them
    // as regular tables — PartitionedTables are fetched separately by
    // setupPartitionWatcher.
    const partitionRefIndices = new Set<number>();
    this.figureData.series.forEach(s => {
      if (s.partition?.refIndex != null) {
        partitionRefIndices.add(s.partition.refIndex);
      }
    });

    // Fetch all referenced tables (skip PartitionedTable refs)
    const tablePromises: Promise<void>[] = [];
    message.new_references.forEach(refIdx => {
      if (partitionRefIndices.has(refIdx)) return; // handled below
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

    // Determine which tables need JS-side downsampling
    const downsamplePromises: Promise<void>[] = [];
    this.tables.forEach((table, tableId) => {
      const meta = this.downsampleMeta[String(tableId)];
      if (meta) {
        // Store original for re-downsample on zoom/pan
        this.originalTableMap.set(tableId, table);
        this.jsDownsampledTableIds.add(tableId);
        // Initial full-range downsample
        downsamplePromises.push(
          this.downsampleTable(tableId).catch(err => {
            log.warn(
              'Initial downsample failed for table',
              tableId,
              err
            );
            // Fall back to subscribing to original table directly
            this.jsDownsampledTableIds.delete(tableId);
            this.originalTableMap.delete(tableId);
            this.subscribeTable(tableId, table);
          })
        );
      } else {
        // Non-downsampled (including server-side autobin): subscribe directly.
        // Autobin tables are scoped server-side to body + anchors so the
        // full aggregation is small enough for a regular subscription.
        this.subscribeTable(tableId, table);
      }
    });
    await Promise.all(downsamplePromises);

    // For each series that's a partition template, fetch its
    // PartitionedTable and start watching for keys.
    const partitionPromises: Promise<void>[] = [];
    this.figureData.series.forEach(template => {
      const ref = template.partition?.refIndex;
      if (ref != null && ref < exportedObjects.length) {
        partitionPromises.push(
          this.setupPartitionWatcher(template, exportedObjects[ref])
        );
      }
    });
    await Promise.all(partitionPromises);

    // Listen for widget config updates
    this.widgetListenerCleanup = this.listenToWidget();

    // Emit initial figure config
    this.emit({
      type: 'FIGURE_UPDATED',
      figure: this.figureData,
      tables: Array.from(this.tables.values()),
    });
  }

  // ---- JS-side downsample API ----

  /** Whether JS-side downsampling is active for any table. */
  isDownsampled(): boolean {
    return this.jsDownsampledTableIds.size > 0;
  }

  /** Whether server-side auto-bin is active for any table. */
  isAutoBinned(): boolean {
    return this.autoBinnedTableIds.size > 0;
  }

  /** Whether any resampling path is active (downsample or auto-bin). */
  isResampling(): boolean {
    return this.isDownsampled() || this.isAutoBinned();
  }

  /** Get the auto-bin metadata from Python. */
  getAutoBinMeta(): Record<string, TvlAutoBinMeta> {
    return this.autoBinMeta;
  }

  /**
   * Currently-scoped body range (UTC ns) for the given auto-binned table,
   * or null when at full source. Returns null when the table is unknown.
   */
  getAutoBinBodyRange(tableRef: number): [number, number] | null {
    return this.autoBinBodyRange[String(tableRef)] ?? null;
  }

  /** Get the downsample metadata from Python. */
  getDownsampleMeta(): Record<string, TvlDownsampleMeta> {
    return this.downsampleMeta;
  }

  /** Set debug callback for overlay output. */
  setDebugFn(fn: (msg: string) => void): void {
    this.debugFn = fn;
  }

  private dbg(msg: string): void {
    this.debugFn?.(msg);
  }

  /**
   * Downsample a single table using dh.plot.Downsample.runChartDownsample.
   * Closes old downsampled table, installs new one, subscribes.
   *
   * @param tableId The table ID to downsample
   * @param range Optional [fromSec, toSec] in TZ-shifted epoch seconds. Null = full range.
   * @param width Optional chart width in pixels for target output size.
   * @param isReset True if this is a reset (double-click) — triggers fitContent on data arrival.
   */
  private async downsampleTable(
    tableId: number,
    range?: [number, number] | null,
    width?: number,
    isReset = false
  ): Promise<void> {
    const meta = this.downsampleMeta[String(tableId)];
    if (!meta) return;

    const originalTable = this.originalTableMap.get(tableId);
    if (!originalTable) return;

    // Convert TZ-shifted seconds to DateWrapper range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dsRange: any[] | undefined;
    if (range != null) {
      const fromUtcSec = unconvertTime(range[0], this.timeZone);
      const toUtcSec = unconvertTime(range[1], this.timeZone);
      dsRange = [
        this.dh.DateWrapper.ofJsDate(new Date(fromUtcSec * 1000)),
        this.dh.DateWrapper.ofJsDate(new Date(toUtcSec * 1000)),
      ];
    }

    const targetWidth = width ?? 1000;

    this.dbg(
      `downsampleTable tid=${tableId} range=${range ? `[${range[0]},${range[1]}]` : 'null'} w=${targetWidth} reset=${isReset}`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newTable = await (this.dh as any).plot.Downsample.runChartDownsample(
      originalTable,
      meta.timeCol,
      meta.valueCols,
      targetWidth,
      dsRange
    );

    if (this.closed) {
      try {
        newTable.close();
      } catch {
        // ignore
      }
      return;
    }

    this.dbg(`downsampleTable tid=${tableId} result: ${newTable.size} rows`);

    // Tear down old subscription FIRST — this prevents the old
    // subscription from firing ticks that consume the reset flag.
    this.cleanupSubscriptions(tableId);
    this.chartDataMap.delete(tableId);
    this.tableDataMap.delete(tableId);

    // Close old downsampled table (not the original!)
    const oldDs = this.downsampledTableMap.get(tableId);
    if (oldDs) {
      try {
        oldDs.close();
      } catch {
        // May already be closed
      }
    }

    // Install new downsampled table
    this.downsampledTableMap.set(tableId, newTable);
    this.tables.set(tableId, newTable);

    // Set flags AFTER cleanup, BEFORE subscribe — race-free.
    // The old subscription is gone, so it can't consume these.
    this.freshDownsampleTables.add(tableId);
    if (isReset) {
      this.resetPendingForTable.add(tableId);
    }

    // Subscribe — first EVENT_UPDATED will see the flags above
    this.subscribeTable(tableId, newTable);
  }

  /**
   * Perform a downsample operation for all JS-downsampled tables.
   * Called by the view on zoom/pan/reset.
   *
   * @param range [fromSec, toSec] in TZ-shifted epoch seconds, or null for full range (reset).
   * @param width Chart width in pixels.
   */
  async performDownsample(
    range: [number, number] | null,
    width: number
  ): Promise<void> {
    if (!this.isDownsampled()) return;

    // Queue if already pending
    if (this.pendingDownsample) {
      this.pendingZoomParams = { range, width };
      return;
    }

    this.setPendingDownsample(true);
    this.resampleSeq += 1;

    const isReset = range == null;

    try {
      const promises: Promise<void>[] = [];
      this.jsDownsampledTableIds.forEach(tableId => {
        promises.push(
          this.downsampleTable(tableId, range, width, isReset).catch(err => {
            log.warn('Re-downsample failed for table', tableId, err);
            // On failure, fall back to original table
            const orig = this.originalTableMap.get(tableId);
            if (orig) {
              this.cleanupSubscriptions(tableId);
              this.chartDataMap.delete(tableId);
              this.tableDataMap.delete(tableId);
              this.tables.set(tableId, orig);
              this.subscribeTable(tableId, orig);
            }
          })
        );
      });
      await Promise.all(promises);
    } finally {
      this.setPendingDownsample(false);
    }

    // Drain pending queue
    if (this.pendingZoomParams != null) {
      const p = this.pendingZoomParams;
      this.pendingZoomParams = null;
      this.performDownsample(p.range, p.width);
    }
  }

  // ---- Server-side auto-bin API ----

  /**
   * Request a re-aggregation for the visible range. Sends AUTOBIN_ZOOM
   * (or AUTOBIN_RESET if range is null) to the server. The server
   * responds asynchronously with AUTOBIN_FIGURE which is handled in
   * listenToWidget.
   */
  performAutoBin(range: [number, number] | null, width?: number): void {
    if (!this.isAutoBinned()) return;

    if (this.pendingAutoBin) {
      this.pendingAutoBinParams = { range, width };
      return;
    }

    this.setPendingAutoBin(true);
    this.resampleSeq += 1;
    this.autoBinPendingIsReset = range == null;

    // Round chart width up to the nearest 1000 px so the server's derived
    // bin width lands on a small set of common values across sessions —
    // makes the engine's `upperBin(time, w)` results cache-friendly. The
    // raw width is sent alongside as `actualWidthPx` so the server can
    // floor `target_bins` to keep each bar at least MIN_BAR_PX wide,
    // regardless of how much the rounding overshoots.
    const actualWidthPx =
      width != null && width > 0 ? Math.round(width) : undefined;
    const widthPx =
      actualWidthPx != null
        ? Math.max(1000, Math.ceil(actualWidthPx / 1000) * 1000)
        : undefined;

    this.autoBinnedTableIds.forEach(tableRef => {
      if (range == null) {
        this.autoBinBodyRange[String(tableRef)] = null;
        this.sendWidgetMessage({
          type: 'AUTOBIN_RESET',
          tableRef,
          widthPx,
          actualWidthPx,
        });
        return;
      }
      // Range comes in as TZ-shifted epoch seconds (matching the chart's
      // visible range). Convert to UTC nanoseconds for the server.
      const fromUtcSec = unconvertTime(range[0], this.timeZone);
      const toUtcSec = unconvertTime(range[1], this.timeZone);
      const fromNs = Math.floor(fromUtcSec * 1e9);
      const toNs = Math.floor(toUtcSec * 1e9);
      // atLiveEdge: visible range's right edge is at or past the source's
      // full extent. Server then extends the body's right bound past the
      // tail anchor so live ticks land in the body's last bin.
      const meta = this.autoBinMeta[String(tableRef)];
      const atLiveEdge = meta != null && toNs >= meta.fullRangeNs[1];
      this.autoBinBodyRange[String(tableRef)] = [fromNs, toNs];
      this.sendWidgetMessage({
        type: 'AUTOBIN_ZOOM',
        tableRef,
        fromNs,
        toNs,
        widthPx,
        actualWidthPx,
        atLiveEdge,
      });
    });
  }

  /** Unified resample router: dispatches to downsample and auto-bin paths. */
  performResample(range: [number, number] | null, width: number): void {
    if (this.isDownsampled()) {
      this.performDownsample(range, width).catch(err => {
        log.warn('performDownsample failed', err);
      });
    }
    if (this.isAutoBinned()) {
      this.performAutoBin(range, width);
    }
  }

  private sendWidgetMessage(msg: Record<string, unknown>): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.widget as any).sendMessage(JSON.stringify(msg), []);
    } catch (e) {
      log.error('Failed to send widget message', msg.type, e);
      this.setPendingAutoBin(false);
    }
  }

  /** Handle an AUTOBIN_FIGURE message from the server. */
  private async handleAutoBinFigure(
    msg: AutoBinFigureMessage,
    exportedObjects: DhType.WidgetExportedObject[]
  ): Promise<void> {
    try {
      // Update meta first so the renderer reflects the new bin width.
      this.autoBinMeta = msg.autoBinMeta;
      if (this.figureData) {
        this.figureData.autoBinMeta = msg.autoBinMeta;
      }
      this.revision = msg.revision;

      if (msg.noop === true || msg.new_references.length === 0) {
        this.setPendingAutoBin(false);
        this.drainPendingAutoBin();
        return;
      }

      // Fetch the swapped-in aggregated table for the affected ref.
      const { tableRef } = msg;
      if (tableRef >= exportedObjects.length) {
        log.warn(
          'AUTOBIN_FIGURE tableRef out of range',
          tableRef,
          exportedObjects.length
        );
        this.setPendingAutoBin(false);
        this.drainPendingAutoBin();
        return;
      }

      const newTable = (await exportedObjects[
        tableRef
      ].fetch()) as DhType.Table;
      if (this.closed) {
        try {
          newTable.close();
        } catch {
          // ignore
        }
        return;
      }

      // Tear down old subscription before swapping.
      this.cleanupSubscriptions(tableRef);
      this.chartDataMap.delete(tableRef);
      this.tableDataMap.delete(tableRef);

      const oldTable = this.tables.get(tableRef);
      if (oldTable && oldTable !== newTable) {
        try {
          oldTable.close();
        } catch {
          // ignore
        }
      }

      this.tables.set(tableRef, newTable);
      this.freshDownsampleTables.add(tableRef);
      if (this.autoBinPendingIsReset) {
        this.resetPendingForTable.add(tableRef);
      }
      // Server-side scoped: subscribe to the entire (small) agg table.
      this.subscribeTable(tableRef, newTable);
    } catch (err) {
      log.error('Error handling AUTOBIN_FIGURE', err);
    } finally {
      this.setPendingAutoBin(false);
      this.drainPendingAutoBin();
    }
  }

  private drainPendingAutoBin(): void {
    if (this.pendingAutoBinParams != null) {
      const p = this.pendingAutoBinParams;
      this.pendingAutoBinParams = null;
      this.performAutoBin(p.range, p.width);
    }
  }

  // ---- Partition handling ----

  /**
   * Add a single partition key for a given template series: fetch its
   * constituent table, subscribe, clone the template into a runtime
   * series, and push it to the figure.
   */
  private async addPartitionKey(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pt: any,
    key: unknown,
    template: TvlSeriesConfig
  ): Promise<void> {
    const watcher = this.partitionWatchers.get(template.id);
    if (!watcher) return;
    const keyStr = String(key);
    if (watcher.seenKeys.has(keyStr)) {
      return; // Duplicate key — already added
    }
    watcher.seenKeys.add(keyStr);

    const table = await pt.getTable(key);
    if (!table) {
      log.warn('getTable returned null for key:', key);
      watcher.seenKeys.delete(keyStr);
      return;
    }

    const newTableId = this.nextTableId;
    this.nextTableId += 1;
    this.tables.set(newTableId, table as DhType.Table);

    // Clone the template into a runtime series. Preserve options,
    // type, paneIndex, priceScaleOptions, columns; give it a unique id
    // and a per-key title.
    const newSeries: TvlSeriesConfig = {
      id: `${template.id}_${keyStr}`,
      type: template.type,
      options: { ...(template.options ?? {}), title: keyStr },
      dataMapping: {
        tableId: newTableId,
        columns: { ...template.dataMapping.columns },
      },
      paneIndex: template.paneIndex,
      priceScaleOptions: template.priceScaleOptions,
    };

    // Push the series config BEFORE subscribing so that
    // getAllColumnsForTable() can find the column names for this tableId.
    if (this.figureData) {
      this.figureData.series.push(newSeries);
      log.debug(
        'Added series for key:',
        keyStr,
        'template:',
        template.id,
        'total:',
        this.figureData.series.length
      );
    }

    this.subscribeTable(newTableId, table as DhType.Table);
  }

  /**
   * Fetch the PartitionedTable for a template series, discover all
   * existing keys, subscribe to each, and listen for new keys.
   *
   * Per the DH JSAPI contract, the keyadded listener must be attached
   * BEFORE :meth:`getKeys` is read so no keys are missed between snapshot
   * and listener-attach. The per-template seenKeys dedup handles the
   * overlap between the listener firing and the initial getKeys() sweep.
   */
  private async setupPartitionWatcher(
    template: TvlSeriesConfig,
    exported: DhType.WidgetExportedObject
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pt = (await exported.fetch()) as any;

      // Resolve the keyadded event name from the DH namespace; fall back to
      // the literal string if the constant isn't surfaced.
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

      // Pre-register the watcher entry so addPartitionKey can dedup.
      this.partitionWatchers.set(template.id, {
        partitionedTable: pt,
        cleanup: () => {},
        seenKeys: new Set<string>(),
      });

      // Attach the listener FIRST so any keys delivered between fetch() and
      // our getKeys() sweep are still picked up.
      const cleanup = pt.addEventListener(
        eventName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (event: any) => {
          try {
            await this.addPartitionKey(pt, event.detail, template);
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
      const entry = this.partitionWatchers.get(template.id);
      if (entry) entry.cleanup = cleanup;

      // Discover existing keys.
      const rawKeys: unknown = pt.getKeys();
      const existingKeys =
        rawKeys != null && typeof (rawKeys as Promise<unknown>).then === 'function'
          ? ((await rawKeys) as Set<unknown> | null | undefined)
          : (rawKeys as Set<unknown> | null | undefined);
      const initialCount = existingKeys?.size ?? 0;
      log.debug(
        'Existing partition keys for template',
        template.id,
        ':',
        initialCount
      );
      if (existingKeys && initialCount > 0) {
        const keyPromises: Promise<void>[] = [];
        existingKeys.forEach((key: unknown) => {
          keyPromises.push(this.addPartitionKey(pt, key, template));
        });
        await Promise.all(keyPromises);
        if (this.figureData) {
          this.emit({
            type: 'FIGURE_UPDATED',
            figure: this.figureData,
            tables: Array.from(this.tables.values()),
          });
        }
      }

      log.debug(
        'Partition watcher set up for',
        template.id,
        'with',
        initialCount,
        'initial keys'
      );
    } catch (err) {
      log.error(
        'Failed to set up partition watcher for template',
        template.id,
        err
      );
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
  }

  /**
   * Subscribe to a table using full table.subscribe() with ChartData
   * for delta updates. All tables (both original and downsampled) use
   * this path — downsampled tables are small enough for full subscribe.
   */
  private subscribeTable(tableId: number, table: DhType.Table): void {
    if (!this.figureData) return;

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

    // Full subscription with ChartData for delta updates
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

  // ---- Data update handler ----

  /**
   * Handle subscription update for a table.
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

    // Check if this is the first data from a fresh downsample
    const isDownsampleSwap = this.freshDownsampleTables.has(tableId);
    if (isDownsampleSwap) {
      this.freshDownsampleTables.delete(tableId);
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
      isDownsampleSwap,
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
        this.dbg(`widget msg: type=${msg.type}`);

        if (msg.type === 'NEW_FIGURE' && msg.revision > this.revision) {
          this.revision = msg.revision;
          this.figureData = msg.figure;

          this.emit({
            type: 'FIGURE_UPDATED',
            figure: this.figureData!,
            tables: Array.from(this.tables.values()),
          });
        } else if (msg.type === 'AUTOBIN_FIGURE') {
          const exported = (data.exportedObjects ??
            []) as DhType.WidgetExportedObject[];
          this.handleAutoBinFigure(msg as AutoBinFigureMessage, exported).catch(
            err => log.error('handleAutoBinFigure failed', err)
          );
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

  /**
   * Whether the chart is "ready" — i.e. every series currently in
   * ``figureData`` has at least one row of data in :attr:`tableDataMap`.
   *
   * For non-partitioned charts this becomes true on the first DATA_UPDATED
   * after model.init. For ``by``-partitioned charts it additionally
   * requires at least one partition key to have been discovered (otherwise
   * ``figureData.series`` is empty and the chart would be a blank canvas).
   * The image-snapshotter polls this signal to know when to take a stable
   * screenshot without resorting to hard-coded waits.
   */
  isReady(): boolean {
    if (!this.figureData) return false;
    // A partitioned chart with no keys discovered yet should NOT be
    // considered ready — there's nothing to render.
    if (this.figureData.series.length === 0) return false;
    for (const series of this.figureData.series) {
      const tableId = series.dataMapping.tableId;
      const tableData = this.tableDataMap.get(tableId);
      if (!tableData) return false;
      const timeColName = series.dataMapping.columns.time;
      const timeCol = tableData[timeColName];
      if (timeCol && timeCol.length > 0) continue;
      // No rows arrived yet. Distinguish "still waiting for first data"
      // from "source table is intentionally empty" (e.g. a `where(...)`
      // that filters everything out — used by the pane_preserve_empty
      // docs example). An empty source reports size === 0 immediately
      // after fetch, so treat that as ready instead of hanging forever.
      const table = this.tables.get(tableId);
      if (table != null && table.size === 0) continue;
      return false;
    }
    return true;
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

  /** Get the set of table IDs that are JS-downsampled. */
  getDownsampledTableIds(): Set<number> {
    return this.jsDownsampledTableIds;
  }

  /** Get a table by ID. */
  getTable(tableId: number): DhType.Table | undefined {
    return this.tables.get(tableId);
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

    // Close downsampled tables
    this.downsampledTableMap.forEach(table => {
      try {
        table.close();
      } catch {
        // ignore
      }
    });
    this.downsampledTableMap.clear();

    // Close original tables
    this.originalTableMap.forEach(table => {
      try {
        table.close();
      } catch {
        // ignore
      }
    });
    this.originalTableMap.clear();

    // Close any remaining tables (non-downsampled)
    this.tables.forEach((table, tableId) => {
      // Don't double-close tables that were in original/downsampled maps
      if (
        !this.jsDownsampledTableIds.has(tableId)
      ) {
        try {
          table.close();
        } catch {
          // ignore
        }
      }
    });
    this.tables.clear();

    // Clean up widget listener
    if (this.widgetListenerCleanup) {
      this.widgetListenerCleanup();
      this.widgetListenerCleanup = null;
    }

    // Clean up all per-template partition watchers
    this.partitionWatchers.forEach(({ partitionedTable, cleanup }) => {
      try {
        cleanup();
      } catch {
        // ignore
      }
      if (partitionedTable?.close) {
        try {
          partitionedTable.close();
        } catch {
          // ignore
        }
      }
    });
    this.partitionWatchers.clear();

    this.listeners.clear();
    this.chartDataMap.clear();
    this.tableDataMap.clear();
    this.resetPendingForTable.clear();
    this.freshDownsampleTables.clear();
    this.jsDownsampledTableIds.clear();
    this.autoBinnedTableIds.clear();
  }
}

export default TradingViewChartModel;
