import type {
  Layout,
  Data,
  PlotData,
  LayoutAxis,
  PlotlyHTMLElement,
  PlotMouseEvent,
  PlotSelectionEvent,
  LegendClickEvent,
  ClickAnnotationEvent,
  SunburstClickEvent,
} from 'plotly.js';
import Plotly from 'plotly.js-dist-min';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  type DateTimeColumnFormatter,
  type Formatter,
} from '@deephaven/jsapi-utils';
import {
  ChartModel,
  ChartUtils,
  type FilterColumnMap,
  type FilterMap,
} from '@deephaven/chart';
import Log from '@deephaven/log';
import {
  type ChartEvent,
  type RenderOptions,
} from '@deephaven/chart/dist/ChartModel';
import memoize from 'memoizee';
import {
  type DownsampleInfo,
  type PlotlyChartWidgetData,
  areSameAxisRange,
  downsample,
  getDataMappings,
  getPathParts,
  getReplaceableWebGlTraceIndices,
  getWidgetData,
  isAutoAxis,
  isLineSeries,
  isLinearAxis,
  removeColorsFromData,
  setWebGlTraceType,
  hasUnreplaceableWebGlTraces,
  isSingleValue,
  replaceValueFormat,
  setDefaultValueFormat,
  getDataTypeMap,
  type FormatUpdate,
  IS_WEBGL_SUPPORTED,
  setRangebreaksFromCalendar,
} from './PlotlyExpressChartUtils';

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartModel');

/**
 * The Plotly graph div element. Plotly's `PlotlyHTMLElement` type already models
 * `.on` (with per-event payload types) and `.data`; we add an overload for the
 * treemap/icicle click events, which share the sunburst click event shape but
 * aren't in the type despite existing at runtime.
 */
type PlotlyGraphDiv = PlotlyHTMLElement & {
  on: (
    event:
      | 'plotly_sunburstclick'
      | 'plotly_treemapclick'
      | 'plotly_icicleclick',
    callback: (event: SunburstClickEvent) => void
  ) => void;
};

/** Keyboard modifier keys held during a user interaction. */
type EventModifiers = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
};

/**
 * Data-space field names that Plotly may include on point data at runtime,
 * depending on the chart type
 */
const POINT_DATA_FIELDS = [
  'x',
  'y',
  'z',
  'lat',
  'lon',
  'location',
  'r',
  'theta',
  'open',
  'high',
  'low',
  'close',
  'label',
  'parent',
  'value',
  'id',
  'text',
] as const;

/**
 * Serialize a Plotly point datum into the payload sent to Python.
 * Includes all data-space fields that are present on the point,
 * plus `trace_name`, `trace_type`, and `curve_number`.
 */
function serializePoint(
  p: Record<string, unknown> & { data: Partial<PlotData>; curveNumber: number }
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  POINT_DATA_FIELDS.forEach(field => {
    if (field in p && p[field] !== undefined) {
      result[field] = p[field];
    }
  });
  result.trace_name = p.data.name;
  result.trace_type = p.data.type;
  result.curve_number = p.curveNumber;
  return result;
}

/** Hierarchical trace types handled by wireHierarchicalClickHandler. */
const HIERARCHICAL_TYPES = new Set(['sunburst', 'treemap', 'icicle']);

/** Plotly's default doubleClickDelay for legend click discrimination. */
const LEGEND_DBL_CLICK_DELAY = 300;

export class PlotlyExpressChartModel extends ChartModel {
  /**
   * The size at which the chart will automatically downsample the data if it can be downsampled.
   * If it cannot be downsampled, but the size is below MAX_FETCH_SIZE,
   * the chart will show a confirmation to fetch the data since it might be a slow operation.
   */
  static AUTO_DOWNSAMPLE_SIZE = 30_000;

  /**
   * The maximum number of items that can be fetched from a table.
   * If a table is larger than this, the chart will not be fetched.
   * This is to prevent the chart from fetching too much data and crashing the browser.
   */
  static MAX_FETCH_SIZE = 1_000_000;

  static canFetch(table: DhType.Table): boolean {
    return table.size <= PlotlyExpressChartModel.MAX_FETCH_SIZE;
  }

  constructor(
    dh: typeof DhType,
    widget: DhType.Widget,
    refetch: () => Promise<DhType.Widget>
  ) {
    super(dh);

    this.widget = widget;
    this.refetch = refetch;
    this.chartUtils = new ChartUtils(dh);

    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);
    this.handleWidgetUpdated = this.handleWidgetUpdated.bind(this);

    const widgetData = getWidgetData(widget);

    // Chart only fetches the model layout once on init, so it needs to be set
    // before the widget is subscribed to.
    this.updateLayout(widgetData);

    // The calendar is only fetched once at init.
    this.updateCalendar(widgetData);

    // The input filter columns are set once at init.
    this.updateFilterColumns(widgetData);

    // Parse event callbacks from initial widget data
    this.updateCallbacks(widgetData);

