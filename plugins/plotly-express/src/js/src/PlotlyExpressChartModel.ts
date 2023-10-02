import type { Layout, Data } from 'plotly.js';
import type {
  dh as DhType,
  ChartData,
  Table,
  TableSubscription,
} from '@deephaven/jsapi-types';
import { ChartModel, ChartUtils, ChartTheme } from '@deephaven/chart';
import Log from '@deephaven/log';
import { applyColorwayToData } from './PlotlyExpressChartUtils.js';

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartModel');

export class PlotlyExpressChartModel extends ChartModel {
  constructor(
    dh: DhType,
    tableColumnReplacementMap: ReadonlyMap<Table, Map<string, string[]>>,
    data: Data[],
    plotlyLayout: Partial<Layout>,
    isDefaultTemplate = true,
    theme: typeof ChartTheme = ChartTheme
  ) {
    super(dh);

    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);

    this.chartUtils = new ChartUtils(dh);
    this.tableColumnReplacementMap = new Map(tableColumnReplacementMap);
    this.chartDataMap = new Map();
    this.tableSubscriptionMap = new Map();

    this.theme = theme;
    this.data = data;
    const template = { layout: this.chartUtils.makeDefaultLayout(theme) };

    // For now we will only use the plotly theme colorway since most plotly themes are light mode
    if (!isDefaultTemplate) {
      template.layout.colorway =
        plotlyLayout.template?.layout?.colorway ?? template.layout.colorway;
    }

    this.plotlyLayout = plotlyLayout;

    this.layout = {
      ...plotlyLayout,
      template,
    };

    applyColorwayToData(
      this.layout?.template?.layout?.colorway ?? [],
      this.plotlyLayout?.template?.layout?.colorway ?? [],
      this.data
    );

    this.setTitle(this.getDefaultTitle());
  }

  chartUtils: ChartUtils;

  tableSubscriptionMap: Map<Table, TableSubscription>;

  tableSubscriptionCleanups: (() => void)[] = [];

  tableColumnReplacementMap: Map<Table, Map<string, string[]>>;

  chartDataMap: Map<Table, ChartData>;

  theme: typeof ChartTheme;

  data: Data[];

  layout: Partial<Layout>;

  plotlyLayout: Partial<Layout>;

  isPaused = false;

  hasPendingUpdate = false;

  override getData(): Partial<Data>[] {
    return this.data;
  }

  getLayout(): Partial<Layout> {
    return this.layout;
  }

  subscribe(callback: (event: CustomEvent) => void): void {
    super.subscribe(callback);

    const { dh } = this;

    this.tableColumnReplacementMap.forEach((_, table) =>
      this.chartDataMap.set(table, new dh.plot.ChartData(table))
    );

    this.tableColumnReplacementMap.forEach((columnReplacements, table) => {
      const columnNames = new Set(columnReplacements.keys());
      const columns = table.columns.filter(({ name }) => columnNames.has(name));
      this.tableSubscriptionMap.set(table, table.subscribe(columns));
    });

    this.startListening();
  }

  unsubscribe(callback: (event: CustomEvent) => void): void {
    super.unsubscribe(callback);

    this.stopListening();

    this.tableSubscriptionMap.forEach(sub => sub.close());
    this.chartDataMap.clear();
  }

  handleFigureUpdated(
    event: CustomEvent,
    chartData: ChartData | undefined,
    columnReplacements: Map<string, string[]> | undefined
  ): void {
    if (chartData == null || columnReplacements == null) {
      log.warn(
        'Unknown chartData or columnReplacements for this event. Skipping update'
      );
      return;
    }
    const { detail: figureUpdateEvent } = event;
    chartData.update(figureUpdateEvent);

    columnReplacements.forEach((destinations, column) => {
      const columnData = chartData.getColumn(
        column,
        val => this.chartUtils.unwrapValue(val),
        figureUpdateEvent
      );
      destinations.forEach(destination => {
        // The JSON pointer starts w/ /plotly and we don't need that part
        const parts = destination
          .split('/')
          .filter(part => part !== '' && part !== 'plotly');
        // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
        let selector: any = this;
        for (let i = 0; i < parts.length; i += 1) {
          if (i !== parts.length - 1) {
            selector = selector[parts[i]];
          } else {
            selector[parts[i]] = columnData;
          }
        }
      });
    });

    const { data } = this;

    if (this.isPaused) {
      this.hasPendingUpdate = true;
      return;
    }

    this.fireUpdate(data);
  }

  startListening(): void {
    this.tableSubscriptionMap.forEach((sub, table) => {
      this.tableSubscriptionCleanups.push(
        sub.addEventListener(this.dh.Table.EVENT_UPDATED, e =>
          this.handleFigureUpdated(
            e,
            this.chartDataMap.get(table),
            this.tableColumnReplacementMap.get(table)
          )
        )
      );
    });
  }

  stopListening(): void {
    this.tableSubscriptionCleanups.forEach(cleanup => cleanup());
  }

  override fireUpdate(data: unknown): void {
    super.fireUpdate(data);
    this.hasPendingUpdate = false;
  }

  pauseUpdates(): void {
    this.isPaused = true;
  }

  resumeUpdates(): void {
    this.isPaused = false;
    if (this.hasPendingUpdate) {
      this.fireUpdate(this.data);
    }
  }

  shouldPauseOnUserInteraction(): boolean {
    return (
      this.hasScene() || this.hasGeo() || this.hasMapbox() || this.hasPolar()
    );
  }

  hasScene(): boolean {
    return this.data.some(d => 'scene' in d && d.scene != null);
  }

  hasGeo(): boolean {
    return this.data.some(d => 'geo' in d && d.geo != null);
  }

  hasMapbox(): boolean {
    return this.data.some(({ type }) => type?.includes('mapbox'));
  }

  hasPolar(): boolean {
    return this.data.some(({ type }) => type?.includes('polar'));
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
