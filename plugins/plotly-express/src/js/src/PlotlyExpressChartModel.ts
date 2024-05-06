import type { Layout, Data, PlotData, LayoutAxis } from 'plotly.js';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ChartModel, ChartUtils } from '@deephaven/chart';
import Log from '@deephaven/log';
import {
  PlotlyChartWidgetData,
  getDataMappings,
  getPathParts,
  getWidgetData,
  removeColorsFromData,
} from './PlotlyExpressChartUtils.js';

const AUTO_DOWNSAMPLE_SIZE = 30000;
const FORCED_DOWNSAMPLE_SIZE = 250000;

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartModel');

export class PlotlyExpressChartModel extends ChartModel {
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

    // Chart only fetches the model layout once on init, so it needs to be set
    // before the widget is subscribed to.
    this.updateLayout(getWidgetData(widget));

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
  downsampleOriginalMap: Map<number, DhType.Table> = new Map();

  /**
   * Map of table index to TableSubscription object.
   */
  tableSubscriptionMap: Map<number, DhType.TableSubscription> = new Map();

  /**
   * Map of table index to cleanup function for the subscription.
   */
  subscriptionCleanupMap: Map<number, () => void> = new Map();

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let selector: any = hydratedData;
          for (let i = 0; i < parts.length; i += 1) {
            if (i !== parts.length - 1) {
              selector = selector[parts[i]];
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
    callback: (event: CustomEvent) => void
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
  }

  override unsubscribe(callback: (event: CustomEvent) => void): void {
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

  updateLayout(data: PlotlyChartWidgetData): void {
    const { figure } = data;
    const { plotly } = figure;
    const { layout: plotlyLayout = {} } = plotly;

    // @deephaven/chart Chart component mutates the layout
    // If we want updates like the zoom range, we must only set the layout once on init
    if (Object.keys(this.layout).length > 0) {
      return;
    }

    this.layout = {
      ...plotlyLayout,
    };
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

    newReferences.forEach(async (id, i) => {
      this.tableDataMap.set(id, {}); // Plot may render while tables are being fetched. Set this to avoid a render error
      const table = (await references[i].fetch()) as DhType.Table;
      this.addTable(id, table);
    });

    removedReferences.forEach(id => this.removeTable(id));
  }

  handleFigureUpdated(
    event: CustomEvent<DhType.SubscriptionTableData>,
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
      const columnData = chartData.getColumn(
        column.name,
        this.chartUtils.unwrapValue,
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

    const downsampledTable = await this.downsampleIfNeeded(id, table);

    if (downsampledTable == null) {
      return;
    }

    if (downsampledTable !== table) {
      this.downsampleOriginalMap.set(id, table);
    }

    this.tableReferenceMap.set(id, downsampledTable);
    this.tableDataMap.set(id, {});

    if (this.isSubscribed) {
      this.subscribeTable(id);
    }
  }

  override setDownsamplingDisabled(isDownsamplingDisabled: boolean): void {
    this.isDownsamplingDisabled = isDownsamplingDisabled;
    if (isDownsamplingDisabled && this.widget != null) {
      const widgetData = getWidgetData(this.widget);
      this.handleWidgetUpdated(widgetData, this.widget.exportedObjects);
    }
  }

  async downsampleIfNeeded(
    tableId: number,
    table: DhType.Table
  ): Promise<DhType.Table | null> {
    const downsampleFailMessage = `Disable downsampling to retrieve all ${table.size} items. This may be slow.`;
    if (table.size < AUTO_DOWNSAMPLE_SIZE || this.isDownsamplingDisabled) {
      log.debug(
        `Table ${tableId} is small enough to not downsample: ${table.size} rows`
      );
      return table;
    }

    const replacementMap = this.tableColumnReplacementMap.get(tableId);

    if (!replacementMap) {
      return table;
    }

    const areAllLines = [...replacementMap.values()]
      .flat()
      .map(path => getPathParts(path)[0])
      .every(seriesIndex => {
        const series = this.plotlyData[parseInt(seriesIndex, 10)];
        // This could be undefined if the index is out of bounds or does not exist
        // TS doesn't know that without an additional flag for strict array indexes
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!series) {
          return false;
        }
        return (
          (series.type === 'scatter' || series.type === 'scattergl') &&
          series.mode === 'lines'
        );
      });

    if (!areAllLines) {
      log.debug('Cannot downsample non-line series');
      this.fireDownsampleFail(downsampleFailMessage);
      return null;
    }

    let xCol = '';
    let xAxis: Partial<LayoutAxis> | null = null;
    const yCols: string[] = [];
    const replacementEntries = [...replacementMap.entries()];

    for (let i = 0; i < replacementEntries.length; i += 1) {
      const [columnName, paths] = replacementEntries[i];
      const pathParts = paths.map(getPathParts);

      for (let j = 0; j < pathParts.length; j += 1) {
        const [seriesIdx, xOrY] = pathParts[j];
        const series = this.plotlyData[parseInt(seriesIdx, 10)] as PlotData;
        if (xOrY === 'x') {
          if (xCol !== '') {
            this.fireDownsampleFail(downsampleFailMessage);
            return null;
          }
          xCol = columnName;
          const axisName = `${series.xaxis[0]}axis${series.xaxis[1] ?? ''}`;
          xAxis = this.layout[axisName as 'xaxis'] ?? null; // The cast makes TS happy
          if (
            xAxis != null &&
            xAxis.type != null &&
            xAxis.type !== 'linear' &&
            xAxis.type !== 'date'
          ) {
            this.fireDownsampleFail('Cannot downsample non-linear x axis');
            return null;
          }
        } else {
          yCols.push(columnName);
          const axisName = `${series.yaxis[0]}axis${series.yaxis[1] ?? ''}`;
          const yAxis = this.layout[axisName as 'yaxis']; // The cast makes TS happy
          if (
            yAxis != null &&
            yAxis.type != null &&
            yAxis.type !== 'linear' &&
            yAxis.type !== 'date'
          ) {
            this.fireDownsampleFail('Cannot downsample non-linear y axis');
            return null;
          }
        }
      }
    }

    if (xCol === '') {
      this.fireDownsampleFail('Cannot downsample without an x column');
      return null;
    }

    if (yCols.length === 0) {
      this.fireDownsampleFail('Cannot downsample without any y columns');
      return null;
    }

    this.fireDownsampleStart(null);

    const range = xAxis?.autorange === false ? xAxis?.range : undefined;

    try {
      const downsampledTable = await this.dh.plot.Downsample.runChartDownsample(
        table,
        xCol,
        yCols,
        this.getPlotWidth(),
        range
      );
      this.fireDownsampleFinish(null);
      return downsampledTable;
    } catch (e) {
      this.fireDownsampleFail(e);
    }

    return null;
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
      this.subscriptionCleanupMap.set(
        id,
        subscription.addEventListener<DhType.SubscriptionTableData>(
          this.dh.Table.EVENT_UPDATED,
          e => this.handleFigureUpdated(e, id)
        )
      );
    }
  }

  removeTable(id: number): void {
    this.subscriptionCleanupMap.get(id)?.();
    this.tableSubscriptionMap.get(id)?.close();

    this.tableReferenceMap.delete(id);
    this.subscriptionCleanupMap.delete(id);
    this.tableSubscriptionMap.delete(id);
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
    if (!this.hasInitialLoadCompleted) {
      this.fireLoadFinished();
      this.hasInitialLoadCompleted = true;
    }
  }

  override setDimensions(rect: DOMRect): void {
    super.setDimensions(rect);
    ChartUtils.getLayoutRanges(this.layout);
    // this.downsampleOriginalMap.forEach((table, id) => {
    //   this.addTable(id, table);
    // });
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
    return (
      this.hasScene() || this.hasGeo() || this.hasMapbox() || this.hasPolar()
    );
  }

  hasScene(): boolean {
    return this.plotlyData.some(d => 'scene' in d && d.scene != null);
  }

  hasGeo(): boolean {
    return this.plotlyData.some(d => 'geo' in d && d.geo != null);
  }

  hasMapbox(): boolean {
    return this.plotlyData.some(({ type }) => type?.includes('mapbox'));
  }

  hasPolar(): boolean {
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
}

export default PlotlyExpressChartModel;