    this.setTitle(this.getDefaultTitle());
  }

  isSubscribed = false;

  chartUtils: ChartUtils;

  refetch: () => Promise<DhType.Widget>;

  widget?: DhType.Widget;

  widgetUnsubscribe?: () => void;

  /**
   * Map of table index to Table object.
   */
  tableReferenceMap: Map<number, DhType.Table> = new Map();

  /**
   * Map of downsampled table indexes to original Table object.
   */
  downsampleMap: Map<number, DownsampleInfo> = new Map();

  /**
   * Map of table index to TableSubscription object.
   */
  tableSubscriptionMap: Map<number, DhType.TableSubscription> = new Map();

  /**
   * Map of table index to cleanup function for the subscription.
   */
  subscriptionCleanupMap: Map<number, Set<() => void>> = new Map();

  /**
   * Map of table index to map of column names to array of paths where the data should be replaced.
   */
  tableColumnReplacementMap: Map<number, Map<string, string[]>> = new Map();

  /**
   * Map of table index to ChartData object. Used to handle data delta updates.
   */
  chartDataMap: Map<number, DhType.plot.ChartData> = new Map();

  /**
   * Map of table index to object where the keys are column names and the values are arrays of data.
   * This data is the full array of data for the column since ChartData doesn't have a clean way to get it at any time.
   */
  tableDataMap: Map<number, { [key: string]: unknown[] }> = new Map();

  plotlyData: Data[] = [];

  layout: Partial<Layout> = {};

  isPaused = false;

  hasPendingUpdate = false;

  hasInitialLoadCompleted = false;

  isDownsamplingDisabled = false;

  isWebGlSupported = IS_WEBGL_SUPPORTED;

  /**
   * Set of traces that are originally WebGL and can be replaced with non-WebGL traces.
   * These need to be replaced if WebGL is disabled and re-enabled if WebGL is enabled again.
   */
  webGlTraceIndices: Set<number> = new Set();

  /**
   * The WebGl warning is only shown once per chart. When the user acknowledges the warning, it will not be shown again.
   */
  hasAcknowledgedWebGlWarning = false;

  /**
   * A calendar object that is used to set rangebreaks on a time axis.
   */
  calendar: DhType.calendar.BusinessCalendar | null = null;

  /**
   * The set of parameters that need to be replaced with the default value format.
   */
  defaultValueFormatSet: Set<FormatUpdate> = new Set();

  /**
   * Map of variable within the plotly data to type.
   * For example, '0/value' -> 'int'
   */
  dataTypeMap: Map<string, string> = new Map();

  /**
   * Map of filter column names to their metadata.
   */

  filterColumnMap: FilterColumnMap = new Map();

  /**
   * The filter map that is sent to the server.
   * This is a map of column names to filter values.
   */
  filterMap: FilterMap | null = null;

  /**
   * A set of column names that are required for the chart to render.
   * If any of these columns are not in the filter map, the chart will not render.
   */
  requiredColumns: Set<string> = new Set();

  /**
   * Map of event name to callback ID for registered event callbacks.
   */
  callbackMap: Map<string, string> = new Map();

  /**
   * Set of callback IDs that use request-response (preventable events).
   */
  preventableCallbacks: Set<string> = new Set();

  /**
   * Map of request ID to resolver function for pending request-response callbacks.
   */
  pendingResponses: Map<string, (allowed: boolean) => void> = new Map();

  cleanupSubscriptions(id: number): void {
    this.subscriptionCleanupMap.get(id)?.forEach(cleanup => {
      cleanup();
    });

    try {
      this.tableSubscriptionMap.get(id)?.close();
    } catch {
      // ignore
    }

    this.subscriptionCleanupMap.delete(id);
    this.tableSubscriptionMap.delete(id);
  }

  override getData(): Partial<Data>[] {
    const hydratedData = [...this.plotlyData];

    this.tableColumnReplacementMap.forEach((columnReplacements, tableId) => {
      const tableData = this.tableDataMap.get(tableId);
      if (tableData == null) {
        throw new Error(`No tableData for table ID ${tableId}`);
      }

      // Replace placeholder arrays with actual data
      columnReplacements.forEach((paths, columnName) => {
        paths.forEach(destination => {
          // The JSON pointer starts w/ /plotly/data and we don't need that part
          const parts = getPathParts(destination);

          const single = isSingleValue(hydratedData, parts);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let selector: any = hydratedData;

          for (let i = 0; i < parts.length; i += 1) {
            if (i !== parts.length - 1) {
              selector = selector[parts[i]];
            } else if (single) {
              selector[parts[i]] = tableData[columnName]?.[0] ?? null;
            } else {
              selector[parts[i]] = tableData[columnName] ?? [];
            }
          }
        });
      });
    });

    return hydratedData;
  }

  override getLayout(): Partial<Layout> {
    return this.layout;
  }

  override close(): void {
    super.close();
    this.widget?.close();
    this.widget = undefined;
  }

  override async subscribe(
    callback: (event: ChartEvent) => void
  ): Promise<void> {
    if (this.isSubscribed) {
      log.debug('already subscribed');
      return;
    }
    log.debug('subscribing');
    super.subscribe(callback);
    if (this.widget == null) {
      this.widget = await this.refetch();
    }

    const widgetData = getWidgetData(this.widget);
    this.handleWidgetUpdated(widgetData, this.widget.exportedObjects);

    this.isSubscribed = true;

    // Track keyboard modifier keys from the raw DOM pointer event so they can
    // be attached to every event payload (see getModifiers). Capture phase so
    // it runs before Plotly dispatches its own handlers.
    document.addEventListener('pointerdown', this.handlePointerModifiers, true);

    this.widgetUnsubscribe = this.widget.addEventListener<DhType.Widget>(
      this.dh.Widget.EVENT_MESSAGE,
      ({ detail }) => {
        const raw = detail.getDataAsString();
        const parsed = JSON.parse(raw);
        if (parsed.type === 'CALLABLE_RESPONSE') {
          this.handleCallableResponse(parsed);
          return;
        }
        this.handleWidgetUpdated(parsed, detail.exportedObjects);
      }
    );

    this.tableReferenceMap.forEach((_, id) => this.subscribeTable(id));

    // If there are no tables to fetch data from, the chart is ready to render
    // Normally this event only fires once at least 1 table has fetched data
    // Without this, the chart shows an infinite loader if there are no tables
    if (this.tableColumnReplacementMap.size === 0) {
      this.fireUpdate(this.getData());
    }

    if (this.filterColumnMap != null) {
      // there are filters, so the server expects the filter to be sent
      this.sendFilterUpdated(this.filterMap ?? new Map());
    }

    // Wire up event callbacks. This is a no-op until the Chart component
    // provides the Plotly graph div via setPlotElement().
    this.wireEventCallbacks();
  }

  /**
   * The Plotly graph div element, provided by the Chart component once Plotly
   * has initialized (via its onInitialized callback).
   */
  private plotElement: PlotlyGraphDiv | null = null;

  private eventListenersWired = false;

  /**
   * Keyboard modifier keys held during the most recent pointer interaction,
   * captured from the raw DOM event (see subscribe). Attached to every event
   * payload sent to Python so callbacks can branch on e.g. shift-click. We read
   * these from the DOM directly rather than from Plotly's event objects, which
   * don't expose modifier state for every event type (selection, relayout...).
   */
  private modifiers: EventModifiers = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
  };

  private handlePointerModifiers = (event: PointerEvent): void => {
    this.modifiers = {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
  };

  private getModifiers(): EventModifiers {
    return { ...this.modifiers };
  }

  setPlotElement(plotElement: HTMLElement | null): void {
    this.plotElement = plotElement as PlotlyGraphDiv | null;
    this.eventListenersWired = false;
    this.wireEventCallbacks();
  }

  /**
   * Attach Plotly event listeners for the hierarchical drill-down clicks
   * (sunburst/treemap/icicle). These must be wired imperatively rather than
   * passed as props to the Plotly component because:
   *   - Plotly only honors a handler's `return false` (to prevent the default
   *     drill-down) when that handler is the last one registered, and
   *   - react-plotly.js registers a `plotly_sunburstclick` "update" listener of
   *     its own after onInitialized, which would otherwise shadow ours, and
   *   - react-plotly.js exposes no treemap/icicle click props at all.
   */
  private wireEventCallbacks(): void {
    // Pulling the plot element directly rather than passing handlers into the
    // react component lets us guarantee ordering for the hierarchical clicks.
    const gd = this.plotElement;
    if (
      gd == null ||
      typeof gd.on !== 'function' ||
      this.callbackMap.size === 0 ||
      this.eventListenersWired
    ) {
      return;
    }
    this.eventListenersWired = true;

    // Defer wiring to a microtask so our listener registers after
    // react-plotly.js attaches its own, which clobbers our sunburst handler.
    // Sunburst could be handled directly, but treemap and icicle are not
    // supported by react-plotly.js at all so they are all handled here.
    queueMicrotask(() => {
      if (this.plotElement !== gd) {
        // The element was swapped out or removed before the microtask ran.
        return;
      }
      this.wireHierarchicalClickHandler(gd);
    });
  }

  /**
   * Wire the hierarchical (sunburst/treemap/icicle) click handler. Always
   * prevents the default drill-down and re-triggers it via Plotly.animate only
   * if the Python callback allows it.
   */
  private wireHierarchicalClickHandler(gd: PlotlyGraphDiv): void {
    const clickId = this.callbackMap.get('on_click');
    if (clickId == null || !this.isPreventable(clickId)) {
      return;
    }
    const hierEvents = [
      'plotly_sunburstclick',
      'plotly_treemapclick',
      'plotly_icicleclick',
    ] as const;
    hierEvents.forEach(eventName => {
      gd.on(eventName, (data: SunburstClickEvent) => {
        const args = {
          points: data.points.map(p => ({
            label: p.label,
            parent: p.parent,
            value: p.value,
            id: p.id,
            trace_name: (p.data as Partial<PlotData>).name,
            trace_type: (p.data as Partial<PlotData>).type,
            curve_number: p.curveNumber,
          })),
          next_level: data.nextLevel ?? null,
          modifiers: this.getModifiers(),
        };
        this.sendEventCallbackWithResponse(clickId, args).then(allowed => {
          if (allowed && data.nextLevel != null) {
            const traceIdx = data.points?.[0]?.curveNumber ?? 0;
            Plotly.animate(
              gd,
              { data: [{ level: data.nextLevel }], traces: [traceIdx] },
              {
                frame: { redraw: false, duration: 300 },
                transition: { duration: 300, easing: 'cubic-in-out' },
                mode: 'immediate',
                fromcurrent: true,
              }
            );
          }
        });
        return false; // Always prevent default drill-down
      });
    });
  }

  /**
   * Handle a double-click on the plot area (e.g. reset axes in zoom/pan mode).
   */
  onDoubleClick(): void {
    const doubleClickId = this.callbackMap.get('on_double_click');
    if (doubleClickId == null) {
      return;
    }
    this.sendEventCallback(doubleClickId, {
      modifiers: this.getModifiers(),
    });
  }

  /**
   * Handle WebGL context lost.
   */
  onWebGlContextLost(): void {
    const webGlLostId = this.callbackMap.get('on_web_gl_context_lost');
    if (webGlLostId == null) {
      return;
    }
    this.sendEventCallback(webGlLostId, {
      modifiers: this.getModifiers(),
    });
  }

  /**
   * Handle a (non-hierarchical) point click.
   * Hierarchical clicks are preventable and handled
   * imperatively via wireHierarchicalClickHandler instead.
   * Non-hierarchical traces in a layered/subplot figure that also
   * contains hierarchical traces still arrive here, so we only skip
   * when every clicked point is a hierarchical type.
   */
  onClick(event: PlotMouseEvent): void {
    const clickId = this.callbackMap.get('on_click');
    if (clickId == null) {
      return;
    }
    if (this.isPreventable(clickId)) {
      const allHierarchical = event.points.every(p =>
        HIERARCHICAL_TYPES.has(p.data.type ?? '')
      );
      if (allHierarchical) {
        return; // Handled by wireHierarchicalClickHandler
      }
    }
    const args = {
      points: event.points.map(p =>
        serializePoint(
          p as unknown as Record<string, unknown> & {
            data: Partial<PlotData>;
            curveNumber: number;
          }
        )
      ),
      modifiers: this.getModifiers(),
    };
    this.sendEventCallback(clickId, args);
  }

  /**
   * Handle a box/lasso selection.
   */
  onSelected(event: PlotSelectionEvent | undefined): void {
    const selectedId = this.callbackMap.get('on_selected');
    if (selectedId == null || event == null) {
      return;
    }
    const args: Record<string, unknown> = {
      points: event.points.map(p =>
        serializePoint(
          p as unknown as Record<string, unknown> & {
            data: Partial<PlotData>;
            curveNumber: number;
          }
        )
      ),
      modifiers: this.getModifiers(),
    };
    if (event.range != null) {
      args.range = event.range;
    }
    if (event.lassoPoints != null) {
      args.lasso_points = event.lassoPoints;
    }
    this.sendEventCallback(selectedId, args);
  }

  /**
   * Handle a selection being cleared.
   */
  onDeselect(): void {
    const deselectId = this.callbackMap.get('on_deselect');
    if (deselectId == null) {
      return;
    }
    this.sendEventCallback(deselectId, { modifiers: this.getModifiers() });
  }

  /**
   * Handle an annotation click.
   */
  onClickAnnotation(event: ClickAnnotationEvent): void {
    const annotationId = this.callbackMap.get('on_click_annotation');
    if (annotationId == null) {
      return;
    }
    const args = {
      index: event.index,
      annotation: {
        text: event.annotation.text,
        x: event.annotation.x,
        y: event.annotation.y,
      },
      modifiers: this.getModifiers(),
    };
    this.sendEventCallback(annotationId, args);
  }

  /**
   * Timer for debouncing legend single-click vs double-click.
   * When on_legend_click is registered, single clicks are held for
   * LEGEND_DBL_CLICK_DELAY ms so a double-click can cancel them.
   */
  private legendClickTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Handle a legend item click.
   * When on_legend_click is registered the click is debounced to
   * discriminate from double-clicks (Plotly fires plotly_legendclick
   * for BOTH clicks of a double-click). If no double-click arrives
   * within LEGEND_DBL_CLICK_DELAY ms the single-click is sent to Python.
   * Returns false to prevent Plotly's default toggle.
   */
  onLegendClick(event: LegendClickEvent): boolean {
    const legendClickId = this.callbackMap.get('on_legend_click');
    if (legendClickId == null) {
      // No callback registered — let Plotly perform its default toggle.
      return true;
    }
    const gd = this.plotElement;
    const args = {
      trace_name:
        (event.data?.[event.curveNumber] as Partial<PlotData>)?.name ?? '',
      curve_number: event.curveNumber,
      modifiers: this.getModifiers(),
    };

    // Cancel any pending debounced click from a previous first-click
    if (this.legendClickTimer != null) {
      clearTimeout(this.legendClickTimer);
      this.legendClickTimer = null;
    }

    // Debounce: wait to see if a double-click follows
    this.legendClickTimer = setTimeout(() => {
      this.legendClickTimer = null;
      this.sendEventCallbackWithResponse(legendClickId, args).then(allowed => {
        if (allowed && gd != null) {
          const currentVis = (gd.data?.[event.curveNumber] as Partial<PlotData>)
            ?.visible;
          const nextVis = currentVis === 'legendonly' ? true : 'legendonly';
          Plotly.restyle(gd, { visible: nextVis }, [event.curveNumber]);
        }
      });
    }, LEGEND_DBL_CLICK_DELAY);

    return false; // Always prevent; re-applied above if allowed.
  }

  /**
   * Handle a legend item double-click.
   * Cancels any pending debounced single-click so only the double-click
   * fires. Returns false to prevent Plotly's default isolate/show-all,
   * then re-applies it only if the Python callback allows it.
   *
   * When on_legend_click is registered, its handler returns false which also
   * suppresses Plotly's native double-click, so we reimplement the default here
   * even when there's no dedicated double-click callback.
   */
  onLegendDoubleClick(event: LegendClickEvent): boolean {
    const legendClickId = this.callbackMap.get('on_legend_click');
    const legendDblClickId = this.callbackMap.get('on_legend_double_click');
    if (legendClickId == null && legendDblClickId == null) {
      // Nothing registered — let Plotly perform its default.
      return true;
    }

    // Cancel pending debounced single-click
    if (this.legendClickTimer != null) {
      clearTimeout(this.legendClickTimer);
      this.legendClickTimer = null;
    }

    const gd = this.plotElement;
    const { curveNumber } = event;
    if (legendDblClickId != null) {
      const args = {
        trace_name:
          (event.data?.[curveNumber] as Partial<PlotData>)?.name ?? '',
        curve_number: curveNumber,
        modifiers: this.getModifiers(),
      };
      this.sendEventCallbackWithResponse(legendDblClickId, args).then(
        allowed => {
          if (allowed && gd != null) {
            PlotlyExpressChartModel.performLegendDoubleClick(gd, curveNumber);
          }
        }
      );
    } else if (gd != null) {
      // Only on_legend_click is registered; its false return blocks the native
      // double-click, so perform the default isolate/show-all directly.
      PlotlyExpressChartModel.performLegendDoubleClick(gd, curveNumber);
    }
    return false; // Always prevent; re-applied above if allowed.
  }

  override unsubscribe(callback: (event: ChartEvent) => void): void {
    if (!this.isSubscribed) {
      return;
    }
    super.unsubscribe(callback);
    this.widgetUnsubscribe?.();
    this.isSubscribed = false;

    document.removeEventListener(
      'pointerdown',
      this.handlePointerModifiers,
      true
    );

    this.tableReferenceMap.forEach((_, id) => this.removeTable(id));

    this.widget?.close();
    this.widget = undefined;
  }

  override setRenderOptions(renderOptions: RenderOptions): void {
    this.handleWebGlAllowed(renderOptions.webgl, this.renderOptions?.webgl);
    super.setRenderOptions(renderOptions);
  }

  /**
   * Handle the WebGL option being set in the render options.
   * If WebGL is enabled, traces have their original types as given.
   * If WebGL is disabled, replace traces that require WebGL with non-WebGL traces if possible.
   * Also, show a dismissible warning per-chart if there are WebGL traces that cannot be replaced.
   * @param webgl The new WebGL value. True if WebGL is enabled.
   * @param prevWebgl The previous WebGL value
   */
  handleWebGlAllowed(webgl = true, prevWebgl = true): void {
    setWebGlTraceType(
      this.plotlyData,
      webgl && this.isWebGlSupported,
      this.webGlTraceIndices
    );

    const needsBlocker = hasUnreplaceableWebGlTraces(this.plotlyData);

    // If WebGL is disabled and there are traces that require WebGL, show a warning that is dismissible on a per-chart basis
    if (needsBlocker && !webgl && !this.hasAcknowledgedWebGlWarning) {
      this.fireBlocker([
        'WebGL is disabled but this chart cannot render without it. Check the Advanced section in the settings to enable WebGL or click below to render with WebGL for this chart.',
      ]);
    } else if (webgl && !prevWebgl && needsBlocker) {
      // clear the blocker but not the acknowledged flag in case WebGL is disabled again
      this.fireBlockerClear(false);
    }
  }

  override fireBlockerClear(isAcknowledged = true): void {
    super.fireBlockerClear();
    this.hasAcknowledgedWebGlWarning =
      isAcknowledged || this.hasAcknowledgedWebGlWarning;
  }

  updateLayout(data: PlotlyChartWidgetData): void {
    const { figure } = data;
    const { plotly } = figure;
    const { layout: plotlyLayout = {} } = plotly;

    // @deephaven/chart Chart component mutates the layout
    // If we want updates like the zoom range, we must only set the layout once on init
    // The title is currently the only thing that can be updated after init
    if (Object.keys(this.layout).length > 0) {
      return;
    }

    this.layout = {
      ...plotlyLayout,
    };
  }

  /**
   * Check if the timezone has changed in the new formatter
   * @param formatter The new formatter
   * @returns True if the timezone has changed
   */
  timeZoneChanged(formatter: Formatter): boolean {
    const timeZone = (
      this.formatter?.getColumnTypeFormatter(
        'datetime'
      ) as DateTimeColumnFormatter
    )?.dhTimeZone.id;

    const newTimeZone = (
      formatter.getColumnTypeFormatter('datetime') as DateTimeColumnFormatter
    )?.dhTimeZone.id;

    return timeZone !== newTimeZone && newTimeZone != null;
  }

  /**
   * Update the calendar object from the data
   * @param data The new data to update the calendar from
   */
  updateCalendar(data: PlotlyChartWidgetData): void {
    const { calendar } = data.figure.deephaven;
    if (calendar != null) {
      // Timezone must be replaced for accurate rangebreaks.
      const timeZone = this.dh.i18n.TimeZone.getTimeZone(calendar.timeZone);

      this.calendar = {
        ...calendar,
        timeZone,
        holidays: calendar.holidays.map((holiday, i) => {
          const { date } = holiday;
          // date is a really a string at this point, but it should be a LocalDate object
          const dateObj = new Date(date as unknown as string);
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth();
          const day = dateObj.getDate();
          return {
            ...holiday,
            date: {
              valueOf: () => date,
              getYear: () => year,
              getMonthValue: () => month,
              getDayOfMonth: () => day,
              toString: () => date,
            } as unknown as DhType.LocalDateWrapper,
          };
        }),
      };
    }
  }

  /**
   * Fire an event to update the rangebreaks on the chart.
   * @param formatter The formatter to use to set the rangebreaks. If not provided, the current formatter is used.
   */
  fireRangebreaksUpdated(
    formatter: Formatter | undefined = this.formatter
  ): void {
    if (!formatter) {
      return;
    }

    const layoutUpdate = setRangebreaksFromCalendar(
      formatter,
      this.calendar,
      this.layout,
      this.chartUtils
    );

    if (layoutUpdate) {
      this.fireLayoutUpdated(layoutUpdate);
    }
  }

  /**
   * Update the filter columns from the data.

   * @param data The new data to update the filter columns from
   */
  updateFilterColumns(data: PlotlyChartWidgetData): void {
    const { deephaven } = data.figure;
    const { filterColumns } = deephaven;

    if (filterColumns != null) {
      this.filterColumnMap = new Map(
        filterColumns.columns.map(({ name, type }) => [name, { name, type }])
      );

      // get all columns that have required = true
      this.requiredColumns = new Set(
        filterColumns.columns
          .filter(({ required }) => required)
          .map(({ name }) => name)
      );
    }
  }

  updateCallbacks(data: PlotlyChartWidgetData): void {
    const { deephaven } = data.figure;
    if (deephaven.callbacks) {
      this.callbackMap = new Map(Object.entries(deephaven.callbacks));
    } else {
      this.callbackMap = new Map();
    }
    this.preventableCallbacks = new Set(deephaven.preventable_callbacks ?? []);
  }

  /**
   * Unsubscribe from a table.
   * @param id The table ID to unsubscribe from
   */
  unsubscribeTable(id: number): void {
    this.tableSubscriptionMap.get(id)?.close();
    this.tableSubscriptionMap.delete(id);
  }

  /**
   * Fire an event to update the timezone on the chart data if it has changed.
   * @param formatter The new formatter
   */
  fireTimeZoneUpdated(): void {
    this.tableDataMap.forEach((_, tableId) => {
      const table = this.tableReferenceMap.get(tableId);
      if (table) {
        // resubscribe to get the data with the new timezone
        this.unsubscribeTable(tableId);
        this.subscribeTable(tableId);
      }
    });
    this.fireUpdate(this.getData());
  }

  setFormatter(formatter: Formatter): void {
    setDefaultValueFormat(
      this.plotlyData,
      this.defaultValueFormatSet,
      this.dataTypeMap,
      formatter
    );

    // Only update if isSubscribed because otherwise the events are unnecessary and buggy
    if (this.isSubscribed && this.timeZoneChanged(formatter)) {
      this.fireRangebreaksUpdated(formatter);
      this.fireTimeZoneUpdated();
    }
    super.setFormatter(formatter);
  }

  handleWidgetUpdated(
    data: PlotlyChartWidgetData,
    references: DhType.Widget['exportedObjects']
  ): void {
    log.debug('handleWidgetUpdated', data, references);
    const {
      figure,
      new_references: newReferences,
      removed_references: removedReferences,
    } = data;
    const { plotly, deephaven } = figure;
    const { layout: plotlyLayout = {} } = plotly;
    this.tableColumnReplacementMap = getDataMappings(data);

    this.plotlyData = plotly.data;

    if (!deephaven.is_user_set_template) {
      removeColorsFromData(
        plotlyLayout?.template?.layout?.colorway ?? [],
        this.plotlyData
      );
    }

    this.defaultValueFormatSet = replaceValueFormat(this.plotlyData);

    // Retrieve the indexes of traces that require WebGL so they can be replaced if WebGL is disabled
    this.webGlTraceIndices = getReplaceableWebGlTraceIndices(this.plotlyData);

    this.handleWebGlAllowed(this.renderOptions?.webgl);

    this.fireRangebreaksUpdated();

    // Parse event callbacks
    this.updateCallbacks(data);

    newReferences.forEach(async (id, i) => {
      this.tableDataMap.set(id, {}); // Plot may render while tables are being fetched. Set this to avoid a render error
      const table = (await references[i].fetch()) as DhType.Table;
      this.addTable(id, table).then(() => {
        // The data type map requires the table to be added to the reference map
        this.dataTypeMap = getDataTypeMap(deephaven, this.tableReferenceMap);

        setDefaultValueFormat(
          this.plotlyData,
          this.defaultValueFormatSet,
          this.dataTypeMap,
          this.formatter
        );
      });
    });

    removedReferences.forEach(id => this.removeTable(id));

    // title and legend title are the only things expected to be updated after init from the layout
    if (
      typeof plotlyLayout.title === 'object' &&
      plotlyLayout.title.text != null &&
      plotlyLayout.title.text !== this.layout.title?.text
    ) {
      this.fireLayoutUpdated({ title: plotlyLayout.title });
      // Keep track of the title to make sure it is not unnecessarily updated
      // fireLayoutUpdated does not update this.layout so it must be set here
      this.layout.title = plotlyLayout.title;
    }

    if (plotlyLayout.legend?.title?.text != null) {
      this.fireLayoutUpdated({
        legend: {
          title: {
            text: plotlyLayout.legend.title.text,
            ...plotlyLayout.legend.title,
          },
          ...plotlyLayout.legend,
        },
      });
    }

    // If there are no tables to fetch data from, the chart is ready to render
    // Normally this event only fires once at least 1 table has fetched data
    // Without this, the chart shows an infinite loader if there are no tables
    if (this.tableColumnReplacementMap.size === 0) {
      this.fireUpdate(this.getData());
    }
  }

  handleFigureUpdated(
    event: DhType.Event<DhType.SubscriptionTableData>,
    tableId: number
  ): void {
    const chartData = this.chartDataMap.get(tableId);
    const tableData = this.tableDataMap.get(tableId);
    if (chartData == null) {
      log.warn('Unknown chartData for this event. Skipping update');
      return;
    }

    if (tableData == null) {
      log.warn('No tableData for this event. Skipping update');
      return;
    }

    const { detail: figureUpdateEvent } = event;
    chartData.update(figureUpdateEvent);
    figureUpdateEvent.columns.forEach(column => {
      const valueTranslator = this.getValueTranslator(
        column.type,
        this.formatter
      );

      const columnData = chartData.getColumn(
        column.name,
        valueTranslator,
        figureUpdateEvent
      );
      tableData[column.name] = columnData;
    });

    if (this.isPaused) {
      this.hasPendingUpdate = true;
      return;
    }

    this.fireUpdate(this.getData());
  }

  async addTable(id: number, table: DhType.Table): Promise<void> {
    if (this.tableReferenceMap.has(id)) {
      return;
    }

    let tableToAdd = table;

    const downsampleInfo = this.getDownsampleInfo(id, table);
    const needsDownsample =
      table.size > PlotlyExpressChartModel.AUTO_DOWNSAMPLE_SIZE;
    const canDownsample = typeof downsampleInfo !== 'string';
    const canFetch = PlotlyExpressChartModel.canFetch(table);
    const shouldDownsample = needsDownsample && !this.isDownsamplingDisabled;

    if (!canDownsample) {
      if (!canFetch) {
        log.debug(`Table ${id} too big to fetch ${table.size} items`);
        this.fireDownsampleFail(
          `Too many items to plot: ${Number(
            table.size
          ).toLocaleString()} items.`
        );
        return;
      }
      if (shouldDownsample) {
        this.fireDownsampleFail(downsampleInfo);
        return;
      }
    }

    if (canDownsample && needsDownsample) {
      this.downsampleMap.set(id, downsampleInfo);
      try {
        this.fireDownsampleStart(null);
        tableToAdd = await downsample(this.dh, downsampleInfo);
        this.fireDownsampleFinish(null);
      } catch (e) {
        this.fireDownsampleFail(e);
        return;
      }
    }

    this.tableReferenceMap.set(id, tableToAdd);
    this.tableDataMap.set(id, {});

    if (this.isSubscribed) {
      this.subscribeTable(id);
    }
  }

  async updateDownsampledTable(id: number): Promise<void> {
    const oldDownsampleInfo = this.downsampleMap.get(id);
    if (oldDownsampleInfo == null) {
      log.error(`No table found for id ${id}`);
      return;
    }

    const downsampleInfo = this.getDownsampleInfo(
      id,
      oldDownsampleInfo.originalTable
    );

    if (typeof downsampleInfo === 'string') {
      this.fireDownsampleFail(downsampleInfo);
      return;
    }

    if (
      areSameAxisRange(downsampleInfo.range, oldDownsampleInfo.range) &&
      downsampleInfo.width === oldDownsampleInfo.width
    ) {
      log.debug('Range and width are the same, skipping downsample');
      return;
    }

    log.debug('Updating downsampled table', downsampleInfo);

    this.fireDownsampleStart(null);

    this.cleanupSubscriptions(id);

    this.tableReferenceMap.delete(id);

    this.addTable(id, oldDownsampleInfo.originalTable);
  }

  override setDownsamplingDisabled(isDownsamplingDisabled: boolean): void {
    this.isDownsamplingDisabled = isDownsamplingDisabled;
    if (isDownsamplingDisabled && this.widget != null) {
      const widgetData = getWidgetData(this.widget);
      this.handleWidgetUpdated(widgetData, this.widget.exportedObjects);
      this.fireDownsampleFinish(null);
    }
  }

  /**
   * Gets info on how to downsample a table for plotting.
   * @param tableId The tableId to get downsample info for
   * @param table The table to get downsample info for
   * @returns DownsampleInfo if table can be downsampled.
   *          A string of the reason if the table cannot be downsampled.
   *          Null if the table does not need downsampling.
   */
  getDownsampleInfo(
    tableId: number,
    table: DhType.Table
  ): DownsampleInfo | string {
    const downsampleFailMessage = `Plotting ${Number(
      table.size
    ).toLocaleString()} items may be slow.\nAre you sure you want to continue?`;

    const replacementMap = this.tableColumnReplacementMap.get(tableId);

    if (!replacementMap) {
      return 'Nothing to downsample';
    }

    const areAllLines = [...replacementMap.values()]
      .flat()
      .map(path => getPathParts(path)[0])
      .every(seriesIndex => {
        const series = this.plotlyData[parseInt(seriesIndex, 10)];
        return series != null && isLineSeries(series);
      });

    if (!areAllLines) {
      log.debug('Cannot downsample non-line series');
      return downsampleFailMessage;
    }

    let xCol = '';
    let xAxis: Partial<LayoutAxis> | undefined;
    const yCols: string[] = [];
    const replacementEntries = [...replacementMap.entries()];

    for (let i = 0; i < replacementEntries.length; i += 1) {
      const [columnName, paths] = replacementEntries[i];
      const pathParts = paths.map(getPathParts);

      for (let j = 0; j < pathParts.length; j += 1) {
        const [seriesIdx, xOrY] = pathParts[j];
        const series = this.plotlyData[parseInt(seriesIdx, 10)] as PlotData;
        if (xOrY === 'x') {
          if (xCol !== '' && columnName !== xCol) {
            log.debug('Cannot downsample multiple x columns');
            return downsampleFailMessage;
          }
          xCol = columnName;
          const axisName = `${series.xaxis[0]}axis${series.xaxis[1] ?? ''}`;
          xAxis = this.layout[axisName as 'xaxis']; // The cast makes TS happy
          if (xAxis != null && !isLinearAxis(xAxis) && !isAutoAxis(xAxis)) {
            return 'Cannot downsample non-linear x axis';
          }
        } else {
          yCols.push(columnName);
          const axisName = `${series.yaxis[0]}axis${series.yaxis[1] ?? ''}`;
          const yAxis = this.layout[axisName as 'yaxis']; // The cast makes TS happy
          if (yAxis != null && !isLinearAxis(yAxis) && !isAutoAxis(yAxis)) {
            return 'Cannot downsample non-linear y axis';
          }
        }
      }
    }

    if (xAxis == null) {
      return 'Cannot downsample without an x axis';
    }

    // Copy the range in case plotly mutates it
    const range = xAxis.autorange === false ? [...(xAxis.range ?? [])] : null;

    return {
      type: 'linear',
      originalTable: table,
      xCol,
      yCols,
      width: this.getPlotWidth(),
      range,
      rangeType: xAxis.type === 'date' ? 'date' : 'number',
    };
  }

  subscribeTable(id: number): void {
    const table = this.tableReferenceMap.get(id);
    const columnReplacements = this.tableColumnReplacementMap.get(id);

    if (
      table != null &&
      columnReplacements != null &&
      columnReplacements.size > 0 &&
      !this.tableSubscriptionMap.has(id)
    ) {
      this.chartDataMap.set(id, new this.dh.plot.ChartData(table));
      const columnNames = new Set(columnReplacements.keys());
      const columns = table.columns.filter(({ name }) => columnNames.has(name));
      const subscription = table.subscribe(columns);
      this.tableSubscriptionMap.set(id, subscription);

      if (!this.subscriptionCleanupMap.has(id)) {
        this.subscriptionCleanupMap.set(id, new Set());
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cleanupSet = this.subscriptionCleanupMap.get(id)!;

      cleanupSet.add(
        subscription.addEventListener<DhType.SubscriptionTableData>(
          this.dh.Table.EVENT_UPDATED,
          e => this.handleFigureUpdated(e, id)
        )
      );

      cleanupSet.add(
        table.addEventListener<DhType.Table>(
          this.dh.Table.EVENT_DISCONNECT,
          e => this.fireDisconnect()
        )
      );
    }
  }

  removeTable(id: number): void {
    this.cleanupSubscriptions(id);

    this.tableReferenceMap.delete(id);

    this.downsampleMap.delete(id);
    this.chartDataMap.delete(id);
    this.tableDataMap.delete(id);
    this.tableColumnReplacementMap.delete(id);
  }

  override fireUpdate(data: unknown): void {
    super.fireUpdate(data);
    this.hasPendingUpdate = false;

    // TODO: This will fire on first call to `fireUpdate` even though other data
    // may still be loading. We should consider making this smarter to fire after
    // all initial data has loaded.
    // https://github.com/deephaven/deephaven-plugins/issues/267
    // If not subscribed, the fireLoadFinished will not go through since there is no listeners
    // which results in a loading spinner that does not go away on its own
    // isSubscribed can also be checked before calling fireUpdate, but this is a
    // subtle bug that is good to check for here just in case
    if (!this.hasInitialLoadCompleted && this.isSubscribed) {
      this.fireLoadFinished();
      this.hasInitialLoadCompleted = true;
    }
  }

  override setDimensions(rect: DOMRect): void {
    super.setDimensions(rect);
    ChartUtils.getLayoutRanges(this.layout);
    this.downsampleMap.forEach((_, id) => {
      this.updateDownsampledTable(id);
    });
  }

  override getFilterColumnMap(): FilterColumnMap {
    return this.filterColumnMap;
  }

  override isFilterRequired(): boolean {
    // if any of the required columns are not in the filter map, then filters are still required
    return Array.from(this.requiredColumns).some(
      column => !this.filterMap || !this.filterMap.has(column)
    );
  }

  override setFilter(filterMap: FilterMap): void {
    super.setFilter(filterMap);

    this.filterMap = filterMap;

    if (this.isSubscribed) {
      this.sendFilterUpdated(filterMap);
    }
  }

  /**
   * Fire an event to update the filters on the chart.
   * @param filterMap The filter map to send to the server
   */
  sendFilterUpdated(filterMap: FilterMap): void {
    // Only send the filter update if filters are not required and the filter columns are set
    // They will either be set or none are required
    if (!this.isFilterRequired() && this.filterColumnMap.size > 0) {
      this.widget?.sendMessage(
        JSON.stringify({
          type: 'FILTER',
          filterMap: Object.fromEntries(filterMap),
        })
      );
    }
  }

  pauseUpdates(): void {
    this.isPaused = true;
  }

  resumeUpdates(): void {
    this.isPaused = false;
    if (this.hasPendingUpdate) {
      this.fireUpdate(this.getData());
    }
  }

  shouldPauseOnUserInteraction(): boolean {
    return this.hasScene() || this.hasGeo() || this.hasMap() || this.hasPolar();
  }

  private hasScene(): boolean {
    return this.plotlyData.some(d => 'scene' in d && d.scene != null);
  }

  private hasGeo(): boolean {
    return this.plotlyData.some(d => 'geo' in d && d.geo != null);
  }

  private hasMap(): boolean {
    return this.plotlyData.some(({ type }) => type?.includes('map'));
  }

  private hasPolar(): boolean {
    return this.plotlyData.some(({ type }) => type?.includes('polar'));
  }

  getPlotWidth(): number {
    if (!this.rect || !this.rect.width) {
      return 0;
    }

    return Math.max(
      this.rect.width -
        (this.layout.margin?.l ?? 0) -
        (this.layout.margin?.r ?? 0),
      0
    );
  }

  getPlotHeight(): number {
    if (!this.rect || !this.rect.height) {
      return 0;
    }

    return Math.max(
      this.rect.height -
        (this.layout.margin?.t ?? 0) -
        (this.layout.margin?.b ?? 0),
      0
    );
  }

  getTimeZone = memoize(
    (columnType: string, formatter: Formatter | undefined) => {
      if (formatter != null) {
        const dataFormatter = formatter.getColumnTypeFormatter(columnType);
        if (dataFormatter != null) {
          return (dataFormatter as DateTimeColumnFormatter).dhTimeZone;
        }
      }
      return undefined;
    }
  );

  getValueTranslator = memoize(
    (columnType: string, formatter: Formatter | undefined) => {
      const timeZone = this.getTimeZone(columnType, formatter);
      return (value: unknown) => this.chartUtils.unwrapValue(value, timeZone);
    }
  );

  getCallbackMap(): Map<string, string> {
    return this.callbackMap;
  }

  hasSelectionCallbacks(): boolean {
    return (
      this.callbackMap.has('on_selected') || this.callbackMap.has('on_deselect')
    );
  }

  private relayoutTimer: ReturnType<typeof setTimeout> | null = null;

  private relayoutMerged: Record<string, unknown> = {};

  onRelayout(changes: Record<string, unknown>): void {
    const relayoutId = this.callbackMap.get('on_relayout');
    if (relayoutId == null) return;

    // Debounce: merge keys from rapid events, send once after 150ms pause
    Object.assign(this.relayoutMerged, changes);
    if (this.relayoutTimer) clearTimeout(this.relayoutTimer);
    this.relayoutTimer = setTimeout(() => {
      this.sendEventCallback(relayoutId, {
        ...this.relayoutMerged,
        modifiers: this.getModifiers(),
      });
      this.relayoutMerged = {};
      this.relayoutTimer = null;
    }, 150);
  }

  isPreventable(callbackId: string): boolean {
    return this.preventableCallbacks.has(callbackId);
  }

  sendEventCallback(callbackId: string, args: unknown): void {
    this.widget?.sendMessage(
      JSON.stringify({ type: 'CALLABLE_EVENT', callback_id: callbackId, args }),
      []
    );
  }

  async sendEventCallbackWithResponse(
    callbackId: string,
    args: unknown
  ): Promise<boolean> {
    const requestId = crypto.randomUUID();
    const responsePromise = new Promise<boolean>(resolve => {
      this.pendingResponses.set(requestId, resolve);
      // Timeout after 5sand allow default if Python doesn't respond
      setTimeout(() => {
        if (this.pendingResponses.delete(requestId)) {
          resolve(true);
        }
      }, 5000);
    });
    this.widget?.sendMessage(
      JSON.stringify({
        type: 'CALLABLE_EVENT',
        callback_id: callbackId,
        args,
        request_id: requestId,
      }),
      []
    );
    return responsePromise;
  }

  handleCallableResponse(parsed: {
    request_id: string;
    result: unknown;
  }): void {
    const resolver = this.pendingResponses.get(parsed.request_id);
    if (resolver) {
      this.pendingResponses.delete(parsed.request_id);
      resolver(parsed.result !== false);
    }
  }

  /**
   * Perform the default legend double-click behavior: toggle between
   * isolating the clicked trace and showing all.
   */
  private static performLegendDoubleClick(
    gd: PlotlyGraphDiv,
    curveNumber: number
  ): void {
    const traces = gd.data ?? [];
    const isAlreadyIsolated = traces.every(
      (trace, i) =>
        i === curveNumber ||
        (trace as Partial<PlotData>).visible === false ||
        (trace as Partial<PlotData>).visible === 'legendonly'
    );

    if (isAlreadyIsolated) {
      // Show all
      Plotly.restyle(gd, { visible: true });
    } else {
      // Isolate — hide all others
      const visibilities = traces.map((trace, i) => {
        if ((trace as Partial<PlotData>).visible === false) return false; // false is sticky
        return i === curveNumber ? true : 'legendonly';
      });
      Plotly.restyle(gd, { visible: visibilities } as unknown as Data);
    }
  }
}

export default PlotlyExpressChartModel;
