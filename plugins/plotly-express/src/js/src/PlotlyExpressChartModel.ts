import type { Layout, Data, PlotData, LayoutAxis } from 'plotly.js';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { DateTimeColumnFormatter, Formatter } from '@deephaven/jsapi-utils';
import {
  ChartModel,
  ChartUtils,
  FilterColumnMap,
  FilterMap,
} from '@deephaven/chart';
import Log from '@deephaven/log';
import { ChartEvent, RenderOptions } from '@deephaven/chart/dist/ChartModel';
import memoize from 'memoizee';
import {
  DownsampleInfo,
  PlotlyChartWidgetData,
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
  FormatUpdate,
  IS_WEBGL_SUPPORTED,
  setRangebreaksFromCalendar,
} from './PlotlyExpressChartUtils';

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartModel');

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
    this.widgetUnsubscribe = this.widget.addEventListener<DhType.Widget>(
      this.dh.Widget.EVENT_MESSAGE,
      ({ detail }) => {
        this.handleWidgetUpdated(
          JSON.parse(detail.getDataAsString()),
          detail.exportedObjects
        );
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
  }

  override unsubscribe(callback: (event: ChartEvent) => void): void {
    if (!this.isSubscribed) {
      return;
    }
    super.unsubscribe(callback);
    this.widgetUnsubscribe?.();
    this.isSubscribed = false;

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
}

export default PlotlyExpressChartModel;
