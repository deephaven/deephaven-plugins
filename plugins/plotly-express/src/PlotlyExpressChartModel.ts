import type {
  Layout,
  Data,
  BoxPlotData,
  ViolinData,
  OhlcData,
  CandlestickData,
  PieData,
} from 'plotly.js';
import type {
  dh as DhType,
  ChartData,
  Table,
  TableSubscription,
} from '@deephaven/jsapi-types';
import { ChartModel, ChartUtils, ChartTheme } from '@deephaven/chart';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/js-plugin-plotly-express.ChartModel');

export function isBoxPlotData(data: Data): data is BoxPlotData {
  return data.type === 'box';
}

export function isViolinPlotData(data: Data): data is ViolinData {
  return data.type === 'violin';
}

export function isOhlcPlotData(data: Data): data is OhlcData {
  return data.type === 'ohlc';
}

export function isCandlestickPlotData(data: Data): data is CandlestickData {
  return data.type === 'candlestick';
}

export function isPiePlotData(data: Data): data is PieData {
  return data.type === 'pie';
}

class PlotlyExpressChartModel extends ChartModel {
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

    this.applyColorwayToData();

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

  getData(): Partial<Data>[] {
    return this.data;
  }

  getLayout(): Partial<Layout> {
    return this.layout;
  }

  /**
   * Applies the model template colorway to the data unless the data color is not its default value
   * Data color is not default if the user set the color specifically or the plot type sets it
   */
  applyColorwayToData(): void {
    const colorway = this.layout?.template?.layout?.colorway ?? [];
    const plotlyColorway = this.plotlyLayout?.template?.layout?.colorway ?? [];

    if (colorway.length === 0) {
      return;
    }

    if (plotlyColorway.length > colorway.length) {
      log.warn(
        "Plotly's colorway is longer than the web UI colorway. May result in incorrect colors for some series"
      );
    }

    const colorMap = new Map(
      plotlyColorway.map((color, i) => [
        color.toUpperCase(),
        colorway[i] ?? color,
      ])
    );

    const plotlyColors = new Set(
      plotlyColorway.map(color => color.toUpperCase())
    );

    for (let i = 0; i < this.data.length; i += 1) {
      const data = this.data[i];

      // There are multiple datatypes in plotly and some don't contain marker or marker.color
      if (
        'marker' in data &&
        data.marker != null &&
        'color' in data.marker &&
        typeof data.marker.color === 'string'
      ) {
        if (plotlyColors.has(data.marker.color.toUpperCase())) {
          data.marker.color = colorMap.get(data.marker.color.toUpperCase());
        }
      }

      if (
        'line' in data &&
        data.line != null &&
        'color' in data.line &&
        typeof data.line.color === 'string'
      ) {
        if (plotlyColors.has(data.line.color.toUpperCase())) {
          data.line.color = colorMap.get(data.line.color.toUpperCase());
        }
      }
    }
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
