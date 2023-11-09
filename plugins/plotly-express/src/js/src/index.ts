import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import PlotlyExpressChartPanel from './PlotlyExpressChartPanel.js';

export * from './PlotlyExpressChartModel.js';
export * from './PlotlyExpressChartUtils.js';

const plugin: WidgetPlugin = {
  name: '@deephaven/plotly-express',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'deephaven.plot.express.DeephavenFigure',
  component: PlotlyExpressChartPanel,
  panelComponent: PlotlyExpressChartPanel,
  icon: vsGraph,
};

export default plugin;
