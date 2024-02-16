import type { Layout, Data } from 'plotly.js';
import type {
  dh as DhType,
  ChartData,
  Widget,
  Table,
  TableSubscription,
  TableData,
} from '@deephaven/jsapi-types';
import { ChartModel, ChartUtils } from '@deephaven/chart';
import Log from '@deephaven/log';
import {
  PlotlyChartWidgetData,
  getDataMappings,
  getWidgetData,
  removeColorsFromData,
} from './PlotlyExpressChartUtils.js';

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartModel');

export class PlotlyExpressChartModel extends ChartModel {
  constructor(dh: DhType, widget: Widget, refetch: () => Promise<Widget>) {
    super(dh);

    this.widget = widget;
    this.refetch = refetch;
    this.chartUtils = new ChartUtils(dh);

    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);
    this.handleWidgetUpdated = this.handleWidgetUpdated.bind(this);

    // This is mostly used for setting the initial layout.
    // Chart only fetches the model layout once on init, so it needs to be set
    // before the widget is subscribed to.
    this.handleWidgetUpdated(getWidgetData(widget), widget.exportedObjects);

    this.setTitle(this.getDefaultTitle());
  }

  isSubscribed = false;

  chartUtils: ChartUtils;

  refetch: () => Promise<Widget>;

  widget?: Widget;

  widgetUnsubscribe?: () => void;

  /**
   * Map of table index to Table object.
   */
  tableReferenceMap: Map<number, Table> = new Map();

  /**
   * Map of table index to TableSubscription object.
   */
  tableSubscriptionMap: Map<number, TableSubscription> = new Map();

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
  chartDataMap: Map<number, ChartData> = new Map();

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
          const parts = destination
            .split('/')
            .filter(
              part => part !== '' && part !== 'plotly' && part !== 'data'
            );
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

  override close() {
    super.close();
    this.widget?.close();
    this.widget = undefined;
  }

  override async subscribe(
    callback: (event: CustomEvent) => void
  ): Promise<void> {
    if (this.isSubscribed) {
      return;
    }
    super.subscribe(callback);
    if (this.widget == null) {
      this.widget = await this.refetch();
      const widgetData = getWidgetData(this.widget);
      this.handleWidgetUpdated(widgetData, this.widget.exportedObjects);
    }

    this.isSubscribed = true;
    this.widgetUnsubscribe = this.widget.addEventListener<Widget>(
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

  updateLayout(data: PlotlyChartWidgetData) {
    const { figure } = data;
    const { plotly } = figure;
    const { layout: plotlyLayout = {} } = plotly;

    this.layout = {
      ...plotlyLayout,
    };
  }

  handleWidgetUpdated(
    data: PlotlyChartWidgetData,
    references: Widget['exportedObjects']
  ): void {
    const {
      figure,
      new_references: newReferences,
      removed_references: removedReferences,
    } = data;
    const { plotly, deephaven } = figure;
    const { layout: plotlyLayout = {} } = plotly;
    this.tableColumnReplacementMap = getDataMappings(data);

    this.plotlyData = plotly.data;
    this.updateLayout(data);

    if (!deephaven.is_user_set_template) {
      removeColorsFromData(
        plotlyLayout?.template?.layout?.colorway ?? [],
        this.plotlyData
      );
    }

    newReferences.forEach(async (id, i) => {
      this.tableDataMap.set(id, {}); // Plot may render while tables are being fetched. Set this to avoid a render error
      const table = (await references[i].fetch()) as Table;
      this.addTable(id, table);
    });

    removedReferences.forEach(id => this.removeTable(id));
  }

  handleFigureUpdated(event: CustomEvent<TableData>, tableId: number): void {
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
        val => this.chartUtils.unwrapValue(val),
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

  addTable(id: number, table: Table) {
    if (this.tableReferenceMap.has(id)) {
      return;
    }
    this.tableReferenceMap.set(id, table);
    this.tableDataMap.set(id, {});

    if (this.isSubscribed) {
      this.subscribeTable(id);
    }
  }

  subscribeTable(id: number) {
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
        subscription.addEventListener<TableData>(
          this.dh.Table.EVENT_UPDATED,
          e => this.handleFigureUpdated(e, id)
        )
      );
    }
  }

  removeTable(id: number) {
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
