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

const DOWNSAMPLE_THRESHOLD = 1000;

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
      partitionedTable: DhType.PartitionedTable;
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

  /**
   * Monotonic counter incremented on every subscription update delivered to
   * the chart, whatever the shape of the delta (added / modified / removed).
   *
   * This is the signal for "data is still flowing". Row counts are not: on a
   * downsampled or auto-binned chart the rendered row count is capped by the
   * target bin count, so it saturates and can even shrink as bins merge, and
   * the rendered time extent only advances when a bin boundary is crossed
   * (~100 source ticks on the ticking fixtures). Ticks that merely move a
   * bin's extremes arrive as modifies, which move neither.
   */
  dataUpdateSeq = 0;

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

  /**
   * Table IDs whose current subscription has delivered at least one update,
   * i.e. its initial Barrage snapshot has arrived. Cancelling a subscription
   * (or releasing its table's export) before that point races the server's
   * snapshot delivery: the stream gets errored, and the queued
   * BarrageMessageProducer.propagateSnapshotForSubscription then logs
   * "IllegalStateException: Stream was terminated by error". See
   * retireSubscription.
   */
  private deliveredTableIds: Set<number> = new Set();

  /**
   * Settle callbacks for retirements that are waiting on their
   * subscription's initial snapshot before releasing. Each entry removes
   * itself when it settles (first update or timeout).
   */
  private drainingRetirements: Set<() => void> = new Set();

  /**
   * Set by close(): release the widget once the last draining retirement
   * settles (a widget close releases every export it owns at once, which
   * must not race in-flight snapshots either).
   */
  private widgetCloseWhenDrained = false;

  /**
   * Upper bound on how long a retirement may wait for its snapshot. This is
   * a stuck-subscription backstop, not an expected path: under load a fresh
   * aggregation's snapshot can legitimately take many seconds, and releasing
   * before it lands recreates the cancel-mid-snapshot race this machinery
   * exists to avoid. Keep it generous.
   */
  private static readonly RETIRE_TIMEOUT_MS = 60000;

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
  private readonly valueTranslator = TradingViewChartModel.unwrapValue;

  /**
   * Stable translator for time columns. Produces TZ-adjusted epoch seconds
   * directly, so the view layer never needs to call convertTime.
   */
  private readonly timeTranslator = (val: unknown): unknown => {
    const unwrapped = TradingViewChartModel.unwrapValue(val);
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
   * Set the timezone used for time column conversion.
   *
   * Called once before init with the user's Deephaven timezone setting, and
   * again whenever that setting changes. Before init (no live subscriptions)
   * the value is simply stored and picked up when tables are first
   * subscribed. After init, every active table is re-subscribed so its time
   * columns re-convert through timeTranslator in the new timezone — mirroring
   * PlotlyExpressChartModel.fireTimeZoneUpdated, which re-subscribes tables
   * on a timezone change rather than tearing the whole chart down.
   */
  setTimeZone(tz: string): void {
    const next = tz ?? '';
    if (next === this.timeZone) return;
    this.timeZone = next;
    if (this.tableSubscriptionMap.size === 0) return;
    this.resubscribeForTimeZone();
  }

  /**
   * Tear down and re-create every active table subscription so time columns
   * are re-extracted through timeTranslator using the current timezone. Each
   * table is flagged as a fresh data swap so the view replaces (rather than
   * appends) its series data and can re-anchor the viewport. The currently
   * subscribed table (original, downsampled, or auto-binned) is reused, so
   * the existing downsample / auto-bin scope is preserved across the change.
   */
  private resubscribeForTimeZone(): void {
    const tableIds = Array.from(this.tableSubscriptionMap.keys());
    tableIds.forEach(tableId => {
      const table = this.tables.get(tableId);
      if (!table) return;
      // Same table is re-subscribed below, so no table release here.
      this.retireSubscription(tableId);
      this.chartDataMap.delete(tableId);
      this.tableDataMap.delete(tableId);
      this.freshDownsampleTables.add(tableId);
      this.subscribeTable(tableId, table);
    });
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

    // Collect partition refs and source table refs used only by partition
    // templates. A large `by=` chart should not subscribe/downsample the raw
    // source table directly; it only needs per-key constituent tables.
    const partitionRefIndices = new Set<number>();
    const partitionTemplateTableIds = new Set<number>();
    const directSeriesTableIds = new Set<number>();
    this.figureData.series.forEach(s => {
      if (s.partition?.refIndex != null) {
        partitionRefIndices.add(s.partition.refIndex);
      }
      if (s.partition != null) {
        partitionTemplateTableIds.add(s.dataMapping.tableId);
      } else {
        directSeriesTableIds.add(s.dataMapping.tableId);
      }
      if (s.markerSpec?.tableId != null) {
        directSeriesTableIds.add(s.markerSpec.tableId);
      }
    });

    // Fetch all referenced tables (skip PartitionedTable refs)
    const fetchedRefs = new Set<number>();
    const tablePromises: Promise<void>[] = [];
    message.new_references.forEach(refIdx => {
      if (partitionRefIndices.has(refIdx)) return; // handled below
      if (
        partitionTemplateTableIds.has(refIdx) &&
        !directSeriesTableIds.has(refIdx) &&
        this.downsampleMeta[String(refIdx)] != null
      ) {
        return;
      }
      if (refIdx < exportedObjects.length) {
        fetchedRefs.add(refIdx);
        const exported = exportedObjects[refIdx];
        tablePromises.push(
          exported.fetch().then((table: unknown) => {
            this.tables.set(refIdx, table as DhType.Table);
          })
        );
      }
    });

    // PartitionedTable refs are fetched by setupPartitionWatcher below.
    partitionRefIndices.forEach(ref => {
      if (ref < exportedObjects.length) fetchedRefs.add(ref);
    });

    // Close exports we never fetch (e.g. the raw source behind a large
    // partition template): unfetched exports must be closed, per the
    // WidgetExportedObject contract, or they pin server-side resources
    // for the life of the widget.
    TradingViewChartModel.closeExportedObjects(
      exportedObjects,
      ...Array.from(fetchedRefs)
    );

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
      if (meta != null) {
        // Store original for re-downsample on zoom/pan
        this.originalTableMap.set(tableId, table);
        this.jsDownsampledTableIds.add(tableId);
        // Initial full-range downsample
        downsamplePromises.push(
          this.downsampleTable(tableId).catch(err => {
            log.warn('Initial downsample failed for table', tableId, err);
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

  /**
   * Whether any table on the chart is live (ticking). Static charts get
   * deterministic layout (exact scaffold extents); live charts get tick
   * headroom instead.
   */
  hasRefreshingTables(): boolean {
    let refreshing = false;
    this.tables.forEach(table => {
      if (table?.isRefreshing === true) refreshing = true;
    });
    return refreshing;
  }

  /**
   * True when nothing is in flight server-side on this chart's behalf: no
   * resample pending or queued, no retirement draining, and every active
   * subscription has delivered its initial snapshot.
   *
   * This is the "safe to tear the page down" signal. A client that vanishes
   * while a snapshot is propagating makes the server race its own cleanup
   * and log "Stream was terminated by error" — noise that lands in the
   * console history and can bleed into unrelated tests' screenshots. Tests
   * should wait for quiescence (via the `quiescent` field of the
   * data-tvl-state attribute) before ending.
   */
  isQuiescent(): boolean {
    if (
      this.pendingDownsample ||
      this.pendingAutoBin ||
      this.pendingZoomParams != null ||
      this.pendingAutoBinParams != null ||
      this.drainingRetirements.size > 0
    ) {
      return false;
    }
    return Array.from(this.tableSubscriptionMap.keys()).every(tableId =>
      this.deliveredTableIds.has(tableId)
    );
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
    if (meta == null) return;

    const originalTable = this.originalTableMap.get(tableId);
    if (!originalTable) return;

    // Convert TZ-shifted seconds to DateWrapper range
    let dsRange: DhType.DateWrapper[] | undefined;
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
      `downsampleTable tid=${tableId} range=${
        range ? `[${range[0]},${range[1]}]` : 'null'
      } w=${targetWidth} reset=${isReset}`
    );

    const newTable = await this.dh.plot.Downsample.runChartDownsample(
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

    // Retire the old subscription FIRST — this prevents the old
    // subscription from firing ticks that consume the reset flag. The old
    // downsampled table is a client-created export (runChartDownsample), so
    // the client must close it — but only once its snapshot has landed;
    // retireSubscription defers the release when necessary.
    const oldDs = this.downsampledTableMap.get(tableId);
    this.downsampledTableMap.delete(tableId);
    this.retireSubscription(tableId, oldDs);
    this.chartDataMap.delete(tableId);
    this.tableDataMap.delete(tableId);

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
              const oldDs = this.downsampledTableMap.get(tableId);
              this.downsampledTableMap.delete(tableId);
              this.retireSubscription(tableId, oldDs);
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

  /**
   * Send a user event (press / doublePress) back to Python via the widget
   * channel. Fire-and-forget; the server produces no client response.
   */
  sendEvent(handler: string, payload: unknown): void {
    this.sendWidgetMessage({ type: 'EVENT', handler, payload });
  }

  /** Handler ids advertised by the figure (subset of press / doublePress). */
  getEnabledHandlers(): string[] {
    return this.figureData?.enabledHandlers ?? [];
  }

  private sendWidgetMessage(msg: Record<string, unknown>): void {
    try {
      this.widget.sendMessage(JSON.stringify(msg), []);
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
        TradingViewChartModel.closeExportedObjects(exportedObjects);
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
        TradingViewChartModel.closeExportedObjects(exportedObjects);
        this.setPendingAutoBin(false);
        this.drainPendingAutoBin();
        return;
      }

      // The server re-exports every table with each AUTOBIN_FIGURE, but only
      // the swapped aggregation is fetched. Unfetched exports must be closed
      // (per WidgetExportedObject docs) or each zoom leaks live exports
      // server-side for the rest of the widget's life.
      TradingViewChartModel.closeExportedObjects(exportedObjects, tableRef);

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

      // Retire the previous aggregation: its subscription is released once
      // its in-flight snapshot (if any) lands, and its export with it. A
      // superseded aggregation has no other owner, so releasing it promptly
      // keeps zoom churn from pinning dead aggregations server-side.
      const oldTable = this.tables.get(tableRef);
      this.retireSubscription(
        tableRef,
        oldTable !== newTable ? oldTable : undefined
      );
      this.chartDataMap.delete(tableRef);
      this.tableDataMap.delete(tableRef);

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
    pt: DhType.PartitionedTable,
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

    const table = await pt.getTable(key as object);
    if (table == null) {
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
      continuous: template.continuous,
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

    if (this.shouldDownsamplePartitionTable(template, table as DhType.Table)) {
      this.addPartitionDownsampleMeta(
        newTableId,
        template,
        table as DhType.Table
      );
      try {
        await this.downsampleTable(newTableId);
      } catch (err) {
        log.warn(
          'Initial partition downsample failed for table',
          newTableId,
          err
        );
        this.removePartitionDownsampleMeta(newTableId);
        this.tables.set(newTableId, table as DhType.Table);
        this.subscribeTable(newTableId, table as DhType.Table);
      }
    } else {
      this.subscribeTable(newTableId, table as DhType.Table);
    }
  }

  private shouldDownsamplePartitionTable(
    template: TvlSeriesConfig,
    table: DhType.Table
  ): boolean {
    if (this.downsampleMeta[String(template.dataMapping.tableId)] == null) {
      return false;
    }
    const size =
      typeof table.size === 'number'
        ? table.size
        : this.downsampleMeta[String(template.dataMapping.tableId)].tableSize;
    return size > DOWNSAMPLE_THRESHOLD;
  }

  private addPartitionDownsampleMeta(
    tableId: number,
    template: TvlSeriesConfig,
    table: DhType.Table
  ): void {
    const sourceMeta =
      this.downsampleMeta[String(template.dataMapping.tableId)];
    if (sourceMeta == null) return;
    const meta = {
      ...sourceMeta,
      tableSize:
        typeof table.size === 'number' ? table.size : sourceMeta.tableSize,
    };
    this.downsampleMeta[String(tableId)] = meta;
    if (this.figureData != null) {
      this.figureData.downsampleMeta = {
        ...(this.figureData.downsampleMeta ?? {}),
        [String(tableId)]: meta,
      };
    }
    this.originalTableMap.set(tableId, table);
    this.jsDownsampledTableIds.add(tableId);
  }

  private removePartitionDownsampleMeta(tableId: number): void {
    this.jsDownsampledTableIds.delete(tableId);
    this.originalTableMap.delete(tableId);
    delete this.downsampleMeta[String(tableId)];
    if (this.figureData?.downsampleMeta) {
      delete this.figureData.downsampleMeta[String(tableId)];
    }
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
      const pt = (await exported.fetch()) as DhType.PartitionedTable;

      // Resolve the keyadded event name from the DH namespace; fall back to
      // the literal string if the constant isn't surfaced.
      let eventName = 'keyadded';
      try {
        const dhPT = this.dh.PartitionedTable;
        if (dhPT?.EVENT_KEYADDED != null) {
          eventName = dhPT.EVENT_KEYADDED;
        }
      } catch {
        // PartitionedTable not on dh namespace, use string fallback
      }

      // Pre-register the watcher entry so addPartitionKey can dedup.
      this.partitionWatchers.set(template.id, {
        partitionedTable: pt,
        cleanup: () => {
          /* no-op placeholder; replaced once the keyadded listener attaches */
        },
        seenKeys: new Set<string>(),
      });

      // Attach the listener FIRST so any keys delivered between fetch() and
      // our getKeys() sweep are still picked up.
      const cleanup = pt.addEventListener(
        eventName,
        async (event: DhType.Event<unknown>) => {
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
        rawKeys != null &&
        typeof (rawKeys as Promise<unknown>).then === 'function'
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
  /**
   * Retire a table slot's subscription, and optionally a client-owned table
   * export, without cancelling a Barrage snapshot that is still in flight.
   *
   * The server assembles and propagates an initial snapshot for every new
   * subscription. If the client cancels the subscription (sub.close()) or
   * releases the table's export (table.close()) before that snapshot has
   * been delivered, the server errors the stream and the queued snapshot
   * delivery throws "IllegalStateException: Stream was terminated by error"
   * (BarrageMessageProducer.propagateSnapshotForSubscription). Under zoom
   * churn, swap N+1 regularly tears down swap N's table while N's snapshot
   * is in flight, so this happens with a live, well-behaved client.
   *
   * The subscription is detached from the model immediately (its listeners
   * are removed, so the replacement slot owner takes over cleanly), but the
   * actual release is deferred until the subscription's first update
   * arrives — proof the snapshot has been delivered — or RETIRE_TIMEOUT_MS
   * passes.
   *
   * @param tableId The table slot being replaced or torn down
   * @param tableToClose A client-owned table to release along with the
   *   subscription: runChartDownsample results and superseded auto-bin
   *   aggregations (both are exports the widget close does not cover, or
   *   that would otherwise accumulate server-side for the widget's life).
   *   Leave undefined for tables that should outlive the subscription.
   */
  private retireSubscription(
    tableId: number,
    tableToClose?: DhType.Table
  ): void {
    const cleanupSet = this.subscriptionCleanupMap.get(tableId);
    if (cleanupSet) {
      cleanupSet.forEach(cleanup => cleanup());
      this.subscriptionCleanupMap.delete(tableId);
    }
    const sub = this.tableSubscriptionMap.get(tableId);
    this.tableSubscriptionMap.delete(tableId);
    const delivered = this.deliveredTableIds.has(tableId);
    this.deliveredTableIds.delete(tableId);

    const release = (): void => {
      try {
        sub?.close();
      } catch {
        // ignore
      }
      try {
        tableToClose?.close();
      } catch {
        // ignore
      }
    };

    if (sub == null || delivered) {
      release();
      return;
    }

    // Initial snapshot still in flight: release on first update or timeout.
    let removeListener: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const settle = (): void => {
      if (!this.drainingRetirements.delete(settle)) return;
      removeListener?.();
      if (timer != null) clearTimeout(timer);
      release();
      this.maybeCloseWidget();
      // Quiescence may have just been reached with no DATA_UPDATED to
      // follow (static tables); poke listeners so the view refreshes
      // data-tvl-state and tests polling isQuiescent() see it.
      this.emit({ type: 'RETIREMENT_DRAINED' });
    };
    this.drainingRetirements.add(settle);
    removeListener = sub.addEventListener(this.dh.Table.EVENT_UPDATED, settle);
    timer = setTimeout(settle, TradingViewChartModel.RETIRE_TIMEOUT_MS);
  }

  /**
   * Close widget-message exported objects that will not be fetched. Per the
   * WidgetExportedObject contract, an export that is never fetched must be
   * closed, or its server-side resources live until the widget closes.
   * Closing an unfetched export is always safe — nothing is subscribed to it.
   *
   * @param exportedObjects The message's exported objects
   * @param keepIndexes Indexes that will be fetched and must not be closed
   */
  private static closeExportedObjects(
    exportedObjects: DhType.WidgetExportedObject[],
    ...keepIndexes: number[]
  ): void {
    exportedObjects.forEach((exported, i) => {
      if (keepIndexes.includes(i)) return;
      try {
        exported.close();
      } catch {
        // ignore
      }
    });
  }

  /**
   * Release the widget if close() has run and no retirement is still
   * draining. Closing the widget releases every export it owns in one
   * server-side sweep, so it must wait for in-flight snapshots too.
   */
  private maybeCloseWidget(): void {
    if (!this.widgetCloseWhenDrained || this.drainingRetirements.size > 0) {
      return;
    }
    this.widgetCloseWhenDrained = false;
    try {
      this.widget.close();
    } catch {
      // ignore
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

    let cleanupSet = this.subscriptionCleanupMap.get(tableId);
    if (cleanupSet == null) {
      cleanupSet = new Set();
      this.subscriptionCleanupMap.set(tableId, cleanupSet);
    }

    // Full subscription with ChartData for delta updates
    if (this.tableSubscriptionMap.has(tableId)) return;

    this.chartDataMap.set(tableId, new this.dh.plot.ChartData(table));
    this.tableDataMap.set(tableId, {});

    const subscription = table.subscribe(columns);
    this.tableSubscriptionMap.set(tableId, subscription);

    cleanupSet.add(
      subscription.addEventListener<DhType.SubscriptionTableData>(
        this.dh.Table.EVENT_UPDATED,
        e => {
          this.handleTableUpdate(e, tableId);
        }
      )
    );

    // Listen for table disconnect / reconnect
    cleanupSet.add(
      table.addEventListener(this.dh.Table.EVENT_DISCONNECT, () => {
        log.warn('Table disconnected:', tableId);
        this.emit({ type: 'DISCONNECTED', connected: false });
      })
    );
    cleanupSet.add(
      table.addEventListener(this.dh.Table.EVENT_RECONNECT, () => {
        log.info('Table reconnected:', tableId);
        this.emit({ type: 'DISCONNECTED', connected: true });
      })
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
    // First update == the subscription's initial snapshot has been
    // delivered, so it is now safe to cancel/release (see retireSubscription).
    this.deliveredTableIds.add(tableId);
    this.dataUpdateSeq += 1;

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
    const handler = (
      event: DhType.Event<DhType.WidgetMessageDetails>
    ): void => {
      try {
        const data = event.detail;
        const dataStr = data.getDataAsString();
        const msg = JSON.parse(dataStr);
        this.dbg(`widget msg: type=${msg.type}`);

        if (msg.type === 'AUTOBIN_FIGURE') {
          const exported = data.exportedObjects ?? [];
          this.handleAutoBinFigure(msg as AutoBinFigureMessage, exported).catch(
            err => log.error('handleAutoBinFigure failed', err)
          );
          return;
        }

        // Nothing is fetched from other message types, so release any
        // exports they carry (unfetched exports must be closed, per the
        // WidgetExportedObject contract).
        TradingViewChartModel.closeExportedObjects(data.exportedObjects ?? []);

        if (msg.type === 'NEW_FIGURE' && msg.revision > this.revision) {
          this.revision = msg.revision;
          this.figureData = msg.figure;

          this.emit({
            type: 'FIGURE_UPDATED',
            figure: msg.figure,
            tables: Array.from(this.tables.values()),
          });
        }
      } catch (e) {
        log.error('Error processing widget message', e);
      }
    };

    this.widget.addEventListener(this.dh.Widget.EVENT_MESSAGE, handler);

    // Detect widget close (server disconnect / variable removed)
    const closeHandler = (): void => {
      log.warn('Widget closed');
      this.emit({ type: 'DISCONNECTED', connected: false });
    };
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
  private static unwrapValue(val: unknown): unknown {
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
   * requires at least one runtime partition series to have been discovered.
   * The image-snapshotter polls this signal to know when to take a stable
   * screenshot without resorting to hard-coded waits.
   */
  isReady(): boolean {
    if (this.figureData == null) return false;
    // A partitioned chart with no keys discovered yet should NOT be
    // considered ready — there's nothing to render.
    const renderableSeries = this.figureData.series.filter(
      series => series.partition == null
    );
    if (renderableSeries.length === 0) return false;
    return renderableSeries.every(series => {
      const { tableId } = series.dataMapping;
      const tableData = this.tableDataMap.get(tableId);
      if (!tableData) return false;
      const { time: timeColName } = series.dataMapping.columns;
      const timeCol = tableData[timeColName];
      if (timeCol != null && timeCol.length > 0) return true;
      // No rows arrived yet. Distinguish "still waiting for first data"
      // from "source table is intentionally empty" (e.g. a `where(...)`
      // that filters everything out — used by the pane_preserve_empty
      // docs example). An empty source reports size === 0 immediately
      // after fetch, so treat that as ready instead of hanging forever.
      const table = this.tables.get(tableId);
      return table != null && table.size === 0;
    });
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

    // Retire every active subscription. Client-created downsample tables are
    // released with their subscription; every other table is released by the
    // widget close below. Retirement defers any release whose initial
    // snapshot is still in flight (see retireSubscription), and the widget
    // close waits for those retirements to drain.
    Array.from(this.tableSubscriptionMap.keys()).forEach(tableId => {
      this.retireSubscription(tableId, this.downsampledTableMap.get(tableId));
    });
    this.subscriptionCleanupMap.clear();
    this.tableSubscriptionMap.clear();
    this.deliveredTableIds.clear();

    this.downsampledTableMap.clear();
    this.originalTableMap.clear();
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
      if (partitionedTable?.close != null) {
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

    // Release the widget, which releases all of its exported tables. tvl never
    // did this, so every reconnect (connectModel re-fetches) abandoned the
    // previous widget and its exports. plotly-express closes the widget in
    // close()/unsubscribe() and re-fetches on the next subscribe. Deferred
    // until draining retirements settle so the mass export release can't
    // cancel a snapshot that is still propagating.
    this.widgetCloseWhenDrained = true;
    this.maybeCloseWidget();
  }
}

export default TradingViewChartModel;
